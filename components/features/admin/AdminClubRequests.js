import { useState } from 'react';
import { db, ref, update } from '@/lib/firebase';
import { useDialog } from '@/context/DialogContext';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import RejectionDialog from './RejectionDialog';

export default function AdminClubRequests({ requests }) {
    const { showSuccess, showError, showWarning, showConfirm } = useDialog();
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [itemToReject, setItemToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const handleApproveClubRequest = async (requestId) => {
        const confirmed = await showConfirm("Approuver cette demande de club ?", {
            type: 'info',
            title: 'Approuver',
            confirmLabel: 'Approuver'
        });
        if (!confirmed) return;

        try {
            const { createClubFromRequest } = await import('@/lib/clubUtils');
            await createClubFromRequest(requestId);
            showSuccess("Club créé avec succès !");
        } catch (err) {
            console.error(err);
            showError("Erreur lors de la création du club.");
        }
    };

    const handleRejectClubRequest = (request) => {
        setItemToReject(request);
        setRejectionReason('');
        setRejectionModalOpen(true);
    };

    const confirmRejection = async () => {
        if (!itemToReject) return;
        setRejecting(true);

        const request = itemToReject;
        const reason = rejectionReason;

        try {
            await update(ref(db, `clubRequests/${request.id}`), {
                status: 'rejected',
                rejectedAt: Date.now(),
                rejectionReason: reason
            });

            // Send Rejection Email (Background)
            if (request && request.requestedBy) {
                (async () => {
                    try {
                        const { clubRequestRejectedEmail } = await import('@/lib/email-templates');
                        const html = clubRequestRejectedEmail(request.clubName, reason);

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: request.requestedBy,
                                subject: `Mise à jour demande de club : ${request.clubName}`,
                                html: html
                            })
                        });
                    } catch (emailErr) {
                        console.error("Failed to send rejection email:", emailErr);
                    }
                })();
            }
        } catch (err) {
            console.error(err);
            showError("Erreur lors du rejet.");
        } finally {
            setRejecting(false);
            setRejectionModalOpen(false);
            setItemToReject(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Demandes de clubs</h1>
                    <p className="text-muted-foreground">Approuvez ou rejetez les demandes de création de clubs.</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Aucune demande en attente</h3>
                    <p className="text-muted-foreground text-sm">Toutes les demandes ont été traitées.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((request) => (
                        <Card key={request.id} className="border-none shadow-sm">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{request.clubName}</CardTitle>
                                        <CardDescription className="mt-2">
                                            Demandé par {request.requestedBy} • {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] font-black uppercase">En attente</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-bold mb-1">Description</p>
                                    <p className="text-sm text-muted-foreground">{request.description}</p>
                                </div>

                                {request.logoUrl && (
                                    <div>
                                        <p className="text-sm font-bold mb-2">Logo</p>
                                        <img src={request.logoUrl} alt="Club logo" className="w-20 h-20 rounded-lg object-cover border" />
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-bold mb-2">Organigramme ({Object.keys(request.organizationalChart || {}).length} positions)</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(request.organizationalChart || {}).map(([key, member]) => (
                                            <div key={key} className="p-3 bg-slate-50 rounded-lg border">
                                                <p className="text-xs font-bold">{member.role}</p>
                                                <p className="text-xs text-muted-foreground">{member.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{member.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {request.members && request.members.length > 0 && (
                                    <div>
                                        <p className="text-sm font-bold mb-2">Membres ({request.members.length})</p>
                                        <p className="text-xs text-muted-foreground">
                                            {request.members.map(m => m.name).join(', ')}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleApproveClubRequest(request.id)}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approuver
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleRejectClubRequest(request)}>Refuser</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <RejectionDialog
                open={rejectionModalOpen}
                onOpenChange={setRejectionModalOpen}
                onConfirm={confirmRejection}
                isSubmitting={rejecting}
                reason={rejectionReason}
                setReason={setRejectionReason}
            />
        </div>
    );
}
