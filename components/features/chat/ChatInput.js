import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Image as ImageIcon, Loader2, Library, Search, FileText, Video, Link as LinkIcon, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { db, ref, get } from '@/lib/firebase';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export default function ChatInput({ onSendMessage, onTypingChange, disabled, mentionableUsers = [] }) {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isResourceDrawerOpen, setIsResourceDrawerOpen] = useState(false);
    const [resources, setResources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    
    // Mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

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
        if (isResourceDrawerOpen && resources.length === 0) {
            fetchAllResources();
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

    const filteredResources = resources.filter(res => 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.professor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.module?.toLowerCase().includes(searchQuery.toLowerCase())
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
                            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                                <SheetHeader className="p-6 border-b">
                                    <SheetTitle>Partager une ressource</SheetTitle>
                                    <SheetDescription>
                                        Recherchez et partagez des ressources académiques avec la communauté.
                                    </SheetDescription>
                                    <div className="relative mt-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Rechercher par titre, module ou prof..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 rounded-full bg-slate-50"
                                        />
                                    </div>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto p-4">
                                    {isLoadingResources ? (
                                        <div className="flex flex-col items-center justify-center py-10">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                            <p className="text-xs text-slate-400">Chargement de la bibliothèque...</p>
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
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

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
                            placeholder="Écrivez votre message..."
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
