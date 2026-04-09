'use client';

import { useState } from 'react';
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
} from '@/lib/projects';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const initialState = {
    title: '',
    summary: '',
    description: '',
    category: 'web',
    tags: '',
    techStack: '',
    githubUrl: '',
    demoUrl: '',
    coverImage: '',
    screenshots: '',
};

export default function NewProjectShowcasePage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [formData, setFormData] = useState(initialState);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

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
            console.error('Error uploading showcase cover image:', error);
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
            setMessage('Connecte-toi pour publier un projet.');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setIsError(false);

        try {
            const createdAt = Date.now();
            const showcaseRef = push(ref(db, 'projectShowcases'));
            const showcaseId = showcaseRef.key;

            const payload = {
                id: showcaseId,
                title: formData.title.trim(),
                summary: formData.summary.trim(),
                description: formData.description.trim(),
                category: formData.category,
                tags: parseCommaSeparatedList(formData.tags),
                techStack: parseCommaSeparatedList(formData.techStack),
                githubUrl: normalizeExternalUrl(formData.githubUrl),
                demoUrl: normalizeExternalUrl(formData.demoUrl),
                coverImage: normalizeExternalUrl(formData.coverImage),
                screenshots: parseLineSeparatedList(formData.screenshots).map(normalizeExternalUrl).filter(Boolean),
                authorId: user.uid,
                authorName: buildProjectAuthorName(profile, user),
                createdAt,
                status: 'approved',
                votesCount: 0,
                featured: false,
            };

            await set(showcaseRef, payload);
            await set(ref(db, `users/${user.uid}/projectShowcases/${showcaseId}`), {
                showcaseId,
                title: payload.title,
                summary: payload.summary,
                createdAt,
            });

            setMessage('Projet publie avec succes dans le showcase.');
            setTimeout(() => {
                router.push(`/projects/showcase/${showcaseId}`);
            }, 1200);
        } catch (error) {
            console.error('Error creating showcase project:', error);
            setIsError(true);
            setMessage("Impossible de publier ton projet pour l'instant.");
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
                            Le showcase met en avant de vrais auteurs. Connecte-toi pour publier ton projet et l afficher sur ton profil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button asChild className="rounded-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href="/projects/showcase">Retour au showcase</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_30%,_#f8fafc_100%)]">
            <div className="container max-w-4xl px-4 py-14 md:px-6">
                <div className="mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-600 shadow-sm">
                        <Sparkles className="h-4 w-4" />
                        Publier dans le showcase
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                        Montre un projet que tu as vraiment construit.
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                        Utilise cette page pour partager un produit fini, un prototype ou un portfolio personnel independant des challenges.
                    </p>
                </div>

                <Card className="rounded-2xl border-white/70 shadow-xl">
                    <CardHeader>
                        <CardTitle>Fiche projet</CardTitle>
                        <CardDescription>
                            Ajoute le contexte, la stack et les liens principaux pour que les visiteurs comprennent vite ton travail.
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
                                    <Label htmlFor="title">Nom du projet</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(event) => handleChange('title', event.target.value)}
                                        placeholder="Ex: ESTT Clubs Dashboard"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="summary">Resume court</Label>
                                    <Textarea
                                        id="summary"
                                        value={formData.summary}
                                        onChange={(event) => handleChange('summary', event.target.value)}
                                        placeholder="Explique en une phrase ce que fait ton projet."
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description detaillee</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(event) => handleChange('description', event.target.value)}
                                        placeholder="Parle du probleme, de ton approche, des resultats et de ce que tu aimerais ameliorer."
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
                                    <Label htmlFor="tags">Tags</Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags}
                                        onChange={(event) => handleChange('tags', event.target.value)}
                                        placeholder="saas, clubs, realtime"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="techStack">Tech stack</Label>
                                    <Input
                                        id="techStack"
                                        value={formData.techStack}
                                        onChange={(event) => handleChange('techStack', event.target.value)}
                                        placeholder="next.js, firebase, stripe"
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
                                        {uploadingCover ? 'Envoi vers ImgBB...' : "Tu peux uploader une image directement ou coller une URL existante."}
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
                                    <Label htmlFor="screenshots">Captures supplementaires</Label>
                                    <Textarea
                                        id="screenshots"
                                        value={formData.screenshots}
                                        onChange={(event) => handleChange('screenshots', event.target.value)}
                                        placeholder={'Une URL par ligne\nhttps://...\nhttps://...'}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="outline" asChild className="rounded-full">
                                    <Link href="/projects/showcase">Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={submitting} className="rounded-full px-6">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Publier le projet
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
