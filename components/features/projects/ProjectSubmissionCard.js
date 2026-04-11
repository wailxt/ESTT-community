'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, Eye, Github, Trophy } from 'lucide-react';

export default function ProjectSubmissionCard({
    submission,
    userId = '',
    currentVoteId = '',
    showProjectLink = false,
}) {
    const isOwnSubmission = userId && submission.authorId === userId;
    const isActiveVote = currentVoteId === submission.id;
    const image = submission.coverImage || submission.screenshots?.[0] || '';
    const projectId = submission.projectId;
    const submissionId = submission.id;

    const detailUrl = `/projects/${projectId}/submissions/${submissionId}`;

    return (
        <article className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-none transition-all hover:border-orange-500/50 group">
            <Link href={detailUrl} className="block relative">
                <div className="absolute inset-0 bg-slate-100" />
                {image && (
                    <img
                        src={image}
                        alt={submission.title}
                        className="relative h-28 sm:h-40 w-full object-cover transition-transform group-hover:scale-105"
                    />
                )}
                {!image && <div className="relative h-28 sm:h-40 w-full bg-slate-100 flex items-center justify-center text-slate-300"><Eye className="h-8 w-8" /></div>}
            </Link>

            <div className="space-y-3 sm:space-y-5 p-3 sm:p-5">
                <div>
                    <p className="mb-1 sm:mb-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-orange-500">
                        {submission.projectTitle || 'Implementation'}
                    </p>
                    <Link href={detailUrl}>
                        <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-slate-900 line-clamp-1 hover:text-primary transition-colors">
                            {submission.title}
                        </h3>
                    </Link>
                    <p className="mt-1 sm:mt-2 line-clamp-2 text-[10px] sm:text-xs md:text-sm text-slate-500">{submission.description}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
                    <div>
                        <p className="text-[9px] sm:text-xs uppercase tracking-wide text-slate-400">Votes</p>
                        <p className="mt-0.5 sm:mt-1 text-base sm:text-2xl font-black text-slate-900">{submission.votesCount}</p>
                    </div>
                    {isOwnSubmission && (
                        <div className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold uppercase text-emerald-600 border border-emerald-100">
                            Mien
                        </div>
                    )}
                    {isActiveVote && (
                        <div className="rounded-full bg-primary/10 px-2 py-1 text-[8px] font-bold uppercase text-primary border border-primary/20">
                            Mon vote
                        </div>
                    )}
                    <div className="rounded-full bg-white p-1.5 sm:p-3 shadow-sm shrink-0">
                        <Trophy className="h-3 w-3 sm:h-5 sm:w-5 text-amber-500" />
                    </div>
                </div>

                <div className="hidden sm:flex flex-wrap gap-2">
                    {submission.techStack.slice(0, 5).map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                            {item}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Eye className="h-3 w-3 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[8px] uppercase tracking-wide text-slate-400">Auteur</p>
                            <p className="text-[10px] font-semibold text-slate-900">{submission.authorName}</p>
                        </div>
                    </div>

                    <Button variant="outline" size="sm" asChild className="rounded-full border-slate-200 h-8 text-[10px] font-bold uppercase transition-colors hover:bg-slate-900 hover:text-white">
                        <Link href={detailUrl}>Regarder</Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}

