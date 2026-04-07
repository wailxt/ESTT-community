import {
    LayoutDashboard,
    FileText,
    Users,
    AlertCircle,
    Building2,
    Edit3,
    Megaphone,
    CreditCard,
    Settings,
    ShieldCheck,
    Bell,
    Zap,
    Bug,
    Link,
    Gift
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminSidebar({ activeTab, setActiveTab, profile, stats = {}, openReportsCount = 0, openBugReportsCount = 0, openClubRequestsCount = 0, openClubChangeRequestsCount = 0 }) {
    return (
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
            <div className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-black tracking-tight text-xl">Admin<span className="text-primary">Panel</span></span>
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
                    className="justify-start gap-3 h-11 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
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
                <Button
                    variant={activeTab === 'bugReports' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('bugReports')}
                >
                    <Bug className="w-4 h-4" /> Bugs
                    {openBugReportsCount > 0 && <Badge variant="destructive" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{openBugReportsCount}</Badge>}
                </Button>
                <Button
                    variant={activeTab === 'clubRequests' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('clubRequests')}
                >
                    <Building2 className="w-4 h-4" /> Demandes de clubs
                    {openClubRequestsCount > 0 && <Badge variant="default" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{openClubRequestsCount}</Badge>}
                </Button>
                <Button
                    variant={activeTab === 'clubChangeRequests' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('clubChangeRequests')}
                >
                    <Edit3 className="w-4 h-4" /> Modifications clubs
                    {openClubChangeRequestsCount > 0 && <Badge variant="default" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center">{openClubChangeRequestsCount}</Badge>}
                </Button>
                <Button
                    variant={activeTab === 'announcements' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('announcements')}
                >
                    <Megaphone className="w-4 h-4" /> Annonces Globales
                </Button>
                <Button
                    variant={activeTab === 'ads' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('ads')}
                >
                    <CreditCard className="w-4 h-4" /> Annonces Étudiants
                </Button>
                <Button
                    variant={activeTab === 'communication' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('communication')}
                >
                    <Megaphone className="w-4 h-4" /> Communication
                </Button>
                <Button
                    variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('notifications')}
                >
                    <Bell className="w-4 h-4" /> Notifications
                </Button>

                <Button
                    variant={activeTab === 'rewardCodes' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('rewardCodes')}
                >
                    <Gift className="w-4 h-4" /> Codes Récompenses
                </Button>

                <Button
                    variant={activeTab === 'shortUrls' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('shortUrls')}
                >
                    <Link className="w-4 h-4" /> URLs Courts
                </Button>

                <Button
                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                    className="justify-start gap-3 h-11"
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings className="w-4 h-4" /> Paramètres
                </Button>
            </nav>

            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Connecté en tant que</p>
                <p className="text-sm font-bold truncate">{profile?.firstName} {profile?.lastName}</p>
                <Badge variant="outline" className="mt-2 bg-white text-[9px] font-black uppercase tracking-tighter border-primary/20 text-primary">Administrateur</Badge>
            </div>
        </aside>
    );
}
