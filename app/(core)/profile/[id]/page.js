'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/image-constants';
import { db, ref, get, update, onValue } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, User, Mail, GraduationCap, Calendar, Share2, Star, Ticket, Edit2, X, Megaphone, ArrowRight, FileText } from 'lucide-react';
import { cn, getUserLevel } from '@/lib/utils';

export default function PublicProfilePage() {
    const { id } = useParams();
    const { user: currentUser, signOut } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStarred, setIsStarred] = useState(false);
    const [starCount, setStarCount] = useState(0);
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [userClubs, setUserClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        filiere: '',
        startYear: ''
    });
    const [favorites, setFavorites] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    useEffect(() => {
        if (!id) return;

        const profileRef = ref(db, `users/${id}`);
        const unsubscribe = onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfile(data);
                setStarCount(data.stars || 0);
                setIsStarred(data.starredBy && currentUser && data.starredBy[currentUser.uid]);
            } else {
                setError("Profil introuvable");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser]);

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                filiere: profile.filiere || '',
                startYear: profile.startYear || ''
            });
        }
    }, [profile]);

    // Fetch saved resources for own profile
    useEffect(() => {
        if (!id || !currentUser || currentUser.uid !== id || !db) return;

        const fetchFavorites = async () => {
            setLoadingFavorites(true);
            try {
                const favRef = ref(db, `userFavorites/${id}`);
                const snap = await get(favRef);
                if (snap.exists()) {
                    const data = snap.val();
                    const list = Object.entries(data).map(([favId, value]) => ({
                        id: favId,
                        ...value,
                    }));
                    // Newest saved first
                    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    setFavorites(list);
                } else {
                    setFavorites([]);
                }
            } catch (e) {
                console.error('Error fetching favorites:', e);
                setFavorites([]);
            } finally {
                setLoadingFavorites(false);
            }
        };

        fetchFavorites();
    }, [id, currentUser]);

    useEffect(() => {
        if (!id || !currentUser || currentUser.uid !== id) return;

        const fetchTickets = async () => {
            setLoadingTickets(true);
            try {
                const ticketsRef = ref(db, 'tickets');
                const snap = await get(ticketsRef);
                if (snap.exists()) {
                    const data = snap.val();
                    const userTickets = Object.entries(data)
                        .map(([tid, t]) => ({ id: tid, ...t }))
                        .filter(t => t.userId === id)
                        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    setTickets(userTickets);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingTickets(false);
            }
        };
        fetchTickets();
    }, [id, currentUser]);

    useEffect(() => {
        if (!profile || !id) return;

        const fetchUserClubs = async () => {
            setLoadingClubs(true);
            try {
                const clubsRef = ref(db, 'clubs');
                const snap = await get(clubsRef);
                if (snap.exists()) {
                    const allClubs = snap.val();
                    const userEmail = profile.email?.toLowerCase();
                    const userId = id;

                    const associatedClubs = Object.entries(allClubs).map(([cId, club]) => ({
                        id: cId,
                        ...club
                    })).filter(club => {
                        const inOrg = club.organizationalChart && Object.values(club.organizationalChart).some(member =>
                            member?.email?.toLowerCase() === userEmail
                        );
                        const inMembers = club.members && Array.isArray(club.members) && club.members.some(member =>
                            member?.email?.toLowerCase() === userEmail || member?.id === userId
                        );
                        return inOrg || inMembers;
                    });

                    setUserClubs(associatedClubs);
                }
            } catch (e) {
                console.error("Error fetching user clubs:", e);
            } finally {
                setLoadingClubs(false);
            }
        };

        fetchUserClubs();
    }, [profile, id]);

    const handleStar = async () => {
        if (!currentUser) { alert("Vous devez être connecté pour liker un profil."); return; }
        if (currentUser.uid === id) { alert("Vous ne pouvez pas liker votre propre profil."); return; }

        const newIsStarred = !isStarred;
        const newStarCount = newIsStarred ? starCount + 1 : Math.max(0, starCount - 1);

        try {
            await update(ref(db, `users/${id}`), {
                stars: newStarCount,
                [`starredBy/${currentUser.uid}`]: newIsStarred || null
            });
            setIsStarred(newIsStarred);
            setStarCount(newStarCount);
        } catch (err) {
            console.error("Error updating star:", err);
            alert("Une erreur est survenue lors de la mise à jour des stars.");
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser || currentUser.uid !== id) return;
        setSaving(true);
        try {
            await update(ref(db, `users/${id}`), { ...formData, updatedAt: Date.now() });
            setIsEditOpen(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Erreur lors de la mise à jour du profil.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
        try { await signOut(); } catch (error) { console.error("Error signing out", error); }
    };

    const copyProfileLink = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({ title: `Profil de ${profile.firstName} ${profile.lastName} | ESTT Community`, url });
            } else {
                await navigator.clipboard.writeText(url);
                alert("Lien du profil copié !");
            }
        } catch (err) {
            console.error("Error sharing profile:", err);
            if (err.name !== 'AbortError') {
                try { await navigator.clipboard.writeText(window.location.href); alert("Lien du profil copié !"); }
                catch (e) { alert("Impossible de copier le lien."); }
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-primary">
            <Loader2 className="animate-spin w-10 h-10" />
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-[60vh] text-destructive">
            {error}
        </div>
    );

    const level = getUserLevel(profile?.startYear);
    const contributionsCount = Object.keys(profile?.contributions || {}).length;
    const isMentor = level === 2 && contributionsCount > 5;

    return (
        <main className="min-h-screen bg-white py-12 border-t border-slate-100">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column */}
                    <div className="space-y-4">

                        {/* Profile Card */}
                        <div className="border border-slate-200 rounded-xl p-8 text-center relative">
                            {isMentor && (
                                <div className="absolute top-3 right-3 bg-yellow-400 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                    Mentor
                                </div>
                            )}
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-9 h-9 text-slate-400" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {profile.firstName} {profile.lastName}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {profile.filiere} · {level === 1 ? 'S1/S2' : 'S3/S4'}
                            </p>

                            <div className="flex justify-center gap-2 mt-6">
                                {currentUser && currentUser.uid === id ? (
                                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="rounded-full px-5 gap-2" size="sm">
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Modifier
                                            </Button>
                                        </DialogTrigger>
                                        <Button asChild variant="outline" size="sm" className="rounded-full px-5 gap-2">
                                            <Link href="/ads-portal/dashboard">
                                                <Megaphone className="w-3.5 h-3.5" />
                                                Annonces
                                            </Link>
                                        </Button>
                                        <DialogContent className="sm:max-w-md rounded-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">Modifier mon profil</DialogTitle>
                                                <DialogDescription>Mettez à jour vos informations publiques.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="firstName">Prénom</Label>
                                                        <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="rounded-lg" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="lastName">Nom</Label>
                                                        <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="rounded-lg" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" value={profile.email} disabled className="rounded-lg bg-slate-50 text-slate-500" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="filiere">Filière</Label>
                                                        <Input id="filiere" value={formData.filiere} onChange={(e) => setFormData({ ...formData, filiere: e.target.value })} className="rounded-lg uppercase" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="startYear">Début</Label>
                                                        <Input id="startYear" type="number" value={formData.startYear} onChange={(e) => setFormData({ ...formData, startYear: e.target.value })} className="rounded-lg" />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter className="flex gap-2">
                                                <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-lg">Annuler</Button>
                                                <Button onClick={handleSaveProfile} disabled={saving} className="rounded-lg bg-primary text-white">
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Enregistrer
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button
                                        variant={isStarred ? "default" : "outline"}
                                        size="sm"
                                        className={cn("rounded-full px-5 transition-all", isStarred && "bg-yellow-500 hover:bg-yellow-600 border-none text-white")}
                                        onClick={handleStar}
                                    >
                                        <Star className={cn("w-3.5 h-3.5 mr-2", isStarred && "fill-current")} />
                                        <span>{starCount}</span>
                                    </Button>
                                )}
                                <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={copyProfileLink}>
                                    <Share2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* About */}
                        <div className="border border-slate-200 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">À propos</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="truncate">{profile.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>Promotion {profile.startYear}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="border border-slate-200 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Succès</h3>
                            <div className="flex flex-wrap gap-2">
                                {contributionsCount >= 1 && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-green-50 text-green-700">Contributeur</span>}
                                {contributionsCount >= 10 && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-orange-50 text-orange-700">Major Contrib</span>}
                                {starCount >= 5 && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-700">Populaire</span>}
                                {level === 2 && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">Ancien</span>}
                                {contributionsCount === 0 && starCount < 5 && level !== 2 && (
                                    <span className="text-xs text-slate-400 italic">Aucun succès pour le moment.</span>
                                )}
                            </div>
                        </div>

                        {/* Logout */}
                        {currentUser && currentUser.uid === id && (
                            <div className="border border-slate-200 rounded-xl p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Compte</h3>
                                <Button
                                    variant="outline"
                                    onClick={handleLogout}
                                    className="w-full justify-start rounded-lg border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 gap-2 text-sm"
                                >
                                    <X className="w-4 h-4" />
                                    Déconnexion
                                </Button>
                            </div>
                        )}
                    </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-8">

                        {/* Contributions (horizontal scroll) */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-900">Contributions</h2>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {contributionsCount}
                                    </span>
                                </div>
                                {contributionsCount > 0 && (
                                    <Link
                                        href={`/profile/${id}/contributions`}
                                        className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                                    >
                                        Tout voir
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                            {profile.contributions ? (
                                <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                                    {Object.entries(profile.contributions)
                                        .filter(([_, item]) => !item.unverified)
                                        .sort((a, b) => b[1].timestamp - a[1].timestamp)
                                        .map(([cid, item]) => (
                                            <Link
                                                key={cid}
                                                href={`/resource/${cid}`}
                                                className="min-w-[260px] max-w-xs group p-4 border border-slate-200 rounded-xl hover:border-primary/50 transition-colors bg-white flex flex-col justify-between"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                                        <span className="font-bold text-primary">
                                                            {item.module || 'Ressource'}
                                                        </span>
                                                        <span className="text-slate-400">
                                                            · {new Date(item.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                                    <p className="text-slate-400 text-sm">Aucune contribution pour le moment.</p>
                                </div>
                            )}
                        </section>

                        {/* Saved resources (own profile) */}
                        {currentUser && currentUser.uid === id && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-slate-900">Ressources enregistrées</h2>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                            {favorites.length}
                                        </span>
                                    </div>
                                    {favorites.length > 0 && (
                                        <Link
                                            href={`/profile/${id}/favorites`}
                                            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                                        >
                                            Tout voir
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                                {loadingFavorites ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                ) : favorites.length === 0 ? (
                                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-400 text-sm">
                                            Aucune ressource enregistrée pour le moment.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                                        {favorites.map((fav) => (
                                            <Link
                                                key={fav.id}
                                                href={`/resource/${fav.resourceId}`}
                                                className="min-w-[260px] max-w-xs group p-4 border border-slate-200 rounded-xl hover:border-primary/50 transition-colors bg-white flex flex-col justify-between"
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                                            {fav.title || 'Ressource'}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-1 mt-1 text-[10px] uppercase text-slate-400">
                                                            {fav.type && <span>{fav.type}</span>}
                                                            {fav.docType && (
                                                                <span className="text-primary">· {fav.docType}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {fav.createdAt && (
                                                    <div className="mt-auto pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                                                        Enregistrée le{' '}
                                                        {new Date(fav.createdAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Clubs */}
                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-4">Clubs</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {loadingClubs ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto col-span-full" />
                                ) : userClubs.length > 0 ? (
                                    userClubs.map(club => (
                                        <Link key={club.id} href={`/clubs/${club.id}`} className="group p-4 border border-slate-200 rounded-xl hover:border-primary/50 transition-colors text-center">
                                            <div className="relative w-10 h-10 mx-auto mb-2">
                                                {club.logo ? (
                                                    <Image src={club.logo} alt={club.name} fill sizes={IMAGE_SIZES.CLUB_LOGO_MD} className="object-contain" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: club.themeColor || '#64748b' }}>
                                                        {club.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 truncate group-hover:text-primary transition-colors">{club.name}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8 border border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-400 text-sm">Aucun club.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Tickets (own profile only) */}
                        {currentUser && currentUser.uid === id && (
                            <section>
                                <h2 className="text-base font-bold text-slate-900 mb-4">Mes Tickets</h2>
                                <div className="grid gap-2">
                                    {loadingTickets ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
                                    ) : tickets.length > 0 ? (
                                        tickets.map(ticket => (
                                            <div key={ticket.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                                                <div>
                                                    <h3 className="font-semibold text-sm text-slate-900">{ticket.eventName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md", ticket.status === 'valid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                                                            {ticket.status === 'valid' ? 'Validé' : 'En attente'}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{ticket.clubName}</span>
                                                    </div>
                                                </div>
                                                <a href={`/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">
                                                    Voir →
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                                            <p className="text-slate-400 text-sm">Aucun ticket.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
