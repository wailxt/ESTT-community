'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero({ stats }) {
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
            </div>
        </section>
    );
}
