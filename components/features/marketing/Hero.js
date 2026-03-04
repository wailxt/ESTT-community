'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function Hero({ stats, handleSearchClick }) {
    return (
        <section id="hero" className="bg-white pt-20 pb-16 lg:pt-32 lg:pb-24 border-b border-slate-100">
            <div className="container px-4 md:px-6 flex flex-col items-center text-center">
                <h1 className="text-3xl font-heading font-black tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-tight">
                    Partage tes ressources — aide tes camarades, gagne du temps
                </h1>
                <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
                    Tu as un cours, un TD, un exercice ou une vidéo utile ? Contribue en moins de 2 minutes.
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-medium">
                    <div className="flex flex-col items-center gap-1">
                        <strong className="text-3xl font-black text-primary" id="hero-stat-resources">{stats.resources}</strong>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ressources</span>
                    </div>
                    <div className="w-px h-10 bg-slate-100 hidden sm:block"></div>
                    <div className="flex flex-col items-center gap-1">
                        <strong className="text-3xl font-black text-primary" id="hero-stat-contributions">{stats.contributions}</strong>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">En attente</span>
                    </div>
                    <div className="w-px h-10 bg-slate-100 hidden sm:block"></div>
                    <div className="flex flex-col items-center gap-1">
                        <strong className="text-3xl font-black text-primary" id="hero-stat-modules">{stats.modules}</strong>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Modules</span>
                    </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="rounded-full px-8 text-lg h-12" asChild>
                        <Link href="/contribute">
                            Contribuer une ressource
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12" asChild>
                        <Link href="/browse">
                            Parcourir les ressources
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12" asChild>
                        <Link href="/clubs">
                            Découvrir les clubs
                        </Link>
                    </Button>
                </div>

                <p className="mt-5 text-sm text-muted-foreground/70">
                    Formats acceptés : PDF · Images · Liens · Vidéos — Anonyme possible · Modération rapide
                </p>

                <div className="relative w-full max-w-2xl mt-12 z-50 px-2 sm:px-0">
                    <div
                        onClick={handleSearchClick}
                        className="group relative cursor-pointer"
                    >
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors z-10 pointer-events-none">
                            <Search className="h-5 w-5" />
                        </div>

                        <div className="w-full h-16 sm:h-20 pl-16 sm:pl-20 pr-10 rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm flex items-center text-slate-400 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 shadow-sm text-base md:text-xl font-medium tracking-tight">
                            Rechercher un module, un cours ou une filière...
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
