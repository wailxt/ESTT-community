import { useState } from 'react';
import { db, ref, set } from '@/lib/firebase';
import { useDialog } from '@/context/DialogContext';
import {
    Users,
    FileText,
    AlertCircle,
    ArrowUpRight,
    Search as SearchIcon,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminOverview({ stats, resources, setActiveTab }) {
    const { showSuccess, showError, showConfirm } = useDialog();
    const [rebuilding, setRebuilding] = useState(false);

    const handleRebuildIndex = async () => {
        const confirmed = await showConfirm("Voulez-vous vraiment reconstruire l'index de recherche ? Cela indexera toutes les ressources existantes.", {
            type: 'warning',
            title: 'Reconstruire l\'index',
            confirmLabel: 'Reconstruire'
        });
        if (!confirmed) return;

        setRebuilding(true);
        try {
            let count = 0;
            for (const res of resources) {
                if (res.field && res.title && !res.unverified) {
                    const keywordRef = ref(db, `metadata/keywords/${res.field}/${res.id}`);
                    await set(keywordRef, {
                        title: res.title,
                        resourceId: res.id
                    });
                    count++;
                }
            }
            showSuccess(`Index reconstruit avec succès ! ${count} ressources indexées.`);
        } catch (error) {
            console.error("Error rebuilding index:", error);
            showError("Erreur lors de la reconstruction de l'index.");
        } finally {
            setRebuilding(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Tableau de bord</h1>
                    <p className="text-muted-foreground">Bienvenue dans votre espace d'administration.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                        onClick={handleRebuildIndex}
                        disabled={rebuilding}
                    >
                        {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
                        Reconstruire l'index
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowUpRight className="w-4 h-4" /> Exporter
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Users className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] border-blue-100 text-blue-600">+12%</Badge>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Utilisateurs</p>
                        <h3 className="text-3xl font-black mt-1">{stats.users}</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] border-purple-100 text-purple-600">+5%</Badge>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ressources</p>
                        <h3 className="text-3xl font-black mt-1">{stats.resources}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-primary text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/20 text-white rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-wider">En attente</p>
                        <h3 className="text-3xl font-black mt-1">{stats.pending}</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Dernières Ressources</CardTitle>
                        <CardDescription>Les 5 ressources les plus récentes ajoutées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {resources.slice(0, 5).map((res) => (
                                <div key={res.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[200px]">{res.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black">{res.module}</p>
                                        </div>
                                    </div>
                                    {res.unverified ? (
                                        <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter">En attente</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter text-green-600 border-green-100">Vérifié</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-primary" onClick={() => setActiveTab('resources')}>
                            Voir tout <ArrowUpRight className="ml-2 w-3 h-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
