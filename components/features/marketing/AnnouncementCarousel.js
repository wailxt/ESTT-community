'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IMAGE_SIZES } from '@/lib/image-constants';
import { cn } from '@/lib/utils';

export default function AnnouncementCarousel({
    announcements,
    currentSlide,
    setCurrentSlide,
    nextSlide,
    prevSlide
}) {
    if (!announcements || announcements.length === 0) return null;

    return (
        <section className="py-20 bg-slate-50/50">
            <div className="container px-4 md:px-6">
                <div className="max-w-2xl mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">À ne pas manquer</h2>
                    <p className="text-slate-500 text-lg">Les annonces et événements récents de la communauté.</p>
                </div>

                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 aspect-[5/6] sm:aspect-[16/9] md:aspect-[21/7] shadow-xl group">
                    {announcements.map((ann, idx) => {
                        const isActive = idx === currentSlide;
                        return (
                            <div
                                key={ann.id || idx}
                                className={cn(
                                    "absolute inset-0 transition-opacity duration-700 ease-in-out",
                                    isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                                )}
                            >
                                {/* Background Image/Gradient */}
                                <div className="absolute inset-0">
                                    {ann.imageUrl ? (
                                        <Image
                                            src={ann.imageUrl}
                                            alt="Announcement cover"
                                            fill
                                            sizes={IMAGE_SIZES.ANNOUNCEMENT_HERO}
                                            className={cn("object-cover transition-transform duration-[3000ms] ease-out", isActive ? "scale-100" : "scale-105")}
                                            priority={idx === 0}
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full"
                                            style={{
                                                background: `linear-gradient(135deg, ${ann.themeColor || '#3b82f6'} 0%, #0f172a 100%)`
                                            }}
                                        />
                                    )}
                                    {/* Dark overlay masks so text appears clearly */}
                                    <div className="absolute inset-0 bg-black/40" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10 lg:p-12">
                                    <div className="max-w-2xl space-y-3 md:space-y-4">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {ann.clubLogo && (
                                                <div className="relative w-5 h-5 md:w-7 md:h-7 rounded-full overflow-hidden border border-white/20 bg-white shadow-sm">
                                                    <Image src={ann.clubLogo} alt={ann.clubName || "Club"} fill sizes={IMAGE_SIZES.CLUB_LOGO_SM} className="object-cover" />
                                                </div>
                                            )}
                                            {ann.clubName && (
                                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-[11px]">
                                                    {ann.clubName}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-white border-white/30 backdrop-blur-sm text-[10px] md:text-[11px] px-2 py-0.5">
                                                {ann.type === 'announcement' ? 'Annonce' : 'Activité'}
                                            </Badge>
                                        </div>

                                        {ann.isAdmin ? (
                                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white line-clamp-2 md:line-clamp-3 leading-tight drop-shadow-md">
                                                {ann.title}
                                            </h3>
                                        ) : (
                                            <Link href={`/clubs/${ann.clubId}/posts/${ann.id}`} className="block">
                                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white hover:text-primary transition-colors line-clamp-2 md:line-clamp-3 leading-tight drop-shadow-md">
                                                    {ann.title}
                                                </h3>
                                            </Link>
                                        )}

                                        <p className="text-white/90 line-clamp-2 md:line-clamp-3 text-sm md:text-lg max-w-xl font-medium drop-shadow-sm pb-2">
                                            {ann.content}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-4">
                                            {ann.isAd ? (
                                                <Button asChild size="default" className="md:h-12 rounded-full font-bold px-6 border border-white/20 bg-emerald-600/90 hover:bg-emerald-600 backdrop-blur-sm shadow-lg shadow-emerald-900/30">
                                                    <a href={ann.link} target="_blank" rel="noopener noreferrer">
                                                        Découvrir le projet
                                                    </a>
                                                </Button>
                                            ) : (
                                                <>
                                                    {!ann.isAdmin && (
                                                        <Button asChild size="default" className="md:hidden rounded-full font-bold px-6 shadow-lg border border-white/20 bg-primary/90 backdrop-blur-sm shadow-primary/30">
                                                            <Link href={`/clubs/${ann.clubId}/posts/${ann.id}`}>
                                                                Accéder
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {!ann.isAdmin && (
                                                        <Button asChild size="lg" className="hidden md:flex rounded-full font-bold px-8 shadow-lg border border-white/20 bg-primary/90 backdrop-blur-sm shadow-primary/30">
                                                            <Link href={`/clubs/${ann.clubId}/posts/${ann.id}`}>
                                                                Lire la suite
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            <span className="text-white/70 text-xs md:text-sm font-medium">
                                                {ann.isAd ? 'Sponsorisé' : new Date(ann.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Navigation Buttons */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 md:bottom-12 md:top-auto md:translate-y-0 md:left-auto md:right-12 flex justify-between md:justify-end gap-2 z-20 pointer-events-none">
                        <button
                            onClick={(e) => { e.preventDefault(); prevSlide(); }}
                            className="p-1 sm:p-2 md:p-3 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 transition-all border border-white/10 pointer-events-auto"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); nextSlide(); }}
                            className="p-1 sm:p-2 md:p-3 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 transition-all border border-white/10 pointer-events-auto"
                        >
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>

                    {/* Indicators */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 md:top-12 md:bottom-auto md:left-auto md:right-12 md:translate-x-0 flex gap-1.5 md:gap-2 z-20">
                        {announcements.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.preventDefault(); setCurrentSlide(idx); }}
                                className={cn(
                                    "h-1.5 md:h-1.5 rounded-full transition-all duration-500",
                                    idx === currentSlide ? "bg-white w-6 md:w-8" : "bg-white/40 w-3 md:w-4 hover:bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
