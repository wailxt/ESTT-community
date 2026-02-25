'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db as staticDb } from '@/lib/data';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge, Loader2, FileText, Video, ImageIcon, Link as LinkIcon, ArrowRight, FolderOpen, User } from 'lucide-react';

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [resources, setResources] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize from URL params
        const fieldParam = searchParams.get('field');
        const semesterParam = searchParams.get('semester');
        const moduleParam = searchParams.get('module');

        if (fieldParam) setSelectedField(fieldParam);
        if (semesterParam) setSelectedSemester(semesterParam);

        // If only module is provided, try to find the field and semester
        if (moduleParam && !fieldParam) {
            let found = false;
            Object.entries(staticDb.modules).forEach(([key, mods]) => {
                if (!found && mods.find(m => m.id === moduleParam)) {
                    const [f, s] = key.split('-');
                    setSelectedField(f);
                    setSelectedSemester(s);
                    setSelectedModule(moduleParam);
                    found = true;
                }
            });
        } else if (moduleParam) {
            setSelectedModule(moduleParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!db) return;
        if (selectedModule) {
            fetchResources();
            fetchAds();
        } else {
            setResources([]);
            setAds([]);
        }
    }, [selectedModule, db]);

    const fetchAds = async () => {
        const adsRef = ref(db, 'studentAds');
        const snapshot = await get(adsRef);
        if (snapshot.exists()) {
            const now = new Date();
            const adsData = Object.entries(snapshot.val())
                .map(([id, data]) => ({ id, ...data }))
                .filter(ad => ad.status === 'live' && (!ad.expirationDate || new Date(ad.expirationDate) > now))
                .sort(() => Math.random() - 0.5)
                .slice(0, 1);
            setAds(adsData);
        }
    };

    const fetchResources = async () => {
        setLoading(true);
        try {
            // 1. Try fetching from mapping first (efficient)
            const mappingRef = ref(db, `module_resources/${selectedModule}`);
            const mappingSnap = await get(mappingRef);

            let resourceIds = [];
            if (mappingSnap.exists()) {
                resourceIds = Object.keys(mappingSnap.val());
            }

            // 2. Fetch actual resource data
            const resourcesRef = ref(db, 'resources');
            const resourcesSnap = await get(resourcesRef);
            const allResources = resourcesSnap.val() || {};

            let formattedResources = [];

            if (resourceIds.length > 0) {
                // If mapping exists, use it
                formattedResources = resourceIds
                    .map(id => ({
                        id,
                        ...allResources[id]
                    }))
                    .filter(resource =>
                        resource &&
                        resource.unverified !== true &&
                        (resource.url || resource.link || resource.file) &&
                        resource.title
                    );
            }

            // 3. Fallback: Search all resources for this module ID if no results or mismatch
            // This handles cases where mapping might be missing but resource has the module field
            if (formattedResources.length === 0) {
                formattedResources = Object.entries(allResources)
                    .map(([id, res]) => ({ id, ...res }))
                    .filter(res => {
                        const isVerified = res.unverified !== true;
                        const hasContent = res.url || res.link || res.file;
                        const hasTitle = !!res.title;

                        // Check direct module field
                        const matchesDirectModule = res.module === selectedModule || res.moduleId === selectedModule;

                        // Check multiple fields array
                        const matchesInFields = res.fields && Array.isArray(res.fields) &&
                            res.fields.some(f => f.moduleId === selectedModule);

                        return isVerified && (matchesDirectModule || matchesInFields) && hasContent && hasTitle;
                    });
            }

            setResources(formattedResources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const modules = selectedField && selectedSemester
        ? staticDb.modules[`${selectedField}-${selectedSemester}`] || []
        : [];

    const selectedModuleData = modules.find(m => m.id === selectedModule);

    const ensureProtocol = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5" />;
            case 'video': return <Video className="w-5 h-5" />;
            case 'image': return <ImageIcon className="w-5 h-5" />;
            case 'link': return <LinkIcon className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const getFieldName = (fieldId) => {
        return staticDb.fields.find(f => f.id === fieldId)?.name || fieldId;
    };

    return (
        <main className="container py-12">
            <section className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                    Parcourir les ressources
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Sélectionnez votre filière, semestre et module pour accéder aux ressources partagées par la communauté.
                </p>
            </section>

            <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Filière</label>
                    <Select
                        value={selectedField}
                        onValueChange={(value) => {
                            setSelectedField(value);
                            setSelectedSemester('');
                            setSelectedModule('');
                            setResources([]);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une filière" />
                        </SelectTrigger>
                        <SelectContent>
                            {staticDb.fields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                    {field.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Semestre</label>
                    <Select
                        value={selectedSemester}
                        onValueChange={(value) => {
                            setSelectedSemester(value);
                            setSelectedModule('');
                            setResources([]);
                        }}
                        disabled={!selectedField}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un semestre" />
                        </SelectTrigger>
                        <SelectContent>
                            {staticDb.semesters.map((sem) => (
                                <SelectItem key={sem} value={sem}>
                                    {sem}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Module</label>
                    <Select
                        value={selectedModule}
                        onValueChange={setSelectedModule}
                        disabled={!selectedSemester}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un module" />
                        </SelectTrigger>
                        <SelectContent>
                            {modules.map((mod) => (
                                <SelectItem key={mod.id} value={mod.id}>
                                    {mod.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            {selectedModule && (
                <section>
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Ressources : <span className="text-primary">{selectedModuleData?.name}</span>
                        </h2>
                        <Badge variant="outline" className="px-3 py-1">
                            {resources.length} ressource{resources.length > 1 ? 's' : ''}
                        </Badge>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Recherche des ressources...</p>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
                            <div className="mx-auto w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FolderOpen className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="font-semibold text-slate-900 mb-1">Aucune ressource disponible</p>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">Aidez vos camarades en étant le premier à partager une ressource pour ce module !</p>
                            <Link href="/contribute">
                                <Button size="sm" className="rounded-full px-6">Contribuer une ressource</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Student Ad Card */}
                            {ads.length > 0 && (
                                <div className="group border border-slate-200 rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
                                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                                        <img src={ads[0].url} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute top-3 left-3">
                                            <span className="inline-block bg-white/90 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">Focus</span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors mb-1 line-clamp-1">{ads[0].title}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{ads[0].description}</p>
                                        <div className="mt-auto pt-4 border-t border-slate-100">
                                            {ads[0].link && (
                                                <a href={ads[0].link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">
                                                    Découvrir →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {resources.map((resource) => {
                                const rawUrl = resource.url || resource.link || resource.file;
                                const validUrl = rawUrl ? ensureProtocol(rawUrl) : null;

                                return (
                                    <Link key={resource.id} href={`/resource/${resource.id}`} className="group flex flex-col h-full border border-slate-200 rounded-xl hover:border-primary/50 transition-colors bg-white p-5 cursor-pointer">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {getResourceIcon(resource.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{resource.title}</h3>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">{resource.type}</span>
                                                    {resource.docType && (
                                                        <span className="text-[10px] font-bold uppercase text-primary">· {resource.docType}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {resource.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{resource.description}</p>
                                        )}

                                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                            {resource.professor && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <User className="w-3 h-3" />
                                                    <span className="truncate">{resource.professor}</span>
                                                </div>
                                            )}
                                            {validUrl ? (
                                                <span className="text-xs font-bold text-primary group-hover:underline ml-auto flex items-center gap-1">
                                                    Ouvrir <ArrowRight className="w-3 h-3" />
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300 ml-auto">Non disponible</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
