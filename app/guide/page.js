import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Bell,
    BookOpen,
    CalendarDays,
    ChevronRight,
    CreditCard,
    Download,
    FileUp,
    Flag,
    HelpCircle,
    LayoutDashboard,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Users,
    UserCircle2,
} from 'lucide-react';

export const metadata = {
    title: 'Guide complet | EST Tetouan Community',
    description: 'Guide complet de la plateforme EST Tetouan Community: ressources, contributions, clubs, evenements, chat, notifications, profil, annonces et administration.',
};

const quickLinks = [
    { href: '/browse', label: 'Parcourir les ressources', icon: BookOpen, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { href: '/contribute', label: 'Contribuer une ressource', icon: FileUp, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { href: '/clubs', label: 'Explorer les clubs', icon: Users, color: 'bg-violet-50 text-violet-700 border-violet-200' },
    { href: '/events', label: 'Voir les evenements', icon: CalendarDays, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { href: '/chat', label: 'Ouvrir le chat', icon: MessageSquare, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { href: '/notifications', label: 'Consulter les notifications', icon: Bell, color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const gettingStarted = [
    {
        step: '1',
        title: 'Creer votre compte',
        body: 'Inscrivez-vous avec votre adresse academique, connectez-vous, puis completez votre profil pour debloquer les experiences personnalisees.',
    },
    {
        step: '2',
        title: 'Trouver votre filiere et vos modules',
        body: 'Utilisez la page de navigation des ressources pour choisir votre filiere, votre semestre et vos modules les plus utiles.',
    },
    {
        step: '3',
        title: 'Participer a la vie du campus',
        body: 'Suivez les clubs, consultez les evenements, recevez des notifications et rejoignez le chat de votre communaute.',
    },
];

const sections = [
    {
        id: 'resources',
        icon: BookOpen,
        title: 'Ressources academiques',
        description: 'La plateforme permet de trouver des cours, TD, TP, examens, liens et autres supports classes par filiere, semestre et module.',
        points: [
            'Utilisez /browse pour filtrer par filiere, semestre et module.',
            'Utilisez /search pour une recherche plus directe par mots-cles.',
            'Chaque ressource peut afficher son type, son auteur, son module, sa note moyenne et ses details.',
            'Certaines pages montrent aussi des annonces etudiantes actives en complement des contenus academiques.',
        ],
        ctaHref: '/browse',
        ctaLabel: 'Ouvrir les ressources',
        tone: 'blue',
    },
    {
        id: 'contribute',
        icon: FileUp,
        title: 'Contribuer une ressource',
        description: 'Vous pouvez envoyer un PDF, une image, un lien ou une video pour aider les autres etudiants.',
        points: [
            'La soumission se fait depuis /contribute.',
            'Vous choisissez la filiere, le semestre, le module, le type de ressource et le type de document.',
            'Les fichiers televerses passent par le flux Google Drive integre a la plateforme.',
            'Vous pouvez contribuer anonymement et lier une meme ressource a plusieurs modules equivalents.',
            'Les contributions sont marquees en attente puis verifiees avant publication.',
        ],
        ctaHref: '/contribute',
        ctaLabel: 'Contribuer maintenant',
        tone: 'emerald',
    },
    {
        id: 'clubs',
        icon: Users,
        title: 'Clubs et vie associative',
        description: 'Les clubs ont leur propre espace avec presentation, publications, formulaires, adhesion et administration dediee.',
        points: [
            'La page /clubs affiche les clubs verifies et permet une recherche simple.',
            'Chaque club dispose d une page detail avec ses informations, posts et activites.',
            'Les etudiants peuvent rejoindre un club et suivre ses annonces.',
            'Un formulaire permet aussi de proposer un nouveau club via /clubs/request.',
        ],
        ctaHref: '/clubs',
        ctaLabel: 'Explorer les clubs',
        tone: 'violet',
    },
    {
        id: 'events',
        icon: CalendarDays,
        title: 'Evenements et inscriptions',
        description: 'La plateforme regroupe les evenements des clubs dans un calendrier commun, avec vues liste, semaine et mois.',
        points: [
            'La page /events rassemble les evenements a venir et passes.',
            'Vous pouvez filtrer par club, rechercher un evenement ou distinguer les evenements gratuits et payants.',
            'Chaque evenement peut ouvrir un parcours d inscription dedie.',
            'Les evenements payants peuvent generer des tickets et un flux de paiement.',
        ],
        ctaHref: '/events',
        ctaLabel: 'Voir les evenements',
        tone: 'amber',
    },
    {
        id: 'tickets',
        icon: CreditCard,
        title: 'Tickets, paiements et certificats',
        description: 'Certaines activites utilisent un systeme de ticket, de validation et de suivi cote club.',
        points: [
            'Les paiements sont geres via Stripe pour les cas prevus par la plateforme.',
            'Apres paiement, le ticket peut etre verifie et passe a l etat valide.',
            'Certains espaces clubs incluent aussi des pages de certificat et des outils de scan pour les responsables.',
            'Le statut du ticket et les confirmations associees sont relies aux donnees de la plateforme.',
        ],
        ctaHref: '/events',
        ctaLabel: 'Commencer par les evenements',
        tone: 'rose',
    },
    {
        id: 'chat',
        icon: MessageSquare,
        title: 'Chat communautaire',
        description: 'Le chat permet d echanger entre etudiants d une meme filiere et d un meme niveau.',
        points: [
            'Le chat est disponible via /chat.',
            'Le canal depend de votre filiere et de votre annee d etude.',
            'Vous pouvez poster des messages, ouvrir des fils de discussion et repondre a d autres messages.',
            'Le chat est pense pour les echanges rapides, les questions de cours et l entraide.',
        ],
        ctaHref: '/chat',
        ctaLabel: 'Ouvrir le chat',
        tone: 'indigo',
    },
    {
        id: 'notifications',
        icon: Bell,
        title: 'Notifications',
        description: 'Le centre de notifications rassemble les alertes privees et globales liees a votre compte et a la plateforme.',
        points: [
            'La page /notifications centralise les messages importants.',
            'Vous pouvez y consulter les notifications lues et non lues.',
            'Certaines notifications ouvrent une action directe vers une page cible.',
            'Le compteur dans l entete vous aide a voir rapidement ce qui est nouveau.',
        ],
        ctaHref: '/notifications',
        ctaLabel: 'Voir mes notifications',
        tone: 'slate',
    },
    {
        id: 'profile',
        icon: UserCircle2,
        title: 'Profil, favoris et contributions',
        description: 'Votre profil sert a suivre votre activite et a personnaliser votre presence sur la plateforme.',
        points: [
            'Vous pouvez acceder a /profile et a votre page personnelle.',
            'Le profil permet de retrouver vos contributions et vos favoris.',
            'Certaines experiences s adaptent a vos informations academiques.',
            'Le compte connecte sert aussi a relier vos soumissions, vos notifications et votre participation communautaire.',
        ],
        ctaHref: '/profile',
        ctaLabel: 'Voir mon profil',
        tone: 'cyan',
    },
    {
        id: 'ads',
        icon: Sparkles,
        title: 'Portail publicitaire etudiant',
        description: 'La plateforme inclut un portail pour proposer des annonces visibles dans l ecosysteme ESTT.',
        points: [
            'La page /ads-portal presente le service et son fonctionnement.',
            'Les annonces peuvent etre soumises, valides puis activees selon le workflow de moderation.',
            'Un dashboard dedie permet de suivre l etat de ses annonces.',
            'Les annonces actives peuvent apparaitre sur l accueil et dans certaines pages du produit.',
        ],
        ctaHref: '/ads-portal',
        ctaLabel: 'Decouvrir le portail pub',
        tone: 'fuchsia',
    },
    {
        id: 'mobile',
        icon: Download,
        title: 'Version mobile et PWA',
        description: 'Le projet est pense pour une utilisation mobile, avec une experience installable et une page de telechargement dediee.',
        points: [
            'La page /download presente ESTT+ et les acces mobiles disponibles.',
            'Le site supporte une experience PWA pour une installation rapide depuis le navigateur compatible.',
            'La route /app propose une variation orientee experience mobile.',
            'Le produit reste utilisable sur desktop comme sur smartphone.',
        ],
        ctaHref: '/download',
        ctaLabel: 'Voir la version mobile',
        tone: 'teal',
    },
    {
        id: 'admin',
        icon: ShieldCheck,
        title: 'Administration',
        description: 'Certaines pages sont reservees aux responsables et administrateurs de la plateforme.',
        points: [
            'Le back-office principal se trouve sur /admin.',
            'Il sert a moderer les ressources, suivre les utilisateurs, traiter les bugs, gerer les annonces et piloter plusieurs reglages.',
            'Les clubs disposent aussi de pages admin specifiques pour leurs propres flux.',
            'Si vous n avez pas les droits adequats, certaines fonctionnalites ne seront pas visibles ou exploitables.',
        ],
        ctaHref: '/admin',
        ctaLabel: 'Acceder a l admin',
        tone: 'orange',
    },
];

const faq = [
    {
        q: 'Faut-il un compte pour tout utiliser ?',
        a: 'La consultation publique existe pour certaines pages, mais un compte est recommande pour contribuer, recevoir des notifications, acceder au chat, suivre son profil et participer pleinement aux flux communautaires.',
    },
    {
        q: 'Comment une ressource devient-elle visible pour tout le monde ?',
        a: 'Une contribution est d abord en attente, puis elle est validee par l equipe ou les responsables avant d apparaitre publiquement.',
    },
    {
        q: 'Pourquoi je ne vois pas les memes options qu un autre utilisateur ?',
        a: 'Certaines options dependent de votre connexion, de votre profil academique, du role que vous avez, ou de l acces admin / club associe a votre compte.',
    },
    {
        q: 'Ou signaler un probleme ?',
        a: 'Vous pouvez utiliser la page de signalement de bug quand elle est disponible, ou passer par les canaux de contact du projet et de l equipe admin.',
    },
];

const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    fuchsia: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
};

export default function GuidePage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20">
            <section className="border-b bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container px-4 py-16 md:px-6 md:py-24">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge className="border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Guide complet
                        </Badge>
                        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                            Tout comprendre de la plateforme ESTT Community
                        </h1>
                        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                            Cette page rassemble l essentiel pour utiliser le site au quotidien:
                            trouver des ressources, contribuer, suivre les clubs, participer aux evenements,
                            discuter avec les etudiants, gerer vos notifications, votre profil et plus encore.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Button asChild size="lg" className="gap-2">
                                <Link href="/browse">
                                    Commencer par les ressources
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="gap-2">
                                <Link href="/contribute">
                                    Contribuer
                                    <FileUp className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container px-4 py-12 md:px-6">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Acces rapides</h2>
                        <p className="text-sm text-slate-500">Les pages les plus utiles pour demarrer.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {quickLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href} className="group">
                                <Card className="h-full border-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg">
                                    <CardContent className="flex items-center gap-4 p-5">
                                        <div className={`rounded-2xl border p-3 ${item.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900 transition-colors group-hover:text-primary">
                                                {item.label}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="container px-4 py-6 md:px-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Prise en main</h2>
                    <p className="mt-2 text-sm text-slate-500">Si vous etes nouveau sur la plateforme, commencez ici.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {gettingStarted.map((item) => (
                        <Card key={item.step} className="border-slate-200 shadow-sm">
                            <CardContent className="p-6">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-black text-white">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="container px-4 py-12 md:px-6">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">Fonctionnalites en detail</h2>
                    <p className="mt-2 max-w-3xl text-slate-600">
                        Voici un panorama complet des espaces disponibles dans l application et de la facon de les utiliser.
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Card key={section.id} className="overflow-hidden border-slate-200 shadow-sm">
                                <CardHeader className="border-b bg-white">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="flex gap-4">
                                            <div className={`h-fit rounded-2xl border p-3 ${toneClasses[section.tone]}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl text-slate-900">{section.title}</CardTitle>
                                                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                                    {section.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="md:pt-1">
                                            <Button asChild variant="outline" className="gap-2">
                                                <Link href={section.ctaHref}>
                                                    {section.ctaLabel}
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="bg-slate-50/60 p-6">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {section.points.map((point) => (
                                            <div key={point} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                                                {point}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="container px-4 py-6 md:px-6">
                <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start">
                        <div className="rounded-2xl border border-amber-200 bg-white p-3 text-amber-700">
                            <Flag className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-amber-900">Bon a savoir</h2>
                            <p className="mt-2 text-sm leading-6 text-amber-800">
                                Certaines pages et certains outils changent selon votre statut de connexion, votre profil academique,
                                votre role dans un club ou vos droits d administration. Si vous ne voyez pas une action mentionnee ici,
                                il est possible qu elle soit reservee a un contexte particulier.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="container px-4 py-12 md:px-6">
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Questions frequentes</h2>
                        <p className="text-sm text-slate-500">Quelques reponses rapides sur le fonctionnement du site.</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {faq.map((item) => (
                        <Card key={item.q} className="border-slate-200 shadow-sm">
                            <CardContent className="p-6">
                                <h3 className="text-base font-bold text-slate-900">{item.q}</h3>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{item.a}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="container px-4 pb-6 md:px-6">
                <Card className="overflow-hidden border-none bg-slate-900 text-white shadow-xl">
                    <CardContent className="p-8 text-center md:p-12">
                        <h2 className="text-3xl font-black tracking-tight">Pret a utiliser toute la plateforme ?</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                            Commencez par vos ressources, puis explorez les clubs, les evenements, le chat et les autres espaces selon vos besoins.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Button asChild size="lg" variant="secondary">
                                <Link href="/browse">Explorer les ressources</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white">
                                <Link href="/clubs">Voir les clubs</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white">
                                <Link href="/events">Voir les evenements</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
