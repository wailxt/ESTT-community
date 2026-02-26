'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell } from 'lucide-react';
import { db, ref, onValue } from '@/lib/firebase';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';


export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const pathname = usePathname();
    if (pathname === '/downloadAndroid' || pathname === '/docs') return null;
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user || !db) return;

        // Listen for private notifications
        const privateNotifRef = ref(db, `notifications/private/${user.uid}`);
        const unsubPrivate = onValue(privateNotifRef, (snapshot) => {
            const data = snapshot.val() || {};
            const unreadPrivate = Object.values(data).filter(n => !n.read).length;

            // Listen for global notifications
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


    const isActive = (path) => pathname === path;

    const navItems = [
        { href: '/', label: 'Accueil' },
        { href: '/events', label: 'Événements' },
        { href: '/contribute', label: 'Contribuer' },
    ];

    if (user) {
        navItems.push({ href: '/chat', label: 'Chat' });
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

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        className="md:hidden"
                        size="icon"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background">
                    <nav className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    isActive(item.href) ? "text-foreground" : "text-muted-foreground"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {!user ? (
                            <div className="flex flex-col gap-2 mt-4">
                                <Button variant="ghost" asChild onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                                <Button asChild onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/signup">S'inscrire</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 mt-4">
                                <span className="text-sm font-medium text-muted-foreground text-center">
                                    {user.email}
                                </span>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
