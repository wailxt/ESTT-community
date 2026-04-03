'use client';

import { useState, useMemo } from 'react';
import { 
    Megaphone, 
    Send, 
    Users, 
    Mail, 
    GraduationCap, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Eye,
    Plus,
    X,
    Upload
} from 'lucide-react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDialog } from '@/context/DialogContext';
import { uploadToImgBB } from '@/lib/uploadUtils';
import { db as staticDb } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function AdminCommunication({ users }) {
    const { showConfirm, showError, showSuccess } = useDialog();

    // -- State --
    const [emailData, setEmailData] = useState({
        subject: '',
        title: '',
        content: '',
        ctaLabel: '',
        ctaLink: '',
        coverImageUrl: ''
    });
    const [targetType, setTargetType] = useState('all');
    const [targetFiliere, setTargetFiliere] = useState('');
    const [targetEmail, setTargetEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
    const [uploadingImage, setUploadingImage] = useState(false);

    // -- Derived --
    const recipients = useMemo(() => {
        if (targetType === 'all') return users.map(u => u.email).filter(Boolean);
        if (targetType === 'filiere') return users.filter(u => u.filiere === targetFiliere).map(u => u.email).filter(Boolean);
        if (targetType === 'external') return targetEmail ? [targetEmail] : [];
        return [];
    }, [users, targetType, targetFiliere, targetEmail]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const url = await uploadToImgBB(file);
            setEmailData(prev => ({ ...prev, coverImageUrl: url }));
            showSuccess("Image prête !");
        } catch (error) {
            showError("Erreur upload.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSend = async () => {
        if (!emailData.subject || !emailData.title || !emailData.content) {
            showError("Remplissez les champs obligatoires.");
            return;
        }
        const confirm = await showConfirm(`Envoyer à ${recipients.length} personnes ?`, { type: 'info' });
        if (!confirm) return;

        setIsSending(true);
        setSendingProgress({ current: 0, total: recipients.length });

        try {
            const { globalAnnouncementEmail } = await import('@/lib/email-templates/global-announcement');
            const emailHtml = globalAnnouncementEmail(
                emailData.title,
                emailData.content,
                emailData.ctaLabel,
                emailData.ctaLink,
                emailData.coverImageUrl
            );

            for (let i = 0; i < recipients.length; i++) {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: recipients[i], subject: emailData.subject, html: emailHtml })
                });
                setSendingProgress(prev => ({ ...prev, current: i + 1 }));
            }
            showSuccess("Emails envoyés !");
            setEmailData({ subject: '', title: '', content: '', ctaLabel: '', ctaLink: '', coverImageUrl: '' });
        } catch (error) {
            showError("Erreur d'envoi.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Communication</h1>
                    <p className="text-muted-foreground">Envoyez des annonces par email à la communauté.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">Nouvel Email</CardTitle>
                        <CardDescription>Configurez votre message et ciblez vos utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Target Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cible ({recipients.length})</label>
                            <Select value={targetType} onValueChange={setTargetType}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous ({users.length})</SelectItem>
                                    <SelectItem value="filiere">Par filière</SelectItem>
                                    <SelectItem value="external">Email unique</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {targetType === 'filiere' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filière</label>
                                <Select value={targetFiliere} onValueChange={setTargetFiliere}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staticDb.fields.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {targetType === 'external' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email spécifique</label>
                                <Input value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="email@exemple.com" />
                            </div>
                        )}

                        <hr className="my-4 border-slate-100" />

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sujet</label>
                            <Input value={emailData.subject} onChange={e => setEmailData(p => ({ ...p, subject: e.target.value }))} placeholder="Sujet de l'email" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre Header</label>
                            <Input value={emailData.title} onChange={e => setEmailData(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'annonce" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contenu</label>
                            <Textarea 
                                rows={6}
                                value={emailData.content} 
                                onChange={e => setEmailData(p => ({ ...p, content: e.target.value }))} 
                                placeholder="Message..." 
                                className="resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Bouton Label</label>
                                <Input value={emailData.ctaLabel} onChange={e => setEmailData(p => ({ ...p, ctaLabel: e.target.value }))} placeholder="Action" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Bouton Lien</label>
                                <Input value={emailData.ctaLink} onChange={e => setEmailData(p => ({ ...p, ctaLink: e.target.value }))} placeholder="https://..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image</label>
                            <div className="flex gap-2">
                                <Input value={emailData.coverImageUrl} onChange={e => setEmailData(p => ({ ...p, coverImageUrl: e.target.value }))} placeholder="URL Image" className="flex-grow" />
                                <Button size="sm" variant="outline" className="shrink-0" onClick={() => document.getElementById('img-up').click()} disabled={uploadingImage}>
                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </Button>
                                <input type="file" id="img-up" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                        </div>

                        <Button className="w-full gap-2 mt-4" size="lg" disabled={isSending || recipients.length === 0} onClick={handleSend}>
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isSending ? `Envoi ${sendingProgress.current}/${sendingProgress.total}` : "Envoyer l'Annonce"}
                        </Button>

                        {isSending && <Progress value={(sendingProgress.current / sendingProgress.total) * 100} className="h-1 mt-2" />}
                    </CardContent>
                </Card>

                {/* Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Aperçu de l'email
                    </h3>
                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                        {/* Mock Email Header */}
                        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <span>ESTT.Community Announcement</span>
                            <Badge variant="outline" className="text-[8px] tracking-tighter opacity-50">Email Preview</Badge>
                        </div>
                        
                        <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
                            {emailData.coverImageUrl && (
                                <img src={emailData.coverImageUrl} alt="" className="w-full h-auto rounded-lg shadow-sm max-h-[300px] object-cover" />
                            )}
                            
                            <h2 className="text-3xl font-black text-slate-900 leading-tight">
                                {emailData.title || "Titre de l'email"}
                            </h2>

                            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {emailData.content || "Le contenu apparaîtra ici..."}
                            </div>

                            {emailData.ctaLabel && (
                                <div className="py-4">
                                    <div className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                                        {emailData.ctaLabel}
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-slate-100 text-sm">
                                <p className="text-slate-500 italic mb-1">Cordialement,</p>
                                <p className="font-bold text-slate-900">L'équipe ESTT-Community</p>
                            </div>
                        </div>
                        
                        {/* Mock Email Footer */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-50 text-center">
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ESTT.Community - Plateforme Étudiante</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
