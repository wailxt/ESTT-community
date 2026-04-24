import { useState, useMemo } from 'react';
import { db, ref, set } from '@/lib/firebase';
import { db as staticDb } from '@/lib/data'; // Import static data for filieres/modules
import { useDialog } from '@/context/DialogContext';
import {
    Users,
    FileText,
    AlertCircle,
    ArrowUpRight,
    Search as SearchIcon,
    Loader2,
    PieChart as PieChartIcon,
    BarChart3,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend 
} from 'recharts';

const TYPE_COLORS = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#6366f1'];
const STATUS_COLORS = { 'Vérifié': '#10b981', 'En attente': '#ef4444' };
const USER_FIELD_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function AdminOverview({ stats, resources, users = [], setActiveTab }) {
    const { showSuccess, showError, showConfirm } = useDialog();
    const [rebuilding, setRebuilding] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Mounting check for Recharts in Next.js
    useState(() => {
        setIsMounted(true);
    }, []);

    // Filter states for modules explorer
    const [selectedField, setSelectedField] = useState(staticDb.fields[0]?.id || 'ia');
    const [selectedSem, setSelectedSem] = useState('S1');

    // Compute chart data
    const chartData = useMemo(() => {
        if (!resources.length) return { types: [], status: [], fields: [], modules: [], userFields: [] };

        const typeMap = {};
        const statusMap = { 'Vérifié': 0, 'En attente': 0 };
        const fieldMap = {};
        
        resources.forEach(res => {
            // Type
            const type = res.docType || 'Autre';
            typeMap[type] = (typeMap[type] || 0) + 1;

            // Status
            const status = res.unverified ? 'En attente' : 'Vérifié';
            statusMap[status] = (statusMap[status] || 0) + 1;

            // Field count (all available fields)
            const field = res.field || 'Inconnu';
            fieldMap[field] = (fieldMap[field] || 0) + 1;
        });

        // Interactive Modules logic
        const selectedKey = `${selectedField}-${selectedSem}`;
        const modulesList = staticDb.modules[selectedKey] || [];
        const moduleCounts = modulesList.map(mod => {
            const count = resources.filter(res => 
                res.field === selectedField && 
                res.semester === selectedSem && 
                (res.module === mod.name || res.moduleId === mod.id)
            ).length;
            return { name: mod.name, value: count };
        });

        // Users by Field distribution
        const userFieldMap = {};
        users.forEach(u => {
            const fieldId = u.filiere || 'Autre';
            const fieldName = staticDb.fields.find(f => f.id === fieldId)?.name || fieldId;
            userFieldMap[fieldName] = (userFieldMap[fieldName] || 0) + 1;
        });

        return {
            types: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
            status: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
            fields: Object.entries(fieldMap)
                .map(([name, value]) => ({ 
                    name: staticDb.fields.find(f => f.id === name)?.name || name, 
                    value 
                }))
                .sort((a, b) => b.value - a.value),
            modules: moduleCounts,
            userFields: Object.entries(userFieldMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
        };
    }, [resources, users, selectedField, selectedSem]);

    const handleRebuildIndex = async () => {
        const confirmed = await showConfirm("Voulez-vous vraiment reconstruire l'index de recherche ? Cela indexera toutes les ressources existantes.", {
            type: 'warning',
            title: 'Reconstruire l\'index',
            confirmLabel: 'Reconstruire'
        });
        if (!confirmed) return;

        setRebuilding(true);
        try {
            let count = 0;
            for (const res of resources) {
                if (res.field && res.title && !res.unverified) {
                    const keywordRef = ref(db, `metadata/keywords/${res.field}/${res.id}`);
                    await set(keywordRef, {
                        title: res.title,
                        resourceId: res.id
                    });
                    count++;
                }
            }
            showSuccess(`Index reconstruit avec succès ! ${count} ressources indexées.`);
        } catch (error) {
            console.error("Error rebuilding index:", error);
            showError("Erreur lors de la reconstruction de l'index.");
        } finally {
            setRebuilding(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Tableau de bord</h1>
                    <p className="text-muted-foreground">Analyses et gestion de la communauté.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-primary border-primary/20 hover:bg-primary/5 rounded-xl px-4"
                        onClick={handleRebuildIndex}
                        disabled={rebuilding}
                    >
                        {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
                        Reconstruire l'index
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl px-4">
                        <ArrowUpRight className="w-4 h-4" /> Exporter
                    </Button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden group col-span-1">
                    <div className="h-1 bg-blue-600 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Users className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <Badge variant="outline" className="text-[9px] md:text-[10px] border-blue-100 text-blue-600">+12%</Badge>
                        </div>
                        <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-wider">Utilisateurs</p>
                        <h3 className="text-xl md:text-3xl font-black mt-1">{stats.users}</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden group col-span-1">
                    <div className="h-1 bg-purple-600 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-1.5 md:p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <Badge variant="outline" className="text-[9px] md:text-[10px] border-purple-100 text-purple-600">+5%</Badge>
                        </div>
                        <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-wider">Ressources</p>
                        <h3 className="text-xl md:text-3xl font-black mt-1">{stats.resources}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-primary text-white overflow-hidden col-span-2 lg:col-span-1">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-1.5 md:p-2 bg-white/20 text-white rounded-lg">
                                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-wider">En attente</p>
                        <h3 className="text-xl md:text-3xl font-black mt-1">{stats.pending}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Repartition par Type & Statut */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Analyse des Ressources</CardTitle>
                            <CardDescription>Par type de document et statut.</CardDescription>
                        </div>
                        <PieChartIcon className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 min-h-[300px]">
                            {isMounted ? (
                                <>
                                    <div className="h-[250px] md:h-auto relative">
                                        <p className="text-[10px] font-black uppercase text-center mb-2 tracking-widest text-muted-foreground">Types</p>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData.types}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {chartData.types.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={48} 
                                                    iconType="circle" 
                                                    wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', bottom: -10 }} 
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-[250px] md:h-auto relative">
                                        <p className="text-[10px] font-black uppercase text-center mb-2 tracking-widest text-muted-foreground">Statut</p>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData.status}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {chartData.status.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={48} 
                                                    iconType="circle" 
                                                    wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', bottom: -10 }} 
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2 flex items-center justify-center h-[300px]">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Popularite Filiere & Modules */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Popularité</CardTitle>
                            <CardDescription>Top filières et modules actifs.</CardDescription>
                        </div>
                        <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {isMounted ? (
                                <>
                                    <div className="h-[200px] md:h-[140px]">
                                        <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-muted-foreground">Top Filières</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData.fields} layout="vertical">
                                                <XAxis type="number" hide />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    stroke="#94a3b8" 
                                                    fontSize={8} 
                                                    width={70} 
                                                    tickFormatter={(val) => val.split(' ')[0]} 
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    itemStyle={{ fontSize: '10px' }}
                                                />
                                                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={12} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    <hr className="border-slate-50" />

                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Explorateur de Modules</p>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Select value={selectedField} onValueChange={setSelectedField}>
                                                    <SelectTrigger className="w-full sm:w-[120px] h-7 text-[10px] uppercase font-bold rounded-lg px-2">
                                                        <SelectValue placeholder="Filière" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staticDb.fields.map(f => (
                                                            <SelectItem key={f.id} value={f.id} className="text-[10px] font-bold uppercase">{f.id.toUpperCase()}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={selectedSem} onValueChange={setSelectedSem}>
                                                    <SelectTrigger className="w-full sm:w-[80px] h-7 text-[10px] uppercase font-bold rounded-lg px-2">
                                                        <SelectValue placeholder="Sem." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staticDb.semesters.map(s => (
                                                            <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        <div className="h-[200px] md:h-[150px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData.modules}>
                                                    <XAxis 
                                                        dataKey="name" 
                                                        stroke="#94a3b8" 
                                                        fontSize={7} 
                                                        tickFormatter={(val) => val.length > 6 ? val.slice(0, 5) + '..' : val} 
                                                        interval={0}
                                                    />
                                                    <YAxis fontSize={8} stroke="#94a3b8" />
                                                    <Tooltip 
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        itemStyle={{ fontSize: '10px' }}
                                                    />
                                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-[340px] flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Distribution */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-50">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Utilisateurs par Filière</CardTitle>
                            <CardDescription>Répartition démographique.</CardDescription>
                        </div>
                        <Users className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] md:h-[250px]">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.userFields} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            stroke="#94a3b8" 
                                            fontSize={9} 
                                            width={100} 
                                            tickFormatter={(val) => val.length > 15 ? val.slice(0, 12) + '...' : val} 
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '10px' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                            {chartData.userFields.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={USER_FIELD_COLORS[index % USER_FIELD_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Resources */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Dernières Ressources</CardTitle>
                        <CardDescription>Les 5 ressources les plus récentes ajoutées.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {resources.slice(0, 5).map((res) => (
                                <div key={res.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold truncate">{res.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black truncate">{res.module}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 ml-4">
                                        {res.unverified ? (
                                            <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter rounded-md">En attente</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter text-green-600 border-green-100 bg-green-50 rounded-md">Vérifié</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50/50">
                            <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-primary hover:bg-white" onClick={() => setActiveTab('resources')}>
                                Voir toutes les ressources <ArrowUpRight className="ml-2 w-3 h-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

