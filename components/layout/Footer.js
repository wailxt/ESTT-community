'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, Github, Globe, MessageCircle, BookOpen, ExternalLink, ShieldCheck, Mail, Info } from 'lucide-react';
import LatestReleaseBadge from '../LatestReleaseBadge';

export default function Footer() {
    const pathname = usePathname();
    if (pathname === '/downloadAndroid' || pathname === '/docs') return null;
    const isAdsPage = pathname === '/ads-portal';

    const currentYear = new Date().getFullYear();

    const sections = [
        {
            title: "Exploration",
            links: [
                { label: "Ressources", href: "/browse" },
                { label: "Événements", href: "/events" },
                { label: "Clubs & Assos", href: "/clubs" },
                { label: "Cours & Examens", href: "/browse?type=course" },
            ]
        },
        {
            title: "Communauté",
            links: [
                { label: "Discussion", href: "/chat" },
                { label: "Contribution", href: "/contribute" },
                { label: "Advertisement ", href: "/ads-portal" },
                { label: "Remerciements", href: "/remerciements" },
            ]
        },
        {
            title: "Support",
            links: [
                { label: "Documentation", href: "/docs" },
                { label: "App Android", href: "/downloadAndroid" },
                { label: "Aide / FAQ", href: "/docs#faq" },
                { label: "Signaler un bug", href: "/report-bug" },
            ]
        }
    ];

    return (
        <footer className="w-full bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 pt-16 pb-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="sm:col-span-2 lg:col-span-2 space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            {!isAdsPage && (
                                <Image
                                    src="/assets/images/logo__five.svg"
                                    alt="EST Tétouan"
                                    width={120}
                                    height={40}
                                    className="h-9 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                            )}
                            <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">
                                ESTT<span className="text-primary">.community</span>
                            </span>
                        </Link>

                        <p className="text-base text-slate-500 leading-relaxed max-w-sm mx-auto lg:mx-0">
                            La plateforme collaborative pour les étudiants de l'École Supérieure de Technologie de Tétouan.
                        </p>

                        <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
                            <a href="https://github.com/abdelhakim-sahifa/ESTT-community/" target="_blank" rel="noopener noreferrer"
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all shadow-sm">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://estt.uae.ac.ma" target="_blank" rel="noopener noreferrer"
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all shadow-sm">
                                <Globe className="w-5 h-5" />
                            </a>
                            <a href="mailto:estt.community+dev@gmail.com"
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all shadow-sm">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-12 lg:col-span-3">
                        {sections.map((section, idx) => (
                            <div key={idx} className="space-y-4 sm:space-y-6 flex flex-col items-start text-left">
                                <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-900">
                                    {section.title}
                                </h4>
                                <ul className="space-y-3 sm:space-y-4">
                                    {section.links.map((link, lIdx) => (
                                        <li key={lIdx}>
                                            <Link
                                                href={link.href}
                                                target={link.external ? "_blank" : undefined}
                                                rel={link.external ? "noopener noreferrer" : undefined}
                                                className="text-[11px] sm:text-sm text-slate-500 hover:text-primary inline-flex items-center gap-1.5 transition-all duration-200 group"
                                            >
                                                <span className="truncate max-w-[80px] sm:max-w-none">{link.label}</span>
                                                {link.external && <ExternalLink className="w-3 h-3 opacity-0 lg:group-hover:opacity-100 transition-opacity hidden sm:block" />}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-8 text-sm">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                        <p className="text-[11px] sm:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                            &copy; {currentYear} EST Tétouan. Fait avec <Heart className="w-3.5 h-3.5 text-slate-400" /> par les étudiants.
                        </p>

                        <div className="flex items-center justify-center gap-6">
                            <Link href="/privacy" className="text-[11px] sm:text-sm text-slate-400 hover:text-slate-600 transition-colors">Vie privée</Link>
                            <Link href="/terms" className="text-[11px] sm:text-sm text-slate-400 hover:text-slate-600 transition-colors">Conditions</Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <LatestReleaseBadge />
                        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Image
                                src="/icons/open-source.png"
                                alt="Open Source"
                                width={16}
                                height={16}
                                className="opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            Open Source Project
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
