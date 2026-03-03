'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, ref, onValue } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, PenTool, ArrowRight, User } from 'lucide-react';

export default function ActivityFeed() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We listen to resources
        const resourcesRef = ref(db, 'resources');

        const unsubscribeResources = onValue(resourcesRef, (snapshot) => {
            const resourceData = snapshot.val() || {};
            const resourceList = [];
            const seenIds = new Set();

            // Flatten resources and de-duplicate
            Object.entries(resourceData).forEach(([key, value]) => {
                // Some resources are nested under module IDs, others are flat
                if (typeof value === 'object' && value !== null && !value.title) {
                    // Nested under module
                    Object.entries(value).forEach(([id, resource]) => {
                        if (!seenIds.has(id)) {
                            // Only add if NOT unverified
                            if (!resource.unverified) {
                                resourceList.push({
                                    id,
                                    type: 'resource',
                                    title: resource.title,
                                    module: resource.module,
                                    semester: resource.semester,
                                    field: resource.field,
                                    author: resource.authorName || 'Anonyme',
                                    authorId: resource.authorId,
                                    timestamp: resource.createdAt || resource.created_at || Date.now(),
                                    href: `/resource/${id}`
                                });
                                seenIds.add(id);
                            }
                        }
                    });
                } else {
                    // Flat structure
                    const id = key;
                    const resource = value;
                    if (!seenIds.has(id)) {
                        // Only add if NOT unverified
                        if (!resource.unverified) {
                            resourceList.push({
                                id,
                                type: 'resource',
                                title: resource.title,
                                module: resource.module,
                                semester: resource.semester,
                                field: resource.field,
                                author: resource.authorName || 'Anonyme',
                                authorId: resource.authorId,
                                timestamp: resource.createdAt || resource.created_at || Date.now(),
                                href: `/resource/${id}`
                            });
                            seenIds.add(id);
                        }
                    }
                }
            });

            const sortedItems = resourceList
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 6);

            setActivities(sortedItems);
            setLoading(false);
        });

        return () => {
            unsubscribeResources();
        };
    }, []);

    if (loading) return <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    if (activities.length === 0) return <div className="col-span-full py-20 text-center text-muted-foreground italic">Aucune activité récente.</div>;

    const getFieldColor = (field) => {
        switch (field?.toLowerCase()) {
            case 'ia': return 'text-purple-600';
            case 'casi': return 'text-blue-600';
            case 'insem': return 'text-orange-600';
            case 'idd': return 'text-green-600';
            default: return 'text-slate-600';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Date invalide';
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            {activities.map((activity) => (
                <a
                    key={activity.id}
                    href={activity.href}
                    className="group block p-3 md:p-6 bg-white border border-slate-200 rounded-xl hover:border-primary/50 transition-colors h-full"
                >
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {activity.type === 'resource' ? 'Ressource' : 'Article'}
                        </span>
                        <time className="text-[8px] md:text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {formatDate(activity.timestamp)}
                        </time>
                    </div>

                    <h3 className="text-xs md:text-base font-bold text-slate-900 group-hover:text-primary transition-colors mb-2 md:mb-4 line-clamp-2 min-h-[2.5em] md:min-h-0">
                        {activity.title}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 md:pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center">
                                <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-400" />
                            </div>
                            <span className="text-[10px] md:text-xs text-slate-600 font-medium truncate">
                                {activity.author}
                            </span>
                        </div>
                        <div className="sm:ml-auto flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase">
                            <span className={cn(getFieldColor(activity.field), "truncate max-w-[50px] md:max-w-none")}>
                                {activity.field || activity.module || 'ESTT'}
                            </span>
                            <ArrowRight className="w-2 h-2 md:w-3 md:h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </a>
            ))}
        </>
    );
}

// Internal helper for Tailwind classes if needed (since it's a separate file)
function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}
