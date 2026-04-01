import { useState } from 'react';
import { db, ref, remove } from '@/lib/firebase';
import { useDialog } from '@/context/DialogContext';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { reportDismissedEmail, reportDeletedEmail } from '@/lib/email-templates';

export default function AdminReports({ reports }) {
    const { showError, showSuccess, showConfirm } = useDialog();
    const [actionLoading, setActionLoading] = useState(null);

    const handleDismissReport = async (report) => {
        try {
            setActionLoading(report.id);
            await remove(ref(db, `reports/${report.id}`));

            // Attempt to send email notification
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: report.reporterName?.includes('@') ? report.reporterName : 'estt.community@gmail.com', // Fallback to admin if email not directly in name
                    subject: 'Mise à jour de votre signalement',
                    html: reportDismissedEmail(report.reporterName, report.resourceTitle)
                })
            }).catch(e => console.error("Email send failed:", e));

        } catch (error) {
            console.error('Error dismissing report:', error);
            showError('Erreur lors de la suppression du signalement.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteResource = async (report) => {
        const confirmed = await showConfirm('Êtes-vous sûr de vouloir supprimer définitivement cette ressource et ce signalement ?', {
            type: 'danger',
            title: 'Supprimer définitivement',
            confirmLabel: 'Supprimer'
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(report.id);
            // Delete the resource
            await remove(ref(db, `resources/${report.resourceId}`));
            // Delete the report
            await remove(ref(db, `reports/${report.id}`));

            // Attempt to send email notification
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: report.reporterName?.includes('@') ? report.reporterName : 'estt.community@gmail.com', // Fallback to admin
                    subject: 'Traitement de votre signalement',
                    html: reportDeletedEmail(report.reporterName, report.resourceTitle)
                })
            }).catch(e => console.error("Email send failed:", e));

            showSuccess('Ressource et signalement supprimés avec succès.');
        } catch (error) {
            console.error('Error deleting resource:', error);
            showError('Erreur lors de la suppression de la ressource.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Signalements</h1>
                    <p className="text-muted-foreground">Contenu signalé par les utilisateurs.</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Aucun signalement</h3>
                    <p className="text-muted-foreground text-sm">Tout semble en ordre pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reports.map((report) => (
                        <Card key={report.id} className="border-none shadow-sm">
                            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0 mt-1 md:mt-0">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base mb-1">
                                            Ressource: {report.resourceTitle || 'Titre inconnu'}
                                        </h4>
                                        <p className="font-medium text-sm text-destructive mb-1">Raison: {report.reason}</p>
                                        <p className="text-xs text-muted-foreground">Signalé par {report.reporterName} • {new Date(report.timestamp).toLocaleDateString()}</p>
                                        <div className="mt-3">
                                            <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                                                <Link href={`/resource/${report.resourceId}`} target="_blank">
                                                    Voir la ressource <ExternalLink className="w-3 h-3 ml-1" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap md:flex-nowrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDismissReport(report)}
                                        disabled={actionLoading === report.id}
                                    >
                                        {actionLoading === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ignorer'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteResource(report)}
                                        disabled={actionLoading === report.id}
                                    >
                                        {actionLoading === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer la ressource'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
