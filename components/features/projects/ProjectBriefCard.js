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

export default function ProjectBriefCard({ project, leaderSubmission }) {
    const runtimeStatus = getProjectRuntimeStatus(project);
    const image = getFirstProjectImage(project);

    return (
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
                {image && (
                    <img
                        src={image}
                        alt={project.title}
                        className="relative h-44 w-full object-cover opacity-35"
                    />
                )}
                {!image && <div className="relative h-44 w-full" />}

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                    <Badge className={getProjectStatusClasses(runtimeStatus)}>
                        {getProjectStatusLabel(runtimeStatus)}
                    </Badge>
                    <Badge className={getDifficultyClasses(project.difficulty)}>
                        {getProjectDifficultyLabel(project.difficulty)}
                    </Badge>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                        {getProjectCategoryLabel(project.category)}
                    </p>
                    <h3 className="text-2xl font-black leading-tight">{project.title}</h3>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/80">
                        {project.summary || 'Un projet propose par la communaute ESTT.'}
                    </p>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <Layers3 className="h-3.5 w-3.5" />
                            Soumissions
                        </div>
                        <p className="mt-2 text-lg font-black text-slate-900">{project.submissionCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Cree le
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-900">{formatProjectDate(project.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <Trophy className="h-3.5 w-3.5" />
                            Top build
                        </div>
                        <p className="mt-2 line-clamp-1 text-sm font-bold text-slate-900">
                            {leaderSubmission ? leaderSubmission.title : 'Pas encore de leader'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Auteur</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{project.authorName}</p>
                    </div>

                    <Button asChild className="shrink-0 rounded-full px-5">
                        <Link href={`/projects/${project.id}`}>
                            Voir le projet
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}
