import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logModeratorAction } from '@/lib/moderator-logs';
import { useDialog } from '@/context/DialogContext';
import { db, ref, update, remove, get, push, set } from '@/lib/firebase';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle2, Eye, Trash2, Edit2, Loader2, Link2, Star, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import RejectionDialog from './RejectionDialog';
import { sendPrivateNotification, NOTIF_TYPES } from '@/lib/notifications';
import { db as staticDb } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminResources({ resources }) {
    const { user } = useAuth();
    const { showSuccess, showError } = useDialog();
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [itemToReject, setItemToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        professor: '',
        docType: ''
    });
    const [saving, setSaving] = useState(false);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [itemToLink, setItemToLink] = useState(null);
    const [selectedFields, setSelectedFields] = useState([]);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [itemToContact, setItemToContact] = useState(null);
    const [contactMessage, setContactMessage] = useState('');
    const [sendingContactEmail, setSendingContactEmail] = useState(false);
    const [contactError, setContactError] = useState('');

    // Ratings state (admin-only view of user feedback)
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [itemToRate, setItemToRate] = useState(null);
    const [currentRatings, setCurrentRatings] = useState([]);

    const filteredResources = resources.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.module?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getResourcePath = (resource) => {
        if (resource._isNested && resource.moduleId) {
            return `resources/${resource.moduleId}/${resource.id}`;
        }
        return `resources/${resource.id}`;
    };

    const openRatingModal = async (resource) => {
        setItemToRate(resource);
        setRatingModalOpen(true);

        try {
            const ratingsRef = ref(db, `resources/${resource.id}/ratings`);
            const snap = await get(ratingsRef);

            if (snap.exists()) {
                const data = snap.val();
                const list = Object.entries(data).map(([userId, value]) => ({
                    userId,
                    ...value,
                }));

                // Sort newest first
                list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
                setCurrentRatings(list);
            } else {
                setCurrentRatings([]);
            }
        } catch (err) {
            console.error('Failed to load ratings', err);
            setCurrentRatings([]);
        }
    };

    const handleApproveResource = async (resource) => {
        try {
            // Determine the path based on the flag we set in the listener
            let path = `resources/${resource.id}`;
            if (resource._isNested && resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }
            await update(ref(db, path), { unverified: null });

            // Sync with user profile if authorId exists
            if (resource.authorId) {
                const profileContribPath = `users/${resource.authorId}/contributions/${resource.id}`;
                await update(ref(db, profileContribPath), { unverified: null });

                // Send Resource Approved Email
                try {
                    // Fetch user email first
                    const userSnap = await get(ref(db, `users/${resource.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceApprovedEmail } = await import('@/lib/email-templates');
                            const resourceUrl = `https://estt-community.vercel.app/resource/${resource.id}`;
                            const html = resourceApprovedEmail(userData.firstName || 'Étudiant', resource.title, resourceUrl);

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Ta ressource est en ligne !',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send resource approval email:", err);
                }

                // Send in-app notification
                await sendPrivateNotification(resource.authorId, {
                    type: NOTIF_TYPES.RESOURCE,
                    title: 'Ressource Approuvée ??',
                    message: `Votre contribution "${resource.title}" a été validée et est maintenant en ligne.`,
                    icon: 'book-open',
                    action: { type: 'navigate', target: `/resource/${resource.id}` }
                });
            }


            showSuccess("Ressource approuvée !");

            // Log the action
            logModeratorAction(user?.uid, 'accept', {
                resourceId: resource.id,
                title: resource.title,
                authorId: resource.authorId
            });

        } catch (err) {
            console.error(err);
            showError("Erreur lors de l'approbation.");
        }
    };

    const handleDeleteResource = (resource) => {
        setItemToReject(resource);
        setRejectionReason('');
        setRejectionModalOpen(true);
    };

    const confirmRejection = async () => {
        if (!itemToReject) return;
        setRejecting(true);

        const resource = itemToReject;
        const reason = rejectionReason;

        try {
            let path = `resources/${resource.id}`;
            if (resource._isNested && resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }

            await remove(ref(db, path));

            // Sync with user profile if authorId exists
            if (resource.authorId) {
                const profileContribPath = `users/${resource.authorId}/contributions/${resource.id}`;
                await remove(ref(db, profileContribPath));

                // Send Resource Rejected Email
                try {
                    // Fetch user email first
                    const userSnap = await get(ref(db, `users/${resource.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceRejectedEmail } = await import('@/lib/email-templates');
                            const html = resourceRejectedEmail(userData.firstName || 'Étudiant', resource.title, reason);

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Mise à jour concernant ta contribution',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send resource rejection email:", err);
                }

                // Send in-app notification
                await sendPrivateNotification(resource.authorId, {
                    type: NOTIF_TYPES.RESOURCE,
                    title: 'Mise à jour contribution',
                    message: `Votre ressource "${resource.title}" n'a pas pu être acceptée. Raison: ${reason}`,
                    icon: 'x-circle',
                    priority: 'high'
                });
            }


            // Cleanup Keywords
            if (resource.field) {
                const keywordPath = `metadata/keywords/${resource.field}/${resource.id}`;
                await remove(ref(db, keywordPath));
            }
            // Log the action
            logModeratorAction(user?.uid, 'deletion', {
                resourceId: resource.id,
                title: resource.title,
                authorId: resource.authorId,
                reason: reason
            });
            // toast success?

        } catch (err) {
            console.error(err);
            showError("Une erreur est survenue lors du rejet.");
        } finally {
            setRejecting(false);
            setRejectionModalOpen(false);
            setItemToReject(null);
        }
    };

    const handleEditResource = (resource) => {
        setItemToEdit(resource);
        setEditData({
            title: resource.title || '',
            description: resource.description || '',
            professor: resource.professor || '',
            docType: resource.docType || ''
        });
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!itemToEdit) return;
        setSaving(true);
        try {
            const changes = [];
            if (editData.title !== itemToEdit.title) changes.push({ label: 'Titre', old: itemToEdit.title || 'Non spécifié', new: editData.title });
            if (editData.description !== itemToEdit.description) changes.push({ label: 'Description', old: itemToEdit.description || 'Non spécifié', new: editData.description });
            if (editData.professor !== itemToEdit.professor) changes.push({ label: 'Professeur', old: itemToEdit.professor || 'Non spécifié', new: editData.professor });
            if (editData.docType !== itemToEdit.docType) changes.push({ label: 'Type de document', old: itemToEdit.docType || 'Non spécifié', new: editData.docType });

            let path = `resources/${itemToEdit.id}`;
            if (itemToEdit._isNested && itemToEdit.moduleId) {
                path = `resources/${itemToEdit.moduleId}/${itemToEdit.id}`;
            }

            await update(ref(db, path), editData);

            // Notify Contributor
            if (itemToEdit.authorId) {
                try {
                    // 1. Send In-App Notification
                    const changeDescription = changes.length > 0
                        ? `Modifications: ${changes.map(c => c.label).join(', ')}.`
                        : '';

                    await sendPrivateNotification(itemToEdit.authorId, {
                        type: NOTIF_TYPES.RESOURCE,
                        title: 'Ressource Mise à Jour ??',
                        message: `Votre contribution "${editData.title}" a été mise à jour par un administrateur. ${changeDescription}`,
                        icon: 'edit-3',
                        action: { type: 'navigate', target: `/resource/${itemToEdit.id}` }
                    });

                    // 2. Send Email Notification
                    const userSnap = await get(ref(db, `users/${itemToEdit.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceUpdatedEmail } = await import('@/lib/email-templates');
                            const resourceUrl = `https://estt-community.vercel.app/resource/${itemToEdit.id}`;
                            const html = resourceUpdatedEmail(
                                userData.firstName || 'Étudiant',
                                editData.title,
                                resourceUrl,
                                changes
                            );

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Ta ressource a été mise à jour',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (notifErr) {
                    console.error("Failed to notify contributor of update:", notifErr);
                }
            }

            // Sync with keywords if field exists
            if (itemToEdit.field) {
                const keywordPath = `metadata/keywords/${itemToEdit.field}/${itemToEdit.id}`;
                await update(ref(db, keywordPath), { title: editData.title });
            }

            // Sync with user profile if authorId exists
            if (itemToEdit.authorId) {
                const profileContribPath = `users/${itemToEdit.authorId}/contributions/${itemToEdit.id}`;
                await update(ref(db, profileContribPath), {
                    title: editData.title
                });
            }

            // Log the action
            logModeratorAction(user?.uid, 'modification', {
                resourceId: itemToEdit.id,
                title: editData.title,
                changes: changes.map(c => ({
                    field: c.label,
                    old: c.old,
                    new: c.new
                }))
            });

            setEditModalOpen(false);

            setItemToEdit(null);
        } catch (err) {
            console.error(err);
            showError("Erreur lors de la mise à jour.");
        } finally {
            setSaving(false);
        }
    };

    const handleLinkResource = (resource) => {
        setItemToLink(resource);
        // Initialize with existing links or empty
        // Structure: [{ fieldId: 'ai', moduleId: 'ai_m1' }, ...]
        const existingLinks = resource.fields || [];
        setSelectedFields(existingLinks);
        setLinkModalOpen(true);
    };

    const handleSaveLinks = async () => {
        if (!itemToLink) return;
        setSaving(true);
        try {
            let path = `resources/${itemToLink.id}`;
            if (itemToLink._isNested && itemToLink.moduleId) {
                path = `resources/${itemToLink.moduleId}/${itemToLink.id}`;
            }

            // 1. Update the resource itself with the new fields structure
            await update(ref(db, path), { fields: selectedFields });

            // 2. Update keywords and module mappings for ALL linked fields
            for (const link of selectedFields) {
                if (!link.fieldId || !link.moduleId) continue;

                // Index by Field for Search
                const keywordRef = ref(db, `metadata/keywords/${link.fieldId}/${itemToLink.id}`);
                await update(keywordRef, { title: itemToLink.title, resourceId: itemToLink.id });

                // Index by Module for Browse
                const moduleMappingRef = ref(db, `module_resources/${link.moduleId}/${itemToLink.id}`);
                await set(moduleMappingRef, true);
            }

            setLinkModalOpen(false);
            setItemToLink(null);
        } catch (err) {
            console.error(err);
            showError("Erreur lors de la liaison des filières.");
        } finally {
            setSaving(false);
        }
    };

    const openContactModal = (resource) => {
        setItemToContact(resource);
        setContactMessage('');
        setContactError('');
        setContactModalOpen(true);
    };

    const handleSendContactEmail = async () => {
        if (!itemToContact) return;

        const trimmedMessage = contactMessage.trim();
        if (!trimmedMessage) {
            setContactError("Ecris un message avant d'envoyer l'email.");
            return;
        }

        if (!itemToContact.authorId) {
            setContactError("Cette ressource n'est pas liee a un contributeur identifiable.");
            return;
        }

        setSendingContactEmail(true);
        setContactError('');

        try {
            const userSnap = await get(ref(db, `users/${itemToContact.authorId}`));
            if (!userSnap.exists()) {
                throw new Error('Impossible de retrouver le contributeur de cette ressource.');
            }

            const userData = userSnap.val();
            if (!userData.email) {
                throw new Error("Aucune adresse email n'est disponible pour ce contributeur.");
            }

            const now = Date.now();
            const authorName = itemToContact.authorName
                || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                || 'Etudiant';

            let threadId = itemToContact.contactThreadId || null;

            if (!threadId) {
                const newThreadRef = push(ref(db, 'resourceContactThreads'));
                threadId = newThreadRef.key;

                await set(newThreadRef, {
                    id: threadId,
                    resourceId: itemToContact.id,
                    resourceTitle: itemToContact.title || 'Ressource',
                    resourceModule: itemToContact.fullModuleName || itemToContact.module || '',
                    resourceStatus: itemToContact.unverified ? 'pending' : 'accepted',
                    authorId: itemToContact.authorId,
                    authorName,
                    authorEmail: userData.email,
                    status: 'awaiting_user',
                    lastSender: 'admin',
                    createdAt: now,
                    updatedAt: now,
                    lastMessagePreview: trimmedMessage.slice(0, 180),
                });
            } else {
                await update(ref(db, `resourceContactThreads/${threadId}`), {
                    resourceTitle: itemToContact.title || 'Ressource',
                    resourceModule: itemToContact.fullModuleName || itemToContact.module || '',
                    resourceStatus: itemToContact.unverified ? 'pending' : 'accepted',
                    authorId: itemToContact.authorId,
                    authorName,
                    authorEmail: userData.email,
                    status: 'awaiting_user',
                    lastSender: 'admin',
                    updatedAt: now,
                    lastMessagePreview: trimmedMessage.slice(0, 180),
                });
            }

            const newMessageRef = push(ref(db, `resourceContactThreads/${threadId}/messages`));
            await set(newMessageRef, {
                id: newMessageRef.key,
                senderType: 'admin',
                senderName: 'Administration ESTT Community',
                body: trimmedMessage,
                createdAt: now,
            });

            await update(ref(db, getResourcePath(itemToContact)), {
                contactThreadId: threadId,
                contactThreadUpdatedAt: now,
                lastAdminContactAt: now,
            });

            await update(ref(db, `users/${itemToContact.authorId}/contributions/${itemToContact.id}`), {
                contactThreadId: threadId,
                contactThreadUpdatedAt: now,
            });

            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://estt-community.vercel.app';
            const replyUrl = `${baseUrl}/resource-contact/${threadId}`;

            const { resourceContactRequestEmail } = await import('@/lib/email-templates');
            const html = resourceContactRequestEmail(
                userData.firstName || 'Etudiant',
                itemToContact.title || 'Ressource',
                trimmedMessage,
                replyUrl,
                itemToContact.unverified ? 'en attente de validation' : 'deja acceptee'
            );

            // Log the action
            logModeratorAction(user?.uid, 'contact', {
                resourceId: itemToContact.id,
                title: itemToContact.title,
                authorId: itemToContact.authorId,
                roomId: threadId
            });

            await fetch('/api/send-email', {

                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userData.email,
                    subject: `Question concernant ta ressource : ${itemToContact.title || 'Ressource'}`,
                    html
                })
            });

            await sendPrivateNotification(itemToContact.authorId, {
                type: NOTIF_TYPES.RESOURCE,
                title: 'Question sur ta ressource',
                message: `Un administrateur t'a envoye une question a propos de "${itemToContact.title}".`,
                icon: 'mail',
                priority: 'high',
                action: { type: 'navigate', target: `/resource-contact/${threadId}` }
            });

            setContactModalOpen(false);
            setItemToContact(null);
            setContactMessage('');
        } catch (err) {
            console.error(err);
            setContactError(err.message || "Impossible d'envoyer l'email de contact.");
        } finally {
            setSendingContactEmail(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Gestion des Ressources</h1>
                    <p className="text-muted-foreground">Approuvez, modifiez ou supprimez les ressources partagées.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        className="pl-9 h-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Titre</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Module</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Type</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Auteur</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Note</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResources.map((res) => (
                            <TableRow key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-bold text-sm">{res.title}</TableCell>
                                <TableCell className="text-xs text-muted-foreground font-medium uppercase">{res.module}</TableCell>
                                <TableCell>
                                    {res.docType && <Badge variant="secondary" className="text-[9px] font-bold">{res.docType}</Badge>}
                                </TableCell>
                                <TableCell className="text-xs font-bold">{res.authorName || 'Anonyme'}</TableCell>
                                <TableCell>
                                    {(() => {
                                        const average = res.ratingAverage;
                                        const count = res.ratingCount || 0;
                                        if (!average || count === 0) {
                                            return <span className="text-[10px] text-muted-foreground">Aucune note</span>;
                                        }
                                        const rounded = Math.round(average * 10) / 10;
                                        return (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= Math.round(average) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {rounded.toFixed(1)} / 5 · {count} avis
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>
                                    {res.unverified ? (
                                        <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter">En attente</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter text-green-600 border-green-100">Vérifié</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {res.unverified && (
                                            <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-100 hover:bg-green-50" onClick={() => handleApproveResource(res)}>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-primary border-primary/10 hover:bg-primary/5" onClick={() => handleEditResource(res)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-primary border-primary/10 hover:bg-primary/5" onClick={() => handleLinkResource(res)} title="Lier à d'autres filières">
                                            <Link2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2 text-sky-600 border-sky-100 hover:bg-sky-50"
                                            onClick={() => openContactModal(res)}
                                            title="Contacter le contributeur"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </Button>
                                        {res.contactThreadId && (
                                            <Button size="sm" variant="outline" className="h-8 px-2" asChild title="Ouvrir la room">
                                                <Link href={`/resource-contact/${res.contactThreadId}`} target="_blank">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2 text-amber-600 border-amber-100 hover:bg-amber-50"
                                            onClick={() => openRatingModal(res)}
                                            title="Voir les avis des étudiants"
                                        >
                                            <Star className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2" asChild>
                                            <a href={res.url || res.link || res.file} target="_blank"><Eye className="w-4 h-4" /></a>
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-destructive border-destructive/10 hover:bg-destructive/5" onClick={() => handleDeleteResource(res)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <RejectionDialog
                open={rejectionModalOpen}
                onOpenChange={setRejectionModalOpen}
                onConfirm={confirmRejection}
                isSubmitting={rejecting}
                reason={rejectionReason}
                setReason={setRejectionReason}
            />

            {/* Rating Modal (admin-only, shows user feedback) */}
            <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Notation de la ressource</DialogTitle>
                        <DialogDescription>
                            Attribuez une note (1 à 5 étoiles) et laissez un avis interne visible uniquement par les administrateurs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {itemToRate && (
                            <div className="rounded-lg border bg-slate-50 px-4 py-3">
                                <p className="text-sm font-semibold">{itemToRate.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {itemToRate.module} {itemToRate.docType ? `· ${itemToRate.docType}` : ''}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                    Avis des étudiants (privé)
                                </p>
                            </div>
                            {currentRatings.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Aucun avis enregistré pour cette ressource.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {currentRatings.map((r) => (
                                        <div
                                            key={`${r.userId}-${r.updatedAt || r.createdAt || ''}`}
                                            className="border rounded-lg px-3 py-2 bg-slate-50"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold">
                                                        {r.userName || r.adminName || 'Utilisateur'}
                                                    </span>
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((value) => (
                                                            <Star
                                                                key={value}
                                                                className={`w-3 h-3 ${value <= (r.rating || 0)
                                                                    ? 'text-yellow-500 fill-yellow-500'
                                                                    : 'text-slate-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {r.updatedAt && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(r.updatedAt).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                            </div>
                                            {r.review && (
                                                <p className="text-xs text-slate-700 whitespace-pre-wrap">
                                                    {r.review}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRatingModalOpen(false)}
                        >
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Modifier la ressource</DialogTitle>
                        <DialogDescription>
                            Mettez à jour les informations de la ressource.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Titre</Label>
                            <Input
                                id="title"
                                value={editData.title}
                                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="professor">Professeur</Label>
                            <Input
                                id="professor"
                                value={editData.professor}
                                onChange={(e) => setEditData(prev => ({ ...prev, professor: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="docType">Type de document</Label>
                            <Select
                                value={editData.docType}
                                onValueChange={(v) => setEditData(prev => ({ ...prev, docType: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cours">Cours</SelectItem>
                                    <SelectItem value="TD">TD</SelectItem>
                                    <SelectItem value="TP">TP</SelectItem>
                                    <SelectItem value="Exam">Examen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={editData.description}
                                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving}>
                            Annuler
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Link Modal */}
            <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Lier à d'autres filières</DialogTitle>
                        <DialogDescription>
                            Sélectionnez toutes les filières où cette ressource doit apparaître.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-3">
                            {staticDb.fields.map((field) => {
                                const isSelected = selectedFields.some(f => f.fieldId === field.id);
                                const currentModuleId = selectedFields.find(f => f.fieldId === field.id)?.moduleId || '';

                                // Get modules for this field and the resource's semester
                                const fieldModules = itemToLink?.semester
                                    ? staticDb.modules[`${field.id}-${itemToLink.semester}`] || []
                                    : [];

                                return (
                                    <div key={field.id} className="space-y-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`field-${field.id}`}
                                                checked={isSelected || field.id === itemToLink?.field}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedFields(prev => [...prev, { fieldId: field.id, moduleId: '' }]);
                                                    } else {
                                                        setSelectedFields(prev => prev.filter(f => f.fieldId !== field.id));
                                                    }
                                                }}
                                                disabled={field.id === itemToLink?.field}
                                            />
                                            <label
                                                htmlFor={`field-${field.id}`}
                                                className="text-sm font-bold leading-none cursor-pointer flex-grow"
                                            >
                                                {field.name}
                                                {field.id === itemToLink?.field && <span className="ml-2 text-[10px] text-primary italic">(Source)</span>}
                                            </label>
                                        </div>

                                        {isSelected && (
                                            <div className="pl-6 animate-in slide-in-from-top-2 duration-200">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Module Équivalent ({itemToLink?.semester})</Label>
                                                <Select
                                                    value={currentModuleId}
                                                    onValueChange={(val) => {
                                                        setSelectedFields(prev => prev.map(f =>
                                                            f.fieldId === field.id ? { ...f, moduleId: val } : f
                                                        ));
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-xs bg-white">
                                                        <SelectValue placeholder="Choisir le module" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {fieldModules.map(m => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkModalOpen(false)} disabled={saving}>
                            Annuler
                        </Button>
                        <Button onClick={handleSaveLinks} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enregistrer les liaisons
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Contacter le contributeur</DialogTitle>
                        <DialogDescription>
                            Ecris ton message. Une room sera creee automatiquement et un lien de reponse sera envoye par email au contributeur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {itemToContact && (
                            <div className="rounded-xl border bg-slate-50 p-4">
                                <p className="font-semibold text-slate-900">{itemToContact.title}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {itemToContact.fullModuleName || itemToContact.module || 'Module non specifie'}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                    Statut: {itemToContact.unverified ? 'En attente de validation' : 'Acceptee'}
                                </p>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="contact-message">Message admin</Label>
                            <Textarea
                                id="contact-message"
                                rows={6}
                                placeholder="Explique clairement ce que tu souhaites demander."
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                            />
                        </div>

                        {contactError && (
                            <p className="text-sm text-destructive">{contactError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setContactModalOpen(false)} disabled={sendingContactEmail}>
                            Annuler
                        </Button>
                        <Button onClick={handleSendContactEmail} disabled={sendingContactEmail}>
                            {sendingContactEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                            Envoyer l'email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
