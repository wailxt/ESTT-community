'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectBriefCard from '@/components/features/projects/ProjectBriefCard';
import ProjectSubmissionCard from '@/components/features/projects/ProjectSubmissionCard';
import ProjectShowcaseCard from '@/components/features/projects/ProjectShowcaseCard';
import {
    countUniqueAuthors,
    getProjectCategoryLabel,
    isProjectVisible,
    normalizeProject,
    normalizeShowcase,
    normalizeSubmission,
    sortByNewest,
} from '@/lib/projects';
import ProjectCarousel from '@/components/features/projects/ProjectCarousel';
import { ArrowRight, Layers3, Loader2, Rocket, Sparkles, Trophy } from 'lucide-react';

export default function ProjectsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [showcases, setShowcases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!db) {
                setLoading(false);
                return;
            }

            try {
                const [projectsSnap, submissionsSnap, showcasesSnap] = await Promise.all([
                    get(ref(db, 'projects')),
                    get(ref(db, 'projectSubmissions')),
                    get(ref(db, 'projectShowcases')),
                ]);

                const projectsList = projectsSnap.exists()
                    ? Object.entries(projectsSnap.val())
                        .map(([id, item]) => normalizeProject(id, item))
                        .filter((item) => isProjectVisible(item) && item.moderationStatus === 'approved')
                        .sort((first, second) => (Number(second.featured) - Number(first.featured)) || sortByNewest(first, second))
                    : [];

                const submissionsList = submissionsSnap.exists()
                    ? Object.entries(submissionsSnap.val())
                        .map(([id, item]) => normalizeSubmission(id, item))
                        .filter((item) => item.status === 'approved')
                        .sort((first, second) => (second.votesCount - first.votesCount) || sortByNewest(first, second))
                    : [];

                const showcasesList = showcasesSnap.exists()
                    ? Object.entries(showcasesSnap.val())
                        .map(([id, item]) => normalizeShowcase(id, item))
                        .filter((item) => item.status === 'approved')
                        .sort((first, second) => (Number(second.featured) - Number(first.featured)) || sortByNewest(first, second))
                    : [];

                setProjects(projectsList);
                setSubmissions(submissionsList);
                setShowcases(showcasesList);
            } catch (error) {
                console.error('Error loading projects hub:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const leaderboardByProject = useMemo(() => {
        const map = new Map();

        submissions.forEach((submission) => {
            const current = map.get(submission.projectId) || [];
            current.push(submission);
            current.sort((first, second) => (second.votesCount - first.votesCount) || sortByNewest(first, second));
            map.set(submission.projectId, current.slice(0, 3));
        });

        return map;
    }, [submissions]);

    // Gather top 5 projects for the carousel (featured first, then newest)
    const carouselProjects = useMemo(() => projects.slice(0, 5), [projects]);
    
    const topSubmissions = useMemo(() => submissions.slice(0, 6), [submissions]);
    const latestShowcases = useMemo(() => showcases.slice(0, 6), [showcases]);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#ffffff_32%,_#f8fafc_100%)]">
            <section className="border-b border-orange-100/80">
                <div className="container px-4 py-12 md:px-6 md:py-16">
                    <div className="flex flex-col gap-12">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-6 max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-600 shadow-sm backdrop-blur">
                                    <Rocket className="h-4 w-4" />
                                    Projects hub
                                </div>

                                <div className="space-y-5">
                                    <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl md:leading-[1.05]">
                                        Trouver une idee, construire une solution, montrer ce que tu sais faire.
                                    </h1>
                                    <p className="text-lg leading-relaxed text-slate-600">
                                        Les etudiants peuvent proposer des briefs, publier leurs implementations et partager leurs projets finis dans un meme espace.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <Button asChild size="lg" className="rounded-full px-8 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-100/50">
                                        <Link href="/projects/new">
                                            Proposer un challenge
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-slate-200">
                                        <Link href="/projects/showcase/new">Publier ton projet</Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 min-w-[300px] lg:min-w-[400px]">
                                <div className="rounded-2xl border-2 border-white/70 bg-white/90 p-4 shadow-none backdrop-blur text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Challenges</p>
                                    <p className="mt-2 text-2xl font-black text-slate-950">{projects.length}</p>
                                </div>
                                <div className="rounded-2xl border-2 border-white/70 bg-white/90 p-4 shadow-none backdrop-blur text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Builders</p>
                                    <p className="mt-2 text-2xl font-black text-slate-950">{countUniqueAuthors(submissions)}</p>
                                </div>
                                <div className="rounded-2xl border-2 border-white/70 bg-white/90 p-4 shadow-none backdrop-blur text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Showcase</p>
                                    <p className="mt-2 text-2xl font-black text-slate-950">{showcases.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Section */}
                        <div className="w-full">
                            {loading ? (
                                <div className="aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                                </div>
                            ) : (
                                <ProjectCarousel projects={carouselProjects} />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 py-12 md:px-6 md:py-16">
                {loading ? (
                    <div className="flex min-h-[40vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="challenges" className="space-y-8">
                        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                            <TabsTrigger value="challenges" className="rounded-lg px-5 py-3">
                                Challenges
                            </TabsTrigger>
                            <TabsTrigger value="showcase" className="rounded-lg px-5 py-3">
                                Showcase
                            </TabsTrigger>
                            <TabsTrigger value="top-builds" className="rounded-lg px-5 py-3">
                                Top builds
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="challenges" className="space-y-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-950">Challenges ouverts</h2>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                        Parcours les briefs publies par les etudiants, clubs ou admins, puis livre ta meilleure implementation.
                                    </p>
                                </div>
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link href="/projects/new">Proposer un nouveau challenge</Link>
                                </Button>
                            </div>

                            {projects.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                                    <p className="text-lg font-bold text-slate-900">Aucun challenge publie</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Lance le premier sujet pour encourager les etudiants a coder, voter et comparer leurs solutions.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {projects.map((project) => (
                                        <ProjectBriefCard
                                            key={project.id}
                                            project={project}
                                            leaderSubmission={leaderboardByProject.get(project.id)?.[0]}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="showcase" className="space-y-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-950">Showcase etudiant</h2>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                        Les projets publies librement par les membres pour montrer leurs experiments, portfolios ou produits finis.
                                    </p>
                                </div>
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link href="/projects/showcase/new">Publier ton projet</Link>
                                </Button>
                            </div>

                            {latestShowcases.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                                    <p className="text-lg font-bold text-slate-900">Aucun projet en showcase</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Commence par publier un projet personnel pour donner le ton et inspirer la prochaine vague de builds.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {latestShowcases.map((showcase) => (
                                        <ProjectShowcaseCard key={showcase.id} showcase={showcase} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="top-builds" className="space-y-6">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-950">Implementations les mieux classees</h2>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                        Les solutions qui ont deja recu le plus de votes dans leurs challenges respectifs.
                                    </p>
                                </div>
                                <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 md:block">
                                    <Trophy className="mr-2 inline h-4 w-4 text-amber-500" />
                                    Classement vivant
                                </div>
                            </div>

                            {topSubmissions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                                    <p className="text-lg font-bold text-slate-900">Pas encore d implementations</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Des que les premiers builds seront soumis, ce classement commencera a vivre.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                                    {topSubmissions.map((submission) => (
                                        <ProjectSubmissionCard
                                            key={submission.id}
                                            submission={submission}
                                            showProjectLink
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </section>

            <section className="border-t border-slate-200 bg-slate-950">
                <div className="container px-4 py-14 text-white md:px-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/50">Road to MVP</p>
                            <h2 className="text-3xl font-black">Commence simple, puis fais grandir la competition.</h2>
                            <p className="max-w-2xl text-sm leading-relaxed text-white/70">
                                Cette premiere version permet deja de creer des briefs, soumettre des builds, publier des showrooms et voter sur la meilleure implementation.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild variant="secondary" className="rounded-full">
                                <Link href="/projects/new">
                                    <Layers3 className="mr-2 h-4 w-4" />
                                    Creer un challenge
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                                <Link href="/projects/showcase">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Explorer le showcase
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
