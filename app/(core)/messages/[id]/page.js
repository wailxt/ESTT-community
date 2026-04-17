'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, onValue, push, set, serverTimestamp, update, query, limitToLast, get } from '@/lib/firebase';
import ChatBubble from '@/components/features/chat/ChatBubble';
import ChatInput from '@/components/features/chat/ChatInput';
import ChatTermsDialog from '@/components/features/chat/ChatTermsDialog';
import { Loader2, ArrowLeft, Bell, BellOff, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { onDisconnect, remove } from 'firebase/database';
import { X, Lock, ShieldCheck, Gem } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSharedKey, encryptText, decryptText } from '@/lib/crypto';
import { useNotifications } from '@/context/NotificationContext';
import { notifyDM as rawNotifyDM } from '@/lib/browserNotifications';
import {
    ESTT_AI_AGENT_ID,
    ESTT_AI_PROFILE,
    buildEsttAiHistory,
    isEsttAiAgent,
} from '@/lib/estt-ai';
import { searchResourcesAction } from '@/lib/resourceUtils';

export default function DirectMessagePage() {
    const { id: recipientId } = useParams();
    const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
    const { isSupported, permission, requestPermission } = useNotifications();
    const router = useRouter();
    const isEsttAiChat = isEsttAiAgent(recipientId);
    
    const [messages, setMessages] = useState([]);
    const [profiles, setProfiles] = useState(() => ({
        [ESTT_AI_AGENT_ID]: ESTT_AI_PROFILE,
    }));
    const [recipientProfile, setRecipientProfile] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [readStatuses, setReadStatuses] = useState({});
    const [messageLimit, setMessageLimit] = useState(100);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isGeneratingAiResponse, setIsGeneratingAiResponse] = useState(false);
    const [isAiSearching, setIsAiSearching] = useState(false);
    
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const profilesListeners = useRef({});
    const [sharedKey, setSharedKey] = useState(null);
    // Track last notified DM so we don't spam
    const lastNotifiedMsgIdRef = useRef(null);
    
    // Mirror recipientProfile in a ref to avoid stale closures in Firebase listeners
    const recipientProfileRef = useRef(null);
    useEffect(() => { recipientProfileRef.current = recipientProfile; }, [recipientProfile]);

    // Auto-request notification permission when entering the DM
    useEffect(() => {
        if (isSupported && permission === 'default') {
            requestPermission();
        }
    }, [isSupported, permission, requestPermission]);

    // Unique Room ID for 1-on-1 interaction
    const roomId = user && recipientId 
        ? (user.uid < recipientId ? `dm_${user.uid}_${recipientId}` : `dm_${recipientId}_${user.uid}`)
        : null;

    // Deriving shared key for encryption
    useEffect(() => {
        if (!user || !recipientId) return;
        if (isEsttAiChat) {
            setSharedKey(null);
            return;
        }
        getSharedKey().then(setSharedKey);
    }, [user, recipientId, isEsttAiChat]);

    // Redirect if messaging self
    useEffect(() => {
        if (user && recipientId === user.uid) {
            router.replace('/messages');
        }
    }, [user, recipientId, router]);

    // Fetch Recipient Profile
    useEffect(() => {
        if (!recipientId) return;
        if (isEsttAiChat) {
            setRecipientProfile(ESTT_AI_PROFILE);
            setProfiles(prev => ({ ...prev, [ESTT_AI_AGENT_ID]: ESTT_AI_PROFILE }));
            return;
        }

        const pRef = ref(db, `users/${recipientId}`);
        const unsubscribe = onValue(pRef, (snapshot) => {
            if (snapshot.exists()) {
                setRecipientProfile(snapshot.val());
                setProfiles(prev => ({ ...prev, [recipientId]: snapshot.val() }));
            }
        });
        return () => unsubscribe();
    }, [recipientId, isEsttAiChat]);

    // Presence Tracking
    useEffect(() => {
        if (!user || authLoading || !roomId) return;
        if (isEsttAiChat) {
            setIsOnline(true);
            return;
        }

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
    }, [user, authLoading, roomId, recipientId, isEsttAiChat]);

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

                // ── DM notification ──────────────────────────────────────
                if (sortedList.length > 0 && !document.hasFocus()) {
                    const latestMsg = sortedList[sortedList.length - 1];
                    if (
                        latestMsg.userId === recipientId &&
                        latestMsg.id !== lastNotifiedMsgIdRef.current
                    ) {
                        lastNotifiedMsgIdRef.current = latestMsg.id;
                        
                        (async () => {
                            let senderProfile = recipientProfileRef.current;
                            if (!senderProfile && !isEsttAiChat) {
                                const snap = await get(ref(db, `users/${recipientId}`));
                                if (snap.exists()) senderProfile = snap.val();
                            }
                            
                            const senderName = senderProfile
                                ? `${senderProfile.firstName} ${senderProfile.lastName || ''}`.trim()
                                : 'Message';
                            const photoUrl = senderProfile?.photoUrl || null;
                            const preview = latestMsg.text || '';
                            rawNotifyDM(senderName, preview, `/messages/${recipientId}`, photoUrl);
                        })();
                    }
                }
                // ──────────────────────────────────────────────────────────

                // Fetch profiles for users in this chat (mostly just the sender/receiver)
                const uniqueUserIds = [...new Set(messageList.map(msg => msg.userId))];
                uniqueUserIds.forEach(uid => {
                    if (isEsttAiAgent(uid)) {
                        setProfiles(prev => ({ ...prev, [ESTT_AI_AGENT_ID]: ESTT_AI_PROFILE }));
                        return;
                    }

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
    }, [user, authLoading, roomId, messageLimit, sharedKey, recipientId, isEsttAiChat]);

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
        }
    }, [messages, user, roomId, readStatuses]);

    // Unconditionally clear unread flag when viewing the chat
    useEffect(() => {
        if (!user || !recipientId) return;

        const clearUnread = () => {
            update(ref(db, `userConversations/${user.uid}/${recipientId}`), {
                unread: false
            }).catch(err => console.error("Error clearing unread status:", err));
        };

        // Clear when opening or receiving a message
        clearUnread();

        // Extra safeguard: clear when navigating away or unmounting
        return () => clearUnread();
    }, [user, recipientId, messages.length]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const persistAiReply = async (text, action = null, unread = false) => {
        const aiMessageRef = push(ref(db, `direct_messages/${roomId}/messages`));

        // If action is display_resources, add sharedResourceIds to the data
        const sharedResourceIds = action?.action === 'display_resources' ? action.resource_ids : null;

        await set(aiMessageRef, {
            text,
            userId: ESTT_AI_AGENT_ID,
            timestamp: serverTimestamp(),
            sharedResourceIds,
            actionData: action // Store raw action data for future reference
        });

        await update(ref(db, `userConversations/${user.uid}/${recipientId}`), {
            lastMessage: text,
            lastMessageSenderId: ESTT_AI_AGENT_ID,
            lastMessageId: aiMessageRef.key,
            timestamp: serverTimestamp(),
            otherUserId: recipientId,
            unread,
        });

        return aiMessageRef.key;
    };

    const handleSendMessage = async (text, imageUrl = null, sharedResource = null, extraData = {}, sharedEvent = null) => {
        if (!user || !roomId || (!text && !imageUrl && !sharedResource && !sharedEvent && !extraData?.stickerUrl)) return;
        if (isEsttAiChat && (!text?.trim() || imageUrl || sharedResource || sharedEvent || extraData?.stickerUrl)) return;
        const newMessageRef = push(ref(db, `direct_messages/${roomId}/messages`));
        const aiHistory = isEsttAiChat
            ? buildEsttAiHistory([...messages, { userId: user.uid, text }])
            : [];

        let textToStore = text || "";
        let ciphertext = null;
        let iv = null;

        // Encrypt message if key is available
        if (textToStore && sharedKey && !isEsttAiChat) {
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
                lastMessageSenderId: user.uid,
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

            if (isEsttAiChat) {
                setIsGeneratingAiResponse(true);

                try {
                    const fetchAiResponse = async (input, history) => {
                        const response = await fetch('/api/estt-ai', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: input,
                                history: history,
                                userProfile: currentUserProfile,
                            }),
                        });

                        const payload = await response.json();
                        if (!response.ok) throw new Error(payload?.error || 'AI Error');
                        return payload;
                    };

                    // Initial acknowledgment if the user is asking for resources
                    // Since the server handles the retrieval, we can show a generic "Searching..." if we detect resource keywords
                    const isResourceQuery = text.toLowerCase().match(/ressource|cour|exam|pdf|math|physique|module/);
                    if (isResourceQuery) {
                        setIsAiSearching(true);
                    }

                    const payload = await fetchAiResponse(text, aiHistory);
                    
                    setIsAiSearching(false);
                    
                    if (payload.reply || payload.action) {
                        await persistAiReply(payload.reply, payload.action, !document.hasFocus());
                    }
                } catch (error) {
                    console.error("❌ [ESTT-AI] FAILURE:", error);
                    setIsAiSearching(false);
                    await persistAiReply(
                        "Désolé, je rencontre une petite difficulté technique. Peux-tu reformuler ta demande ?",
                        null,
                        false
                    );
                } finally {
                    setIsGeneratingAiResponse(false);
                }

                return;
            }

            await update(ref(db, `userConversations/${recipientId}/${user.uid}`), { 
                ...hubUpdate, 
                otherUserId: user.uid 
            });

        } catch (error) {
            console.error("Error sending message:", error);
            setIsGeneratingAiResponse(false);
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
    const activeRecipientProfile = recipientProfile || (isEsttAiChat ? ESTT_AI_PROFILE : null);
    const recipientDisplayName = [activeRecipientProfile?.firstName, activeRecipientProfile?.lastName].filter(Boolean).join(' ');
    const recipientIsTyping = isEsttAiChat
        ? isGeneratingAiResponse
        : Object.entries(typingUsers).some(([uid, t]) => t && uid === recipientId);

    return (
        <main className="fixed inset-0 z-[100] h-[100dvh] bg-white flex flex-col font-sans overflow-hidden overscroll-none">
            <ChatTermsDialog />
            {/* DM Header */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/messages" className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        {isEsttAiChat ? (
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                        {activeRecipientProfile?.photoUrl ? (
                                            <img src={activeRecipientProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                {activeRecipientProfile?.firstName?.[0]}{activeRecipientProfile?.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-bold text-slate-900">
                                            {recipientDisplayName}
                                        </span>
                                        <span
                                            className="material-symbols-outlined select-none !text-[13px] text-yellow-500"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            verified
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                                            Officiel
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-500">
                                        Agent officiel ESTT Community
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <Link href={`/profile/${recipientId}`} className="flex items-center gap-3 group">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                        {activeRecipientProfile?.photoUrl ? (
                                            <img src={activeRecipientProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                {activeRecipientProfile?.firstName?.[0]}{activeRecipientProfile?.lastName?.[0]}
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
                                            {recipientDisplayName}
                                        </span>
                                        {activeRecipientProfile?.verifiedEmail && (
                                            <span
                                                className={cn(
                                                    "material-symbols-outlined select-none !text-[13px]",
                                                    activeRecipientProfile?.role === 'admin' ? "text-yellow-500" : "text-emerald-500"
                                                )}
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                verified
                                            </span>
                                        )}
                                        {activeRecipientProfile?.isSubscribed && (
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
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {sharedKey && !isEsttAiChat && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Chiffré</span>
                            </div>
                        )}

                        {/* Notification Bell */}
                        {isSupported && (
                            <button
                                onClick={requestPermission}
                                title={
                                    permission === 'granted'
                                        ? 'Notifications activées'
                                        : permission === 'denied'
                                        ? 'Notifications bloquées par le navigateur'
                                        : 'Activer les notifications'
                                }
                                className={`p-2 rounded-full transition-all ${
                                    permission === 'granted'
                                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                        : permission === 'denied'
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                                }`}
                                disabled={permission === 'denied'}
                            >
                                {permission === 'denied'
                                    ? <BellOff className="w-4 h-4" />
                                    : <Bell className="w-4 h-4" fill={permission === 'granted' ? 'currentColor' : 'none'} />
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Body */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-12 scroll-smooth bg-white custom-scrollbar overscroll-contain">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                        <div className="py-16">
                            {isEsttAiChat ? (
                                <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 md:p-10 shadow-sm">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm mb-5">
                                            <img src={ESTT_AI_PROFILE.photoUrl} alt="ESTT-AI" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                                            ESTT-AI
                                        </div>
                                        <h2 className="mt-4 text-2xl font-black text-slate-900">Agent officiel de la communaute ESTT</h2>
                                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                                            Posez vos questions sur la plateforme, les clubs, les evenements, les contributions ou demandez de l'aide pour rediger un message, une annonce ou une presentation.
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, msgs]) => (
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
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-100 p-3 md:p-6 pb-4 md:pb-8 shrink-0">
                <div className="max-w-4xl mx-auto">
                    {isAiSearching && (
                        <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                                <Search className="w-3 h-3 text-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    ESTT-AI recherche des ressources...
                                </span>
                            </div>
                        </div>
                    )}

                    {recipientIsTyping && !isAiSearching && (
                        <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <span className="text-[10px] font-medium text-slate-400 italic">
                                {activeRecipientProfile?.firstName} est en train d'écrire...
                            </span>
                        </div>
                    )}
                    
                    {replyingTo && (
                        <div className="mb-3 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Réponse</span>
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
                        disabled={loading || isGeneratingAiResponse}
                        textOnly={isEsttAiChat}
                        placeholder={isEsttAiChat ? "Envoyez un message a ESTT-AI..." : "Ecrivez votre message..."}
                    />
                </div>
            </div>
        </main>
    );
}
