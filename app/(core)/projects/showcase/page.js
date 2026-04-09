'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import ProjectShowcaseCard from '@/components/features/projects/ProjectShowcaseCard';
import { normalizeShowcase, sortByNewest } from '@/lib/projects';
import { Loader2, Sparkles } from 'lucide-react';

export default function ProjectShowcasePage() {
    const [showcases, setShowcases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShowcases = async () => {
            if (!db) {
                setLoading(false);
                return;
            }

            try {
                const snapshot = await get(ref(db, 'projectShowcases'));
                const items = snapshot.exists()
                    ? Object.entries(snapshot.val())
                        .map(([id, item]) => normalizeShowcase(id, item))
                        .filter((item) => item.status === 'approved')
                        .sort((first, second) => (Number(second.featured) - Number(first.featured)) || sortByNewest(first, second))
                    : [];

                setShowcases(items);
            } catch (error) {
                console.error('Error loading showcase projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShowcases();
    }, []);

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_28%,_#f8fafc_100%)]">
            <section className="border-b border-orange-100/70">
                <div className="container px-4 py-16 md:px-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-600 shadow-sm">
                                <Sparkles className="h-4 w-4" />
                                Student showcase
                            </div>
                            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                                Les projets libres publies par la communaute.
                            </h1>
                            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                                Cet espace met en avant les projets termines, portfolios et produits experimentaux que les etudiants veulent rendre visibles.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button asChild className="rounded-full">
                                <Link href="/projects/showcase/new">Publier ton projet</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-full">
                                <Link href="/projects">Retour au hub</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 py-12 md:px-6 md:py-16">
                {loading ? (
                    <div className="flex min-h-[40vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : showcases.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                        <p className="text-lg font-bold text-slate-900">Aucun projet publie pour le moment</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Lance le showcase avec un premier build et donne envie aux autres etudiants de montrer leur travail.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {showcases.map((showcase) => (
                            <ProjectShowcaseCard key={showcase.id} showcase={showcase} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
