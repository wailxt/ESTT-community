'use client';

import { useState, useEffect } from 'react';
import { db, ref, onValue, set, push, remove, serverTimestamp } from '@/lib/firebase';
import { useDialog } from '@/context/DialogContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Link as LinkIcon, Trash2, Copy, ExternalLink, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminShortUrls() {
    const { showError, showSuccess, showConfirm } = useDialog();
    const [urls, setUrls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [newUrl, setNewUrl] = useState({
        originalUrl: '',
        customId: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!db) return;

        const shortUrlsRef = ref(db, 'shortUrls');
        const unsubscribe = onValue(shortUrlsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({
                id,
                ...val
            })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setUrls(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newUrl.originalUrl) return;

        setIsCreating(true);
        try {
            let id = newUrl.customId.trim();
            if (!id) {
                // Generate a simple random ID if none provided
                id = Math.random().toString(36).substring(2, 8);
            }

            // Ensure ID is URL safe
            id = id.replace(/[^a-zA-Z0-9_-]/g, '');

            const urlData = {
                originalUrl: newUrl.originalUrl.startsWith('http') ? newUrl.originalUrl : `https://${newUrl.originalUrl}`,
                createdAt: serverTimestamp(),
                clicks: 0,
                createdBy: 'admin' // In a real app, this would be the current user's email/ID
            };

            await set(ref(db, `shortUrls/${id}`), urlData);
            setNewUrl({ originalUrl: '', customId: '' });
        } catch (error) {
            console.error('Error creating short URL:', error);
            showError('Erreur lors de la création de l\'URL courte');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Êtes-vous sûr de vouloir supprimer cette redirection ?', {
            type: 'danger',
            title: 'Supprimer la redirection',
            confirmLabel: 'Supprimer'
        });
        if (!confirmed) return;

        try {
            await remove(ref(db, `shortUrls/${id}`));
        } catch (error) {
            console.error('Error deleting short URL:', error);
        }
    };

    const copyToClipboard = (id) => {
        const fullUrl = `${window.location.origin}/re/${id}`;
        navigator.clipboard.writeText(fullUrl);
        showSuccess('Copié dans le presse-papier !');
    };

    const filteredUrls = urls.filter(u => 
        u.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tightest">URLs <span className="text-primary">Courts</span></h1>
                    <p className="text-slate-500 font-medium">Gérez vos redirections personnalisées es.to/re/[id]</p>
                </div>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" /> Créer une nouvelle redirection
                    </CardTitle>
                    <CardDescription>
                        Remplissez le formulaire ci-dessous pour créer une URL courte.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">URL Originale</label>
                            <Input 
                                placeholder="https://example.com/very-long-url" 
                                value={newUrl.originalUrl}
                                onChange={(e) => setNewUrl({...newUrl, originalUrl: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">ID Personnalisé (facultatif)</label>
                            <Input 
                                placeholder="mon-lien" 
                                value={newUrl.customId}
                                onChange={(e) => setNewUrl({...newUrl, customId: e.target.value})}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="w-full font-bold" disabled={isCreating}>
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Créer la redirection
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-xl font-bold">Redirections Actives</CardTitle>
                        <CardDescription>Liste de toutes les URLs raccourcies.</CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Rechercher..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-bold">Short ID</TableHead>
                                    <TableHead className="font-bold">Destination</TableHead>
                                    <TableHead className="font-bold text-center">Clicks</TableHead>
                                    <TableHead className="font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUrls.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">
                                            Aucune redirection trouvée.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUrls.map((url) => (
                                        <TableRow key={url.id}>
                                            <TableCell className="font-mono font-bold text-primary">/re/{url.id}</TableCell>
                                            <TableCell className="max-w-md truncate text-slate-600 font-medium">
                                                {url.originalUrl}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="font-bold">
                                                    {url.clicks || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => copyToClipboard(url.id)}>
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-500" asChild>
                                                        <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(url.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
