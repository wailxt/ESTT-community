'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, push, set, runTransaction } from '@/lib/firebase';
import { sendPrivateNotification, NOTIF_TYPES } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    buildProjectAuthorName,
    getProjectRuntimeStatus,
    normalizeExternalUrl,
    normalizeProject,
    parseCommaSeparatedList,
    parseLineSeparatedList,
} from '@/lib/projects';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const initialState = {
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
    demoUrl: '',
    coverImage: '',
    screenshots: '',
    notes: '',
};

export default function SubmitProjectImplementationPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;

    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState(initialState);
    const [loadingProject, setLoadingProject] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const runtimeStatus = useMemo(() => getProjectRuntimeStatus(project), [project]);

    useEffect(() => {
        if (!projectId) return;

        const fetchProject = async () => {
            setLoadingProject(true);

            if (!db) {
                setLoadingProject(false);
                return;
            }

            try {
                const projectSnap = await get(ref(db, `projects/${projectId}`));
                setProject(projectSnap.exists() ? normalizeProject(projectId, projectSnap.val()) : null);
            } catch (error) {
                console.error('Error loading project before submission:', error);
                setProject(null);
            } finally {
                setLoadingProject(false);
            }
        };

        fetchProject();
    }, [projectId]);

    const handleChange = (name, value) => {
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleCoverUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setIsError(true);
            setMessage("L'image de couverture depasse 10 Mo.");
            return;
        }

        setUploadingCover(true);
        setMessage('');
        setIsError(false);

        try {
            const uploadedUrl = await uploadToImgBB(file);
            handleChange('coverImage', uploadedUrl);
            setMessage('Image de couverture envoyee avec succes.');
        } catch (error) {
            console.error('Error uploading implementation cover image:', error);
            setIsError(true);
            setMessage("Impossible d'envoyer l'image de couverture.");
        } finally {
            setUploadingCover(false);
            event.target.value = '';
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!user || !project || !db) {
            setIsError(true);
            setMessage('Connecte-toi et recharge la page avant de soumettre.');
            return;
        }

        if (runtimeStatus !== 'open') {
            setIsError(true);
            setMessage('Ce challenge est ferme. Les soumissions ne sont plus acceptees.');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setIsError(false);

        try {
            const createdAt = Date.now();
            const submissionRef = push(ref(db, 'projectSubmissions'));
            const submissionId = submissionRef.key;

            const payload = {
                id: submissionId,
                projectId: project.id,
                projectTitle: project.title,
                authorId: user.uid,
                authorName: buildProjectAuthorName(profile, user),
                title: formData.title.trim(),
                description: formData.description.trim(),
                techStack: parseCommaSeparatedList(formData.techStack),
                githubUrl: normalizeExternalUrl(formData.githubUrl),
                demoUrl: normalizeExternalUrl(formData.demoUrl),
                coverImage: normalizeExternalUrl(formData.coverImage),
                screenshots: parseLineSeparatedList(formData.screenshots).map(normalizeExternalUrl).filter(Boolean),
                notes: formData.notes.trim(),
                createdAt,
                status: 'approved',
                votesCount: 0,
                commentsCount: 0,
            };

            await set(submissionRef, payload);
            await set(ref(db, `users/${user.uid}/projectSubmissions/${submissionId}`), {
                submissionId,
                projectId: project.id,
                projectTitle: project.title,
                title: payload.title,
                createdAt,
            });
            await runTransaction(
                ref(db, `projects/${project.id}/submissionCount`),
                (currentValue) => Number(currentValue || 0) + 1
            );

            if (project.createdBy && project.createdBy !== user.uid) {
                await sendPrivateNotification(project.createdBy, {
                    type: NOTIF_TYPES.UPDATE,
                    title: 'Nouvelle implementation sur ton projet',
                    message: `${payload.authorName} a soumis "${payload.title}" sur le challenge "${project.title}".`,
                    icon: 'trophy',
                    action: { type: 'navigate', target: `/projects/${project.id}` },
                });
            }

            setMessage('Implementation publiee avec succes. Elle apparait deja dans le challenge.');
            setTimeout(() => {
                router.push(`/projects/${project.id}`);
            }, 1200);
        } catch (error) {
            console.error('Error submitting implementation:', error);
            setIsError(true);
            setMessage("Impossible d'enregistrer cette implementation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!loading && !user) {
        return (
            <main className="container max-w-3xl px-4 py-16 md:px-6">
                <Card className="rounded-2xl border-slate-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl font-black text-slate-950">Connexion requise</CardTitle>
                        <CardDescription className="text-base text-slate-500">
                            Il faut etre connecte pour soumettre une implementation et apparaitre comme auteur dans le classement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button asChild className="rounded-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href={`/projects/${projectId}`}>Retour au projet</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (loadingProject) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    if (!project) {
        return (
            <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10">
                    <h1 className="text-3xl font-black text-slate-950">Challenge introuvable</h1>
                    <p className="mt-3 text-sm text-slate-500">
                        Recharge depuis le hub des projets et reessaie.
                    </p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/projects">Retour au hub</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-[linear-gradient(180deg,_#eff6ff_0%,_#ffffff_35%,_#f8fafc_100%)]">
            <div className="container max-w-4xl px-4 py-14 md:px-6">
                <div className="mb-10 space-y-4">
                    <Button asChild variant="ghost" className="rounded-full">
                        <Link href={`/projects/${project.id}`}>Retour au challenge</Link>
                    </Button>
                    <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                        Soumettre une implementation
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                        Tu soumets une reponse au challenge <span className="font-bold text-slate-950">{project.title}</span>. Ajoute une explication claire, un repo, une demo et quelques visuels.
                    </p>
                </div>

                <Card className="mb-8 rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>{project.summary || project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-500">
                        Statut du challenge: <span className="font-semibold text-slate-900">{runtimeStatus === 'open' ? 'Ouvert' : 'Ferme'}</span>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-white/70 shadow-xl">
                    <CardHeader>
                        <CardTitle>Ton build</CardTitle>
                        <CardDescription>
                            Plus la demo est claire, plus les autres utilisateurs pourront la comprendre et voter utilement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {message && (
                                <Alert className={isError ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>
                                    {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    <AlertTitle>{isError ? 'Erreur' : 'Succes'}</AlertTitle>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="title">Titre de l implementation</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(event) => handleChange('title', event.target.value)}
                                        placeholder="Ex: Attendance tracker avec QR code et dashboard"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(event) => handleChange('description', event.target.value)}
                                        placeholder="Explique ton angle, tes choix techniques et ce qui rend ton implementation differente."
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="techStack">Tech stack</Label>
                                    <Input
                                        id="techStack"
                                        value={formData.techStack}
                                        onChange={(event) => handleChange('techStack', event.target.value)}
                                        placeholder="next.js, firebase, tailwind"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverImage">Image de couverture</Label>
                                    <Input
                                        id="coverImageUpload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        disabled={uploadingCover || submitting}
                                    />
                                    <Input
                                        id="coverImage"
                                        type="url"
                                        value={formData.coverImage}
                                        onChange={(event) => handleChange('coverImage', event.target.value)}
                                        placeholder="https://..."
                                    />
                                    <p className="text-xs text-slate-500">
                                        {uploadingCover ? 'Envoi vers ImgBB...' : "Tu peux uploader une image directement ou garder une URL externe."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="githubUrl">Lien GitHub</Label>
                                    <Input
                                        id="githubUrl"
                                        type="url"
                                        value={formData.githubUrl}
                                        onChange={(event) => handleChange('githubUrl', event.target.value)}
                                        placeholder="https://github.com/..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="demoUrl">Lien de demo</Label>
                                    <Input
                                        id="demoUrl"
                                        type="url"
                                        value={formData.demoUrl}
                                        onChange={(event) => handleChange('demoUrl', event.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="screenshots">Captures d ecran</Label>
                                    <Textarea
                                        id="screenshots"
                                        value={formData.screenshots}
                                        onChange={(event) => handleChange('screenshots', event.target.value)}
                                        placeholder={'Une URL par ligne\nhttps://...\nhttps://...'}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes complementaires</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(event) => handleChange('notes', event.target.value)}
                                        placeholder="Ajoute ici ce qu il faut tester, les limites actuelles ou les pistes pour evoluer."
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="outline" asChild className="rounded-full">
                                    <Link href={`/projects/${project.id}`}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={submitting || runtimeStatus !== 'open'} className="rounded-full px-6">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Publier mon implementation
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
