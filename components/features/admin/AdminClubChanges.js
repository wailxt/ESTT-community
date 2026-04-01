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
import { CheckCircle2, Trash2 } from 'lucide-react';

export default function AdminClubChanges({ requests }) {
    const { showSuccess, showError, showConfirm } = useDialog();

    const handleApproveChangeRequest = async (request) => {
        const confirmed = await showConfirm("Approuver cette modification ?", {
            type: 'info',
            title: 'Approuver',
            confirmLabel: 'Approuver'
        });
        if (!confirmed) return;

        try {
            const clubRef = ref(db, `clubs/${request.clubId}`);

            if (request.changeType === 'name') {
                await update(clubRef, { name: request.newData.name });
            } else if (request.changeType === 'organizationalChart') {
                await update(clubRef, { organizationalChart: request.newData });
            }

            await update(ref(db, `clubChangeRequests/${request.id}`), {
                status: 'approved',
                approvedAt: Date.now()
            });

            showSuccess("Modification approuvée !");
        } catch (err) {
            console.error(err);
            showError("Erreur lors de l'approbation.");
        }
    };

    const handleRejectChangeRequest = async (requestId) => {
        const confirmed = await showConfirm("Rejeter cette demande de modification ?", {
            type: 'danger',
            title: 'Rejeter',
            confirmLabel: 'Rejeter'
        });
        if (!confirmed) return;

        try {
            await update(ref(db, `clubChangeRequests/${requestId}`), {
                status: 'rejected',
                rejectedAt: Date.now()
            });
            showSuccess("Demande rejetée.");
        } catch (err) {
            console.error(err);
            showError("Erreur lors du rejet.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Demandes de modification</h1>
                    <p className="text-muted-foreground">Gérez les demandes de modification des clubs.</p>
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
                                    <Badge variant="outline" className="text-[8px] font-black uppercase">
                                        {request.changeType === 'name' ? 'Changement de nom' : 'Organigramme'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {request.changeType === 'name' && (
                                    <div>
                                        <p className="text-sm font-bold mb-1">Nouveau nom proposé</p>
                                        <p className="text-lg font-bold text-primary">{request.newData?.name}</p>
                                    </div>
                                )}

                                {request.changeType === 'organizationalChart' && (
                                    <div>
                                        <p className="text-sm font-bold mb-2">Nouvel organigramme</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Contactez l'administrateur du club pour plus de détails
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleApproveChangeRequest(request)}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approuver
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 text-destructive border-destructive/20"
                                        onClick={() => handleRejectChangeRequest(request.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Rejeter
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
