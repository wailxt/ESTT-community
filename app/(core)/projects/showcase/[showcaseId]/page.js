'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { normalizeShowcase, getProjectCategoryLabel, formatProjectDate } from '@/lib/projects';
import { ArrowLeft, ExternalLink, Github, Loader2, Sparkles } from 'lucide-react';

export default function ShowcaseDetailPage() {
    const params = useParams();
    const showcaseId = Array.isArray(params?.showcaseId) ? params.showcaseId[0] : params?.showcaseId;
    const [showcase, setShowcase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!showcaseId) return;

        const fetchShowcase = async () => {
            setLoading(true);

            if (!db) {
                setLoading(false);
                return;
            }

            try {
                const snapshot = await get(ref(db, `projectShowcases/${showcaseId}`));
                setShowcase(snapshot.exists() ? normalizeShowcase(showcaseId, snapshot.val()) : null);
            } catch (error) {
                console.error('Error loading showcase detail:', error);
                setShowcase(null);
            } finally {
                setLoading(false);
            }
        };

        fetchShowcase();
    }, [showcaseId]);

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    if (!showcase) {
        return (
            <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10">
                    <h1 className="text-3xl font-black text-slate-950">Projet introuvable</h1>
                    <p className="mt-3 text-sm text-slate-500">
                        Cette fiche showcase n'est plus disponible.
                    </p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/projects/showcase">Retour au showcase</Link>
                    </Button>
                </div>
            </main>
        );
    }

    const gallery = [showcase.coverImage, ...showcase.screenshots].filter(Boolean);

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_28%,_#f8fafc_100%)]">
            <section className="container px-4 py-12 md:px-6 md:py-16">
                <Button asChild variant="ghost" className="mb-6 rounded-full">
                    <Link href="/projects/showcase">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour au showcase
                    </Link>
                </Button>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6 bg-slate-950 px-6 py-8 text-white md:px-8 md:py-10">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                Showcase project
                            </div>

                            <div className="space-y-4">
                                <Badge className="border-white/15 bg-white/10 text-white">
                                    {getProjectCategoryLabel(showcase.category)}
                                </Badge>
                                <h1 className="text-4xl font-black tracking-tight md:text-5xl">{showcase.title}</h1>
                                <p className="text-base leading-relaxed text-white/80">
                                    {showcase.summary || showcase.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {showcase.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Auteur</p>
                                    <p className="mt-2 text-sm font-bold">{showcase.authorName}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Publie le</p>
                                    <p className="mt-2 text-sm font-bold">{formatProjectDate(showcase.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 bg-white px-6 py-8 md:px-8 md:py-10">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tech stack</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {showcase.techStack.length > 0 ? showcase.techStack.map((item) => (
                                        <Badge key={item} variant="outline" className="border-slate-200 bg-white text-slate-700">
                                            {item}
                                        </Badge>
                                    )) : (
                                        <p className="text-sm text-slate-500">Aucune stack detaillee.</p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Liens</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {showcase.githubUrl && (
                                        <Button variant="outline" asChild className="rounded-full">
                                            <a href={showcase.githubUrl} target="_blank" rel="noopener noreferrer">
                                                <Github className="mr-2 h-4 w-4" />
                                                GitHub
                                            </a>
                                        </Button>
                                    )}
                                    {showcase.demoUrl && (
                                        <Button variant="outline" asChild className="rounded-full">
                                            <a href={showcase.demoUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Demo
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Description detaillee</p>
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                                    {showcase.description || showcase.summary || 'Aucune description detaillee disponible.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 pb-16 md:px-6">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black text-slate-950">Galerie</h2>
                    {gallery.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                            <p className="text-sm text-slate-500">Aucun visuel fourni pour ce projet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {gallery.map((image, index) => (
                                <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <img src={image} alt={`${showcase.title} visual ${index + 1}`} className="h-full w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
