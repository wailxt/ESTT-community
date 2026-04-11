'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, query, orderByChild, equalTo } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import ProjectSubmissionCard from '@/components/features/projects/ProjectSubmissionCard';
import {
    formatProjectDate,
    getDifficultyClasses,
    getProjectCategoryLabel,
    getProjectDifficultyLabel,
    getProjectRuntimeStatus,
    getProjectStatusClasses,
    getProjectStatusLabel,
    getProjectVoteModeLabel,
    normalizeProject,
    normalizeSubmission,
    sortByNewest,
} from '@/lib/projects';
import { ChevronDown, AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Loader2, RotateCw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const sortSubmissions = (items) =>
    [...items].sort((first, second) => (second.votesCount - first.votesCount) || sortByNewest(first, second));

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;

    const [project, setProject] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [currentVote, setCurrentVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // { type: 'notFound' | 'loadError', message: string }
    const [refreshingSubmissions, setRefreshingSubmissions] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const refreshSubmissions = async () => {
        if (!db || !projectId) return;
        setRefreshingSubmissions(true);

        let submissionsList = [];

        try {
            const submissionsSnap = await get(
                query(ref(db, 'projectSubmissions'), orderByChild('projectId'), equalTo(projectId))
            );
            if (submissionsSnap.exists()) {
                submissionsList = Object.entries(submissionsSnap.val())
                    .map(([id, item]) => normalizeSubmission(id, item))
                    .filter((item) => item.status === 'approved');
            }
        } catch (queryError) {
            console.warn('Submissions indexed query failed, trying fallback:', queryError);
        }

        if (submissionsList.length === 0) {
            try {
                const allSubmissionsSnap = await get(ref(db, 'projectSubmissions'));
                if (allSubmissionsSnap.exists()) {
                    submissionsList = Object.entries(allSubmissionsSnap.val())
                        .map(([id, item]) => normalizeSubmission(id, item))
                        .filter((item) => item.projectId === projectId && item.status === 'approved');
                }
            } catch (fallbackError) {
                console.warn('Submissions fallback also failed:', fallbackError);
            }
        }

        setSubmissions(sortSubmissions(submissionsList));
        setRefreshingSubmissions(false);
    };

    useEffect(() => {
        if (!projectId) return;

        const fetchProjectData = async () => {
            setLoading(true);
            setError(null);

            if (!db) {
                setLoading(false);
                setError({
                    type: 'loadError',
                    message: 'Impossible de charger le projet pour le moment. Verifiez votre connexion internet et reessayez.',
                });
                return;
            }

            try {
                const projectSnap = await get(ref(db, `projects/${projectId}`));

                if (!projectSnap.exists()) {
                    setProject(null);
                    setSubmissions([]);
                    setCurrentVote(null);
                    setError({
                        type: 'notFound',
                        message: 'Ce challenge n\'existe plus ou son identifiant est invalide.',
                    });
                    setLoading(false);
                    return;
                }

                setProject(normalizeProject(projectId, projectSnap.val()));
            } catch (error) {
                console.error('Error loading project detail:', error);
                setProject(null);
                setSubmissions([]);
                setCurrentVote(null);
                setError({
                    type: 'loadError',
                    message: 'Impossible de charger le projet pour le moment. Verifiez votre connexion internet et reessayez.',
                });
                setLoading(false);
                return;
            }

            {
                let submissionsList = [];

                try {
                    const submissionsSnap = await get(
                        query(ref(db, 'projectSubmissions'), orderByChild('projectId'), equalTo(projectId))
                    );
                    if (submissionsSnap.exists()) {
                        submissionsList = Object.entries(submissionsSnap.val())
                            .map(([id, item]) => normalizeSubmission(id, item))
                            .filter((item) => item.status === 'approved');
                    }
                } catch (queryError) {
                    console.warn('Submissions indexed query failed, trying fallback:', queryError);
                }

                if (submissionsList.length === 0) {
                    try {
                        const allSubmissionsSnap = await get(ref(db, 'projectSubmissions'));
                        if (allSubmissionsSnap.exists()) {
                            submissionsList = Object.entries(allSubmissionsSnap.val())
                                .map(([id, item]) => normalizeSubmission(id, item))
                                .filter((item) => item.projectId === projectId && item.status === 'approved');
                        }
                    } catch (fallbackError) {
                        console.warn('Submissions fallback also failed:', fallbackError);
                    }
                }

                setSubmissions(sortSubmissions(submissionsList));
            }

            if (user) {
                try {
                    const voteSnap = await get(ref(db, `projectVotes/${projectId}/${user.uid}`));
                    setCurrentVote(voteSnap.exists() ? voteSnap.val() : null);
                } catch (error) {
                    console.error('Error loading current project vote:', error);
                    setCurrentVote(null);
                }
            } else {
                setCurrentVote(null);
            }

            setError(null);
            setLoading(false);
        };

        fetchProjectData();
    }, [projectId, user]);

    const runtimeStatus = useMemo(() => getProjectRuntimeStatus(project), [project]);
    const leaderSubmission = submissions[0] || null;

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    // Handle different error states
    if (error) {
        if (error.type === 'notFound') {
            return (
                <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10">
                        <h1 className="text-3xl font-black text-slate-950">Projet introuvable</h1>
                        <p className="mt-3 text-sm text-slate-500">{error.message}</p>
                        <Button asChild className="mt-6 rounded-full">
                            <Link href="/projects">Retour au hub</Link>
                        </Button>
                    </div>
                </main>
            );
        }

        // Load error - show error with retry option
        if (error.type === 'loadError') {
            return (
                <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-10">
                        <div className="inline-flex items-center justify-center rounded-full bg-amber-100 p-3">
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                        </div>
                        <h1 className="mt-4 text-3xl font-black text-slate-950">Erreur de chargement</h1>
                        <p className="mt-3 text-sm text-slate-600">{error.message}</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button className="rounded-full" onClick={() => window.location.reload()}>
                                Reessayer
                            </Button>
                            <Button asChild variant="outline" className="rounded-full">
                                <Link href="/projects">Retour au hub</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            );
        }
    }

    if (!project) {
        return (
            <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10">
                    <h1 className="text-3xl font-black text-slate-950">Projet introuvable</h1>
                    <p className="mt-3 text-sm text-slate-500">
                        Ce challenge n'existe plus ou son identifiant est invalide.
                    </p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/projects">Retour au hub</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/50">
            <section className="container px-4 py-8 md:px-6 md:py-12">
                <Button asChild variant="ghost" className="mb-6 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                    <Link href="/projects">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux projets
                    </Link>
                </Button>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                    <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-8 bg-white px-6 py-8 text-slate-900 md:px-10 md:py-12">
                            <div className="flex flex-wrap gap-2">
                                <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getProjectStatusClasses(runtimeStatus))}>
                                    {getProjectStatusLabel(runtimeStatus)}
                                </Badge>
                                <Badge variant="secondary" className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getDifficultyClasses(project.difficulty))}>
                                    {getProjectDifficultyLabel(project.difficulty)}
                                </Badge>
                                <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {getProjectCategoryLabel(project.category)}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">{project.title}</h1>
                                <div className="max-w-3xl">
                                    <div className={cn(
                                        "prose prose-slate max-w-none text-lg leading-relaxed text-slate-600",
                                        !isDescriptionExpanded && "line-clamp-4 md:line-clamp-none"
                                    )}>
                                        {project.description || project.summary || 'Aucune description detaillee pour le moment.'}
                                    </div>

                                    {(project.description?.length > 400 || project.summary?.length > 400) && (
                                        <button
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="mt-2 flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                                        >
                                            {isDescriptionExpanded ? "Voir moins" : "Continuer la lecture"}
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-colors hover:bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Auteur</p>
                                    <p className="mt-2 text-base font-black text-slate-900">{project.authorName}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-colors hover:bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Soumissions</p>
                                    <p className="mt-2 text-base font-black text-slate-900">{submissions.length}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-colors hover:bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Vote</p>
                                    <p className="mt-2 text-base font-black text-slate-900">{getProjectVoteModeLabel(project.voteMode)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {project.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 bg-slate-50/30 px-6 py-8 md:px-10 md:py-12">
                            {project.coverImage && (
                                <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
                                    <img
                                        src={project.coverImage}
                                        alt={project.title}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Calendrier
                                </p>
                                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cree le</span>
                                        <span className="font-bold text-slate-900">{formatProjectDate(project.createdAt)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deadline</span>
                                        <span className="font-bold text-slate-900">
                                            {project.deadline ? formatProjectDate(project.deadline) : 'Aucune date limite'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Action</p>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                    Soumets ton build avec une demo, un repo GitHub et une explication claire. Les autres membres pourront ensuite voter.
                                </p>
                                <div className="mt-6 flex flex-col gap-3">
                                    {runtimeStatus === 'open' ? (
                                        <Button asChild className="w-full rounded-full">
                                            <Link href={`/projects/${project.id}/submit`}>
                                                Soumettre une implementation
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button className="w-full rounded-full" disabled>
                                            Soumissions fermees
                                        </Button>
                                    )}
                                    <Button asChild variant="outline" className="w-full rounded-full">
                                        <Link href="/projects/showcase/new">Publier un projet libre</Link>
                                    </Button>
                                </div>
                            </div>

                            {leaderSubmission && (
                                <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-6">
                                    <div className="relative z-10">
                                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                                            <Trophy className="h-3.5 w-3.5" />
                                            Leader actuel
                                        </p>
                                        <h2 className="mt-3 text-xl font-black text-slate-950">{leaderSubmission.title}</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {leaderSubmission.votesCount} vote{leaderSubmission.votesCount > 1 ? 's' : ''} • {leaderSubmission.authorName}
                                        </p>
                                    </div>
                                    <Trophy className="absolute -bottom-4 -right-4 h-24 w-24 rotate-12 text-amber-200/50" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 pb-20 md:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md md:p-10">
                    <Accordion type="multiple" className="w-full space-y-4">
                        <AccordionItem value="requirements" className="border-none">
                            <AccordionTrigger className="hover:no-underline py-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 transition-colors hover:bg-slate-50 [&[data-state=open]]:bg-slate-50 [&[data-state=open]]:rounded-b-none">
                                <h2 className="text-2xl font-black tracking-tight text-slate-900">Attendus</h2>
                            </AccordionTrigger>
                            <AccordionContent className="mt-0 border-x border-b border-slate-100 rounded-b-2xl bg-white px-8 pb-8 pt-6">
                                {project.requirements.length > 0 ? (
                                    <ul className="space-y-3">
                                        {project.requirements.map((item) => (
                                            <li key={item} className="group flex items-start gap-4 transition-colors">
                                                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                                <span className="text-base font-medium text-slate-600 group-hover:text-slate-900 transition-colors leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Aucun attendu detaille pour le moment.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="criteria" className="border-none">
                            <AccordionTrigger className="hover:no-underline py-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 transition-colors hover:bg-slate-50 [&[data-state=open]]:bg-slate-50 [&[data-state=open]]:rounded-b-none">
                                <h2 className="text-2xl font-black tracking-tight text-slate-900">Criteres d'evaluation</h2>
                            </AccordionTrigger>
                            <AccordionContent className="mt-0 border-x border-b border-slate-100 rounded-b-2xl bg-white px-8 pb-8 pt-6">
                                {project.evaluationCriteria.length > 0 ? (
                                    <ul className="space-y-4">
                                        {project.evaluationCriteria.map((item) => (
                                            <li key={item} className="group flex items-start gap-4 transition-colors">
                                                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                                                <span className="text-base font-medium text-slate-600 group-hover:text-slate-900 transition-colors leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Les criteres seront ajoutes par l'auteur du projet plus tard.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <div className="mt-16 space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-slate-950">Implementations</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                La communaute vote sur la meilleure execution du meme brief.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full shrink-0"
                                onClick={refreshSubmissions}
                                disabled={refreshingSubmissions}
                                title="Rafraichir les soumissions"
                            >
                                <RotateCw className={cn("h-4 w-4", refreshingSubmissions && "animate-spin")} />
                            </Button>
                            <Button asChild variant="outline" className="rounded-full">
                                <Link href={`/projects/${project.id}/submit`}>Ajouter une implementation</Link>
                            </Button>
                        </div>
                    </div>


                    {submissions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                            <p className="text-lg font-bold text-slate-900">Aucune implementation pour le moment</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Sois le premier a repondre a ce challenge et pose les bases du futur classement.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {submissions.map((submission) => (
                                <ProjectSubmissionCard
                                    key={submission.id}
                                    submission={submission}
                                    currentVoteId={currentVote?.submissionId || ''}
                                    userId={user?.uid || ''}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
