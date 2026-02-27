'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';
import { Loader2, ArrowLeft, ArrowRight, FileText } from 'lucide-react';

export default function ContributionsPage() {
    const { id } = useParams();
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !db) return;

        const fetchContributions = async () => {
            setLoading(true);
            try {
                const userRef = ref(db, `users/${id}/contributions`);
                const snap = await get(userRef);
                if (snap.exists()) {
                    const data = snap.val();
                    const list = Object.entries(data)
                        .map(([cid, value]) => ({ id: cid, ...value }))
                        .filter((item) => !item.unverified)
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setContributions(list);
                } else {
                    setContributions([]);
                }
            } catch (e) {
                console.error('Error fetching contributions:', e);
                setContributions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchContributions();
    }, [id]);

    return (
        <main className="min-h-screen bg-white py-12 border-t border-slate-100">
            <div className="container max-w-5xl mx-auto px-4 space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Contributions
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Toutes les ressources et éléments partagés par cet utilisateur.
                        </p>
                    </div>
                    <Link
                        href={`/profile/${id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Retour au profil
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : contributions.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-sm">
                            Aucune contribution pour le moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contributions.map((item) => (
                            <Link
                                key={item.id}
                                href={`/resource/${item.resourceId || item.id}`}
                                className="group p-4 border border-slate-200 rounded-xl hover:border-primary/50 transition-colors bg-white flex flex-col justify-between"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                            {item.title || 'Contribution'}
                                        </h2>
                                        <div className="flex flex-wrap gap-1 mt-1 text-[10px] uppercase text-slate-400">
                                            {item.module && <span>{item.module}</span>}
                                            {item.type && (
                                                <span className="text-primary">· {item.type}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                    {item.timestamp && (
                                        <span>
                                            Ajoutée le{' '}
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="ml-auto flex items-center gap-1 text-primary font-semibold text-[11px]">
                                        Ouvrir
                                        <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

