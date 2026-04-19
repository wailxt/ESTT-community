import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BookOpen, 
    LayoutDashboard, 
    FileText, 
    Zap, 
    Users, 
    AlertCircle, 
    CheckCircle2, 
    Info,
    Edit2,
    Trash2,
    Eye,
    Link2,
    Mail,
    Star,
    ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ModeratorDocs() {
    const sections = [
        {
            title: "Vue d'ensemble",
            icon: <LayoutDashboard className="w-5 h-5 text-blue-600" />,
            description: "Comprendre l'état actuel de la plateforme.",
            details: [
                "Visualisez le nombre total d'utilisateurs et de ressources.",
                "Consultez les graphiques de répartition par type et statut.",
                "Identifiez les filières et modules les plus actifs grâce à l'Explorateur de Modules.",
                "Accédez rapidement aux dernières ressources ajoutées."
            ]
        },
        {
            title: "Gestion des Ressources",
            icon: <FileText className="w-5 h-5 text-purple-600" />,
            description: "Le cœur de la modération : vérifier le contenu.",
            details: [
                "Vérification : Examinez les documents en attente et marquez-les comme 'Vérifiés' s'ils sont conformes.",
                "Edition : Corrigez les erreurs dans les titres, types de documents ou semestres.",
                "Suppression : Retirez les doublons ou les fichiers inappropriés.",
                "Filtrage : Utilisez les filtres par filière ou module pour cibler votre travail."
            ]
        },
        {
            title: "Contribuer (Vite)",
            icon: <Zap className="w-5 h-5 text-amber-600" />,
            description: "Ajouter du contenu de manière accélérée.",
            details: [
                "Utilisez cet outil pour uploader rapidement plusieurs documents.",
                "Remplissez les informations essentielles (Module, Semestre, Type).",
                "Les ressources ajoutées ici sont automatiquement vérifiées."
            ]
        },
        {
            title: "Gestion des Utilisateurs",
            icon: <Users className="w-5 h-5 text-emerald-600" />,
            description: "Aperçu de la communauté.",
            details: [
                "Consultez la liste des membres inscrits.",
                "Vérifiez l'appartenance académique (Filière) des utilisateurs.",
                "Note : Seuls les administrateurs peuvent modifier les rôles ou bannir des utilisateurs."
            ]
        },
        {
            title: "Signalements",
            icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
            description: "Répondre aux alertes de la communauté.",
            details: [
                "Examinez les signalements envoyés par les utilisateurs.",
                "Traitez les problèmes de liens morts, d'erreurs de contenu ou de mauvais classement.",
                "Marquez les signalements comme traités une fois résolus."
            ]
        }
    ];

    return (
        <div className="space-y-8 pb-10 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Documentation Modérateur</h1>
                        <p className="text-muted-foreground font-medium">Guide d'utilisation du panneau de modération d'ESTT Community.</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                <CardContent className="p-8">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">IMPORTANT</Badge>
                            <span className="font-bold tracking-wide text-sm opacity-90 uppercase">Votre Mission</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight max-w-2xl">
                            Assurer la qualité et l'accessibilité des ressources pour tous les étudiants.
                        </h2>
                        <p className="opacity-80 text-sm max-w-xl font-medium leading-relaxed">
                            En tant que modérateur, votre rôle est crucial pour maintenir une base de données propre, 
                            classée et vérifiée. Un bon référencement aide des centaines d'étudiants à trouver ce dont ils ont besoin.
                        </p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <CheckCircle2 size={200} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <Card key={idx} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                                {section.icon}
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">{section.title}</CardTitle>
                                <CardDescription className="text-xs font-medium">{section.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ul className="space-y-3">
                                {section.details.map((detail, dIdx) => (
                                    <li key={dIdx} className="flex gap-3 text-sm text-slate-600 leading-relaxed font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-2 shrink-0" />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Guide Visuel des Actions
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">Découvrez la signification des icônes dans la table des ressources.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, label: "Valider", desc: "Approuve la ressource et la rend visible à tous." },
                            { icon: <Edit2 className="w-4 h-4 text-primary" />, label: "Modifier", desc: "Change les informations (Titre, Prof, Type)." },
                            { icon: <Trash2 className="w-4 h-4 text-destructive" />, label: "Supprimer", desc: "Retire la ressource avec un motif de rejet." },
                            { icon: <Eye className="w-4 h-4 text-slate-600" />, label: "Visualiser", desc: "Ouvre le document dans un nouvel onglet." },
                            { icon: <Link2 className="w-4 h-4 text-primary" />, label: "Relier", desc: "Partage la ressource avec d'autres filières." },
                            { icon: <Mail className="w-4 h-4 text-sky-600" />, label: "Contacter", desc: "Envoie un message direct à l'auteur." },
                            { icon: <Star className="w-4 h-4 text-amber-500" />, label: "Avis", desc: "Consulte les notes et commentaires des étudiants." },
                            { icon: <ExternalLink className="w-4 h-4 text-slate-600" />, label: "Fil de discussion", desc: "Reprend une conversation avec un auteur." }
                        ].map((action, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    {action.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{action.label}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">{action.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-50 border border-slate-100">
                <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-2 bg-white text-slate-400 rounded-lg shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">Besoin d'aide supplémentaire ?</p>
                        <p className="text-sm text-slate-500 font-medium">
                            Si vous rencontrez un problème technique ou si vous avez des doutes sur une ressource, 
                            contactez l'administrateur via le groupe de communication ou directement sur le campus.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
