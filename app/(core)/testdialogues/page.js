'use client';

import { useDialog } from '@/context/DialogContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Info, XCircle, HelpCircle } from 'lucide-react';

export default function TestDialoguesPage() {
    const { showWarning, showError, showSuccess, showInfo, showConfirm } = useDialog();

    const testConfirm = async () => {
        const result = await showConfirm("Voulez-vous vraiment effectuer cette action de test ?", {
            title: "Test de Confirmation",
            confirmLabel: "Oui, tester",
            cancelLabel: "Annuler",
            type: "warning"
        });
        
        if (result) {
            showSuccess("Vous avez confirmé l'action !");
        } else {
            showInfo("Action annulée.");
        }
    };

    const testConfirmDanger = async () => {
        const result = await showConfirm("Cette action est destructive. Continuer ?", {
            title: "Action Dangereuse",
            confirmLabel: "Supprimer",
            type: "danger"
        });
        
        if (result) {
            showSuccess("Élément supprimé (test)");
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Test des Dialogues</h1>
                    <p className="text-slate-500">Interface de test pour le système UnifiedDialog et DialogContext.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Notifications */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Notifications Basiques</CardTitle>
                            <CardDescription>Alertes simples avec auto-fermeture ou manuelle.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-3">
                            <Button 
                                variant="outline" 
                                className="justify-start gap-3 h-12 border-green-100 hover:bg-green-50 text-green-700"
                                onClick={() => showSuccess("Opération réussie avec succès !")}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Tester showSuccess
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="justify-start gap-3 h-12 border-blue-100 hover:bg-blue-50 text-blue-700"
                                onClick={() => showInfo("Voici une information importante pour vous.")}
                            >
                                <Info className="w-5 h-5" />
                                Tester showInfo
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="justify-start gap-3 h-12 border-yellow-100 hover:bg-yellow-50 text-yellow-700"
                                onClick={() => showWarning("Attention, cette action nécessite votre vigilance.")}
                            >
                                <AlertTriangle className="w-5 h-5" />
                                Tester showWarning
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="justify-start gap-3 h-12 border-red-100 hover:bg-red-50 text-red-700"
                                onClick={() => showError("Une erreur critique est survenue lors du traitement.")}
                            >
                                <XCircle className="w-5 h-5" />
                                Tester showError
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Confirmations */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Confirmations (Promises)</CardTitle>
                            <CardDescription>Dialogues bloquants qui retournent un booléen.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-3">
                            <Button 
                                variant="default" 
                                className="justify-start gap-3 h-12"
                                onClick={testConfirm}
                            >
                                <HelpCircle className="w-5 h-5" />
                                Tester showConfirm (Standard)
                            </Button>

                            <Button 
                                variant="destructive" 
                                className="justify-start gap-3 h-12"
                                onClick={testConfirmDanger}
                            >
                                <AlertTriangle className="w-5 h-5" />
                                Tester showConfirm (Danger/Rouge)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm bg-primary text-white">
                    <CardContent className="p-8 text-center space-y-4">
                        <h2 className="text-2xl font-bold">Pourquoi utiliser UnifiedDialog ?</h2>
                        <p className="opacity-90 max-w-2xl mx-auto">
                            Ce système remplace les <code>window.confirm()</code> natifs par des composants Radix UI stylisés, 
                            accessibles et animés. Il permet de maintenir une cohérence visuelle sur toute la plateforme 
                            tout en supportant des thèmes variés (danger, info, success).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
