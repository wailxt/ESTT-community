'use client';

import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, BellOff, BellRing, MessageSquare, AtSign, Zap, CheckCircle2, XCircle, AlertTriangle, Info, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function StatusBadge({ permission }) {
    if (permission === 'granted') return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accordées
        </span>
    );
    if (permission === 'denied') return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Bloquées
        </span>
    );
    if (permission === 'unsupported') return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Non supporté
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Info className="w-3.5 h-3.5" /> Pas encore demandées
        </span>
    );
}

function TestCard({ icon: Icon, iconBg, title, description, action, disabled, buttonLabel = 'Envoyer', buttonColor = 'primary' }) {
    const [fired, setFired] = useState(false);

    const handleClick = () => {
        action();
        setFired(true);
        setTimeout(() => setFired(false), 2000);
    };

    const colors = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
        emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
        violet: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200',
        amber: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    };

    return (
        <div className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
            <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', iconBg)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{description}</p>
                    <button
                        onClick={handleClick}
                        disabled={disabled}
                        className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all duration-200',
                            disabled
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : colors[buttonColor],
                            fired && !disabled && 'scale-95'
                        )}
                    >
                        {fired && !disabled ? (
                            <><CheckCircle2 className="w-4 h-4" />Envoyée !</>
                        ) : (
                            <><BellRing className="w-4 h-4" />{buttonLabel}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TestNotificationPage() {
    const {
        isSupported,
        permission,
        requestPermission,
        notify,
    } = useNotifications();

    const [customTitle, setCustomTitle] = useState('🔔 Notification personnalisée');
    const [customBody, setCustomBody] = useState('Ceci est un test de notification globale.');
    const [customUrl, setCustomUrl] = useState('/');

    const isGranted = permission === 'granted';

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        Test Lab
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                        Notifications
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                            Browser Test
                        </span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        Testez toutes les notifications du système en temps réel.
                        Réduisez la fenêtre pour recevoir les notifications.
                    </p>
                </div>

                {/* Permission Panel */}
                <div className={cn(
                    'rounded-3xl p-6 mb-10 border transition-all',
                    isGranted
                        ? 'bg-emerald-50 border-emerald-200'
                        : permission === 'denied'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-slate-200 shadow-sm'
                )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'w-14 h-14 rounded-2xl flex items-center justify-center',
                                isGranted ? 'bg-emerald-100' : permission === 'denied' ? 'bg-red-100' : 'bg-blue-100'
                            )}>
                                {isGranted
                                    ? <Bell className="w-7 h-7 text-emerald-600" fill="currentColor" />
                                    : permission === 'denied'
                                    ? <BellOff className="w-7 h-7 text-red-500" />
                                    : <Bell className="w-7 h-7 text-blue-600" />
                                }
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900">Permission navigateur</span>
                                    <StatusBadge permission={isSupported ? permission : 'unsupported'} />
                                </div>
                                <p className="text-sm text-slate-500">
                                    {!isSupported
                                        ? 'Votre navigateur ne supporte pas les notifications.'
                                        : permission === 'granted'
                                        ? 'Vous recevrez des notifications quand le navigateur est en arrière-plan.'
                                        : permission === 'denied'
                                        ? 'Vous avez bloqué les notifications. Modifiez les paramètres du navigateur.'
                                        : 'Cliquez pour autoriser les notifications de navigateur.'}
                                </p>
                            </div>
                        </div>

                        {isSupported && permission !== 'denied' && !isGranted && (
                            <button
                                onClick={requestPermission}
                                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105"
                            >
                                <Bell className="w-4 h-4" />
                                Activer
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Test Cards */}
                <div className="space-y-4 mb-10">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                        Tests prédéfinis
                    </h2>

                    <TestCard
                        icon={AtSign}
                        iconBg="bg-blue-100 text-blue-600"
                        title="Mention dans le chat de groupe"
                        description="Simule une notification quand quelqu'un vous mentionne avec @NomPrenom dans le chat de filière."
                        disabled={!isGranted}
                        buttonColor="primary"
                        action={() => notify({
                            title: 'Youssef Amrani vous a mentionné dans ICS 2024',
                            body: '"@Utilisateur_Test hey tu as vu le cours de maths ?"',
                            tag: 'mention_test',
                            url: '/chat',
                            requireFocus: false,
                        })}
                    />

                    <TestCard
                        icon={MessageSquare}
                        iconBg="bg-violet-100 text-violet-600"
                        title="Message Direct (DM)"
                        description="Simule une notification de nouveau message privé reçu depuis un autre utilisateur."
                        disabled={!isGranted}
                        buttonColor="violet"
                        action={() => notify({
                            title: 'Nouveau message de Sara Benali',
                            body: '"Salut ! Tu as les notes du dernier cours ?"',
                            tag: 'dm_test',
                            url: '/messages',
                            requireFocus: false,
                        })}
                    />

                    <TestCard
                        icon={Zap}
                        iconBg="bg-amber-100 text-amber-600"
                        title="Notification personnalisée (usage global)"
                        description="Démontre le helper notifyCustom() utilisable n'importe où sur le site pour des alertes événementielles, des mises à jour, etc."
                        disabled={!isGranted}
                        buttonColor="amber"
                        action={() => notify({
                            title: '🎉 Nouvel événement',
                            body: 'Le GDG EST Tétouan organise un hackathon !',
                            tag: 'custom_test',
                            url: '/events',
                            requireFocus: false,
                        })}
                    />
                </div>

                {/* Custom Notification Builder */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                        Constructeur personnalisé
                    </h2>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Titre</label>
                            <input
                                type="text"
                                value={customTitle}
                                onChange={e => setCustomTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                                placeholder="Titre de la notification"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Corps</label>
                            <textarea
                                value={customBody}
                                onChange={e => setCustomBody(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all resize-none"
                                placeholder="Message de la notification"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">URL au clic <span className="font-normal text-slate-400">(optionnel)</span></label>
                            <input
                                type="text"
                                value={customUrl}
                                onChange={e => setCustomUrl(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                                placeholder="/page-de-destination"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                            {!isGranted
                                ? '⚠️ Vous devez d\'abord activer les notifications.'
                                : '✅ Réduisez l\'onglet avant d\'envoyer.'}
                        </p>
                        <button
                            disabled={!isGranted || !customTitle.trim()}
                            onClick={() => notify({ title: customTitle, body: customBody, url: customUrl || undefined, requireFocus: false })}
                            className={cn(
                                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all',
                                !isGranted || !customTitle.trim()
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-blue-200 hover:scale-105'
                            )}
                        >
                            <BellRing className="w-4 h-4" />
                            Tester
                        </button>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-400 mt-8">
                    <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">/test-notification</code>
                    {' '}· Page réservée aux développeurs
                </p>
            </div>
        </main>
    );
}
