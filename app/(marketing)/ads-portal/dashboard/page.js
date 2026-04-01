'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { db, ref, onValue, remove, set } from '@/lib/firebase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    LayoutDashboard,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    CreditCard,
    MessageSquare,
    Loader2
} from 'lucide-react';
import { AD_STATUSES } from '@/lib/ad-constants';
import { useSearchParams } from 'next/navigation';

const StatusBadge = ({ status }) => {
    switch (status) {
        case AD_STATUSES.LIVE:
            return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50"><CheckCircle2 className="w-3 h-3 mr-1" /> En Ligne</Badge>;
        case AD_STATUSES.UNDER_REVIEW:
            return <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50"><Clock className="w-3 h-3 mr-1" /> En Révision</Badge>;
        case AD_STATUSES.PAYMENT_REQUIRED:
            return <Badge className="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-50 animate-pulse"><CreditCard className="w-3 h-3 mr-1" /> Paiement Requis</Badge>;
        case AD_STATUSES.EXPIRED:
            return <Badge className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-50">Expiré</Badge>;
        case AD_STATUSES.REFUSED:
            return <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>;
        case AD_STATUSES.DRAFT:
            return <Badge className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100">Brouillon</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

export default function UserAdsDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { showSuccess, showWarning, showError, showConfirm } = useDialog();
    const searchParams = useSearchParams();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payLoading, setPayLoading] = useState(null);

    // Handle success/cancel notifications
    useEffect(() => {
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');
        if (success) {
            showSuccess("Paiement réussi ! Votre annonce est maintenant en cours d'activation.");
        }
        if (canceled) {
            showWarning("Paiement annulé.");
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/ads-portal/dashboard');
            return;
        }

        const adsRef = ref(db, 'studentAds');
        const unsubscribe = onValue(adsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const userAds = Object.entries(data)
                    .map(([id, ad]) => ({ id, ...ad }))
                    .filter(ad => ad.publisher === user.uid)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAds(userAds);
            } else {
                setAds([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, router]);

    const handleDelete = async (ad) => {
        if (ad.status === AD_STATUSES.LIVE) {
            const code = window.prompt("Cette annonce est en ligne. Pour la désactiver avant expiration, veuillez saisir votre code de vérification (N° Facture envoyé par email) :");
            if (code !== ad.invoiceId) {
                showWarning("Code incorrect. Désactivation annulée.");
                return;
            }
        } else {
            const confirmed = await showConfirm("Voulez-vous vraiment supprimer cette annonce ?", { type: 'danger', title: 'Supprimer l\'annonce', confirmLabel: 'Supprimer' });
            if (!confirmed) return;
        }
        try {
            await remove(ref(db, `studentAds/${ad.id}`));
        } catch (error) {
            showError("Erreur lors de la suppression");
        }
    };

    const handleStripePayment = async (ad) => {
        setPayLoading(ad.id);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ad',
                    adId: ad.id,
                    adTitle: ad.title,
                    price: ad.price,
                    userEmail: user.email
                })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Une erreur est survenue");
            }
        } catch (error) {
            console.error("Payment error:", error);
            showError("Erreur: " + error.message);
        } finally {
            setPayLoading(null);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white">
            <div className="container max-w-6xl mx-auto px-4 py-16">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                            <LayoutDashboard className="w-10 h-10 text-blue-600" />
                            Mes Annonces
                        </h1>
                        <p className="text-slate-500 mt-2">Gérez vos campagnes publicitaires et suivez leur performance.</p>
                    </div>
                    <Button
                        onClick={() => router.push('/ads-portal/submit')}
                        className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 px-8 font-bold shadow-xl shadow-slate-200 transition-all hover:scale-105"
                    >
                        <Plus className="w-5 h-5 mr-3" />
                        Nouvelle Annonce
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-slate-50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : ads.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Plus className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Aucune annonce trouvée</h2>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            Partagez votre première annonce dès aujourd'hui pour gagner en visibilité auprès de la communauté.
                        </p>
                        <Button variant="outline" onClick={() => router.push('/ads-portal/submit')} className="rounded-full h-12 px-8">
                            Publier ma première annonce
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {ads.map((ad) => (
                            <Card key={ad.id} className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-[32px] bg-white">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Media Preview */}
                                        <div className="w-full md:w-64 h-48 md:h-auto relative bg-slate-100">
                                            {ad.type === 'video' ? (
                                                <video src={ad.url} className="w-full h-full object-cover" muted />
                                            ) : (
                                                <img src={ad.url} alt={ad.title} className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-none shadow-sm capitalize text-[10px]">
                                                    {ad.category}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-grow p-8">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-slate-900">{ad.title}</h3>
                                                        <StatusBadge status={ad.status} />
                                                    </div>
                                                    <p className="text-slate-500 text-sm line-clamp-2 max-w-xl">
                                                        {ad.description}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-medium text-slate-400">
                                                    Soumise le {new Date(ad.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-6 pt-6 border-t border-slate-50 items-center justify-between">
                                                <div className="flex gap-8">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Prix</p>
                                                        <p className="text-sm font-bold text-slate-900">{ad.price} MAD</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Durée</p>
                                                        <p className="text-sm font-bold text-slate-900">{ad.duration} jours</p>
                                                    </div>
                                                    {ad.status === AD_STATUSES.LIVE && (
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Expiration</p>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {ad.expirationDate ? new Date(ad.expirationDate).toLocaleDateString() : 'Bientôt'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {ad.status === AD_STATUSES.PAYMENT_REQUIRED && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                disabled={true}
                                                                className="bg-slate-100 text-slate-400 h-10 px-6 rounded-xl font-bold border border-slate-200"
                                                            >
                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                Carte (Bientôt)
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                                                            >
                                                                <a href="https://wa.me/212715307349" target="_blank" rel="noopener noreferrer">
                                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                                    Payer via WhatsApp
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50" asChild>
                                                        <a href={ad.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(ad)}
                                                        className="h-10 w-10 rounded-xl hover:bg-red-50 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Note if Refused */}
                                    {ad.status === AD_STATUSES.REFUSED && ad.adminNote && (
                                        <div className="bg-red-50 p-6 flex gap-4 items-start border-t border-red-100">
                                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-red-900">Note de l'administrateur :</p>
                                                <p className="text-sm text-red-700 mt-1">{ad.adminNote}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Footer Help */}
                <div className="mt-20 p-10 bg-slate-900 rounded-[40px] text-white">
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-bold mb-4">Besoin d'aide avec votre campagne ?</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Notre équipe est là pour vous accompagner dans la réussite de votre publicité.
                            Contactez-nous si vous avez des questions sur le paiement ou le ciblage.
                        </p>
                        <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 font-bold">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contacter le Support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
