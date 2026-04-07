'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Ticket, 
    Mail, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    ArrowRight,
    Loader2
} from 'lucide-react';
import { db, ref, get, set, update } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { rewardClaimedEmail } from '@/lib/email-templates';

export default function PromotionalModal({ isOpen, onClose, fromId, initialCode }) {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: code, 2: email, 3: success


    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rewardCodes, setRewardCodes] = useState([]);
    const [matchedReward, setMatchedReward] = useState('');
    const [matchedCodeObj, setMatchedCodeObj] = useState(null);

    // Fetch codes on mount

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const snapshot = await get(ref(db, 'rewardCodes'));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // Handle both array and object formats and keep ID
                    const codesList = Array.isArray(data) 
                        ? data.map((val, id) => val ? {id: id.toString(), ...val} : null).filter(Boolean)
                        : Object.entries(data).map(([id, val]) => ({id, ...val}));
                    setRewardCodes(codesList);
                }

            } catch (err) {
                console.error("Error fetching reward codes:", err);
            }
        };

        if (isOpen) {
            fetchCodes();
            // Reset state when opening
            setStep(1);
            setCode(initialCode || '');
            setError('');
            setMatchedReward('');
            setMatchedCodeObj(null);
        }
    }, [isOpen, initialCode]);

    const processValidCode = async (found) => {
        setMatchedReward(found.reward || 'esttplus_1month');
        setMatchedCodeObj(found);

        if (user) {
            setLoading(true);
            try {
                let days = 30;
                const rewardStr = found.reward || 'esttplus_1month';
                if (rewardStr.includes('month')) {
                    days = (parseInt(rewardStr.split('_')[1]) || 1) * 30;
                } else if (rewardStr.includes('day')) {
                    days = parseInt(rewardStr.split('_')[1]) || 30;
                }
                const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);

                await update(ref(db, `rewardCodes/${found.id}`), {
                    isValid: false,
                    usedAt: Date.now(),
                    usedByUid: user.uid,
                    usedByEmail: user.email
                });

                await update(ref(db, `users/${user.uid}`), {
                    subscription: {
                        type: rewardStr,
                        expiresAt: expiresAt
                    }
                });
                
                const encodedEmail = user.email.toLowerCase().replace(/\./g, ',');
                await set(ref(db, `qrClaims/${encodedEmail}`), {
                    email: user.email.toLowerCase(),
                    qrId: fromId || 'unknown',
                    code: found.code,
                    claimedAt: Date.now(),
                    reward: rewardStr,
                    status: 'applied'
                });

                // NON-BLOCKING: Send the premium confirmation email
                try {
                    const htmlEmail = rewardClaimedEmail({ isGuest: false, rewardType: rewardStr, email: user.email });
                    fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: user.email,
                            subject: '🎉 Votre badge ESTTPlus+ est désormais actif !',
                            html: htmlEmail
                        })
                    }); 
                } catch (emailErr) {
                    console.error("Non-blocking email error:", emailErr);
                }

                setStep(3);
            } catch (err) {
                console.error("Error applying reward:", err);
                setError("Une erreur est survenue lors de l'application de la récompense.");
            } finally {
                setLoading(false);
            }
        } else {
            setStep(2);
        }
    };


    // Auto-validate initial code if rewards are loaded
    useEffect(() => {
        if (isOpen && initialCode && rewardCodes.length > 0 && step === 1 && !loading) {
            const found = rewardCodes.find(item => String(item.code) === initialCode && item.isValid);
            if (found) {
                setCode(initialCode);
                processValidCode(found);
            } else if (initialCode.length === 4) {
                setError('Code automatique invalide.');
            }
        }
    }, [isOpen, initialCode, rewardCodes, step, loading]);


    const handleCodeSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        const found = rewardCodes.find(item => String(item.code) === code && item.isValid);
        
        if (found) {
            processValidCode(found);
        } else {


            setError('Code invalide. Veuillez vérifier le code sur l\'affiche.');
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.toLowerCase().endsWith('@etu.uae.ac.ma') && !email.toLowerCase().endsWith('@gmail.com')) {
            setError('Veuillez utiliser votre adresse académique @etu.uae.ac.ma.');
            return;
        }

        setLoading(true);
        try {
            // Encode email for Firebase key
            const encodedEmail = email.toLowerCase().replace(/\./g, ',');
            
            // Check if claim already exists
            const claimRef = ref(db, `qrClaims/${encodedEmail}`);
            const claimSnapshot = await get(claimRef);
            
            if (claimSnapshot.exists()) {
                setError('Vous avez déjà réclamé une récompense avec cet email.');
                setLoading(false);
                return;
            }

            if (matchedCodeObj) {
                await update(ref(db, `rewardCodes/${matchedCodeObj.id}`), {
                    isValid: false,
                    usedAt: Date.now(),
                    usedByEmail: email.toLowerCase()
                });
            }

            // Store claim

            await set(claimRef, {
                email: email.toLowerCase(),
                qrId: fromId || 'unknown',
                code: code,
                claimedAt: Date.now(),
                reward: matchedReward,
                status: 'pending' // pending until signup
            });

            // NON-BLOCKING: Send the premium registration email
            try {
                const htmlEmail = rewardClaimedEmail({ isGuest: true, rewardType: matchedReward, email: email.toLowerCase() });
                fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: email.toLowerCase(),
                        subject: "🏷️ Votre récompense ESTT vous attend !",
                        html: htmlEmail
                    })
                }); 
            } catch (emailErr) {
                console.error("Non-blocking email error:", emailErr);
            }

            setStep(3);
        } catch (err) {
            console.error("Error storing claim:", err);
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupRedirect = () => {
        router.push(`/signup?email=${encodeURIComponent(email)}`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent className="sm:max-w-[440px] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-950 rounded-3xl">
                {/* Header Decoration */}
                <div className={cn(
                    "h-32 w-full relative flex items-center justify-center overflow-hidden transition-all duration-500",
                    step === 1 ? "bg-gradient-to-br from-indigo-600 to-indigo-800" :
                    step === 2 ? "bg-gradient-to-br from-amber-500 to-orange-600" :
                    "bg-gradient-to-br from-emerald-500 to-teal-600"
                )}>
                    {/* Abstract circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    
                    {step === 1 && loading && (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center z-10">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        </div>
                    )}
                    {step === 1 && !loading && <Ticket className="w-16 h-16 text-white/90 relative z-10 animate-bounce" />}
                    {step === 2 && <Sparkles className="w-16 h-16 text-white/90 relative z-10 animate-pulse" />}
                    {step === 3 && <CheckCircle2 className="w-16 h-16 text-white/90 relative z-10" />}
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2 text-center">
                                <DialogTitle className="text-2xl font-bold">Code Promo QR</DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Entrez le code à 4 chiffres présent sur l'affiche pour réclamer votre récompense.
                                </DialogDescription>
                            </div>

                            <form onSubmit={handleCodeSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="promo-code" className="sr-only">Code</Label>
                                    <Input 
                                        id="promo-code"
                                        placeholder="0000"
                                        max={4}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="text-center text-3xl tracking-[1em] font-mono h-16 border-2 focus-visible:ring-indigo-500"
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </p>
                                    )}
                                </div>
                                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl transition-all shadow-lg shadow-indigo-200" disabled={code.length !== 4}>
                                    Vérifier le code
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2 text-center">
                                <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                                    C'est gagné ! <Sparkles className="w-6 h-6 text-amber-500" />
                                </DialogTitle>
                                <DialogDescription className="text-slate-600 font-medium">
                                    Vous avez débloqué <span className="text-indigo-600 font-bold">{
                                        matchedReward.includes('month') ? matchedReward.split('_')[1].replace('month', ' mois gratuit') :
                                        matchedReward.includes('day') ? matchedReward.split('_')[1].replace('day', ' jours gratuits') :
                                        '1 mois gratuit'
                                    }</span> de <span className="text-indigo-600 font-bold">ESTTPlus+</span>
                                </DialogDescription>

                                <p className="text-sm text-slate-400 mt-2">
                                    Entrez votre email pour réserver votre récompense.
                                </p>
                            </div>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="claim-email">Email Académique</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <Input 
                                            id="claim-email"
                                            type="email"
                                            placeholder="prenom.nom@etu.uae.ac.ma"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 border-slate-200"
                                            required
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </p>
                                    )}
                                </div>
                                <Button 
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl transition-all shadow-lg"
                                    disabled={loading || !email}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Réserver ma récompense <ArrowRight className="ml-2 w-5 h-5" /></>
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center">
                            {user ? (
                                // Logged-in user: reward applied instantly
                                <>
                                    <div className="space-y-2">
                                        <DialogTitle className="text-2xl font-bold text-emerald-600">Récompense activée !</DialogTitle>
                                        <DialogDescription className="text-slate-600">
                                            Votre abonnement <strong>ESTTPlus+</strong> est maintenant actif.
                                        </DialogDescription>
                                        <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 text-violet-800 text-sm mt-4">
                                            <p className="font-black text-base mb-1">
                                                {matchedReward.includes('month') ? matchedReward.split('_')[1].replace('month', ' mois') :
                                                 matchedReward.includes('day') ? matchedReward.split('_')[1].replace('day', ' jours') :
                                                 '1 mois'} d&apos;ESTTPlus+ débloqué ✨
                                            </p>
                                            <p className="text-xs text-violet-600">Le badge PLUS+ est maintenant visible sur votre profil.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={onClose}
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg rounded-xl transition-all shadow-lg shadow-emerald-100"
                                    >
                                        Super, merci !
                                    </Button>
                                </>
                            ) : (
                                // Guest user: prompt to sign up
                                <>
                                    <div className="space-y-2">
                                        <DialogTitle className="text-2xl font-bold text-emerald-600">Félicitations !</DialogTitle>
                                        <DialogDescription className="text-slate-600">
                                            Votre récompense est réservée pour <strong>{email}</strong>.
                                        </DialogDescription>
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-sm mt-4">
                                            Créez votre compte maintenant pour activer votre avantage <span className="font-bold">{
                                                matchedReward.includes('month') ? matchedReward.split('_')[1].replace('month', ' mois') :
                                                matchedReward.includes('day') ? matchedReward.split('_')[1].replace('day', ' jours') :
                                                '1 mois'
                                            }</span> de ESTTPlus+.
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={handleSignupRedirect}
                                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg rounded-xl transition-all shadow-lg shadow-emerald-100"
                                        >
                                            S&apos;inscrire maintenant
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={onClose}
                                            className="w-full h-12 text-slate-500 hover:text-slate-800"
                                        >
                                            S&apos;inscrire plus tard
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
