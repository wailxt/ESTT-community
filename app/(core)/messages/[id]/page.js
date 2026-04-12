'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, onValue, push, set, serverTimestamp, update, query, limitToLast, get } from '@/lib/firebase';
import ChatBubble from '@/components/features/chat/ChatBubble';
import ChatInput from '@/components/features/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { onDisconnect, remove } from 'firebase/database';
import { X, Lock, ShieldCheck, Gem } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSharedKey, encryptText, decryptText } from '@/lib/crypto';

export default function DirectMessagePage() {
    const { id: recipientId } = useParams();
    const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [messages, setMessages] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [recipientProfile, setRecipientProfile] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [readStatuses, setReadStatuses] = useState({});
    const [messageLimit, setMessageLimit] = useState(100);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const profilesListeners = useRef({});
    const [sharedKey, setSharedKey] = useState(null);

    // Unique Room ID for 1-on-1 interaction
    const roomId = user && recipientId 
        ? (user.uid < recipientId ? `dm_${user.uid}_${recipientId}` : `dm_${recipientId}_${user.uid}`)
        : null;

    // Deriving shared key for encryption
    useEffect(() => {
        if (!user || !recipientId) return;
        getSharedKey().then(setSharedKey);
    }, [user, recipientId]);

    // Redirect if messaging self
    useEffect(() => {
        if (user && recipientId === user.uid) {
            router.replace('/messages');
        }
    }, [user, recipientId, router]);

    // Fetch Recipient Profile
    useEffect(() => {
        if (!recipientId) return;
        const pRef = ref(db, `users/${recipientId}`);
        const unsubscribe = onValue(pRef, (snapshot) => {
            if (snapshot.exists()) {
                setRecipientProfile(snapshot.val());
                setProfiles(prev => ({ ...prev, [recipientId]: snapshot.val() }));
            }
        });
        return () => unsubscribe();
    }, [recipientId]);

    // Presence Tracking
    useEffect(() => {
        if (!user || authLoading || !roomId) return;

        const userStatusRef = ref(db, `direct_messages/${roomId}/presence/${user.uid}`);
        const recipientStatusRef = ref(db, `direct_messages/${roomId}/presence/${recipientId}`);

        set(userStatusRef, { online: true, lastSeen: serverTimestamp() });
        onDisconnect(userStatusRef).remove();

        const unsubRecipientPresence = onValue(recipientStatusRef, (snapshot) => {
            setIsOnline(snapshot.exists() && snapshot.val().online);
        });

        return () => {
            if (unsubRecipientPresence) unsubRecipientPresence();
            remove(userStatusRef);
        };
    }, [user, authLoading, roomId, recipientId]);

    // Messages Listener
    useEffect(() => {
        if (!user || authLoading || !roomId) return;

        const messagesRef = ref(db, `direct_messages/${roomId}/messages`);
        const q = query(messagesRef, limitToLast(messageLimit));

        const unsubscribe = onValue(q, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const items = Object.entries(data);
                const messageList = [];

                for (const [id, msg] of items) {
                    let text = msg.text;
                    // Decrypt main text if encrypted
                    if (msg.ciphertext && msg.iv) {
                        if (sharedKey) {
                            const decrypted = await decryptText(msg.ciphertext, msg.iv, sharedKey);
                            text = decrypted || "❌ Erreur de déchiffrement";
                        } else {
                            text = "🔒 Message chiffré (Détails de sécurité requis)";
                        }
                    }

                    // Decrypt replyTo text if encrypted
                    let replyTo = msg.replyTo;
                    if (replyTo && replyTo.ciphertext && replyTo.iv) {
                        if (sharedKey) {
                            const decryptedReply = await decryptText(replyTo.ciphertext, replyTo.iv, sharedKey);
                            replyTo = { ...replyTo, text: decryptedReply || replyTo.text };
                        } else {
                            replyTo = { ...replyTo, text: "🔒 Message chiffré" };
                        }
                    }

                    messageList.push({
                        id,
                        ...msg,
                        text,
                        replyTo
                    });
                }
                
                const sortedList = messageList.sort((a, b) => a.timestamp - b.timestamp);
                setMessages(sortedList);
                setHasMore(sortedList.length >= messageLimit);

                // Fetch profiles for users in this chat (mostly just the sender/receiver)
                const uniqueUserIds = [...new Set(messageList.map(msg => msg.userId))];
                uniqueUserIds.forEach(uid => {
                    if (!profilesListeners.current[uid]) {
                        const profileRef = ref(db, `users/${uid}`);
                        profilesListeners.current[uid] = onValue(profileRef, (pSnap) => {
                            if (pSnap.exists()) {
                                setProfiles(prev => ({ ...prev, [uid]: pSnap.val() }));
                            }
                        });
                    }
                });
            } else {
                setMessages([]);
                setHasMore(false);
            }
            setLoading(false);
            if (isInitialLoad) scrollToBottom();
        });

        const typingRef = ref(db, `direct_messages/${roomId}/typing`);
        const unsubscribeTyping = onValue(typingRef, (snapshot) => {
            setTypingUsers(snapshot.val() || {});
        });

        const readStatusRef = ref(db, `direct_messages/${roomId}/readStatus`);
        const unsubscribeReadStatus = onValue(readStatusRef, (snapshot) => {
            setReadStatuses(snapshot.val() || {});
        });

        return () => {
            unsubscribe();
            unsubscribeTyping();
            unsubscribeReadStatus();
        };
    }, [user, authLoading, roomId, messageLimit, sharedKey]);

    // Read Tracking
    useEffect(() => {
        if (!user || !roomId || messages.length === 0) return;
        const lastMessage = messages[messages.length - 1];
        const userReadRef = ref(db, `direct_messages/${roomId}/readStatus/${user.uid}`);

        if (readStatuses[user.uid]?.lastMessageId !== lastMessage.id) {
            set(userReadRef, {
                lastMessageId: lastMessage.id,
                timestamp: serverTimestamp()
            });

            // Clear unread in Hub
            update(ref(db, `userConversations/${user.uid}/${recipientId}`), {
                unread: false
            });
        }
    }, [messages, user, roomId, recipientId, readStatuses]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (text, imageUrl = null, sharedResource = null, extraData = {}, sharedEvent = null) => {
        if (!user || !roomId || (!text && !imageUrl && !sharedResource && !sharedEvent && !extraData?.stickerUrl)) return;
        const newMessageRef = push(ref(db, `direct_messages/${roomId}/messages`));

        let textToStore = text || "";
        let ciphertext = null;
        let iv = null;

        // Encrypt message if key is available
        if (textToStore && sharedKey) {
            const encrypted = await encryptText(textToStore, sharedKey);
            if (encrypted) {
                ciphertext = encrypted.ciphertext;
                iv = encrypted.iv;
                textToStore = ""; // Clear plain text
            }
        }

        const messageData = {
            text: textToStore,
            ciphertext,
            iv,
            imageUrl,
            sharedResource,
            sharedEvent,
            ...extraData,
            userId: user.uid,
            timestamp: serverTimestamp(),
            ...(replyingTo && {
                replyTo: {
                    id: replyingTo.id,
                    text: replyingTo.text,
                    userName: replyingTo.userName,
                    userId: replyingTo.userId,
                }
            })
        };

        try {
            await set(newMessageRef, messageData);
            setReplyingTo(null);

            // Update Conversation Hub (for both users)
            const hubUpdate = {
                lastMessage: text || (imageUrl ? "Image" : (sharedResource ? "Ressource" : (sharedEvent ? "Événement" : "Message"))),
                lastMessageId: newMessageRef.key,
                timestamp: serverTimestamp(),
                otherUserId: recipientId,
                unread: true,
                ciphertext,
                iv
            };
            
            await update(ref(db, `userConversations/${user.uid}/${recipientId}`), { 
                ...hubUpdate, 
                unread: false 
            });
            await update(ref(db, `userConversations/${recipientId}/${user.uid}`), { 
                ...hubUpdate, 
                otherUserId: user.uid 
            });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleReact = async (messageId, emoji) => {
        if (!user || !roomId) return;
        const reactionRef = ref(db, `direct_messages/${roomId}/messages/${messageId}/reactions/${emoji}/${user.uid}`);
        onValue(reactionRef, (snapshot) => {
            const exists = snapshot.exists();
            set(reactionRef, exists ? null : true);
        }, { onlyOnce: true });
    };

    const handleDelete = async (messageId) => {
        if (!user || !roomId) return;
        const messageRef = ref(db, `direct_messages/${roomId}/messages/${messageId}`);
        try {
            await update(messageRef, {
                isDeleted: true,
                text: "" 
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleTypingChange = (isTyping) => {
        if (!user || !roomId) return;
        const typingRef = ref(db, `direct_messages/${roomId}/typing/${user.uid}`);
        set(typingRef, isTyping || null);
        if (isTyping) onDisconnect(typingRef).remove();
    };

    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const date = new Date(msg.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const label = date === new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) ? `Aujourd'hui` : date;
            if (!groups[label]) groups[label] = [];
            groups[label].push(msg);
        });
        return groups;
    };

    if (authLoading || loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-500">Chargement de la conversation...</p>
        </div>
    );

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <main className="fixed inset-0 z-[100] h-[100dvh] bg-white flex flex-col font-sans overflow-hidden overscroll-none">
            {/* DM Header */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/messages" className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <Link href={`/profile/${recipientId}`} className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                    {recipientProfile?.photoUrl ? (
                                        <img src={recipientProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                            {recipientProfile?.firstName?.[0]}{recipientProfile?.lastName?.[0]}
                                        </div>
                                    )}
                                </div>
                                {isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                                        {recipientProfile?.firstName} {recipientProfile?.lastName}
                                    </span>
                                    {recipientProfile?.verifiedEmail && (
                                        <span 
                                            className={cn(
                                                "material-symbols-outlined select-none !text-[13px]",
                                                recipientProfile?.role === 'admin' ? "text-yellow-500" : "text-emerald-500"
                                            )} 
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            verified
                                        </span>
                                    )}
                                    {recipientProfile?.isSubscribed && (
                                        <div className="bg-gradient-to-r from-violet-600 to-indigo-500 p-0.5 rounded shadow-sm flex items-center justify-center">
                                            <Gem className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">
                                    {isOnline ? 'En ligne' : 'Hors ligne'}
                                </span>
                            </div>
                        </Link>
                    </div>
                    {sharedKey && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Chiffré</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Body */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-12 scroll-smooth bg-white custom-scrollbar overscroll-contain">
                <div className="max-w-4xl mx-auto">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex items-center justify-center mb-8">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-white px-4">
                                    {date}
                                </span>
                            </div>
                            {msgs.map((msg, idx) => {
                                const isContinuation = idx > 0 && msgs[idx - 1].userId === msg.userId;
                                const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1].userId !== msg.userId;

                                return (
                                    <ChatBubble
                                        key={msg.id}
                                        message={msg}
                                        profile={profiles[msg.userId]}
                                        profiles={profiles}
                                        readStatuses={readStatuses}
                                        isOwn={msg.userId === user?.uid}
                                        currentUserId={user?.uid}
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
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-100 p-3 md:p-6 pb-4 md:pb-8 shrink-0">
                <div className="max-w-4xl mx-auto">
                    {Object.entries(typingUsers).some(([uid, t]) => t && uid === recipientId) && (
                        <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <span className="text-[10px] font-medium text-slate-400 italic">
                                {recipientProfile?.firstName} est en train d'écrire...
                            </span>
                        </div>
                    )}
                    
                    {replyingTo && (
                        <div className="mb-3 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-primary uppercase uppercase tracking-wider">Réponse</span>
                                    <p className="text-xs text-slate-500 truncate italic">{replyingTo.text}</p>
                                </div>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-200 rounded-full transition-all">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    )}

                    <ChatInput
                        onSendMessage={handleSendMessage}
                        onTypingChange={handleTypingChange}
                        disabled={loading}
                    />
                </div>
            </div>
        </main>
    );
}
