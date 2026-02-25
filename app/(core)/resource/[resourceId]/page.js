'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get, set, push } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Video, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink, User, Share2, GraduationCap, Play, MessageCircle, Send, X, Flag, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

export default function ResourcePage() {
    const params = useParams();
    const { resourceId } = params;
    const { user, profile } = useAuth();

    const [resource, setResource] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Reporting state
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportReason, setReportReason] = useState('spam');
    const [reportDetails, setReportDetails] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    useEffect(() => {
        if (resourceId) {
            fetchResource();
            fetchComments();
        }
    }, [resourceId]);

    const fetchResource = async () => {
        try {
            const resourceRef = ref(db, `resources/${resourceId}`);
            const snapshot = await get(resourceRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                // Check if verified - admins might view unverified via this link too, but general public shouldn't?
                // For now, we'll display it, assuming the link is shared only when approved or by admin.
                setResource({ id: resourceId, ...data });
            } else {
                setError('Ressource introuvable');
            }
        } catch (err) {
            console.error(err);
            setError('Erreur lors du chargement de la ressource');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const commentsRef = ref(db, `resources/${resourceId}/comments`);
            const snapshot = await get(commentsRef);

            if (snapshot.exists()) {
                const commentsData = snapshot.val();
                const commentsList = [];

                // Convert comments object to array and organize with replies
                Object.entries(commentsData).forEach(([id, comment]) => {
                    commentsList.push({ id, ...comment });
                });

                // Sort by timestamp (newest first)
                commentsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                setComments(commentsList);
            } else {
                setComments([]);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            setComments([]);
        }
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-12 h-12 text-primary" />;
            case 'video': return <Video className="w-12 h-12 text-primary" />;
            case 'image': return <ImageIcon className="w-12 h-12 text-primary" />;
            case 'link': return <LinkIcon className="w-12 h-12 text-primary" />;
            default: return <FileText className="w-12 h-12 text-primary" />;
        }
    };

    const ensureProtocol = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        // Handle playlist
        const playlistMatch = url.match(/[?&]list=([^#\&\?]+)/);
        if (playlistMatch && playlistMatch[1]) {
            return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
        }

        // Handle video
        const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (videoMatch && videoMatch[1]) {
            return `https://www.youtube.com/embed/${videoMatch[1]}`;
        }

        return null;
    };

    const getGoogleWorkspaceEmbedUrl = (url) => {
        if (!url) return null;

        // Match general Google Docs/Sheets/Slides/Forms formats
        // Typically: https://docs.google.com/document/d/FILE_ID/edit
        // We want to replace /edit, /view, etc. with /preview
        const googleDocsRegex = /(https:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation|forms)\/d\/[a-zA-Z0-9-_]+)\/(?:edit|view|copy)?(.*)?/i;

        const match = url.match(googleDocsRegex);
        if (match && match[1]) {
            return `${match[1]}/preview`;
        }

        // Handle drive folder/file sharing links (some can be previewed)
        const driveRegex = /(https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+)\/(?:edit|view)?(.*)?/i;
        const driveMatch = url.match(driveRegex);
        if (driveMatch && driveMatch[1]) {
            return `${driveMatch[1]}/preview`;
        }

        return null;
    };

    const isPdfUrl = (url) => {
        if (!url) return false;
        // Check if URL contains .pdf (ignoring query params)
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.toLowerCase().endsWith('.pdf');
        } catch (e) {
            return url.toLowerCase().includes('.pdf');
        }
    };

    const getFieldName = (fieldCode) => {
        return fieldCode?.toUpperCase() || 'N/A';
    };

    const formatCommentDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins}m`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    const getParentComments = () => {
        return comments.filter(comment => !comment.isReply);
    };

    const getReplies = (parentId) => {
        return comments.filter(comment => comment.parentId === parentId);
    };

    const handleAddComment = async () => {
        if (!user) {
            alert('Veuillez vous connecter pour commenter');
            return;
        }

        if (!commentText.trim()) {
            alert('Le commentaire ne peut pas être vide');
            return;
        }

        try {
            setSubmitting(true);
            const commentsRef = ref(db, `resources/${resourceId}/comments`);
            const newCommentRef = push(commentsRef);

            await set(newCommentRef, {
                text: commentText,
                authorId: user.uid,
                authorName: profile?.displayName || user.email || 'Anonyme',
                timestamp: Date.now(),
                isReply: false
            });

            setCommentText('');
            // Optionally refresh comments
            fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
            alert('Erreur lors de la publication du commentaire');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddReply = async (parentId) => {
        if (!user) {
            alert('Veuillez vous connecter pour répondre');
            return;
        }

        const replyText = replyTexts[parentId];
        if (!replyText?.trim()) {
            alert('La réponse ne peut pas être vide');
            return;
        }

        try {
            setSubmitting(true);
            const commentsRef = ref(db, `resources/${resourceId}/comments`);
            const newReplyRef = push(commentsRef);

            await set(newReplyRef, {
                text: replyText,
                authorId: user.uid,
                authorName: profile?.displayName || user.email || 'Anonyme',
                timestamp: Date.now(),
                isReply: true,
                parentId: parentId
            });

            setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
            setExpandedReplies(prev => ({ ...prev, [parentId]: false }));
            // Optionally refresh comments
            fetchComments();
        } catch (err) {
            console.error('Error posting reply:', err);
            alert('Erreur lors de la publication de la réponse');
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papiers !');
        } catch (err) {
            console.error('Failed to copy link: ', err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                alert('Lien copié dans le presse-papiers !');
            } catch (fallbackErr) {
                console.error('Fallback copy failed', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleReportSubmit = async () => {
        if (!user) {
            alert('Veuillez vous connecter pour signaler une ressource');
            return;
        }

        try {
            setIsSubmittingReport(true);
            const reportsRef = ref(db, 'reports');
            const newReportRef = push(reportsRef);

            let finalReason = reportReason;
            if (reportReason === 'other') {
                finalReason = `Autre: ${reportDetails}`;
            }

            await set(newReportRef, {
                resourceId: resourceId,
                resourceTitle: resource.title,
                reporterId: user.uid,
                reporterName: profile?.displayName || user.email || 'Anonyme',
                reason: finalReason,
                timestamp: Date.now(),
                status: 'pending'
            });

            setIsReportDialogOpen(false);
            setReportReason('spam');
            setReportDetails('');
            alert('Signalement envoyé avec succès. Merci pour votre aide !');
        } catch (err) {
            console.error('Error submitting report:', err);
            alert('Erreur lors de lenvoi du signalement.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-muted-foreground">{error || 'Introuvable'}</p>
                <Button asChild>
                    <Link href="/browse">Parcourir les ressources</Link>
                </Button>
            </div>
        );
    }

    const downloadUrl = ensureProtocol(resource.url || resource.link || resource.file);

    return (
        <main className="min-h-screen bg-slate-50/50 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center w-full">
                    <Button variant="ghost" asChild size="sm">
                        <Link href="/browse">← Retour</Link>
                    </Button>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground hover:text-primary gap-1 sm:gap-2 transition-colors">
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Partager</span>
                        </Button>

                        {user && (
                            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-2 transition-colors">
                                        <Flag className="w-4 h-4" />
                                        <span>Signaler</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="w-5 h-5" />
                                            Signaler cette ressource
                                        </DialogTitle>
                                        <DialogDescription>
                                            Pourquoi signalez-vous "{resource.title}" ? Notre équipe examinera ce contenu.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="py-4">
                                        <RadioGroup value={reportReason} onValueChange={setReportReason} className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="spam" id="spam" />
                                                <Label htmlFor="spam">Spam ou contenu promotionnel</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="inappropriate" id="inappropriate" />
                                                <Label htmlFor="inappropriate">Contenu inapproprié ou offensant</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="copyright" id="copyright" />
                                                <Label htmlFor="copyright">Violation des droits d'auteur</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="irrelevant" id="irrelevant" />
                                                <Label htmlFor="irrelevant">Document hors sujet ou incorrect</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="broken_link" id="broken_link" />
                                                <Label htmlFor="broken_link">Le lien est cassé ou introuvable</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="other" id="other" />
                                                <Label htmlFor="other">Autre raison</Label>
                                            </div>
                                        </RadioGroup>

                                        {reportReason === 'other' && (
                                            <div className="mt-4">
                                                <Label htmlFor="details" className="mb-2 block text-sm">Précisez votre raison</Label>
                                                <Textarea
                                                    id="details"
                                                    placeholder="Décrivez le problème..."
                                                    value={reportDetails}
                                                    onChange={(e) => setReportDetails(e.target.value)}
                                                    className="min-h-[80px]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)} disabled={isSubmittingReport}>
                                            Annuler
                                        </Button>
                                        <Button variant="destructive" onClick={handleReportSubmit} disabled={isSubmittingReport || (reportReason === 'other' && !reportDetails.trim())}>
                                            {isSubmittingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                            Envoyer le signalement
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="space-y-4">
                            <div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="text-xs">
                                        {resource.type.toUpperCase()}
                                    </Badge>
                                    {resource.docType && (
                                        <Badge variant="secondary" className="text-xs">
                                            {resource.docType}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-bold mb-2">
                                    {resource.title}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                    {resource.professor && (
                                        <span>Prof. {resource.professor}</span>
                                    )}
                                    {resource.createdAt && (
                                        <span>{new Date(resource.createdAt).toLocaleDateString('fr-FR')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="py-6 space-y-6">
                        {resource.description && (
                            <div className="text-sm text-slate-700 leading-relaxed">
                                {resource.description}
                            </div>
                        )}

                        {getYouTubeEmbedUrl(downloadUrl) && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden border shadow-sm">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={getYouTubeEmbedUrl(downloadUrl)}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}

                        {!getYouTubeEmbedUrl(downloadUrl) && isPdfUrl(downloadUrl) && (
                            <div className="w-full h-[60vh] sm:h-[600px] md:h-[700px] rounded-xl overflow-hidden border shadow-sm bg-slate-50 transition-all hover:shadow-md">
                                <object
                                    data={downloadUrl}
                                    type="application/pdf"
                                    width="100%"
                                    height="100%"
                                >
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={downloadUrl}
                                        title="PDF viewer"
                                        frameBorder="0"
                                    >
                                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 bg-slate-50/50">
                                            <FileText className="w-12 h-12 mb-3 text-slate-300" />
                                            <p className="mb-4">Votre navigateur ne supporte pas l'affichage direct des PDF.</p>
                                            <Button asChild>
                                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                    <Download className="w-4 h-4" />
                                                    Téléchargez le PDF
                                                </a>
                                            </Button>
                                        </div>
                                    </iframe>
                                </object>
                            </div>
                        )}

                        {!getYouTubeEmbedUrl(downloadUrl) && !isPdfUrl(downloadUrl) && getGoogleWorkspaceEmbedUrl(downloadUrl) && (
                            <div className="w-full h-[60vh] sm:h-[600px] md:h-[700px] rounded-xl overflow-hidden border shadow-sm bg-slate-50 transition-all hover:shadow-md">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={getGoogleWorkspaceEmbedUrl(downloadUrl)}
                                    title="Google Workspace viewer"
                                    frameBorder="0"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}

                        {/* Fallback for generic links (Not YouTube, Not PDF, Not Google Workspace) */}
                        {downloadUrl && !getYouTubeEmbedUrl(downloadUrl) && !isPdfUrl(downloadUrl) && !getGoogleWorkspaceEmbedUrl(downloadUrl) && resource.type === 'link' && (
                            <div className="border rounded-xl p-5 sm:p-6 bg-slate-50 hover:bg-slate-100/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-4 shadow-sm hover:shadow-md mt-6">
                                <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                                    <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0 mt-1 sm:mt-0">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 mb-1 text-base sm:text-lg">Lien externe</h4>
                                        <p className="text-sm text-slate-500 truncate w-full max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md">
                                            {downloadUrl}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild className="w-full sm:w-auto shrink-0 gap-2 font-medium">
                                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                        Visiter le site
                                    </a>
                                </Button>
                            </div>
                        )}

                        {((resource.fields && resource.fields.length > 0) || resource.field) && (
                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold text-slate-600 mb-3">Filières</p>
                                <div className="flex flex-wrap gap-2">
                                    {resource.field && (
                                        <Badge variant="secondary">
                                            {getFieldName(resource.field)}
                                        </Badge>
                                    )}
                                    {resource.fields?.map((f, idx) => (
                                        <Badge key={idx} variant="outline">
                                            {getFieldName(f.fieldId)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="py-4 border-t flex flex-wrap gap-4 justify-between items-center">
                        <Button asChild className="gap-2 flex-1 sm:flex-none">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                {resource.type === 'link' ? <ExternalLink className="w-4 h-4" /> : resource.type === 'video' ? <Play className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                {resource.type === 'link' ? 'Accéder' : resource.type === 'video' ? 'Ouvrir' : 'Télécharger'}
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 text-slate-600 hover:text-primary flex-1 sm:flex-none">
                            <Share2 className="w-4 h-4" />
                            Partager
                        </Button>
                    </CardFooter>
                </Card>

                {/* Comments Section */}
                <Card className="shadow-md">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Commentaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4 space-y-6">
                        {/* Comment Form */}
                        {user ? (
                            <div className="border rounded-lg p-4 bg-slate-50">
                                <Textarea
                                    placeholder="Partagez votre avis..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="mb-3 min-h-20 text-sm"
                                />
                                <Button
                                    onClick={handleAddComment}
                                    disabled={submitting || !commentText.trim()}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Send className="w-3 h-3" />
                                    Publier
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-sm text-slate-600">
                                <Link href="/login" className="text-primary font-semibold hover:underline">
                                    Connectez-vous
                                </Link>
                                {' '}pour commenter
                            </div>
                        )}

                        <div className="border-t pt-4">
                            {comments.length === 0 && (
                                <p className="text-center text-slate-500 text-sm py-6">Aucun commentaire pour l'instant.</p>
                            )}
                            {comments.length > 0 && (
                                <div className="space-y-4">
                                    {getParentComments().map((comment) => (
                                        <div key={comment.id} className="space-y-4">
                                            {/* Parent Comment */}
                                            <div className="border rounded-lg p-3 bg-slate-50">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-sm">{comment.authorName}</span>
                                                            <span className="text-xs text-slate-500">{formatCommentDate(comment.timestamp)}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 mb-2">{comment.text}</p>
                                                        {user && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs h-auto p-0 text-primary hover:bg-transparent"
                                                                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                                            >
                                                                Répondre
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reply Form */}
                                            {expandedReplies[comment.id] && user && (
                                                <div className="ml-6 border rounded-lg p-3 bg-slate-50">
                                                    <Textarea
                                                        placeholder="Votre réponse..."
                                                        value={replyTexts[comment.id] || ''}
                                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                        className="mb-2 min-h-16 text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAddReply(comment.id)}
                                                            disabled={submitting || !(replyTexts[comment.id]?.trim())}
                                                            size="sm"
                                                            className="gap-2"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            Répondre
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Replies */}
                                            {getReplies(comment.id).length > 0 && (
                                                <div className="ml-6 space-y-2 border-l px-3">
                                                    {getReplies(comment.id).map((reply) => (
                                                        <div key={reply.id} className="bg-slate-50 rounded p-3 text-xs">
                                                            <div className="flex items-start gap-2">
                                                                <User className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-xs">{reply.authorName}</span>
                                                                        <span className="text-slate-500">{formatCommentDate(reply.timestamp)}</span>
                                                                    </div>
                                                                    <p className="text-slate-700">{reply.text}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
