'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFirstProjectImage, getProjectCategoryLabel, formatProjectDate } from '@/lib/projects';
import { ExternalLink, Github, Sparkles } from 'lucide-react';

export default function ProjectShowcaseCard({ showcase }) {
    const image = getFirstProjectImage(showcase);

    return (
        <article className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-none transition-all hover:border-orange-500/50">
            <div className="relative">
                <div className="absolute inset-0 bg-slate-100" />
                {image && (
                    <img
                        src={image}
                        alt={showcase.title}
                        className="relative h-28 sm:h-44 w-full object-cover"
                    />
                )}
                {!image && <div className="relative h-28 sm:h-44 w-full bg-slate-100" />}
            </div>

            <div className="space-y-3 sm:space-y-5 p-3 sm:p-5">
                <div>
                    <p className="mb-1 sm:mb-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-orange-500">
                        Showcase
                    </p>
                    <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-slate-900 line-clamp-1">{showcase.title}</h3>
                    <p className="mt-1 sm:mt-2 line-clamp-2 text-[10px] sm:text-xs md:text-sm text-slate-500">
                        {showcase.summary || 'Projet publie par la communaute.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge className="text-[9px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 border-slate-200 bg-slate-100 text-slate-700">
                        {getProjectCategoryLabel(showcase.category)}
                    </Badge>
                    {showcase.tags.slice(0, 1).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[9px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 border-slate-200 bg-slate-50 text-slate-600">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
                    <div>
                        <p className="text-[9px] sm:text-xs uppercase tracking-wide text-slate-400">Auteur</p>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">{showcase.authorName}</p>
                    </div>
                    <div className="rounded-full bg-white p-1.5 sm:p-3 shadow-sm shrink-0">
                        <Sparkles className="h-3 w-3 sm:h-5 sm:w-5 text-amber-500" />
                    </div>
                </div>

                <div className="hidden sm:flex flex-wrap gap-2">
                    {showcase.techStack.slice(0, 5).map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                            {item}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:pt-4">
                    <div className="min-w-0 hidden sm:block">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Publie le</p>
                        <p className="truncate text-xs font-semibold text-slate-900">
                            {formatProjectDate(showcase.createdAt)}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <Button size="sm" asChild className="flex-1 sm:flex-none rounded-full px-2 sm:px-4 text-[10px] sm:text-sm h-8 sm:h-auto">
                            <Link href={`/projects/showcase/${showcase.id}`}>Voir</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
