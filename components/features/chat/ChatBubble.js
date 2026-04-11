import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BadgeCheck, ShieldCheck, Gem, User, SmilePlus, Trash2, MoreHorizontal, Pencil, AlertTriangle, X, Reply, Flag, FileText, Video, Link as LinkIcon, ArrowRight, BookOpen } from 'lucide-react';

const COMMON_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮'];

export default function ChatBubble({ message, isOwn, onReact, onDelete, onReply, currentUserId, profile: externalProfile, isContinuation, isLastInGroup }) {
    const [showPicker, setShowPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { id, userId, text, timestamp, reactions, profile: messageProfile, isDeleted, replyTo, imageUrl, sharedResource } = message;
    const profile = externalProfile || messageProfile;
    const { firstName, lastName, photoUrl, verifiedEmail, role, subscription } = profile || {};

    const formattedTime = new Date(timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toUpperCase();

    // Permissions logic
    const isSubscribed = subscription?.expiresAt && subscription.expiresAt > Date.now();
    const isAdmin = role === 'admin';
    const canEdit = isOwn;
    const canDelete = isOwn;
    const canReport = !isOwn;

    // Reactions logic
    const reactionList = reactions ? Object.entries(reactions).map(([emoji, users]) => ({
        emoji,
        count: Object.keys(users).length,
        hasReacted: users[currentUserId] === true
    })) : [];

    const scrollToMessage = (msgId) => {
        const element = document.getElementById(`msg-${msgId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
            }, 2000);
        }
    };

    return (
        <div 
            id={`msg-${id}`}
            className={cn(
                "flex w-full group relative transition-all duration-200",
                isLastInGroup ? "mb-6" : "mb-1",
                isOwn ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn(
                "flex max-w-[85%] md:max-w-[75%]",
                isOwn ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar Column */}
                <div className={cn(
                    "flex-shrink-0 flex flex-col justify-end pb-1",
                    isOwn ? "ml-2 md:ml-3" : "mr-2 md:mr-3"
                )}>
                    {!isContinuation ? (
                        <Link 
                            href={`/profile/${userId}`}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-80 transition-opacity"
                        >
                            {photoUrl ? (
                                <Image
                                    src={photoUrl}
                                    alt={firstName || 'User'}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                            )}
                        </Link>
                    ) : (
                        <div className="w-8 md:w-10" /> /* Spacer for alignment */
                    )}
                </div>

                {/* Content */}
                <div className={cn(
                    "flex flex-col relative",
                    isOwn ? "items-end" : "items-start"
                )}>
                    {/* Name & Badges (Only if not continuation) */}
                    {!isContinuation && (
                        <Link 
                            href={`/profile/${userId}`}
                            className={cn(
                                "flex items-center gap-1 mb-1 md:mb-1.5 hover:opacity-80 transition-opacity",
                                isOwn ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <span className="text-[13px] md:text-sm font-bold text-slate-800">
                                {firstName} {lastName}
                            </span>
                            
                            {verifiedEmail && (
                                <div className="relative flex items-center">
                                    <span 
                                        className={cn(
                                            "material-symbols-outlined select-none !text-[11px] md:!text-[12px]",
                                            isAdmin ? "text-yellow-500" : "text-emerald-500"
                                        )} 
                                        style={{ 
                                            fontVariationSettings: "'FILL' 1"
                                        }}
                                    >
                                        verified
                                    </span>
                                </div>
                            )}

                            {isSubscribed && (
                                <div className="bg-gradient-to-r from-violet-600 to-indigo-500 p-0.5 rounded-sm shadow-sm flex items-center justify-center">
                                    <Gem className="!w-1.5 !h-1.5 md:!w-2 md:!h-2 text-white" />
                                </div>
                            )}
                        </Link>
                    )}

                    {/* Bubble Container (for Reaction Picker overlap) */}
                    <div className="relative group/bubble">
                        {/* Bubble */}
                        <div className={cn(
                            "rounded-[18px] md:rounded-2xl text-[14px] md:text-[15px] leading-relaxed relative shadow-sm transition-all overflow-hidden border",
                            isDeleted 
                                ? "bg-slate-50 text-slate-400 border-slate-100 italic px-4 py-2 md:px-6 md:py-3.5" 
                                : isOwn 
                                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 shadow-sm" 
                                    : "bg-slate-100 text-slate-800 border-slate-200/50",
                            isOwn && !isContinuation && "rounded-tr-none",
                            !isOwn && !isContinuation && "rounded-tl-none"
                        )}>
                            {/* Reply Quote Block */}
                            {replyTo && !isDeleted && (
                                <button
                                    onClick={() => scrollToMessage(replyTo.id)}
                                    className={cn(
                                        "w-full text-left border-b px-4 py-1.5 md:px-5 md:py-2.5 mb-1 group/reply transition-all block",
                                        isOwn 
                                            ? "bg-black/10 border-black/5 hover:bg-black/20 text-white" 
                                            : "bg-white/50 border-slate-200/50 hover:bg-white/80"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className={cn(
                                            "w-0.5 h-3 rounded-full",
                                            isOwn ? "bg-white/50" : "bg-blue-500"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] md:text-[11px] font-black uppercase tracking-wider",
                                            isOwn ? "text-blue-100" : "text-blue-600"
                                        )}>
                                            {replyTo.userName}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-[12px] md:text-[13px] line-clamp-1 italic",
                                        isOwn ? "text-blue-50/70" : "text-slate-500"
                                    )}>
                                        {replyTo.text || "Message supprimé"}
                                    </p>
                                </button>
                            )}
                            
                            {imageUrl && !isDeleted && (
                                <div className={cn(
                                    "relative overflow-hidden",
                                    text ? "mb-1" : ""
                                )}>
                                    <Link 
                                        href={imageUrl} 
                                        target="_blank" 
                                        className="block group/img relative"
                                    >
                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors z-10 flex items-center justify-center">
                                            <span className="opacity-0 group-hover/img:opacity-100 text-white text-[10px] font-bold uppercase tracking-wider bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all transform scale-90 group-hover/img:scale-100">
                                                Voir en grand
                                            </span>
                                        </div>
                                        <img
                                            src={imageUrl}
                                            alt="Chat attachment"
                                            className="max-w-[240px] md:max-w-[400px] max-h-[300px] md:max-h-[450px] w-auto h-auto object-contain block mx-auto rounded-lg"
                                        />
                                    </Link>
                                </div>
                            )}
                            
                            {/* Shared Resource Card */}
                            {sharedResource && (
                                <div className={cn(
                                    "p-1 md:p-1.5",
                                    text ? "mb-1" : ""
                                )}>
                                    <Link 
                                        href={`/resource/${sharedResource.id}`}
                                        className="block w-full max-w-[260px] md:max-w-none group/resource bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl overflow-hidden hover:bg-white hover:border-primary/30 transition-all shadow-sm"
                                    >
                                        <div className="flex items-start gap-3 md:gap-4 p-3 md:p-5">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-100/50 flex items-center justify-center text-slate-400 group-hover/resource:bg-primary/10 group-hover/resource:text-primary transition-colors shrink-0">
                                                {sharedResource.type === 'pdf' ? <FileText className="w-5 h-5 md:w-6 md:h-6" /> :
                                                 sharedResource.type === 'video' ? <Video className="w-5 h-5 md:w-6 md:h-6" /> :
                                                 sharedResource.type === 'link' ? <LinkIcon className="w-5 h-5 md:w-6 md:h-6" /> :
                                                 <BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] md:text-base font-bold text-slate-900 group-hover/resource:text-primary transition-colors line-clamp-2 leading-tight md:leading-snug">
                                                    {sharedResource.title}
                                                </p>
                                                <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-1.5 truncate">
                                                    {sharedResource.module} • {sharedResource.professor || 'Professeur'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 border-t border-slate-100/50 px-3 md:px-5 py-2 md:py-2.5 flex items-center justify-between group-hover/resource:bg-primary/5 transition-colors">
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sharedResource.type}</span>
                                            <span className="text-[10px] md:text-xs font-bold text-primary flex items-center gap-1 group-hover/resource:underline">
                                                Voir ressource <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* Text Content */}
                            {(text || isDeleted) && (
                                <div className={cn(
                                    !isDeleted && (imageUrl || sharedResource ? "px-4 pb-3 pt-1 md:px-6 md:pb-4 md:pt-2" : "px-4 py-2 md:px-6 md:py-3.5")
                                )}>
                                    {isDeleted ? (
                                        <span className="italic opacity-60">Ce message a été supprimé</span>
                                    ) : (
                                        (() => {
                                            if (!text) return null;
                                            // Unified regex for mentions and URLs
                                            const parts = text.split(/((?:@\w+_\w+)|(?:https?:\/\/[^\s]+))/g);
                                            return parts.map((part, index) => {
                                                if (part.startsWith('@') && part.includes('_')) {
                                                    return (
                                                        <span 
                                                            key={index} 
                                                            className={cn(
                                                                "font-bold px-1.5 py-0.5 rounded-md mx-0.5 inline-block transition-all",
                                                                isOwn 
                                                                    ? "bg-white/20 text-white shadow-sm ring-1 ring-white/10" 
                                                                    : "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/5"
                                                            )}
                                                        >
                                                            {part}
                                                        </span>
                                                    );
                                                }
                                                if (part.startsWith('http')) {
                                                    return (
                                                        <a 
                                                            key={index}
                                                            href={part}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={cn(
                                                                "font-bold underline decoration-2 underline-offset-2 hover:decoration-4 transition-all mx-0.5",
                                                                isOwn ? "text-white" : "text-primary"
                                                            )}
                                                        >
                                                            {part}
                                                        </a>
                                                    );
                                                }
                                                return part;
                                            });
                                        })()
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions (Only if not deleted) */}
                        {!isDeleted && (
                            <div className={cn(
                                "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all z-10",
                                isOwn ? "-left-8 md:-left-20" : "-right-8 md:-right-20",
                                "opacity-0 group-hover/bubble:opacity-100",
                                (showPicker || showMenu) && "opacity-100"
                            )}>
                                {/* Reaction Picker Trigger */}
                                <button 
                                    onClick={() => {
                                        setShowPicker(!showPicker);
                                        setShowMenu(false);
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-100 transition-all",
                                        showPicker ? "text-blue-500 ring-2 ring-blue-50" : "text-slate-400 hover:text-blue-500"
                                    )}
                                >
                                    <SmilePlus className="w-4 h-4" />
                                </button>

                                {/* More Actions Trigger */}
                                <div className="relative">
                                    <button 
                                        onClick={() => {
                                            setShowMenu(!showMenu);
                                            setShowPicker(false);
                                        }}
                                        className={cn(
                                            "w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-100 transition-all",
                                            showMenu ? "text-slate-900 ring-2 ring-slate-100" : "text-slate-400 hover:text-slate-900"
                                        )}
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {/* Actions Dropdown */}
                                    {showMenu && (
                                        <div className={cn(
                                            "absolute bottom-full mb-3 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in duration-200",
                                            isOwn ? "left-0" : "right-0"
                                        )}>
                                            <button 
                                                onClick={() => {
                                                    onReply(message);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                            >
                                                <Reply className="w-4 h-4" />
                                                Répondre
                                            </button>

                                            {canEdit && (
                                                <button 
                                                    onClick={() => setShowMenu(false)} // Placeholder
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Modifier
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button 
                                                    onClick={() => {
                                                        setShowDeleteConfirm(true);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Supprimer
                                                </button>
                                            )}

                                            {canReport && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                                    <button 
                                                        onClick={() => setShowMenu(false)} // Placeholder
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                        Signaler
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Emoji Picker Popover */}
                        {showPicker && (
                            <div className={cn(
                                "absolute bottom-full mb-3 p-1.5 bg-white rounded-full shadow-2xl border border-slate-100 flex items-center gap-1 z-30 animate-in fade-in zoom-in duration-200",
                                isOwn ? "right-0" : "left-0"
                            )}>
                                {COMMON_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            onReact(emoji);
                                            setShowPicker(false);
                                        }}
                                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-50 rounded-full transition-colors active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Custom Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                            {/* Backdrop */}
                            <div 
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            />
                            
                            {/* Dialog Content */}
                            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">Supprimer le message ?</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Cette action est irréversible. Le contenu sera remplacé par un message système.
                                    </p>
                                </div>
                                <div className="flex border-t border-slate-100">
                                    <button 
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-6 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Garder
                                    </button>
                                    <button 
                                        onClick={() => {
                                            onDelete();
                                            setShowDeleteConfirm(false);
                                        }}
                                        className="flex-1 px-6 py-4 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reaction Chips */}
                    {reactionList.length > 0 && !isDeleted && (
                        <div className={cn(
                            "flex flex-wrap gap-1.5 mt-2",
                            isOwn ? "justify-end" : "justify-start"
                        )}>
                            {reactionList.map(({ emoji, count, hasReacted }) => (
                                <button
                                    key={emoji}
                                    onClick={() => onReact(emoji)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-all border",
                                        hasReacted 
                                            ? "bg-blue-50 border-blue-200 text-blue-600" 
                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                    )}
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Timestamp (Always on last in group, or if hovering) */}
                    <div className={cn(
                        "transition-all duration-200 overflow-hidden",
                        isLastInGroup ? "max-h-10 opacity-100" : "max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100"
                    )}>
                        <span className="text-[10px] font-medium text-slate-400 mt-2 block uppercase tracking-wider">
                            {formattedTime}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
