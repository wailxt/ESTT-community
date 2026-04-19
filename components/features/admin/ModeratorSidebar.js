import {
    LayoutDashboard,
    FileText,
    Users,
    AlertCircle,
    ShieldCheck,
    Zap,
    BookOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ModeratorSidebar({ activeTab, setActiveTab, profile, stats = {}, openReportsCount = 0 }) {
    return (
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
            <div className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-black tracking-tight text-xl">Moderator<span className="text-blue-600">Panel</span></span>
            </div>

            <nav className="flex flex-col gap-1">
                <Button
                    variant={activeTab === 'overview' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('overview')}
                >
                    <LayoutDashboard className="w-4 h-4" /> Vue d'ensemble
                </Button>
                <Button
                    variant={activeTab === 'resources' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('resources')}
                >
                    <FileText className="w-4 h-4" /> Ressources
                </Button>

                <Button
                    variant={activeTab === 'fastContribute' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11 border-dashed border-blue-600/20 bg-blue-600/5 hover:bg-blue-600/10 text-blue-600"
                    onClick={() => setActiveTab('fastContribute')}
                >
                    <Zap className="w-4 h-4" /> Contribuer (Vite)
                </Button>

                <Button
                    variant={activeTab === 'users' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('users')}
                >
                    <Users className="w-4 h-4" /> Utilisateurs
                </Button>
                <Button
                    variant={activeTab === 'reports' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('reports')}
                >
                    <AlertCircle className="w-4 h-4" /> Signalements
                    {openReportsCount > 0 && <Badge variant="destructive" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{openReportsCount}</Badge>}
                </Button>

                <div className="h-px bg-slate-100 my-2" />

                <Button
                    variant={activeTab === 'documentation' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('documentation')}
                >
                    <BookOpen className="w-4 h-4" /> Documentation
                </Button>
            </nav>

            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Connecté en tant que</p>
                <p className="text-sm font-bold truncate">{profile?.firstName} {profile?.lastName}</p>
                <Badge variant="outline" className="mt-2 bg-white text-[9px] font-black uppercase tracking-tighter border-blue-600/20 text-blue-600">Modérateur</Badge>
            </div>
        </aside>
    );
}
