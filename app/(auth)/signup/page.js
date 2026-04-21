'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { db as staticDb } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSuccess } = useDialog();

    const { signUp, sendVerification } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        filiere: '',
        startYear: ''
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [message, setMessage] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setFormData(prev => ({
                ...prev,
                email: decodeURIComponent(emailParam)
            }));
        }
    }, [searchParams]);


    const now = new Date();
    const maxYear = (now.getMonth() + 1 >= 9) ? now.getFullYear() : now.getFullYear() - 1;
    const years = Array.from({ length: Math.max(1, maxYear - 2023) }, (_, i) => (maxYear - i).toString());

    const validateEmail = (email) => {
        return email.toLowerCase().endsWith('@etu.uae.ac.ma');
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!acceptedTerms) {
            setMessage('Vous devez accepter les conditions d\'utilisation et la politique de confidentialité.');
            return;
        }

        setMessage('');


        const email = formData.email;
        let isAllowed = false;

        // 1. Check if academic email
        if (validateEmail(email)) {
            isAllowed = true;
        }
        // 2. Check if Gmail and in exceptions
        else if (email.toLowerCase().endsWith('@gmail.com')) {
            try {
                const { db } = await import('@/lib/firebase');
                const { ref, get } = await import('firebase/database');
                const snapshot = await get(ref(db, 'emailExceptions'));

                if (snapshot.exists()) {
                    const exceptions = snapshot.val();
                    const allowedEmails = Object.values(exceptions);
                    if (allowedEmails.includes(email.trim())) {
                        isAllowed = true;
                    }
                }
            } catch (err) {
                console.error("Error checking email exceptions:", err);
            }
        }

        if (!isAllowed) {
            setMessage('Veuillez utiliser votre adresse académique @etu.uae.ac.ma.');
            return;
        }

        if (formData.password.length < 6) {
            setMessage('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setLoading(true);

        try {
            // Create user in Auth
            const userCred = await signUp(formData.email, formData.password);
            const user = userCred.user;

            // Save user profile in Realtime DB
            const { db } = await import('@/lib/firebase');
            const { ref, set } = await import('firebase/database');

            await set(ref(db, `users/${user.uid}`), {
                email: formData.email.toLowerCase(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                filiere: formData.filiere,
                startYear: formData.startYear,
                createdAt: Date.now()
            });

            // Send verification email
            await sendVerification(user);

            // Send welcome email via API
            try {
                const { welcomeEmail } = await import('@/lib/email-templates');
                const html = welcomeEmail(formData.firstName);

                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formData.email,
                        subject: 'Bienvenue sur ESTT Community !',
                        html: html
                    })
                });
            } catch (err) {
                console.error("Failed to send welcome email:", err);
            }

            // Check for a pending QR reward claim
            try {
                const { get, update: dbUpdate } = await import('firebase/database');
                const encodedEmail = formData.email.toLowerCase().replace(/\./g, ',');
                const claimSnap = await get(ref(db, `qrClaims/${encodedEmail}`));

                if (claimSnap.exists()) {
                    const claim = claimSnap.val();
                    if (claim.status === 'pending' && claim.reward) {
                        const rewardStr = claim.reward;
                        let days = 30;
                        if (rewardStr.includes('month')) {
                            days = (parseInt(rewardStr.split('_')[1]) || 1) * 30;
                        } else if (rewardStr.includes('day')) {
                            days = parseInt(rewardStr.split('_')[1]) || 30;
                        }
                        const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);

                        // Apply subscription to new user profile
                        await dbUpdate(ref(db, `users/${user.uid}`), {
                            subscription: {
                                type: rewardStr,
                                expiresAt: expiresAt
                            }
                        });

                        // Mark claim as applied
                        await dbUpdate(ref(db, `qrClaims/${encodedEmail}`), {
                            status: 'applied',
                            appliedAt: Date.now(),
                            appliedToUid: user.uid
                        });

                        const formatReward = (r) => {
                            if (r.includes('month')) return `ESTTPlus+ (${r.split('_')[1].replace('month', ' Mois')})`;
                            if (r.includes('day')) return `ESTTPlus+ (${r.split('_')[1].replace('day', ' Jours')})`;
                            return 'ESTTPlus+';
                        };

                        showSuccess(`Félicitations ! Votre récompense réservée ${formatReward(rewardStr)} a été liée à votre nouveau compte !`, { title: 'Récompense Activée !' });
                    }
                }
            } catch (err) {
                console.error("Failed to apply QR reward:", err);
                // Non-blocking: don't fail signup if reward application fails
            }

            setMessage('Compte créé ! Un email de vérification a été envoyé à votre adresse académique. Veuillez vérifier votre boîte de réception avant de vous connecter.');
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Erreur lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = message.includes('créé') || message.includes('succès') || message.includes('réussie');

    return (
        <main className="container py-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Card className="w-full max-w-2xl shadow-xl border-muted-foreground/10">
                <CardHeader className="space-y-1 text-center border-b pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <UserPlus className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">Créer un compte</CardTitle>
                    <CardDescription>
                        Rejoignez la communauté ESTT pour partager et accéder aux ressources
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    {message && (
                        <Alert variant={isSuccess ? "default" : "destructive"} className={cn("mb-6", isSuccess ? "border-green-500 bg-green-50 text-green-700" : "")}>
                            {isSuccess ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertDescription className="font-medium">{message}</AlertDescription>
                        </Alert>
                    )}

                    {isSuccess ? (
                        <div className="flex flex-col items-center gap-6 py-8">
                            <div className="p-4 bg-green-100 rounded-full text-green-600">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold">Vérifiez votre boîte mail</h3>
                                <p className="text-muted-foreground">Un lien de vérification a été envoyé à <strong>{formData.email}</strong>.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Button className="flex-grow h-12 text-lg" asChild>
                                    <Link href="/">Retour à l'accueil</Link>
                                </Button>
                                <Button variant="outline" className="flex-grow h-12 text-lg" asChild>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Ahmed"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Alami"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Adresse email académique</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="prenom.nom@etu.uae.ac.ma"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Requis pour vérifier votre appartenance à l'UAE
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Au moins 6 caractères"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Pas forcément le mot de passe de l’e-mail académique
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="filiere">Filière</Label>
                                    <Select
                                        value={formData.filiere}
                                        onValueChange={(v) => handleChange('filiere', v)}
                                        required
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="filiere">
                                            <SelectValue placeholder="Sélectionnez..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staticDb.fields.map((f) => (
                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startYear">Année d'entrée</Label>
                                    <Select
                                        value={formData.startYear}
                                        onValueChange={(v) => handleChange('startYear', v)}
                                        required
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="startYear">
                                            <SelectValue placeholder="Sélectionnez..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 py-4">
                                <Checkbox 
                                    id="terms" 
                                    checked={acceptedTerms} 
                                    onCheckedChange={setAcceptedTerms} 
                                />
                                <Label 
                                    htmlFor="terms" 
                                    className="text-sm text-muted-foreground font-normal leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    J'accepte les <Link href="/terms" target="_blank" className="text-primary font-medium hover:underline">Conditions d'utilisation</Link> et la <Link href="/privacy" target="_blank" className="text-primary font-medium hover:underline">Politique de confidentialité</Link>.
                                </Label>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-medium shadow-sm transition-all hover:shadow-md" disabled={loading}>

                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Création du compte...
                                    </>
                                ) : (
                                    'Créer un compte'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        Vous avez déjà un compte ?{' '}
                        <Link href="/login" className="text-primary font-semibold hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}
