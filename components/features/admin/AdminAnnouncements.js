import { useState } from 'react';
import { db, ref, set, push, remove } from '@/lib/firebase';
import { useDialog } from '@/context/DialogContext';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Clock, Trash2 } from 'lucide-react';

export default function AdminAnnouncements({ announcements, userEmail }) {
    const { showWarning, showSuccess, showError, showConfirm } = useDialog();
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: '',
        imageUrl: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementForm.title || !announcementForm.content) {
            showWarning("Le titre et le contenu sont obligatoires.");
            return;
        }

        setIsSubmitting(true);
        try {
            const newAnnRef = push(ref(db, 'adminAnnouncements'));
            await set(newAnnRef, {
                ...announcementForm,
                type: 'admin',
                createdAt: Date.now(),
                author: userEmail
            });
            setAnnouncementForm({ title: '', content: '', imageUrl: '' });
            showSuccess("Annonce publiée !");
        } catch (err) {
            console.error(err);
            showError("Erreur lors de la publication.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        const confirmed = await showConfirm("Supprimer cette annonce ?", { type: 'danger', title: 'Suppression', confirmLabel: 'Supprimer' });
        if (!confirmed) return;
        try {
            await remove(ref(db, `adminAnnouncements/${id}`));
            showSuccess("Annonce supprimée.");
        } catch (err) {
            console.error(err);
            showError("Erreur lors de la suppression.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Annonces Globales</h1>
                    <p className="text-muted-foreground">Gérez les annonces qui s'affichent en haut de la page d'accueil.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Nouvelle Annonce</CardTitle>
                        <CardDescription>Elle apparaîtra dans le slider principal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddAnnouncement} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
                                <Input
                                    required
                                    placeholder="Titre de l'annonce"
                                    value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contenu</label>
                                <textarea
                                    required
                                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Description de l'annonce..."
                                    value={announcementForm.content}
                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL de l'image (Optionnel)</label>
                                <Input
                                    placeholder="https://..."
                                    value={announcementForm.imageUrl}
                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                />
                            </div>
                            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Publier l'annonce
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-1">Annonces Actives ({announcements.length})</h3>
                    {announcements.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-muted-foreground text-sm">Aucune annonce globale pour le moment.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {announcements.map((ann) => (
                                <Card key={ann.id} className="border-none shadow-sm group overflow-hidden">
                                    <div className="flex flex-col sm:flex-row">
                                        {ann.imageUrl && (
                                            <div className="sm:w-32 h-32 sm:h-auto relative shrink-0">
                                                <img src={ann.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="p-5 flex-grow">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <Badge className="mb-2 bg-primary/10 text-primary border-0 hover:bg-primary/20">Admin</Badge>
                                                    <h4 className="font-bold text-lg">{ann.title}</h4>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ann.content}</p>
                                                    <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(ann.createdAt).toLocaleDateString('fr-FR')}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
