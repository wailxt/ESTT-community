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

                <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/7] shadow-2xl group">
                    {/* Background Image/Gradient */}
                    <div className="absolute inset-0">
                        {announcements[currentSlide].imageUrl ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={announcements[currentSlide].imageUrl}
                                    alt="Announcement cover"
                                    fill
                                    sizes={IMAGE_SIZES.ANNOUNCEMENT_HERO}
                                    className="object-cover opacity-80 transition-opacity duration-700 scale-105 group-hover:scale-100 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            </div>
                        ) : (
                            <div
                                className="w-full h-full"
                                style={{
                                    background: `linear-gradient(135deg, ${announcements[currentSlide].themeColor || '#3b82f6'} 0%, #0f172a 100%)`
                                }}
                            />
                        )}
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                        <div className="max-w-2xl space-y-3">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                {announcements[currentSlide].clubLogo && (
                                    <div className="relative w-5 h-5 md:w-7 md:h-7 rounded-full overflow-hidden border border-white/20 bg-white shadow-sm">
                                        <Image src={announcements[currentSlide].clubLogo} alt={announcements[currentSlide].clubName} fill sizes={IMAGE_SIZES.CLUB_LOGO_SM} className="object-cover" />
                                    </div>
                                )}
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-[11px]">
                                    {announcements[currentSlide].clubName}
                                </Badge>
                                <Badge variant="outline" className="text-white border-white/30 backdrop-blur-sm text-[9px] md:text-[11px] px-2 py-0.5">
                                    {announcements[currentSlide].type === 'announcement' ? 'Annonce' : 'Activité'}
                                </Badge>
                            </div>

                            {announcements[currentSlide].isAdmin ? (
                                <h3 className="text-xl md:text-3xl font-black text-white line-clamp-2 leading-tight drop-shadow-md">
                                    {announcements[currentSlide].title}
                                </h3>
                            ) : (
                                <Link href={`/clubs/${announcements[currentSlide].clubId}/posts/${announcements[currentSlide].id}`} className="block">
                                    <h3 className="text-xl md:text-3xl font-black text-white hover:text-primary transition-colors line-clamp-2 md:line-clamp-3 leading-[1.1] drop-shadow-md">
                                        {announcements[currentSlide].title}
                                    </h3>
                                </Link>
                            )}

                            <p className="text-white/90 line-clamp-2 text-xs md:text-base max-w-xl font-medium drop-shadow-sm">
                                {announcements[currentSlide].content}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-4 md:pt-6">
                                {announcements[currentSlide].isAd ? (
                                    <Button asChild size="lg" className="rounded-full font-bold px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                                        <a href={announcements[currentSlide].link} target="_blank" rel="noopener noreferrer">
                                            Découvrir le projet
                                        </a>
                                    </Button>
                                ) : (
                                    <>
                                        {!announcements[currentSlide].isAdmin && (
                                            <Button asChild size="sm" className="md:hidden rounded-full font-bold px-6 shadow-lg shadow-primary/20">
                                                <Link href={`/clubs/${announcements[currentSlide].clubId}/posts/${announcements[currentSlide].id}`}>
                                                    Accéder
                                                </Link>
                                            </Button>
                                        )}
                                        {!announcements[currentSlide].isAdmin && (
                                            <Button asChild size="lg" className="hidden md:flex rounded-full font-bold px-8 shadow-lg shadow-primary/20">
                                                <Link href={`/clubs/${announcements[currentSlide].clubId}/posts/${announcements[currentSlide].id}`}>
                                                    Lire la suite
                                                </Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                                <span className="text-white/60 text-[10px] md:text-sm font-medium">
                                    {announcements[currentSlide].isAd ? 'Sponsorisé' : new Date(announcements[currentSlide].createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="absolute bottom-4 right-4 md:bottom-12 md:right-12 flex gap-2">
                        <button
                            onClick={(e) => { e.preventDefault(); prevSlide(); }}
                            className="p-2 md:p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all border border-white/10"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); nextSlide(); }}
                            className="p-2 md:p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all border border-white/10"
                        >
                            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                        </button>
                    </div>

                    {/* Indicators */}
                    <div className="absolute top-4 right-4 md:top-12 md:right-12 flex gap-1.5 md:gap-2">
                        {announcements.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={cn(
                                    "h-1 md:h-1.5 rounded-full transition-all duration-500",
                                    idx === currentSlide ? "bg-white w-6 md:w-8" : "bg-white/30 w-3 md:w-4 hover:bg-white/50"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
