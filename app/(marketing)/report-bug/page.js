'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Bug,
    Info,
    AlertCircle,
    CheckCircle2,
    Upload,
    X,
    Loader2,
    Plus,
    Trash2,
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';
import { db, storage, storageRef, uploadBytes, getDownloadURL, push, ref, set, serverTimestamp } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

export default function ReportBugPage() {
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [referenceId, setReferenceId] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        stepsToReproduce: '',
        appVersion: '',
        os: '',
        browser: '',
        deviceType: '',
        severity: '',
        email: ''
    });

    const [attachments, setAttachments] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Auto-detection logic and user linking
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent;
            let detectedOS = 'Other';
            let detectedBrowser = 'Other';
            let detectedDevice = 'Desktop';

            // OS Detection
            if (/windows/i.test(ua)) detectedOS = 'Windows';
            else if (/macintosh|mac os x/i.test(ua)) detectedOS = 'macOS';
            else if (/linux/i.test(ua)) detectedOS = 'Linux';
            else if (/android/i.test(ua)) detectedOS = 'Android';
            else if (/iphone|ipad|ipod/i.test(ua)) detectedOS = 'iOS';

            // Browser Detection
            if (/edg/i.test(ua)) detectedBrowser = 'Edge';
            else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) detectedBrowser = 'Chrome';
            else if (/firefox|fxios/i.test(ua)) detectedBrowser = 'Firefox';
            else if (/safari/i.test(ua) && !/chrome/i.test(ua) && !/edg/i.test(ua)) detectedBrowser = 'Safari';

            // Device Detection
            if (/mobile/i.test(ua)) detectedDevice = 'Mobile';
            else if (/tablet|ipad/i.test(ua)) detectedDevice = 'Tablet';

            setFormData(prev => ({
                ...prev,
                os: detectedOS,
                browser: detectedBrowser,
                deviceType: detectedDevice,
                email: user?.email || prev.email,
                userId: user?.uid || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        // Basic validation for file size and type could be added here
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const generateReferenceId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BUG-';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            setError('Vous devez être connecté pour signaler un bug.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const refId = generateReferenceId();
            const bugReportsRef = ref(db, 'bugReports');
            const newBugRef = push(bugReportsRef);

            let uploadedAttachments = [];

            // Upload attachments if any
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const fileRef = storageRef(storage, `bug-reports/${refId}/${file.name}`);
                    const snapshot = await uploadBytes(fileRef, file);
                    const url = await getDownloadURL(snapshot.ref);
                    uploadedAttachments.push({
                        name: file.name,
                        url: url,
                        type: file.type,
                        size: file.size
                    });
                }
            }

            const reportData = {
                ...formData,
                referenceId: refId,
                attachments: uploadedAttachments,
                status: 'open',
                createdAt: serverTimestamp(),
                timestamp: Date.now(),
                userId: user.uid,
                reporterName: profile ? `${profile.firstName} ${profile.lastName}` : (user.displayName || 'Utilisateur ESTT')
            };

            await set(newBugRef, reportData);

            setReferenceId(refId);
            setSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Error submitting bug report:', err);
            setError('Une erreur est survenue lors de l\'envoi du rapport. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 py-20 px-4">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Merci pour votre retour !</h1>
                        <p className="text-lg text-slate-500">Votre rapport a été reçu et sera examiné par notre équipe dès que possible.</p>
                    </div>

                    <Card className="shadow-lg border-muted-foreground/10 bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-8 space-y-6 text-left">
                            <div className="bg-slate-50 rounded-2xl p-6 text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">ID de référence</p>
                                <p className="text-2xl font-mono font-bold text-primary">{referenceId}</p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-900">Prochaines étapes :</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-slate-600 text-sm">
                                        <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">1</div>
                                        <span>Notre équipe examinera les détails fournis pour reproduire le bug.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600 text-sm">
                                        <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">2</div>
                                        <span>Nous prioriserons le correctif en fonction de la sévérité indiquée.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600 text-sm">
                                        <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">3</div>
                                        <span>Vous pourriez recevoir un email si nous avons besoin de plus d'informations.</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button asChild className="rounded-2xl h-12 px-8 font-bold">
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                        <Button variant="outline" onClick={() => setSuccess(false)} className="rounded-2xl h-12 px-8 font-bold bg-white">
                            Signaler un autre bug
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Chargement...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <main className="container py-20 max-w-2xl">
                <div className="text-center space-y-8">
                    <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Bug className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Connexion requise</h1>
                        <p className="text-lg text-slate-500">Vous devez être connecté pour signaler un bug et nous aider à améliorer la plateforme.</p>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold w-full sm:w-auto">
                            <Link href="/login?redirect=/report-bug">Se connecter</Link>
                        </Button>
                        <Button variant="ghost" asChild className="rounded-2xl h-14 px-8 font-bold w-full sm:w-auto border-slate-200 border">
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="container py-12 max-w-4xl">
            <section className="mb-12 text-center relative">
                <Link href="/" className="absolute left-0 top-0 hidden md:flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-bold">Retour</span>
                </Link>

                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Bug className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Signaler un bug
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Aidez-nous à améliorer la plateforme en signalant les problèmes rencontrés.
                </p>
            </section>

            <section>
                <Card className="shadow-lg border-muted-foreground/10 rounded-3xl">
                    <CardHeader>
                        <CardTitle>Détails du rapport</CardTitle>
                        <CardDescription>
                            Veuillez fournir autant d'informations que possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <Alert variant="destructive" className="rounded-2xl">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erreur</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre du bug *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        placeholder="Ex: Le bouton de téléchargement ne fonctionne pas sur mobile"
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description détaillée *</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Que s'est-il passé exactement ?"
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="rounded-xl resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="stepsToReproduce">Étapes pour reproduire *</Label>
                                    <Textarea
                                        id="stepsToReproduce"
                                        name="stepsToReproduce"
                                        placeholder="1. Aller sur...&#10;2. Cliquer sur...&#10;3. Voir l'erreur..."
                                        required
                                        rows={4}
                                        value={formData.stepsToReproduce}
                                        onChange={handleInputChange}
                                        className="rounded-xl resize-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/20 rounded-2xl border border-muted-foreground/10">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <Monitor className="w-4 h-4" />
                                        Environnement
                                    </h4>

                                    <div className="space-y-2">
                                        <Label className="text-xs opacity-70">OS</Label>
                                        <div className="h-10 rounded-xl bg-white border border-slate-200 flex items-center px-4 text-sm font-medium">
                                            {formData.os}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs opacity-70">Navigateur</Label>
                                        <div className="h-10 rounded-xl bg-white border border-slate-200 flex items-center px-4 text-sm font-medium">
                                            {formData.browser}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs opacity-70">Appareil</Label>
                                        <div className="h-10 rounded-xl bg-white border border-slate-200 flex items-center px-4 text-sm font-medium">
                                            {formData.deviceType}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Importance
                                    </h4>

                                    <div className="space-y-2">
                                        <Label htmlFor="severity" className="text-xs opacity-70">Sévérité *</Label>
                                        <Select required onValueChange={(val) => handleSelectChange('severity', val)}>
                                            <SelectTrigger id="severity" className="h-10 rounded-xl bg-white">
                                                <SelectValue placeholder="Sélectionner" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Low">Basse</SelectItem>
                                                <SelectItem value="Medium">Moyenne</SelectItem>
                                                <SelectItem value="High">Haute</SelectItem>
                                                <SelectItem value="Critical">Critique</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="version" className="text-xs opacity-70">Version</Label>
                                        <Input
                                            id="version"
                                            name="appVersion"
                                            placeholder="Ex: 1.3.1"
                                            value={formData.appVersion}
                                            onChange={handleInputChange}
                                            className="h-10 rounded-xl bg-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs opacity-70">Email (Auto-détecté)</Label>
                                        <div className="h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 text-sm font-medium text-slate-500">
                                            {user?.email || 'Connexion requise'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Pièces jointes</Label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-muted-foreground/20 border-dashed rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer relative group">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <div className="flex text-sm text-muted-foreground">
                                            <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                                <span>Cliquer pour uploader des fichiers</span>
                                                <input type="file" className="hidden" multiple onChange={handleFileChange} accept=".png,.jpg,.jpeg,.mp4,.txt,.log" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, MP4, TXT, LOG (Max. 10MB)</p>
                                    </div>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeAttachment(index)}
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/5"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    size="lg"
                                    className="w-full h-12 rounded-2xl text-lg font-bold shadow-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        'Envoyer le rapport'
                                    )}
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground text-center">
                                    <Info className="h-3 w-3" />
                                    <span>Votre rapport nous aide à améliorer la plateforme pour tout le monde.</span>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
