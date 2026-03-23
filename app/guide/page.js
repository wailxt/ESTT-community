import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileUp, Users, ShieldCheck, PlayCircle, HelpCircle, ChevronRight } from 'lucide-react';

export const metadata = {
    title: 'Guide d\'utilisation | EST Tétouan Community',
    description: 'Apprenez à utiliser la plateforme EST Tétouan Community : consulter des ressources, contribuer, rejoindre des clubs et bien plus.',
};

export default function GuidePage() {
    return (
        <main className="min-h-screen pb-20 pt-24 bg-slate-50 dark:bg-slate-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/10 pointer-events-none" />
                <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 max-w-5xl">
                    <div className="text-center space-y-6">
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 mb-4 px-3 py-1 text-sm font-medium">
                            <BookOpen className="w-4 h-4 mr-2 inline" />
                            Guide Utilisateur
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Comment utiliser l'application ?
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Découvrez toutes les fonctionnalités de votre plateforme collaborative et apprenez comment en tirer le meilleur parti.
                        </p>
                    </div>
                </div>
            </section>

            {/* Video Tutorial Section */}
            <section className="container mx-auto px-4 py-12 max-w-5xl -mt-8 relative z-20">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 sm:p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tutoriel Vidéo</h2>
                                <p className="text-slate-500 dark:text-slate-400">Regardez notre guide rapide pour bien démarrer</p>
                            </div>
                        </div>

                        {/* YouTube Video Embed */}
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group">
                            {/* Placeholder for YouTube Video - Replace src later */}
                            <iframe 
                                className="absolute inset-0 w-full h-full"
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                            ></iframe>
                            
                            {/* Optional: Placeholder overlay when video link is empty (can remove if iframe src is set) */}
                            {/* 
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                <PlayCircle className="w-16 h-16 opacity-50 mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="font-medium text-lg">La vidéo sera bientôt disponible</p>
                            </div>
                            */}
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Guide Section */}
            <section className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Guide étape par étape</h2>
                    <p className="text-slate-600 dark:text-slate-400">Tout ce que vous devez savoir pour naviguer, contribuer et participer.</p>
                </div>

                <Tabs defaultValue="resources" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-3/4 mx-auto mb-8 h-auto p-1">
                        <TabsTrigger value="resources" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 rounded-lg flex flex-col items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            <span className="text-xs sm:text-sm font-medium">Rechercher</span>
                        </TabsTrigger>
                        <TabsTrigger value="contribute" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg flex flex-col items-center gap-2">
                            <FileUp className="w-5 h-5" />
                            <span className="text-xs sm:text-sm font-medium">Contribuer</span>
                        </TabsTrigger>
                        <TabsTrigger value="clubs" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-3 rounded-lg flex flex-col items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span className="text-xs sm:text-sm font-medium">Clubs</span>
                        </TabsTrigger>
                        <TabsTrigger value="account" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white py-3 rounded-lg flex flex-col items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-xs sm:text-sm font-medium">Compte</span>
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* Tab Content: Trouver des ressources */}
                    <TabsContent value="resources" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
                                <CardTitle className="text-2xl text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                    <BookOpen className="w-6 h-6" />
                                    Trouver des ressources
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Comment chercher et télécharger des cours, TDs et examens.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">1</div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Utilisez la recherche</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            Utilisez la barre de recherche globale en haut ou naviguez vers <Link href="/search" className="text-blue-600 hover:underline">la page de recherche</Link> pour trouver des documents spécifiques par module, type ou mot-clé.
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">2</div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Filtrez par filière</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            Sélectionnez votre filière (GI, TM, etc.) puis votre semestre pour voir tous les modules correspondants organisés de manière claire.
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl md:col-span-2 lg:col-span-1">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">3</div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Consultez & Téléchargez</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            Cliquez sur n'importe quel document pour voir un aperçu. S'il vous est utile, vous pouvez le télécharger ou le sauvegarder sur votre propre compte.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-center">
                                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                                        <Link href="/search">Essayer la recherche <ChevronRight className="w-4 h-4 ml-2" /></Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Content: Contribuer */}
                    <TabsContent value="contribute" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-lg border-t-4 border-t-emerald-500">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
                                <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-500 flex items-center gap-2">
                                    <FileUp className="w-6 h-6" />
                                    Contribuer des documents
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Aidez la communauté en partageant vos propres ressources et examens passés.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <ul className="space-y-6">
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">A</div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Allez sur la page d'ajout</h3>
                                            <p className="text-slate-600 dark:text-slate-400 mt-1">Cliquez sur le bouton "Ajouter" en haut à droite de l'écran ou rendez-vous sur <Link href="/contribute" className="text-emerald-600 font-medium hover:underline">la page de contribution</Link>.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">B</div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Remplissez les détails</h3>
                                            <p className="text-slate-600 dark:text-slate-400 mt-1">Sélectionnez la filière, le semestre, le module, et le type du document (Cours, TD, TP, Examen, etc.). Donnez-lui un titre clair.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">C</div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Hébergez et liez</h3>
                                            <p className="text-slate-600 dark:text-slate-400 mt-1">En raison des limites de stockage, veuillez héberger votre fichier sur Google Drive (avec accès public "Tous ceux qui ont le lien") et coller le lien dans le formulaire.</p>
                                        </div>
                                    </li>
                                </ul>
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-start gap-3 mt-6">
                                    <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-amber-800 dark:text-amber-500">Validation des ressources</h4>
                                        <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1">Les documents que vous soumettez passeront par une phase de vérification ("En attente"). Une fois validés par l'équipe, ils seront visibles par tous.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Content: Clubs */}
                    <TabsContent value="clubs" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-lg border-t-4 border-t-purple-500">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
                                <CardTitle className="text-2xl text-purple-700 dark:text-purple-400 flex items-center gap-2">
                                    <Users className="w-6 h-6" />
                                    Activités et Clubs
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Suivez la vie para-universitaire et rejoignez les clubs de l'EST Tétouan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-32 bg-purple-100 dark:bg-purple-900/20 flex flex-col justify-end p-4 border-b border-purple-200 dark:border-purple-800/30">
                                            <h3 className="font-bold text-xl text-purple-900 dark:text-purple-300">Explorer les clubs</h3>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <p className="text-slate-600 dark:text-slate-400 flex-1">
                                                Découvrez tous les clubs actifs dans la section <Link href="/clubs" className="text-purple-600 font-medium hover:underline">Clubs</Link>. Vous pourrez y consulter leurs descriptions, leurs responsables, et leurs événements passés ou à venir.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-32 bg-indigo-100 dark:bg-indigo-900/20 flex flex-col justify-end p-4 border-b border-indigo-200 dark:border-indigo-800/30">
                                            <h3 className="font-bold text-xl text-indigo-900 dark:text-indigo-300">Annonces et Posts</h3>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <p className="text-slate-600 dark:text-slate-400 flex-1">
                                                Restez à jour grâce au carrousel sur la page d'accueil. Les clubs y publient leurs dernières annonces, ouvertures de recrutement, ou récapitulatifs d'activités.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Content: Account */}
                    <TabsContent value="account" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-lg border-t-4 border-t-amber-500">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
                                <CardTitle className="text-2xl text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6" />
                                    Gérer son Compte
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Créez un profil pour personnaliser votre expérience.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Inscription & Connexion</h4>
                                            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
                                                Créez un compte gratuitement pour suivre l'état de vos contributions, aimer ou sauvegarder des ressources pour y accéder plus tard.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Profil & Réalisations</h4>
                                            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
                                                Personnalisez votre avatar et votre bio. Vos ressources partagées s'afficheront sur votre profil public. Si vous gagnez de l'XP en contribuant, vous débloquerez peut-être de nouveaux rôles.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>
        </main>
    );
}
