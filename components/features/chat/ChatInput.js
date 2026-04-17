import { ArrowUp, Image as ImageIcon, Loader2, Library, Search, FileText, Video, Link as LinkIcon, ArrowRight, BookOpen, Sticker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { db, ref, get, onValue } from '@/lib/firebase';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from 'react';
export default function ChatInput({
    onSendMessage,
    onTypingChange,
    disabled,
    mentionableUsers = [],
    textOnly = false,
    placeholder = "Ecrivez votre message...",
}) {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isResourceDrawerOpen, setIsResourceDrawerOpen] = useState(false);
    const [resources, setResources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [events, setEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    // Sticker state
    const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
    const [stickerPacks, setStickerPacks] = useState([]);
    const [isLoadingStickers, setIsLoadingStickers] = useState(false);

    // Mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    // Fetch stickers when drawer opens
    useEffect(() => {
        if (isStickerDrawerOpen && stickerPacks.length === 0) {
            setIsLoadingStickers(true);
            const stickersRef = ref(db, 'stickers');
            onValue(stickersRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const packs = Object.values(data);
                    setStickerPacks(packs);
                }
                setIsLoadingStickers(false);
            });
        }
    }, [isStickerDrawerOpen]);

    const handleSendSticker = (stickerUrl) => {
        onSendMessage('', null, null, { type: 'sticker', stickerUrl });
        setIsStickerDrawerOpen(false);
    };

    // Filter mentionable users
    const filteredMentions = mentionableUsers.filter(u =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5); // Limit to 5 for UI clarity

    // Sync selected index when list changes
    useEffect(() => {
        setSelectedMentionIndex(0);
    }, [mentionQuery]);

    // Handle mention detection
    const handleInputChange = (e) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setMessage(value);

        // Simple @ mention detection
        const textBeforeCursor = value.slice(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1]);
        } else {
            setShowMentions(false);
        }
    };

    const selectMention = (user) => {
        const cursorPosition = inputRef.current.selectionStart;
        const textBeforeCursor = message.slice(0, cursorPosition);
        const textAfterCursor = message.slice(cursorPosition);

        const mentionStart = textBeforeCursor.lastIndexOf('@');
        const newMessage = message.slice(0, mentionStart) + `@${user.name} ` + textAfterCursor;

        setMessage(newMessage);
        setShowMentions(false);

        // Refocus and move cursor
        setTimeout(() => {
            inputRef.current.focus();
            const newPos = mentionStart + user.name.length + 2;
            inputRef.current.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (showMentions && filteredMentions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev + 1) % filteredMentions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectMention(filteredMentions[selectedMentionIndex]);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
        }
    };

    // Fetch resources when drawer opens
    useEffect(() => {
        if (isResourceDrawerOpen) {
            if (resources.length === 0) fetchAllResources();
            if (events.length === 0) fetchAllEvents();
        }
    }, [isResourceDrawerOpen]);

    const fetchAllResources = async () => {
        setIsLoadingResources(true);
        try {
            const resourcesRef = ref(db, 'resources');
            const snapshot = await get(resourcesRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const formatted = Object.entries(data)
                    .map(([id, res]) => ({ id, ...res }))
                    .filter(res => !res.unverified && res.title);
                setResources(formatted);
            }
        } catch (error) {
            console.error('Error fetching resources for chat:', error);
        } finally {
            setIsLoadingResources(false);
        }
    };

    const fetchAllEvents = async () => {
        setIsLoadingEvents(true);
        try {
            const clubsSnap = await get(ref(db, 'clubs'));
            if (!clubsSnap.exists()) return;

            const clubsData = clubsSnap.val();
            const eventsPromises = Object.entries(clubsData).map(async ([clubId, club]) => {
                const eventsSnap = await get(ref(db, `clubs/${clubId}/events`));
                if (!eventsSnap.exists()) return [];
                return Object.entries(eventsSnap.val()).map(([id, data]) => ({
                    id,
                    ...data,
                    clubId,
                    clubName: club.name,
                    clubLogo: club.logo,
                    clubThemeColor: club.themeColor
                })).filter(e => !e.status || e.status === 'published');
            });

            const results = await Promise.all(eventsPromises);
            setEvents(results.flat().sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)));
        } catch (error) {
            console.error('Error fetching events for chat:', error);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const filteredResources = resources.filter(res =>
        res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.professor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.module?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredEvents = events.filter(e =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.clubName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5" />;
            case 'video': return <Video className="w-5 h-5" />;
            case 'link': return <LinkIcon className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    const handleShareResource = (resource) => {
        onSendMessage('', null, {
            id: resource.id,
            title: resource.title,
            type: resource.type,
            module: resource.module || resource.moduleId,
            professor: resource.professor
        });
        setIsResourceDrawerOpen(false);
    };

    const handleShareEvent = (event) => {
        onSendMessage('', null, null, {}, {
            id: event.id,
            clubId: event.clubId
        });
        setIsResourceDrawerOpen(false);
    };

    // Typing detection logic
    useEffect(() => {
        if (!message.trim() || disabled) {
            if (isTypingRef.current) {
                isTypingRef.current = false;
                onTypingChange?.(false);
            }
            return;
        }

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTypingChange?.(true);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            onTypingChange?.(false);
        }, 2000);

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [message, onTypingChange, disabled]);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const imageUrl = await uploadToImgBB(file);
            onSendMessage('', imageUrl);
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Erreur: Impossible d\'envoyer l\'image.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');

            if (isTypingRef.current) {
                isTypingRef.current = false;
                onTypingChange?.(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    return (
        <div className="flex flex-col w-full gap-2">
            <form
                onSubmit={handleSubmit}
                className="flex items-center w-full gap-2"
            >
                <div className="relative flex-1 group flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {!textOnly && (
                        <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={disabled || isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30",
                                isUploading && "animate-pulse cursor-not-allowed"
                            )}
                            title="Envoyer une image"
                        >
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ImageIcon className="w-5 h-5" />
                            )}
                        </button>

                        <Sheet open={isStickerDrawerOpen} onOpenChange={setIsStickerDrawerOpen}>
                            <SheetTrigger asChild>
                                <button
                                    type="button"
                                    disabled={disabled || isUploading}
                                    className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30"
                                    title="Envoyer un sticker"
                                >
                                    <Sticker className="w-5 h-5" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[60vh] p-0 flex flex-col rounded-t-[2rem] bg-white z-[100]">
                                <SheetHeader className="p-6 pb-2">
                                    <SheetTitle className="text-xl font-black">Stickers</SheetTitle>
                                    <SheetDescription>
                                        Exprimez-vous avec des stickers.
                                    </SheetDescription>
                                </SheetHeader>

                                <Tabs defaultValue={stickerPacks[0]?.id || "empty"} className="flex-1 flex flex-col overflow-hidden">
                                    <div className="px-6 pb-2 overflow-x-auto no-scrollbar">
                                        <TabsList className="bg-slate-100/50 p-1 rounded-xl w-max min-w-full justify-start">
                                            {stickerPacks.length > 0 ? (
                                                stickerPacks.map(pack => (
                                                    <TabsTrigger
                                                        key={pack.id}
                                                        value={pack.id}
                                                        className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                                                    >
                                                        {pack.name}
                                                    </TabsTrigger>
                                                ))
                                            ) : (
                                                <TabsTrigger value="empty" disabled>Aucun pack</TabsTrigger>
                                            )}
                                        </TabsList>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 py-4">
                                        {isLoadingStickers ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                                                <p className="font-bold">Chargement des stickers...</p>
                                            </div>
                                        ) : stickerPacks.length > 0 ? (
                                            stickerPacks.map(pack => (
                                                <TabsContent key={pack.id} value={pack.id} className="mt-0 outline-none">
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 pb-8">
                                                        {pack.items?.map((url, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleSendSticker(url)}
                                                                className="aspect-square relative group hover:scale-110 active:scale-95 transition-all duration-200"
                                                            >
                                                                <img
                                                                    src={url}
                                                                    alt={`${pack.name} sticker ${idx}`}
                                                                    className="w-full h-full object-contain"
                                                                    loading="lazy"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 grayscale opacity-30">
                                                <Sticker className="w-16 h-16" />
                                                <p className="font-bold text-center">Pas encore de stickers disponibles</p>
                                            </div>
                                        )}
                                    </div>
                                </Tabs>
                            </SheetContent>
                        </Sheet>

                        <Sheet open={isResourceDrawerOpen} onOpenChange={setIsResourceDrawerOpen}>
                            <SheetTrigger asChild>
                                <button
                                    type="button"
                                    disabled={disabled || isUploading}
                                    className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30"
                                    title="Partager une ressource"
                                >
                                    <Library className="w-5 h-5" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white z-[100]">
                                <SheetHeader className="p-6 border-b">
                                    <SheetTitle>Partager du contenu</SheetTitle>
                                    <SheetDescription>
                                        Partagez des ressources ou des événements avec la communauté.
                                    </SheetDescription>
                                    <div className="relative mt-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Rechercher..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 rounded-full bg-slate-50"
                                        />
                                    </div>
                                </SheetHeader>

                                <Tabs defaultValue="resources" className="flex-1 flex flex-col overflow-hidden">
                                    <div className="px-6 py-2 border-b">
                                        <TabsList className="grid grid-cols-2 w-full">
                                            <TabsTrigger value="resources" className="text-xs font-bold">Ressources</TabsTrigger>
                                            <TabsTrigger value="events" className="text-xs font-bold">Événements</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        <TabsContent value="resources" className="m-0 p-4 h-full">
                                            {isLoadingResources ? (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                                    <p className="text-xs text-slate-400">Chargement des ressources...</p>
                                                </div>
                                            ) : filteredResources.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <p className="text-slate-500 text-sm">Aucune ressource trouvée.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {filteredResources.map((res) => (
                                                        <div
                                                            key={res.id}
                                                            className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all cursor-pointer"
                                                            onClick={() => handleShareResource(res)}
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                {getResourceIcon(res.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 truncate">{res.title}</p>
                                                                <p className="text-[11px] text-slate-500 truncate">
                                                                    {res.module || res.moduleId} • {res.professor || 'Professeur inconnu'}
                                                                </p>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="events" className="m-0 p-4 h-full">
                                            {isLoadingEvents ? (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                                    <p className="text-xs text-slate-400">Chargement des événements...</p>
                                                </div>
                                            ) : filteredEvents.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <p className="text-slate-500 text-sm">Aucun événement trouvé.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {filteredEvents.map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all cursor-pointer"
                                                            onClick={() => handleShareEvent(event)}
                                                        >
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                                                {event.clubLogo ? (
                                                                    <img src={event.clubLogo} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                                        <CalendarDays className="w-5 h-5 text-slate-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 truncate">{event.title}</p>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500 uppercase">
                                                                        {event.clubName}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {new Date(event.date || event.eventDate || event.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </SheetContent>
                        </Sheet>
                        </div>
                    )}

                    <div className="relative flex-1">
                        {/* Mention Suggestions */}
                        {showMentions && filteredMentions.length > 0 && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                                <div className="p-1">
                                    {filteredMentions.map((user, index) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => selectMention(user)}
                                            className={cn(
                                                "w-full flex items-center px-4 py-2 rounded-xl transition-all text-left text-[13px] font-medium",
                                                index === selectedMentionIndex
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "hover:bg-slate-50 text-slate-600"
                                            )}
                                        >
                                            @{user.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled || isUploading}
                            className={cn(
                                "w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 px-6 pr-14 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
                                (disabled || isUploading) && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <button
                            type="submit"
                            disabled={disabled || !message.trim() || isUploading}
                            className={cn(
                                "absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                message.trim() && !disabled && !isUploading
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-300"
                            )}
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
