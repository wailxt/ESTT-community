'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, push, set } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    buildProjectAuthorName,
    normalizeExternalUrl,
    parseCommaSeparatedList,
    parseLineSeparatedList,
    PROJECT_CATEGORIES,
    PROJECT_DIFFICULTIES,
    PROJECT_VOTE_MODE,
    slugifyProjectTitle,
} from '@/lib/projects';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { AlertCircle, CheckCircle2, Loader2, Rocket } from 'lucide-react';

const initialState = {
    title: '',
    summary: '',
    description: '',
    category: 'web',
    difficulty: 'beginner',
    tags: '',
    skills: '',
    requirements: '',
    evaluationCriteria: '',
    deadline: '',
    coverImage: '',
};

export default function NewProjectPage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [formData, setFormData] = useState(initialState);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const isReady = useMemo(
        () => Boolean(formData.title.trim() && formData.summary.trim() && formData.description.trim()),
        [formData]
    );

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
            console.error('Error uploading challenge cover image:', error);
            setIsError(true);
            setMessage("Impossible d'envoyer l'image de couverture.");
        } finally {
            setUploadingCover(false);
            event.target.value = '';
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!user || !db) {
            setIsError(true);
            setMessage('Connecte-toi pour proposer un challenge.');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setIsError(false);

        try {
            const createdAt = Date.now();
            const projectRef = push(ref(db, 'projects'));
            const projectId = projectRef.key;

            const payload = {
                id: projectId,
                title: formData.title.trim(),
                slug: slugifyProjectTitle(formData.title),
                summary: formData.summary.trim(),
                description: formData.description.trim(),
                category: formData.category,
                difficulty: formData.difficulty,
                tags: parseCommaSeparatedList(formData.tags),
                skills: parseCommaSeparatedList(formData.skills),
                requirements: parseLineSeparatedList(formData.requirements),
                evaluationCriteria: parseLineSeparatedList(formData.evaluationCriteria),
                createdBy: user.uid,
                authorName: buildProjectAuthorName(profile, user),
                createdAt,
                deadline: formData.deadline ? new Date(`${formData.deadline}T23:59:59`).getTime() : null,
                status: 'open',
                moderationStatus: 'approved',
                voteMode: PROJECT_VOTE_MODE,
                featured: false,
                coverImage: normalizeExternalUrl(formData.coverImage),
                submissionCount: 0,
            };

            await set(projectRef, payload);
            await set(ref(db, `users/${user.uid}/projectBriefs/${projectId}`), {
                projectId,
                title: payload.title,
                summary: payload.summary,
                status: payload.status,
                createdAt,
            });

            setMessage('Projet cree avec succes. Tu peux maintenant attendre des implementations ou commencer a promouvoir le brief.');
            setTimeout(() => {
                router.push(`/projects/${projectId}`);
            }, 1200);
        } catch (error) {
            console.error('Error creating project challenge:', error);
            setIsError(true);
            setMessage("Impossible de creer ce challenge pour l'instant.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!loading && !user) {
        return (
            <main className="container max-w-3xl px-4 py-16 md:px-6">
                <Card className="rounded-2xl border-slate-200 shadow-lg">
                    <CardHeader className="space-y-3">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                            <Rocket className="h-3.5 w-3.5" />
                            Nouveau challenge
                        </div>
                        <CardTitle className="text-3xl font-black text-slate-950">Connecte-toi pour proposer un projet</CardTitle>
                        <CardDescription className="text-base text-slate-500">
                            La creation de briefs est reservee aux membres connectes afin de garder des auteurs identifies et de limiter le spam.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button asChild className="rounded-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href="/projects">Retour au hub</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_35%,_#f8fafc_100%)]">
            <div className="container max-w-4xl px-4 py-14 md:px-6">
                <div className="mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-600 shadow-sm">
                        <Rocket className="h-4 w-4" />
                        Proposer un challenge
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                        Lance un projet que d'autres etudiants pourront construire.
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                        Decris le probleme, le niveau, les attentes et les criteres d evaluation. La communaute pourra ensuite soumettre des implementations et voter.
                    </p>
                </div>

                <Card className="rounded-2xl border-white/70 shadow-xl">
                    <CardHeader>
                        <CardTitle>Brief du projet</CardTitle>
                        <CardDescription>
                            Le MVP publie automatiquement le challenge pour accelerer le lancement. Une moderation plus stricte pourra etre activee plus tard.
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
                                    <Label htmlFor="title">Titre du challenge</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(event) => handleChange('title', event.target.value)}
                                        placeholder="Ex: Construire un attendance tracker pour ESTT"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="summary">Resume court</Label>
                                    <Textarea
                                        id="summary"
                                        value={formData.summary}
                                        onChange={(event) => handleChange('summary', event.target.value)}
                                        placeholder="En une ou deux phrases, explique ce que les builders doivent realiser."
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description complete</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(event) => handleChange('description', event.target.value)}
                                        placeholder="Expose le contexte, les problemes a resoudre, les contraintes et la vision finale."
                                        rows={7}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Categorie</Label>
                                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir une categorie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_CATEGORIES.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Difficulte</Label>
                                    <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir une difficulte" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_DIFFICULTIES.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags</Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags}
                                        onChange={(event) => handleChange('tags', event.target.value)}
                                        placeholder="react, firebase, dashboard"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="skills">Skills utiles</Label>
                                    <Input
                                        id="skills"
                                        value={formData.skills}
                                        onChange={(event) => handleChange('skills', event.target.value)}
                                        placeholder="design system, auth, api"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deadline">Deadline optionnelle</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(event) => handleChange('deadline', event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverImage">Image de couverture optionnelle</Label>
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
                                        {uploadingCover ? 'Envoi vers ImgBB...' : "Tu peux uploader une image directement ou coller une URL existante."}
                                    </p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="requirements">Attendus fonctionnels</Label>
                                    <Textarea
                                        id="requirements"
                                        value={formData.requirements}
                                        onChange={(event) => handleChange('requirements', event.target.value)}
                                        placeholder={'Une ligne par attente\nAuthentification et roles\nDashboard responsive\nHistorique des actions'}
                                        rows={5}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="evaluationCriteria">Criteres d evaluation</Label>
                                    <Textarea
                                        id="evaluationCriteria"
                                        value={formData.evaluationCriteria}
                                        onChange={(event) => handleChange('evaluationCriteria', event.target.value)}
                                        placeholder={'Une ligne par critere\nQualite UX\nPertinence technique\nClarte de la demo'}
                                        rows={5}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Regle de vote MVP</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Chaque utilisateur peut placer un vote sur une seule implementation par challenge, avec possibilite de changer ce vote tant que le projet reste ouvert.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="outline" asChild className="rounded-full">
                                    <Link href="/projects">Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={!isReady || submitting} className="rounded-full px-6">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Creer le challenge
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
