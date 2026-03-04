'use client';

import { useState, useEffect } from 'react';
import { db, ref, onValue } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { markAsRead, markGlobalAsRead, NOTIF_PRIORITY } from '@/lib/notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Bell, CheckCheck, Loader2, ArrowRight, Info, AlertTriangle, Megaphone, ExternalLink, Download, Check, Copy, Edit, Trash2, Share2, MoreVertical, MapPin, Calendar, User, Mail, Phone, Eye, Lock, Home, Search, Menu, X, Plus, Minus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Heart, Star, Flag, Bookmark, Settings, LogOut, LogIn, Clock, Zap, AlertCircle, CheckCircle, AlertOctagon, MessageSquare, Send, Inbox, Archive, Trash, FileText, Image, Music, Video, Code, Cpu, Database, Server, Cloud, GitBranch, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const { user, profile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!user || !db) return;

        // Fetch private notifications
        const privateRef = ref(db, `notifications/private/${user.uid}`);
        const unsubPrivate = onValue(privateRef, (snapshot) => {
            const privateData = snapshot.val() || {};
            const privateList = Object.entries(privateData).map(([id, val]) => ({
                ...val,
                id,
                isGlobal: false
            }));

            // Fetch global notifications
            const globalRef = ref(db, 'notifications/global');
            onValue(globalRef, (gSnapshot) => {
                const globalData = gSnapshot.val() || {};
                const lastOpenedGlobal = profile?.notifications?.meta?.lastOpenedGlobalAt || 0;

                const globalList = Object.entries(globalData).map(([id, val]) => ({
                    ...val,
                    id,
                    isGlobal: true,
                    read: val.createdAt <= lastOpenedGlobal
                }));

                // Combine and sort
                const combined = [...privateList, ...globalList].sort((a, b) => b.createdAt - a.createdAt);
                setNotifications(combined);
                setLoading(false);
            }, { onlyOnce: true });
        });

        return () => {
            unsubPrivate();
        };
    }, [user, profile, db]);

    const handleMarkAllRead = async () => {
        if (!user) return;

        // Mark private as read
        const unreadPrivate = notifications.filter(n => !n.isGlobal && !n.read);
        for (const n of unreadPrivate) {
            await markAsRead(user.uid, n.id);
        }

        // Mark global as read (update meta)
        await markGlobalAsRead(user.uid);
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            if (notif.isGlobal) {
                await markGlobalAsRead(user.uid);
            } else {
                await markAsRead(user.uid, notif.id);
            }
        }

        // Open modal instead of directly performing action
        setSelectedNotif(notif);
        setIsModalOpen(true);
    };

    const handleActionClick = (notif) => {
        if (notif.action && notif.action.target) {
            // Support dynamic parameters
            let finalTarget = notif.action.target
                .replace(/{uid}/g, user?.uid || '')
                .replace(/{email}/g, user?.email || '')
                .replace(/{firstName}/g, profile?.firstName || '')
                .replace(/{lastName}/g, profile?.lastName || '');

            if (notif.action.type === 'navigate') {
                setIsModalOpen(false);
                router.push(finalTarget);
            } else if (notif.action.type === 'external_link') {
                window.open(finalTarget, '_blank');
            }
        }
    };


    const getIcon = (iconName) => {
        switch (iconName) {
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
            case 'alert-triangle': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'megaphone': return <Megaphone className="w-5 h-5 text-primary" />;
            case 'credit-card': return <Bell className="w-5 h-5 text-orange-500" />;
            case 'book-open': return <Bell className="w-5 h-5 text-emerald-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const getDynamicIcon = (iconName, className = "w-4 h-4") => {
        const iconMap = {
            'arrow-right': <ArrowRight className={className} />,
            'external-link': <ExternalLink className={className} />,
            'check': <Check className={className} />,
            'download': <Download className={className} />,
            'copy': <Copy className={className} />,
            'edit': <Edit className={className} />,
            'trash': <Trash2 className={className} />,
            'trash-2': <Trash2 className={className} />,
            'share': <Share2 className={className} />,
            'share-2': <Share2 className={className} />,
            'more-vertical': <MoreVertical className={className} />,
            'calendar': <Calendar className={className} />,
            'user': <User className={className} />,
            'mail': <Mail className={className} />,
            'phone': <Phone className={className} />,
            'eye': <Eye className={className} />,
            'lock': <Lock className={className} />,
            'home': <Home className={className} />,
            'search': <Search className={className} />,
            'heart': <Heart className={className} />,
            'star': <Star className={className} />,
            'flag': <Flag className={className} />,
            'bookmark': <Bookmark className={className} />,
            'settings': <Settings className={className} />,
            'clock': <Clock className={className} />,
            'zap': <Zap className={className} />,
            'alert-circle': <AlertCircle className={className} />,
            'check-circle': <CheckCircle className={className} />,
            'message-square': <MessageSquare className={className} />,
            'send': <Send className={className} />,
            'inbox': <Inbox className={className} />,
            'archive': <Archive className={className} />,
            'file-text': <FileText className={className} />,
            'image': <Image className={className} />,
            'music': <Music className={className} />,
            'video': <Video className={className} />,
            'code': <Code className={className} />,
            'cpu': <Cpu className={className} />,
            'database': <Database className={className} />,
            'server': <Server className={className} />,
            'cloud': <Cloud className={className} />,
            'git-branch': <GitBranch className={className} />,
            'package': <Package className={className} />,
        };
        return iconMap[iconName] || <ArrowRight className={className} />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-12 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Vos Notifications</h1>
                    <p className="text-muted-foreground mt-1">Restez informé de l'activité de votre compte.</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/5 font-bold"
                        onClick={handleMarkAllRead}
                    >
                        <CheckCheck className="w-4 h-4 mr-2" /> Tout marquer
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="border-none shadow-sm bg-slate-50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <Bell className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="font-bold text-slate-900">Aucune notification</h3>
                        <p className="text-sm text-slate-500 max-w-[250px] mt-2">
                            Vous recevrez ici les alertes concernant vos contributions et annonces.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={cn(
                                "border-none shadow-sm transition-all cursor-pointer hover:shadow-md",
                                !notif.read ? "bg-white border-l-4 border-l-primary" : "bg-slate-50/50"
                            )}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <CardContent className="p-5 flex gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100",
                                    !notif.read ? "bg-primary/5" : "bg-white"
                                )}>
                                    {getIcon(notif.icon)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className={cn("text-sm font-bold truncate", !notif.read ? "text-slate-900" : "text-slate-600")}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap uppercase tracking-wider">
                                            {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                    </p>

                                    {notif.action && (
                                        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-primary uppercase tracking-tighter group">
                                            Voir les détails <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    )}
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 animate-pulse" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Notification Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-full max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100",
                                "bg-primary/5"
                            )}>
                                {selectedNotif && getIcon(selectedNotif.icon)}
                            </div>
                            <div className="flex-grow">
                                <DialogTitle className="text-lg">
                                    {selectedNotif?.title}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    {selectedNotif?.priority && (
                                        <Badge
                                            variant={
                                                selectedNotif.priority === 'high' ? 'destructive' :
                                                selectedNotif.priority === 'normal' ? 'default' :
                                                'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {selectedNotif.priority === 'high' ? 'Haute priorité' :
                                             selectedNotif.priority === 'normal' ? 'Normale' :
                                             'Basse priorité'}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-slate-400">
                                        {selectedNotif?.createdAt && new Date(selectedNotif.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                Message
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedNotif?.message}
                            </p>
                        </div>

                        {selectedNotif?.action && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Action
                                </h4>
                                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md font-mono break-all">
                                    <span className="text-primary font-semibold">[{selectedNotif.action.type}]</span> {selectedNotif.action.target}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <DialogClose asChild>
                            <Button variant="outline" size="sm">
                                Fermer
                            </Button>
                        </DialogClose>
                        {selectedNotif?.action && (
                            <Button
                                size="sm"
                                onClick={() => handleActionClick(selectedNotif)}
                                className="gap-1"
                            >
                                {getDynamicIcon(selectedNotif.action.buttonIcon || 'arrow-right')}
                                {selectedNotif.action.buttonText || 'Voir les détails'}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
