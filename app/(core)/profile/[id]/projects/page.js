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
                const [profileSnap, projectsSnap, submissionsSnap, showcasesSnap] = await Promise.all([
                    get(ref(db, `users/${profileId}`)),
                    get(query(ref(db, 'projects'), orderByChild('createdBy'), equalTo(profileId))),
                    get(query(ref(db, 'projectSubmissions'), orderByChild('authorId'), equalTo(profileId))),
                    get(query(ref(db, 'projectShowcases'), orderByChild('authorId'), equalTo(profileId))),
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

                setSubmissions(
                    submissionsSnap.exists()
                        ? Object.entries(submissionsSnap.val())
                            .map(([id, item]) => normalizeSubmission(id, item))
                            .filter((item) => isOwner || item.status === 'approved')
                            .sort((first, second) => (second.votesCount - first.votesCount) || sortByNewest(first, second))
                        : []
                );

                setShowcases(
                    showcasesSnap.exists()
                        ? Object.entries(showcasesSnap.val())
                            .map(([id, item]) => normalizeShowcase(id, item))
                            .filter((item) => isOwner || item.status === 'approved')
                            .sort(sortByNewest)
                        : []
                );
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
                        <div className="space-y-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Portfolio projets</p>
                            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                                Les projets de {displayName}
                            </h1>
                            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                                Regroupe les challenges crees, les implementations soumises et les projets publies dans le showcase.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Challenges</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{projects.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Builds</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submissions.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Showcase</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{showcases.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 py-12 md:px-6 md:py-16">
                <Tabs defaultValue="challenges" className="space-y-8">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                        <TabsTrigger value="challenges" className="rounded-lg px-5 py-3">
                            <Layers3 className="mr-2 h-4 w-4" />
                            Challenges
                        </TabsTrigger>
                        <TabsTrigger value="submissions" className="rounded-lg px-5 py-3">
                            <Trophy className="mr-2 h-4 w-4" />
                            Builds
                        </TabsTrigger>
                        <TabsTrigger value="showcase" className="rounded-lg px-5 py-3">
                            <Sparkles className="mr-2 h-4 w-4" />
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
                            <div className="grid gap-6 lg:grid-cols-2">
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
                            <div className="grid gap-6 lg:grid-cols-2">
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
                            <div className="grid gap-6 lg:grid-cols-2">
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
