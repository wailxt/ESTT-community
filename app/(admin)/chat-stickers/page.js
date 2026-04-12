"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { db, ref, push, set } from "@/lib/firebase";
import { 
    Upload, 
    Image as ImageIcon, 
    X, 
    CheckCircle2, 
    Loader2, 
    Plus,
    AlertCircle,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StickerManagement() {
    const [categoryName, setCategoryName] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const webpFiles = files.filter(f => f.name.toLowerCase().endsWith('.webp') || f.type === 'image/webp');
        
        if (webpFiles.length < files.length) {
            setError("Certains fichiers n'étaient pas au format .webp et ont été ignorés.");
        }

        setSelectedFiles(prev => [...prev, ...webpFiles]);
        setError(null);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!categoryName.trim()) {
            setError("Veuillez donner un nom à ce pack de stickers.");
            return;
        }
        if (selectedFiles.length === 0) {
            setError("Veuillez sélectionner au moins un sticker.");
            return;
        }

        setUploading(true);
        setProgress(0);
        setCompleted([]);
        setError(null);

        const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const stickersRef = ref(db, `stickers/${categoryId}`);
        const newStickers = [];

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const filename = `stickers/${categoryId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

                // Upload to Supabase
                const { data, error: uploadError } = await supabase.storage
                    .from('resources')
                    .upload(filename, file, {
                        contentType: 'image/webp',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('resources')
                    .getPublicUrl(filename);

                newStickers.push(publicUrl);
                setCompleted(prev => [...prev, file.name]);
                setProgress(((i + 1) / selectedFiles.length) * 100);
            }

            // Save to Firebase
            const packData = {
                name: categoryName,
                id: categoryId,
                items: newStickers,
                updatedAt: new Date().toISOString()
            };

            await set(stickersRef, packData);

            // Success!
            setUploading(false);
            setSelectedFiles([]);
            setCategoryName("");
            alert("Pack de stickers créé avec succès !");

        } catch (err) {
            console.error("Upload failed:", err);
            setError(`L'upload a échoué: ${err.message}`);
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-primary/10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Package className="w-8 h-8 text-primary" />
                            Gestion des Stickers
                        </h1>
                        <p className="text-slate-500 mt-2">Créez et organisez vos packs de stickers .webp</p>
                    </div>
                    <Link href="/chat">
                        <Button variant="outline" className="rounded-xl">Retour au Chat</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nom du Pack</label>
                                    <Input 
                                        placeholder="Ex: Pepa Pig Fun, Coding Memes..."
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        className="h-14 px-6 rounded-2xl border-slate-200 focus:ring-primary/20 text-lg font-medium"
                                        disabled={uploading}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sélectionner les Stickers (.webp)</label>
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept=".webp"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        ref={fileInputRef}
                                        disabled={uploading}
                                    />
                                    <div 
                                        onClick={() => !uploading && fileInputRef.current.click()}
                                        className={cn(
                                            "border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                                            uploading && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-slate-900">Cliquez pour ajouter des fichiers</p>
                                        <p className="text-sm text-slate-400 mt-1">Glissez-déposez vos fichiers .webp ici</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {uploading && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <span className="text-slate-600">Upload en cours...</span>
                                            <span className="text-primary">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all duration-300 shadow-sm"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 text-center italic">
                                            Merci de ne pas fermer cette page
                                        </p>
                                    </div>
                                )}

                                <Button 
                                    className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                                    onClick={handleUpload}
                                    disabled={uploading || selectedFiles.length === 0}
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Upload de {selectedFiles.length} stickers...
                                        </span>
                                    ) : (
                                        "Créer le Pack de Stickers"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm min-h-[400px]">
                            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                Aperçu ({selectedFiles.length})
                            </h2>
                            
                            {selectedFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <p className="text-sm font-medium">Aucun fichier sélectionné</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="group relative aspect-square bg-slate-50 rounded-2xl p-2 border border-slate-100 flex items-center justify-center overflow-hidden">
                                            <img 
                                                src={URL.createObjectURL(file)} 
                                                alt="preview"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            <button 
                                                onClick={() => removeFile(i)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            {completed.includes(file.name) && (
                                                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                                                    <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => fileInputRef.current.click()}
                                        className="aspect-square bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 transition-all"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
