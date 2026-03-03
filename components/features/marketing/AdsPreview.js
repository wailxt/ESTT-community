'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AdsPreview({ ads }) {
    if (!ads || ads.length === 0) return null;

    return (
        <section id="student-ads" className="py-12 md:py-20 bg-white">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-4">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 md:mb-4">Projets & Partenaires</h2>
                        <p className="text-slate-500 text-lg">
                            Soutenez les initiatives et services créés par vos camarades de l'ESTT.
                        </p>
                    </div>
                    <Link href="/ads-portal" className="text-primary text-sm font-bold hover:underline shrink-0">
                        Toutes les annonces →
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {ads.map((ad) => (
                        <div key={ad.id} className="group border border-slate-200 rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                            <div className="relative aspect-video overflow-hidden bg-slate-100">
                                {ad.type === 'video' ? (
                                    <video
                                        src={ad.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        onMouseOver={(e) => e.target.play()}
                                        onMouseOut={(e) => e.target.pause()}
                                    />
                                ) : (
                                    <Image
                                        src={ad.url}
                                        alt={ad.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="inline-block bg-white/90 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                                        {ad.type === 'video' ? 'Vidéo' : 'Focus'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors mb-2 line-clamp-1">
                                    {ad.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                    {ad.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                                            {ad.publisherEmail?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">Communauté</span>
                                    </div>
                                    {ad.link && (
                                        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">
                                            Découvrir →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
