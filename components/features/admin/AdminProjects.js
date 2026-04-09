'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { db, ref, update } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatProjectDate } from '@/lib/projects';
import { AlertCircle, ExternalLink, Loader2, Sparkles, Trophy } from 'lucide-react';

const sortByDateDesc = (first, second) => (second?.createdAt || 0) - (first?.createdAt || 0);

const badgeClassNames = {
    open: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    closed: 'border-amber-200 bg-amber-50 text-amber-700',
    completed: 'border-slate-200 bg-slate-100 text-slate-700',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    hidden: 'border-slate-200 bg-slate-100 text-slate-700',
};

export default function AdminProjects({ projects = [], submissions = [], showcases = [] }) {
    const [pendingKey, setPendingKey] = useState('');
    const [feedback, setFeedback] = useState(null);

    const sortedProjects = useMemo(() => [...projects].sort(sortByDateDesc), [projects]);
    const sortedSubmissions = useMemo(
        () => [...submissions].sort((first, second) => (second.votesCount - first.votesCount) || sortByDateDesc(first, second)),
        [submissions]
    );
    const sortedShowcases = useMemo(() => [...showcases].sort(sortByDateDesc), [showcases]);

    const setSuccess = (text) => setFeedback({ type: 'success', text });
    const setError = (text) => setFeedback({ type: 'error', text });

    const toggleProjectStatus = async (project) => {
        if (!db) return;

        const nextStatus = project.status === 'open' ? 'closed' : 'open';
        const key = `project-status-${project.id}`;

        try {
            setPendingKey(key);
            await update(ref(db, `projects/${project.id}`), { status: nextStatus });
            setSuccess(`Le challenge "${project.title}" est maintenant ${nextStatus === 'open' ? 'ouvert' : 'ferme'}.`);
        } catch (error) {
            console.error('Error toggling project status:', error);
            setError("Impossible de changer le statut du challenge.");
        } finally {
            setPendingKey('');
        }
    };

    const toggleProjectFeatured = async (project) => {
        if (!db) return;

        const key = `project-featured-${project.id}`;

        try {
            setPendingKey(key);
            await update(ref(db, `projects/${project.id}`), { featured: !project.featured });
            setSuccess(`Le challenge "${project.title}" a ete ${project.featured ? 'retire' : 'ajoute'} a la selection.`);
        } catch (error) {
            console.error('Error toggling project featured state:', error);
            setError("Impossible de modifier la mise en avant du challenge.");
        } finally {
            setPendingKey('');
        }
    };

    const toggleShowcaseFeatured = async (showcase) => {
        if (!db) return;

        const key = `showcase-featured-${showcase.id}`;

        try {
            setPendingKey(key);
            await update(ref(db, `projectShowcases/${showcase.id}`), { featured: !showcase.featured });
            setSuccess(`Le projet "${showcase.title}" a ete ${showcase.featured ? 'retire' : 'ajoute'} a la selection showcase.`);
        } catch (error) {
            console.error('Error toggling showcase featured state:', error);
            setError("Impossible de modifier la mise en avant du showcase.");
        } finally {
            setPendingKey('');
        }
    };

    const toggleSubmissionVisibility = async (submission) => {
        if (!db) return;

        const nextStatus = submission.status === 'approved' ? 'hidden' : 'approved';
        const key = `submission-status-${submission.id}`;

        try {
            setPendingKey(key);
            await update(ref(db, `projectSubmissions/${submission.id}`), { status: nextStatus });
            setSuccess(`La soumission "${submission.title}" est maintenant ${nextStatus === 'approved' ? 'visible' : 'masquee'}.`);
        } catch (error) {
            console.error('Error toggling submission visibility:', error);
            setError("Impossible de modifier la visibilite de cette soumission.");
        } finally {
            setPendingKey('');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950">Projets et competitions</h1>
                    <p className="mt-2 max-w-3xl text-sm text-slate-500">
                        Surveille les briefs, les implementations et les projets publies. Cette vue sert de premier tableau de bord pour la nouvelle fonctionnalite Projects.
                    </p>
                </div>
            </div>

            {feedback && (
                <Alert className={feedback.type === 'error' ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>
                    {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    <AlertTitle>{feedback.type === 'error' ? 'Erreur' : 'Mise a jour effectuee'}</AlertTitle>
                    <AlertDescription>{feedback.text}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-xl border-slate-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Challenges</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">{projects.length}</p>
                    <p className="mt-1 text-sm text-slate-500">Briefs actuellement en base.</p>
                </Card>
                <Card className="rounded-xl border-slate-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Implementations</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">{submissions.length}</p>
                    <p className="mt-1 text-sm text-slate-500">Soumissions associees aux challenges.</p>
                </Card>
                <Card className="rounded-xl border-slate-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Showcase</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">{showcases.length}</p>
                    <p className="mt-1 text-sm text-slate-500">Projets personnels publies.</p>
                </Card>
            </div>

            <Card className="rounded-2xl border-slate-200 p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">Briefs</h2>
                        <p className="mt-1 text-sm text-slate-500">Fermer, rouvrir ou mettre en avant les challenges les plus pertinents.</p>
                    </div>
                </div>

                {sortedProjects.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Aucun brief pour le moment.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sortedProjects.map((project) => {
                            const statusKey = project.status || 'open';
                            return (
                                <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-bold text-slate-950">{project.title}</h3>
                                                <Badge className={badgeClassNames[statusKey] || badgeClassNames.open}>
                                                    {project.status || 'open'}
                                                </Badge>
                                                {project.featured && (
                                                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">featured</Badge>
                                                )}
                                            </div>
                                            <p className="max-w-3xl text-sm text-slate-500">
                                                {project.summary || project.description}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                                <span>Auteur: {project.authorName}</span>
                                                <span>Cree le: {formatProjectDate(project.createdAt)}</span>
                                                <span>Soumissions: {project.submissionCount || 0}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() => toggleProjectStatus(project)}
                                                disabled={pendingKey === `project-status-${project.id}`}
                                            >
                                                {pendingKey === `project-status-${project.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {project.status === 'open' ? 'Fermer' : 'Rouvrir'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() => toggleProjectFeatured(project)}
                                                disabled={pendingKey === `project-featured-${project.id}`}
                                            >
                                                {pendingKey === `project-featured-${project.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {project.featured ? 'Retirer du hub' : 'Mettre en avant'}
                                            </Button>
                                            <Button size="sm" variant="outline" asChild className="rounded-full">
                                                <Link href={`/projects/${project.id}`} target="_blank">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Ouvrir
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card className="rounded-2xl border-slate-200 p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-950">Soumissions</h2>
                    <p className="mt-1 text-sm text-slate-500">Surveille les meilleures implementations et masque rapidement une entree si besoin.</p>
                </div>

                {sortedSubmissions.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Aucune soumission enregistree.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sortedSubmissions.slice(0, 12).map((submission) => {
                            const statusKey = submission.status || 'approved';
                            return (
                                <div key={submission.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-bold text-slate-950">{submission.title}</h3>
                                                <Badge className={badgeClassNames[statusKey] || badgeClassNames.approved}>
                                                    {submission.status || 'approved'}
                                                </Badge>
                                                <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                                                    <Trophy className="mr-1 h-3.5 w-3.5" />
                                                    {submission.votesCount} vote{submission.votesCount > 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <p className="max-w-3xl text-sm text-slate-500">
                                                {submission.description}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                                <span>Auteur: {submission.authorName}</span>
                                                <span>Projet: {submission.projectTitle || submission.projectId}</span>
                                                <span>Publiee le: {formatProjectDate(submission.createdAt)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() => toggleSubmissionVisibility(submission)}
                                                disabled={pendingKey === `submission-status-${submission.id}`}
                                            >
                                                {pendingKey === `submission-status-${submission.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {submission.status === 'approved' ? 'Masquer' : 'Republier'}
                                            </Button>
                                            <Button size="sm" variant="outline" asChild className="rounded-full">
                                                <Link href={`/projects/${submission.projectId}`} target="_blank">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Voir le projet
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card className="rounded-2xl border-slate-200 p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-950">Showcase</h2>
                    <p className="mt-1 text-sm text-slate-500">Mets en avant les meilleurs projets libres de la communaute.</p>
                </div>

                {sortedShowcases.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        Aucun projet showcase publie.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sortedShowcases.map((showcase) => (
                            <div key={showcase.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-950">{showcase.title}</h3>
                                            {showcase.featured && (
                                                <Badge className="border-amber-200 bg-amber-50 text-amber-700">featured</Badge>
                                            )}
                                        </div>
                                        <p className="max-w-3xl text-sm text-slate-500">
                                            {showcase.summary || showcase.description}
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                            <span>Auteur: {showcase.authorName}</span>
                                            <span>Publie le: {formatProjectDate(showcase.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => toggleShowcaseFeatured(showcase)}
                                            disabled={pendingKey === `showcase-featured-${showcase.id}`}
                                        >
                                            {pendingKey === `showcase-featured-${showcase.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {showcase.featured ? 'Retirer de la vitrine' : 'Mettre en avant'}
                                        </Button>
                                        <Button size="sm" variant="outline" asChild className="rounded-full">
                                            <Link href={`/projects/showcase/${showcase.id}`} target="_blank">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Ouvrir
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
