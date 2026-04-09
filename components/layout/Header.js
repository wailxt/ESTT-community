'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { db, ref, onValue } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
    const { user, profile, signOut } = useAuth();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user || !db) return;

        const privateNotifRef = ref(db, `notifications/private/${user.uid}`);
        const unsubPrivate = onValue(privateNotifRef, (snapshot) => {
            const data = snapshot.val() || {};
            const unreadPrivate = Object.values(data).filter(n => !n.read).length;

            const globalNotifRef = ref(db, 'notifications/global');
            onValue(globalNotifRef, (gSnapshot) => {
                const globalData = gSnapshot.val() || {};
                const lastOpenedGlobal = profile?.notifications?.meta?.lastOpenedGlobalAt || 0;
                const unreadGlobal = Object.values(globalData).filter(n => n.createdAt > lastOpenedGlobal).length;

                setUnreadCount(unreadPrivate + unreadGlobal);
            }, { onlyOnce: true });
        });

        return () => {
            unsubPrivate();
        };
    }, [user, profile, db]);

    if (pathname === '/downloadAndroid' || pathname === '/docs') return null;

    const isActive = (path) => pathname === path;

    const navItems = [
        { href: '/', label: 'Accueil' },
        { href: '/events', label: 'Événements' },
        { href: '/contribute', label: 'Contribuer' },
        { href: '/chat', label: 'Discussion' },
    ];

    if (user) {
        navItems.push({ href: '/profile', label: 'Profil' });
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/assets/images/logo__five.svg"
                            alt="EST Tétouan Logo"
                            className="h-10 w-auto"
                            width={150}
                            height={50}
                            priority
                        />
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                isActive(item.href) ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
                        {!user ? (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/signup">S'inscrire</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-muted-foreground hidden lg:flex items-center gap-2">
                                    {profile?.firstName ? `Salut, ${profile.firstName}` : user.email}
                                    {profile?.startYear && (new Date().getFullYear() - parseInt(profile.startYear) >= 1) && Object.keys(profile?.contributions || {}).length > 5 && (
                                        <Badge variant="secondary" className="bg-yellow-400 text-white border-none text-[8px] px-1 animate-pulse">
                                            MENTOR
                                        </Badge>
                                    )}
                                </span>

                                <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Notifications Bell */}
                    {user && (
                        <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-primary transition-colors md:hidden">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* Mobile Menu Toggle via Sheet */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                className="md:hidden"
                                size="icon"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-6">
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
                                            isActive(item.href) ? "text-primary" : "text-slate-600"
                                        )}
                                        onClick={() => setOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-auto pt-6">
                                {!user ? (
                                    <div className="flex flex-col gap-3">
                                        <Button variant="outline" className="w-full justify-center h-12 rounded-xl" asChild onClick={() => setOpen(false)}>
                                            <Link href="/login">Se connecter</Link>
                                        </Button>
                                        <Button className="w-full justify-center h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-md" asChild onClick={() => setOpen(false)}>
                                            <Link href="/signup">S'inscrire</Link>
                                        </Button>
                                    </div>
                                ) : (
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
                                            <Button variant="ghost" className="w-full justify-start h-11 px-4 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl gap-3" asChild onClick={() => setOpen(false)}>
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
                                                    setOpen(false);
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
            </div>
        </header>
    );
}
