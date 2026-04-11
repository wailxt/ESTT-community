'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, ref, onValue, push, set, serverTimestamp, update } from '@/lib/firebase';
import ChatBubble from '@/components/features/chat/ChatBubble';
import ChatInput from '@/components/features/chat/ChatInput';
import { Loader2, Hash, Lock, Menu, Bell, Search, User as UserIcon, LogOut } from 'lucide-react';
import { cn, getUserLevel } from '@/lib/utils';
import { db as staticData } from '@/lib/data';
import { onDisconnect } from 'firebase/database';
import { remove } from 'firebase/database';
import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function DiscussionPage() {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const [messages, setMessages] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // { id, text, userId, userName }
    const messagesEndRef = useRef(null);
    const profilesListeners = useRef({});

    // Get room details based on user profile
    const filiere = profile?.filiere?.toLowerCase() || 'general';
    const startYear = profile?.startYear || 'unknown';
    const roomId = `${filiere}_${startYear}`;
    const filiereName = staticData.fields.find(f => f.id === filiere)?.name || profile?.filiere || 'Général';

    // Presence Tracking Effect
    useEffect(() => {
        if (!user || authLoading || !roomId) return;

        const userStatusRef = ref(db, `discussions/${roomId}/presence/${user.uid}`);
        const roomPresenceRef = ref(db, `discussions/${roomId}/presence`);

        // Set online status
        set(userStatusRef, {
            online: true,
            lastSeen: serverTimestamp()
        });

        // Remove on disconnect
        onDisconnect(userStatusRef).remove();

        // Listen for all online users in the room
        const unsubscribePresence = onValue(roomPresenceRef, (snapshot) => {
            if (snapshot.exists()) {
                const uids = Object.keys(snapshot.val());
                setOnlineUsers(uids);

                // Ensure we have profiles for these online users
                uids.forEach(uid => {
                    if (!profilesListeners.current[uid]) {
                        const pRef = ref(db, `users/${uid}`);
                        profilesListeners.current[uid] = onValue(pRef, (pSnap) => {
                            if (pSnap.exists()) {
                                setProfiles(prev => ({
                                    ...prev,
                                    [uid]: pSnap.val()
                                }));
                            }
                        });
                    }
                });
            } else {
                setOnlineUsers([]);
            }
        });

        return () => {
            unsubscribePresence();
            remove(userStatusRef);
        };
    }, [user, authLoading, roomId]);

    useEffect(() => {
        if (!user || authLoading) return;

        const messagesRef = ref(db, `discussions/${roomId}/messages`);

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const messageList = Object.entries(data).map(([id, msg]) => ({
                    id,
                    ...msg
                })).sort((a, b) => a.timestamp - b.timestamp);

                setMessages(messageList);

                // Fetch profiles for all unique users in the room
                const uniqueUserIds = [...new Set(messageList.map(msg => msg.userId))];
                uniqueUserIds.forEach(uid => {
                    if (!profilesListeners.current[uid]) {
                        const profileRef = ref(db, `users/${uid}`);
                        profilesListeners.current[uid] = onValue(profileRef, (pSnap) => {
                            if (pSnap.exists()) {
                                setProfiles(prev => ({
                                    ...prev,
                                    [uid]: pSnap.val()
                                }));
                            }
                        });
                    }
                });
            } else {
                setMessages([]);
            }
            setLoading(false);
            scrollToBottom();
        });

        return () => {
            unsubscribe();
        };
    }, [user, authLoading, roomId]);

    // Combined cleanup for all listeners
    useEffect(() => {
        return () => {
            Object.values(profilesListeners.current).forEach(unsub => unsub());
            profilesListeners.current = {};
        };
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (text) => {
        if (!user) return;

        const messagesRef = ref(db, `discussions/${roomId}/messages`);
        const newMessageRef = push(messagesRef);

        const messageData = {
            text,
            userId: user.uid,
            timestamp: serverTimestamp(),
            ...(replyingTo && {
                replyTo: {
                    id: replyingTo.id,
                    text: replyingTo.text,
                    userName: replyingTo.userName,
                    userId: replyingTo.userId
                }
            })
        };

        try {
            await set(newMessageRef, messageData);
            setReplyingTo(null); // Clear reply after sending
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleReact = async (messageId, emoji) => {
        if (!user) return;
        const reactionRef = ref(db, `discussions/${roomId}/messages/${messageId}/reactions/${emoji}/${user.uid}`);

        onValue(reactionRef, (snapshot) => {
            const exists = snapshot.exists();
            set(reactionRef, exists ? null : true);
        }, { onlyOnce: true });
    };

    const handleDelete = async (messageId) => {
        if (!user) return;
        const messageRef = ref(db, `discussions/${roomId}/messages/${messageId}`);

        try {
            await update(messageRef, {
                isDeleted: true,
                text: "" // Clear text
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const date = new Date(msg.timestamp).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long'
            });
            const today = new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long'
            });
            const label = date === today ? `Aujourd'hui, ${date}` : date;

            if (!groups[label]) groups[label] = [];
            groups[label].push(msg);
        });
        return groups;
    };

    if (authLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-500">Chargement de votre session...</p>
        </div>
    );

    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-black mb-2">Accès Restreint</h1>
            <p className="text-slate-500 max-w-sm mb-8">
                Vous devez être connecté pour accéder à l'espace de discussion de votre promotion.
            </p>
        </div>
    );

    const groupedMessages = groupMessagesByDate(messages);
    const level = getUserLevel(profile?.startYear);
    const semesterLabel = level === 1 ? 'S1/S2' : 'S3/S4';

    // Facepile logic
    const facepileLimit = 3;
    const onlineProfiles = onlineUsers
        .map(uid => profiles[uid])
        .filter(Boolean);
    const extraCount = onlineProfiles.length > facepileLimit ? onlineProfiles.length - facepileLimit : 0;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navItems = [
        { href: '/', label: 'Accueil' },
        { href: '/events', label: 'Événements' },
        { href: '/contribute', label: 'Contribuer' },
        { href: '/chat', label: 'Discussion' },
    ];
    if (user) navItems.push({ href: '/profile', label: 'Profil' });

    const isActive = (path) => {
        if (path === '/') return false; // Simple check for chat
        return false;
    };

    return (
        <main className="fixed inset-0 md:relative md:h-[calc(100vh-64px)] h-[100dvh] bg-white flex flex-col font-sans overflow-hidden overscroll-none">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 md:px-12 md:py-4 shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Trigger */}
                        <div className="md:hidden">
                            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <SheetTrigger asChild>
                                    <button className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors">
                                        <Menu className="w-6 h-6" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] flex flex-col p-6">
                                    <SheetHeader className="text-left mb-6">
                                        <SheetTitle className="flex items-center gap-2">
                                            <Image
                                                src="/assets/images/logo__five.svg"
                                                alt="EST Tétouan Logo"
                                                className="h-8 w-auto"
                                                width={120}
                                                height={40}
                                            />
                                        </SheetTitle>
                                    </SheetHeader>
                                    <nav className="flex flex-col gap-4 mt-4">
                                        {navItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center py-3 text-lg font-semibold transition-colors hover:text-primary border-b border-slate-50",
                                                    item.href === '/chat' ? "text-primary" : "text-slate-600"
                                                )}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </nav>

                                    <div className="mt-auto pt-6">
                                        {user && (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                                        {profile?.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-900 truncate">
                                                            {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Étudiant'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 truncate leading-tight">{user.email}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <Button variant="ghost" className="w-full justify-start h-11 px-4 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl gap-3" asChild onClick={() => setIsMenuOpen(false)}>
                                                        <Link href="/profile">
                                                            <UserIcon className="w-4 h-4" />
                                                            Mon Profil
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start h-11 px-4 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl gap-3"
                                                        onClick={() => {
                                                            signOut();
                                                            setIsMenuOpen(false);
                                                        }}
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Se déconnecter
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <div className="flex flex-col">
                            <h1 className="text-base md:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                                Filière {filiereName} <span className="text-slate-400 font-medium md:ml-1 md:inline block text-xs md:text-base">{semesterLabel}</span>
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                                    {onlineUsers.length} {onlineUsers.length > 1 ? 'En ligne' : 'En ligne'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Facepile UI */}
                    <div className="flex items-center">
                        <div className="flex -space-x-2 md:-space-x-3 overflow-hidden">
                            {onlineProfiles.slice(0, facepileLimit).map((p, i) => (
                                <div
                                    key={i}
                                    className="inline-block h-8 w-8 md:h-10 md:w-10 rounded-full ring-2 md:ring-4 ring-white transition-transform hover:translate-y-[-2px] cursor-pointer"
                                    title={`${p.firstName} ${p.lastName}`}
                                >
                                    {p.photoUrl ? (
                                        <img className="h-full w-full object-cover rounded-full bg-slate-100" src={p.photoUrl} alt="" />
                                    ) : (
                                        <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-[10px] md:text-xs font-bold text-slate-500">
                                            {p.firstName?.[0]}{p.lastName?.[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {extraCount > 0 && (
                            <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full ring-2 md:ring-4 ring-white bg-slate-800 text-white text-[9px] md:text-[10px] font-black -ml-2 md:-ml-3 z-10 border-2 border-white">
                                +{extraCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12 scroll-smooth bg-white custom-scrollbar overscroll-contain">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Hash className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Pas encore de messages</h3>
                            <p className="text-sm text-slate-500">Commencez la discussion avec vos camarades de promotion !</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                {/* Date Separator */}
                                <div className="flex items-center justify-center mb-10 overflow-hidden">
                                    <div className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-300 bg-white px-4">
                                        {date}
                                    </div>
                                </div>

                                {msgs.map((msg, index) => {
                                    const isContinuation = index > 0 && msgs[index - 1].userId === msg.userId;
                                    const isLastInGroup = index === msgs.length - 1 || msgs[index + 1].userId !== msg.userId;

                                    return (
                                        <ChatBubble
                                            key={msg.id}
                                            message={msg}
                                            profile={profiles[msg.userId] || msg.profile}
                                            isOwn={msg.userId === user.uid}
                                            currentUserId={user.uid}
                                            onReact={(emoji) => handleReact(msg.id, emoji)}
                                            onDelete={() => handleDelete(msg.id)}
                                            onReply={(target) => setReplyingTo({
                                                id: target.id,
                                                text: target.text,
                                                userId: target.userId,
                                                userName: `${profiles[target.userId]?.firstName} ${profiles[target.userId]?.lastName}`
                                            })}
                                            isContinuation={isContinuation}
                                            isLastInGroup={isLastInGroup}
                                        />
                                    );
                                })}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-100 pb-2 md:pb-6 pt-4 px-6 md:px-12 shrink-0">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Reply Preview */}
                    {replyingTo && (
                        <div className="mb-3 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-1 h-10 bg-blue-500 rounded-full shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                                        Réponse à {replyingTo.userName}
                                    </span>
                                    <p className="text-sm text-slate-500 truncate italic">
                                        {replyingTo.text}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
                </div>
            </div>
        </main>
    );
}
