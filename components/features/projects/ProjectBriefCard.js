'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    getDifficultyClasses,
    getFirstProjectImage,
    getProjectCategoryLabel,
    getProjectDifficultyLabel,
    getProjectRuntimeStatus,
    getProjectStatusClasses,
    getProjectStatusLabel,
    formatProjectDate,
} from '@/lib/projects';
import { ArrowRight, CalendarDays, Layers3, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectBriefCard({ project, leaderSubmission }) {
    const runtimeStatus = getProjectRuntimeStatus(project);
    const image = getFirstProjectImage(project);

    return (
        <article className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-none transition-all hover:border-orange-500/50">
            <div className="relative">
                <div className="absolute inset-0 bg-slate-100" />
                {image && (
                    <img
                        src={image}
                        alt={project.title}
                        className="relative h-28 sm:h-44 w-full object-cover"
                    />
                )}
                {!image && <div className="relative h-28 sm:h-44 w-full bg-slate-100" />}

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2 sm:gap-2 sm:p-4">
                    <Badge className={cn("text-[8px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5", getProjectStatusClasses(runtimeStatus))}>
                        {getProjectStatusLabel(runtimeStatus)}
                    </Badge>
                    <Badge className={cn("text-[8px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5", getDifficultyClasses(project.difficulty))}>
                        {getProjectDifficultyLabel(project.difficulty)}
                    </Badge>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-5 p-3 sm:p-5">
                <div>
                    <p className="mb-1 sm:mb-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-orange-500">
                        {getProjectCategoryLabel(project.category)}
                    </p>
                    <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-slate-900 line-clamp-1">{project.title}</h3>
                    <p className="mt-1 sm:mt-2 line-clamp-2 max-w-2xl text-[10px] sm:text-xs md:text-sm text-slate-500">
                        {project.summary || 'Un projet propose par la communaute ESTT.'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                    {project.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[11px] font-semibold text-slate-600"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="grid gap-1 sm:gap-3 grid-cols-3">
                    <div className="rounded-lg sm:rounded-xl border border-slate-100 bg-white p-1.5 sm:p-3 shadow-sm">
                        <div className="flex items-center gap-1 sm:gap-2 text-[7px] sm:text-xs font-bold uppercase tracking-wide text-slate-400">
                            <Layers3 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate">Soumissions</span>
                        </div>
                        <p className="mt-0.5 sm:mt-2 text-xs sm:text-lg font-black text-slate-900">{project.submissionCount}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-slate-100 bg-white p-1.5 sm:p-3 shadow-sm">
                        <div className="flex items-center gap-1 sm:gap-2 text-[7px] sm:text-xs font-bold uppercase tracking-wide text-slate-400">
                            <CalendarDays className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate">Cree le</span>
                        </div>
                        <p className="mt-0.5 sm:mt-2 text-[8px] sm:text-sm font-bold text-slate-900 truncate">{formatProjectDate(project.createdAt)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-slate-100 bg-white p-1.5 sm:p-3 shadow-sm">
                        <div className="flex items-center gap-1 sm:gap-2 text-[7px] sm:text-xs font-bold uppercase tracking-wide text-slate-400">
                            <Trophy className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate">Top build</span>
                        </div>
                        <p className="mt-0.5 sm:mt-2 text-[8px] sm:text-sm font-bold text-slate-900 line-clamp-1">
                            {leaderSubmission ? leaderSubmission.title : 'Pas encore...'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:pt-4">
                    <div className="min-w-0">
                        <p className="text-[7px] sm:text-[10px] uppercase tracking-wide text-slate-400">Auteur</p>
                        <p className="truncate text-[9px] sm:text-xs font-semibold text-slate-900">{project.authorName}</p>
                    </div>

                    <Button asChild className="shrink-0 rounded-full px-3 py-1 sm:px-6 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-sm h-7 sm:h-10">
                        <Link href={`/projects/${project.id}`}>
                            Voir
                            <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}
