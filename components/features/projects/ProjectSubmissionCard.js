'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, Eye, Github, Trophy } from 'lucide-react';

export default function ProjectSubmissionCard({
    submission,
    onVote,
    voteDisabled = false,
    isVoting = false,
    currentVoteId = '',
    userId = '',
    showProjectLink = false,
}) {
    const isActiveVote = currentVoteId === submission.id;
    const isOwnSubmission = userId && submission.authorId === userId;
    const image = submission.coverImage || submission.screenshots?.[0] || '';

    return (
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700" />
                {image && (
                    <img
                        src={image}
                        alt={submission.title}
                        className="relative h-40 w-full object-cover opacity-40"
                    />
                )}
                {!image && <div className="relative h-40 w-full" />}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                        {submission.projectTitle || 'Implementation'}
                    </p>
                    <h3 className="text-xl font-black leading-tight">{submission.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-white/80">{submission.description}</p>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Votes</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{submission.votesCount}</p>
                    </div>
                    <div className="rounded-full bg-white p-3 shadow-sm">
                        <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {submission.techStack.slice(0, 5).map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                            {item}
                        </Badge>
                    ))}
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Par</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{submission.authorName}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {submission.githubUrl && (
                        <Button variant="outline" asChild className="rounded-full">
                            <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </a>
                        </Button>
                    )}
                    {submission.demoUrl && (
                        <Button variant="outline" asChild className="rounded-full">
                            <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Demo
                            </a>
                        </Button>
                    )}
                    {showProjectLink && submission.projectId && (
                        <Button variant="outline" asChild className="rounded-full">
                            <Link href={`/projects/${submission.projectId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Projet
                            </Link>
                        </Button>
                    )}
                </div>

                {onVote && (
                    <Button
                        className={cn(
                            'w-full rounded-xl',
                            isActiveVote && 'bg-emerald-600 hover:bg-emerald-700'
                        )}
                        disabled={voteDisabled || isVoting || isOwnSubmission}
                        onClick={() => onVote(submission)}
                    >
                        {isOwnSubmission
                            ? 'Ta propre soumission'
                            : isVoting
                                ? 'Vote en cours...'
                                : isActiveVote
                                    ? 'Ton vote actuel'
                                    : 'Voter pour cette implementation'}
                    </Button>
                )}
            </div>
        </article>
    );
}
