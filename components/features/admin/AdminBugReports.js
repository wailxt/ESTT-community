'use client';

import { useState } from 'react';
import { db, ref, update, remove, get } from '@/lib/firebase';
import { sendPrivateNotification, NOTIF_TYPES } from '@/lib/notifications';
import { bugResolvedEmail } from '@/lib/email-templates';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bug,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    Loader2,
    ChevronRight,
    Eye,
    MessageSquare,
    Trash2,
    Calendar,
    Mail,
    Monitor,
    Shield
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

export default function AdminBugReports({ reports = [] }) {
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedBug, setSelectedBug] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'critical': return 'bg-red-100 text-red-700 border-red-200 animate-pulse';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open': return <Badge className="bg-blue-500">Ouvert</Badge>;
            case 'in-progress': return <Badge className="bg-amber-500">En cours</Badge>;
            case 'fixed': return <Badge className="bg-green-500">Corrigé</Badge>;
            case 'closed': return <Badge className="bg-slate-500">Fermé</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const handleUpdateStatus = async (bugId, newStatus) => {
        try {
            setActionLoading(bugId);

            // Get bug data before update if we need to send notification
            const bugRef = ref(db, `bugReports/${bugId}`);
            let bugData = null;
            if (newStatus === 'fixed') {
                const snapshot = await get(bugRef);
                if (snapshot.exists()) {
                    bugData = snapshot.val();
                }
            }

            await update(bugRef, {
                status: newStatus,
                updatedAt: Date.now()
            });

            // Send notifications if bug is fixed
            if (newStatus === 'fixed' && bugData) {
                // 1. In-App Notification
                if (bugData.userId) {
                    await sendPrivateNotification(bugData.userId, {
                        type: NOTIF_TYPES.SYSTEM,
                        title: 'Bug résolu !',
                        message: `Le problème que vous avez signalé ("${bugData.title}") a été corrigé. Merci de votre aide !`,
                        icon: 'check-circle',
                        action: `/report-bug` // Or a detail page if one exists
                    });
                }

                // 2. Email Notification
                if (bugData.email) {
                    try {
                        const emailHtml = bugResolvedEmail(
                            bugData.reporterName || 'Cher utilisateur',
                            bugData.title,
                            bugData.referenceId
                        );

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: bugData.email,
                                subject: `Bug Résolu : ${bugData.title}`,
                                html: emailHtml
                            })
                        });
                    } catch (emailError) {
                        console.error('Failed to send resolution email:', emailError);
                    }
                }
            }

            if (selectedBug && selectedBug.id === bugId) {
                setSelectedBug(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating bug status:', error);
            alert('Erreur lors de la mise à jour du statut.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteBug = async (bugId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport de bug ?')) return;

        try {
            setActionLoading(bugId);
            await remove(ref(db, `bugReports/${bugId}`));
            setIsDetailOpen(false);
        } catch (error) {
            console.error('Error deleting bug report:', error);
            alert('Erreur lors de la suppression du rapport.');
        } finally {
            setActionLoading(null);
        }
    };

    const sortedReports = [...reports].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Rapports de Bugs</h1>
                    <p className="text-muted-foreground">Gestion des problèmes techniques signalés par les utilisateurs.</p>
                </div>
            </div>

            {sortedReports.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Aucun bug signalé</h3>
                    <p className="text-muted-foreground text-sm">Tout semble fonctionner correctement !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {sortedReports.map((bug) => (
                        <Card key={bug.id} className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => {
                            setSelectedBug(bug);
                            setIsDetailOpen(true);
                        }}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl shrink-0 ${getSeverityColor(bug.severity)}`}>
                                            <Bug className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-lg leading-none">{bug.title}</h4>
                                                {getStatusBadge(bug.status)}
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getSeverityColor(bug.severity)}`}>
                                                    {bug.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-1">{bug.description}</p>
                                            <div className="flex items-center gap-4 pt-1">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(bug.timestamp).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono uppercase">
                                                    <Shield className="w-3 h-3" />
                                                    {bug.referenceId}
                                                </span>
                                                {bug.attachments?.length > 0 && (
                                                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        {bug.attachments.length} attachment(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary">
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Bug Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                    {selectedBug && (
                        <div className="space-y-0">
                            <div className={`p-8 ${getSeverityColor(selectedBug.severity)} rounded-t-3xl`}>
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-current border-none backdrop-blur-md">
                                        ID: {selectedBug.referenceId}
                                    </Badge>
                                    {getStatusBadge(selectedBug.status)}
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-2">{selectedBug.title}</h2>
                                <div className="flex flex-wrap gap-4 text-sm font-medium opacity-80">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(selectedBug.timestamp).toLocaleString()}
                                    </div>
                                    {selectedBug.email && (
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-4 h-4" />
                                            {selectedBug.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <section className="space-y-2">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Description
                                            </h3>
                                            <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedBug.description}
                                            </p>
                                        </section>

                                        <section className="space-y-2">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Bug className="w-3.5 h-3.5" />
                                                Étapes à reproduire
                                            </h3>
                                            <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedBug.stepsToReproduce}
                                            </p>
                                        </section>
                                    </div>

                                    <div className="space-y-6">
                                        <section className="space-y-2">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Monitor className="w-3.5 h-3.5" />
                                                Environnement
                                            </h3>
                                            <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                                                <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                                                    <span className="text-slate-500">OS</span>
                                                    <span className="font-bold">{selectedBug.os || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                                                    <span className="text-slate-500">Navigateur</span>
                                                    <span className="font-bold">{selectedBug.browser || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                                                    <span className="text-slate-500">Appareil</span>
                                                    <span className="font-bold">{selectedBug.deviceType || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Version</span>
                                                    <Badge variant="outline" className="font-bold bg-white">{selectedBug.appVersion || 'Unknown'}</Badge>
                                                </div>
                                            </div>
                                        </section>

                                        {selectedBug.attachments?.length > 0 && (
                                            <section className="space-y-2">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pièces Jointes</h3>
                                                <div className="space-y-2">
                                                    {selectedBug.attachments.map((file, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white">
                                                                    <Eye className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                                                </div>
                                                                <span className="text-xs font-bold truncate">{file.name}</span>
                                                            </div>
                                                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-primary" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl h-10 px-4 font-bold border-slate-200"
                                            onClick={() => handleUpdateStatus(selectedBug.id, 'in-progress')}
                                            disabled={actionLoading === selectedBug.id || selectedBug.status === 'in-progress'}
                                        >
                                            {actionLoading === selectedBug.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                                            Marquer En Cours
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl h-10 px-4 font-bold border-green-200 text-green-600 hover:bg-green-50"
                                            onClick={() => handleUpdateStatus(selectedBug.id, 'fixed')}
                                            disabled={actionLoading === selectedBug.id || selectedBug.status === 'fixed'}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Marquer Fixé
                                        </Button>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="rounded-xl h-10 px-4 font-bold"
                                        onClick={() => handleDeleteBug(selectedBug.id)}
                                        disabled={actionLoading === selectedBug.id}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
