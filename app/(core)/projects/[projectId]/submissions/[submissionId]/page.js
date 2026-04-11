'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, query, orderByChild, equalTo, runTransaction, set, push } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
    formatProjectDate,
    getProjectRuntimeStatus,
    normalizeProject,
    normalizeSubmission,
} from '@/lib/projects';
import { 
    AlertCircle, 
    ArrowLeft, 
    CalendarDays, 
    CheckCircle2, 
    ChevronDown, 
    ExternalLink, 
    Github, 
    Loader2, 
    MessageCircle, 
    Send, 
    Trophy, 
    User, 
    X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubmissionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    
    const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;
    const submissionId = Array.isArray(params?.submissionId) ? params.submissionId[0] : params?.submissionId;

    const [project, setProject] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [comments, setComments] = useState([]);
    const [currentVote, setCurrentVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [voting, setVoting] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});
    const [submittingComment, setSubmittingComment] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!db || !projectId || !submissionId) return;
        setRefreshing(true);

        try {
            // Fetch project
            const projectSnap = await get(ref(db, `projects/${projectId}`));
            if (!projectSnap.exists()) {
                setError({ type: 'notFound', message: 'Challenge introuvable.' });
                setLoading(false);
                return;
            }
            setProject(normalizeProject(projectId, projectSnap.val()));

            // Fetch submission
            const submissionSnap = await get(ref(db, `projectSubmissions/${submissionId}`));
            if (!submissionSnap.exists()) {
                setError({ type: 'notFound', message: 'Implementation introuvable.' });
                setLoading(false);
                return;
            }
            setSubmission(normalizeSubmission(submissionId, submissionSnap.val()));

            // Fetch comments
            const commentsSnap = await get(ref(db, `projectSubmissions/${submissionId}/comments`));
            if (commentsSnap.exists()) {
                const commentsList = Object.entries(commentsSnap.val())
                    .map(([id, item]) => ({ id, ...item }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setComments(commentsList);
            } else {
                setComments([]);
            }

            // Fetch vote status
            if (user) {
                const voteSnap = await get(ref(db, `projectVotes/${projectId}/${user.uid}`));
                setCurrentVote(voteSnap.exists() ? voteSnap.val() : null);
            }
        } catch (err) {
            console.error('Error fetching submission details:', err);
            setError({ type: 'loadError', message: 'Impossible de charger les details. Verifiez votre connexion.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId, submissionId, user]);

    const runtimeStatus = useMemo(() => getProjectRuntimeStatus(project), [project]);

    const handleVote = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!project || !submission || runtimeStatus !== 'open') {
            setMessage({ type: 'error', text: 'Le vote est ferme pour ce challenge.' });
            return;
        }

        if (submission.authorId === user.uid) {
            setMessage({ type: 'error', text: 'Tu ne peux pas voter pour ta propre implementation.' });
            return;
        }

        setVoting(true);
        setMessage(null);

        try {
            const voteRef = ref(db, `projectVotes/${projectId}/${user.uid}`);
            const existingVoteSnap = await get(voteRef);
            const existingVote = existingVoteSnap.exists() ? existingVoteSnap.val() : null;

            if (existingVote?.submissionId === submission.id) {
                setMessage({ type: 'success', text: 'Ton vote est deja place sur cette implementation.' });
                return;
            }

            // If switching vote
            if (existingVote?.submissionId) {
                await runTransaction(ref(db, `projectSubmissions/${existingVote.submissionId}/votesCount`), (val) => Math.max(0, Number(val || 0) - 1));
            }

            // Add new vote
            await runTransaction(ref(db, `projectSubmissions/${submission.id}/votesCount`), (val) => Number(val || 0) + 1);

            await set(voteRef, {
                userId: user.uid,
                projectId,
                submissionId: submission.id,
                createdAt: existingVote?.createdAt || Date.now(),
                updatedAt: Date.now(),
            });

            setCurrentVote({ submissionId: submission.id, userId: user.uid });
            setSubmission(prev => ({ ...prev, votesCount: prev.votesCount + 1 }));
            
            setMessage({ type: 'success', text: 'Ton vote a bien ete enregistre.' });
        } catch (err) {
            console.error('Error voting:', err);
            setMessage({ type: 'error', text: "Impossible d'enregistrer ton vote." });
        } finally {
            setVoting(false);
        }
    };

    const handleAddComment = async () => {
        if (!user) return;
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const commentsRef = ref(db, `projectSubmissions/${submissionId}/comments`);
            const newCommentRef = push(commentsRef);

            const commentData = {
                text: commentText.trim(),
                authorId: user.uid,
                authorName: profile?.displayName || user.email?.split('@')[0] || 'Anonyme',
                timestamp: Date.now(),
                isReply: false
            };

            await set(newCommentRef, commentData);
            
            // Increment comment count denormalized
            await runTransaction(ref(db, `projectSubmissions/${submissionId}/commentsCount`), (val) => Number(val || 0) + 1);

            setCommentText('');
            // Locally update
            setComments(prev => [{ id: newCommentRef.key, ...commentData }, ...prev]);
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleAddReply = async (parentId) => {
        if (!user) return;
        const replyText = replyTexts[parentId];
        if (!replyText?.trim()) return;

        setSubmittingComment(true);
        try {
            const commentsRef = ref(db, `projectSubmissions/${submissionId}/comments`);
            const newReplyRef = push(commentsRef);

            const replyData = {
                text: replyText.trim(),
                authorId: user.uid,
                authorName: profile?.displayName || user.email?.split('@')[0] || 'Anonyme',
                timestamp: Date.now(),
                isReply: true,
                parentId: parentId
            };

            await set(newReplyRef, replyData);
            await runTransaction(ref(db, `projectSubmissions/${submissionId}/commentsCount`), (val) => Number(val || 0) + 1);

            setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
            setExpandedReplies(prev => ({ ...prev, [parentId]: false }));
            setComments(prev => [...prev, { id: newReplyRef.key, ...replyData }]);
        } catch (err) {
            console.error('Error adding reply:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatCommentDate = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "A l'instant";
        if (diffMins < 60) return `Il y a ${diffMins}m`;
        return d.toLocaleDateString('fr-FR');
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    if (error || !submission || !project) {
        return (
            <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10">
                    <h1 className="text-3xl font-black text-slate-950">Introuvable</h1>
                    <p className="mt-3 text-sm text-slate-500">{error?.message || 'Une erreur est survenue.'}</p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/projects">Retour au hub</Link>
                    </Button>
                </div>
            </main>
        );
    }

    const isActiveVote = currentVote?.submissionId === submission.id;
    const isOwnSubmission = user && submission.authorId === user.uid;

    return (
        <main className="min-h-screen bg-slate-50/50 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="container px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 truncate">
                        <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0">
                            <Link href={`/projects/${projectId}`}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="truncate">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                                Challenge: {project.title}
                            </p>
                            <h1 className="text-xl font-black text-slate-900 truncate">
                                {submission.title}
                            </h1>
                        </div>
                    </div>
                    
                    {user && (
                        <Button 
                            onClick={handleVote} 
                            disabled={voting || isOwnSubmission || runtimeStatus !== 'open'}
                            className={cn(
                                "rounded-full shadow-lg transition-all",
                                isActiveVote ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary"
                            )}
                        >
                            {voting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                            {isOwnSubmission ? 'Ma soumission' : isActiveVote ? 'Mon vote' : 'Voter'}
                        </Button>
                    )}
                </div>
            </header>

            <section className="container px-4 py-8 md:px-6 max-w-6xl">
                <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                    <div className="space-y-8">
                        {/* Main Content Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            {submission.coverImage && (
                                <div className="aspect-video w-full overflow-hidden border-b border-slate-100">
                                    <img src={submission.coverImage} className="h-full w-full object-cover" alt="" />
                                </div>
                            )}
                            <div className="p-6 md:p-10 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {submission.techStack.map(tech => (
                                            <Badge key={tech} variant="secondary" className="rounded-full bg-slate-100 text-slate-600 border-none px-3">
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight md:text-4xl">
                                        Description du build
                                    </h2>
                                    <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed">
                                        {submission.description}
                                    </div>
                                </div>

                                {submission.notes && (
                                    <div className="rounded-2xl bg-amber-50 p-6 border border-amber-100">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-2">Note de l'auteur</h3>
                                        <p className="text-slate-700 italic">{submission.notes}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 pt-4">
                                    {submission.githubUrl && (
                                        <Button asChild variant="outline" className="rounded-full border-slate-200 h-12 px-6">
                                            <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                                                <Github className="mr-2 h-5 w-5" />
                                                Repo GitHub
                                            </a>
                                        </Button>
                                    )}
                                    {submission.demoUrl && (
                                        <Button asChild className="rounded-full h-12 px-8 shadow-md">
                                            <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-5 w-5" />
                                                Voir la demo
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Screenshots Carousel/Grid */}
                        {submission.screenshots?.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-900">Captures d'ecran</h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {submission.screenshots.map((s, idx) => (
                                        <img 
                                            key={idx} 
                                            src={s} 
                                            className="rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]" 
                                            alt="" 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <MessageCircle className="h-6 w-6 text-primary" />
                                    Commentaires ({submission.commentsCount || 0})
                                </h3>
                            </div>
                            <div className="p-6 md:p-8 space-y-8">
                                {user ? (
                                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                        <Textarea 
                                            placeholder="Bravo pour le taf ! Qu'est-ce qui t'a le plus bloque ?"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="min-h-[100px] border-none bg-transparent focus-visible:ring-0 text-base"
                                        />
                                        <div className="flex justify-end">
                                            <Button 
                                                onClick={handleAddComment} 
                                                disabled={submittingComment || !commentText.trim()}
                                                className="rounded-full px-6"
                                            >
                                                {submittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                Publier
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/30">
                                        <p className="text-slate-600 mb-4">Connecte-toi pour donner ton avis sur ce projet !</p>
                                        <Button asChild variant="outline" className="rounded-full">
                                            <Link href="/login">Se connecter</Link>
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {comments.filter(c => !c.isReply).length === 0 && (
                                        <p className="text-center text-slate-400 italic py-4">Pas encore de retour...</p>
                                    )}
                                    {comments.filter(c => !c.isReply).map((comment) => (
                                        <div key={comment.id} className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <User className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900">{comment.authorName}</span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                            {formatCommentDate(comment.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                                        {comment.text}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {user && (
                                                            <button 
                                                                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                                                className="text-xs font-bold text-primary hover:underline"
                                                            >
                                                                Repondre
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reply Input */}
                                            {expandedReplies[comment.id] && (
                                                <div className="ml-14 space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                    <Textarea 
                                                        placeholder="Ta reponse..."
                                                        value={replyTexts[comment.id] || ''}
                                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                        className="min-h-[80px] bg-transparent border-none focus-visible:ring-0"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}>
                                                            Annuler
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            disabled={submittingComment || !replyTexts[comment.id]?.trim()}
                                                            onClick={() => handleAddReply(comment.id)}
                                                            className="rounded-full"
                                                        >
                                                            Repondre
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Replies List */}
                                            {comments.filter(c => c.parentId === comment.id).map(reply => (
                                                <div key={reply.id} className="ml-14 flex gap-3">
                                                    <div className="h-8 w-8 shrink-0 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-slate-800">{reply.authorName}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                {formatCommentDate(reply.timestamp)}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-600 bg-white border border-slate-100 rounded-xl rounded-tl-none p-3">
                                                            {reply.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        <div className="sticky top-28 space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">A propos de l'auteur</h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{submission.authorName}</p>
                                        <p className="text-xs text-slate-500">Membre de la communaute</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Statistiques</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Votes recus</span>
                                        <span className="font-bold text-slate-900 text-lg">{submission.votesCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Commentaires</span>
                                        <span className="font-bold text-slate-900 text-lg">{submission.commentsCount || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            Soumis le
                                        </span>
                                        <span className="font-bold text-slate-900 text-xs">{formatProjectDate(submission.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
                                <Trophy className="h-8 w-8 text-emerald-600 mb-4" />
                                <h3 className="font-black text-slate-900 mb-2">Classement</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Ce build participe au challenge <span className="font-bold">{project.title}</span>. Les votes determinent l'implementation gagnante a la fin du challenge.
                                </p>
                                <Button asChild variant="link" className="px-0 text-emerald-700 h-auto mt-4 font-bold">
                                    <Link href={`/projects/${projectId}`}>Voir le challenge complet &rarr;</Link>
                                </Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
