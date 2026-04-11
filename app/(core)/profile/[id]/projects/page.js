'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, query, orderByChild, equalTo } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectBriefCard from '@/components/features/projects/ProjectBriefCard';
import ProjectSubmissionCard from '@/components/features/projects/ProjectSubmissionCard';
import ProjectShowcaseCard from '@/components/features/projects/ProjectShowcaseCard';
import { normalizeProject, normalizeShowcase, normalizeSubmission, sortByNewest } from '@/lib/projects';
import { ArrowLeft, Layers3, Loader2, Sparkles, Trophy } from 'lucide-react';

export default function ProfileProjectsPage() {
    const params = useParams();
    const { user } = useAuth();
    const profileId = params.id;

    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [showcases, setShowcases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            if (!profileId || !db) {
                setLoading(false);
                return;
            }

            try {
                const [profileSnap, projectsSnap] = await Promise.all([
                    get(ref(db, `users/${profileId}`)),
                    get(query(ref(db, 'projects'), orderByChild('createdBy'), equalTo(profileId))),
                ]);

                setProfile(profileSnap.exists() ? profileSnap.val() : null);

                const isOwner = user?.uid === profileId;

                setProjects(
                    projectsSnap.exists()
                        ? Object.entries(projectsSnap.val())
                            .map(([id, item]) => normalizeProject(id, item))
                            .filter((item) => isOwner || item.moderationStatus === 'approved')
                            .sort(sortByNewest)
                        : []
                );

                // --- Submissions: try indexed query, fall back to full scan ---
                let submissionsList = [];
                try {
                    const submissionsSnap = await get(
                        query(ref(db, 'projectSubmissions'), orderByChild('authorId'), equalTo(profileId))
                    );
                    if (submissionsSnap.exists()) {
                        submissionsList = Object.entries(submissionsSnap.val())
                            .map(([id, item]) => normalizeSubmission(id, item))
                            .filter((item) => isOwner || item.status === 'approved');
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
                                .filter(
                                    (item) =>
                                        item.authorId === profileId &&
                                        (isOwner || item.status === 'approved')
                                );
                        }
                    } catch (fallbackError) {
                        console.warn('Submissions fallback also failed:', fallbackError);
                    }
                }

                setSubmissions(
                    submissionsList.sort(
                        (first, second) =>
                            second.votesCount - first.votesCount || sortByNewest(first, second)
                    )
                );

                // --- Showcases: try indexed query, fall back to full scan ---
                let showcasesList = [];
                try {
                    const showcasesSnap = await get(
                        query(ref(db, 'projectShowcases'), orderByChild('authorId'), equalTo(profileId))
                    );
                    if (showcasesSnap.exists()) {
                        showcasesList = Object.entries(showcasesSnap.val())
                            .map(([id, item]) => normalizeShowcase(id, item))
                            .filter((item) => isOwner || item.status === 'approved');
                    }
                } catch (queryError) {
                    console.warn('Showcases indexed query failed, trying fallback:', queryError);
                }

                if (showcasesList.length === 0) {
                    try {
                        const allShowcasesSnap = await get(ref(db, 'projectShowcases'));
                        if (allShowcasesSnap.exists()) {
                            showcasesList = Object.entries(allShowcasesSnap.val())
                                .map(([id, item]) => normalizeShowcase(id, item))
                                .filter(
                                    (item) =>
                                        item.authorId === profileId &&
                                        (isOwner || item.status === 'approved')
                                );
                        }
                    } catch (fallbackError) {
                        console.warn('Showcases fallback also failed:', fallbackError);
                    }
                }

                setShowcases(showcasesList.sort(sortByNewest));
            } catch (error) {
                console.error('Error loading profile projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, [profileId, user]);

    const displayName = profile?.firstName
        ? `${profile.firstName}${profile?.lastName ? ` ${profile.lastName}` : ''}`
        : 'Etudiant ESTT';

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff_0%,_#ffffff_28%,_#f8fafc_100%)]">
            <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="container px-4 py-12 md:px-6 md:py-16">
                    <Button asChild variant="ghost" className="mb-6 rounded-full">
                        <Link href={`/profile/${profileId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au profil
                        </Link>
                    </Button>

                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div className="space-y-3 sm:space-y-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Portfolio projets</p>
                            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                                Les projets de {displayName}
                            </h1>
                            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
                                Regroupe les challenges crees, les implementations soumises et les projets publies dans le showcase.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4 shadow-sm flex flex-col items-center justify-center">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400 text-center">Challenges</p>
                                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-slate-950 text-center">{projects.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4 shadow-sm flex flex-col items-center justify-center">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400 text-center">Builds</p>
                                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-slate-950 text-center">{submissions.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4 shadow-sm flex flex-col items-center justify-center">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400 text-center">Showcase</p>
                                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-slate-950 text-center">{showcases.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 py-12 md:px-6 md:py-16">
                <Tabs defaultValue="challenges" className="space-y-8">
                <TabsList className="h-auto w-full flex-wrap justify-between sm:justify-start gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                        <TabsTrigger value="challenges" className="flex-1 sm:flex-none justify-center rounded-lg px-2 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm">
                            <Layers3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Challenges
                        </TabsTrigger>
                        <TabsTrigger value="submissions" className="flex-1 sm:flex-none justify-center rounded-lg px-2 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm">
                            <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Builds
                        </TabsTrigger>
                        <TabsTrigger value="showcase" className="flex-1 sm:flex-none justify-center rounded-lg px-2 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm">
                            <Sparkles className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Showcase
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="challenges">
                        {projects.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                                <p className="text-lg font-bold text-slate-900">Aucun challenge cree</p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Les briefs proposes apparaitront ici des leur creation.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:gap-6 grid-cols-2">
                                {projects.map((project) => (
                                    <ProjectBriefCard key={project.id} project={project} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="submissions">
                        {submissions.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                                <p className="text-lg font-bold text-slate-900">Aucune implementation publiee</p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Les reponses aux challenges apparaitront ici.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:gap-6 grid-cols-2">
                                {submissions.map((submission) => (
                                    <ProjectSubmissionCard key={submission.id} submission={submission} showProjectLink />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="showcase">
                        {showcases.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                                <p className="text-lg font-bold text-slate-900">Aucun projet showcase</p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Les projets libres publies dans le showcase apparaitront ici.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:gap-6 grid-cols-2">
                                {showcases.map((showcase) => (
                                    <ProjectShowcaseCard key={showcase.id} showcase={showcase} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </section>
        </main>
    );
}
