'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFirstProjectImage, getProjectCategoryLabel, formatProjectDate } from '@/lib/projects';
import { ExternalLink, Github, Sparkles } from 'lucide-react';

export default function ProjectShowcaseCard({ showcase }) {
    const image = getFirstProjectImage(showcase);

    return (
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400" />
                {image && (
                    <img
                        src={image}
                        alt={showcase.title}
                        className="relative h-44 w-full object-cover opacity-40"
                    />
                )}
                {!image && <div className="relative h-44 w-full" />}
                <div className="absolute inset-x-0 bottom-0 p-5 text-slate-950">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900/70">
                        Showcase
                    </p>
                    <h3 className="text-2xl font-black leading-tight">{showcase.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-900/80">
                        {showcase.summary || 'Projet publie par la communaute.'}
                    </p>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                        {getProjectCategoryLabel(showcase.category)}
                    </Badge>
                    {showcase.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Auteur</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{showcase.authorName}</p>
                    </div>
                    <div className="rounded-full bg-white p-3 shadow-sm">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {showcase.techStack.slice(0, 5).map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                            {item}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Publie le</p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {formatProjectDate(showcase.createdAt)}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        {showcase.githubUrl && (
                            <Button variant="outline" size="sm" asChild className="rounded-full">
                                <a href={showcase.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <Github className="mr-2 h-4 w-4" />
                                    GitHub
                                </a>
                            </Button>
                        )}
                        {showcase.demoUrl && (
                            <Button variant="outline" size="sm" asChild className="rounded-full">
                                <a href={showcase.demoUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Demo
                                </a>
                            </Button>
                        )}
                        <Button size="sm" asChild className="rounded-full">
                            <Link href={`/projects/showcase/${showcase.id}`}>Voir</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
