import localFont from 'next/font/local';
import './globals.css';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { DialogProvider } from '@/context/DialogContext';
import LocalDevServiceWorkerCleanup from '@/components/providers/LocalDevServiceWorkerCleanup';
import { defaultMetadata } from '@/lib/metadata';

const canela = localFont({
    src: '../public/fonts/Canela-Medium.woff2', // Assuming this path, verified in globals.css
    variable: '--font-canela',
});

export const metadata = {
    ...defaultMetadata,
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: 'https://estt-community.vercel.app',
        siteName: 'EST Tétouan Community',
        title: 'EST Tétouan - Ressources Étudiants',
        description: 'Plateforme collaborative de partage de ressources académiques pour les étudiants de l\'EST Tétouan',
        images: [
            {
                url: 'https://estt-community.vercel.app/favicon.ico',
                width: 1200,
                height: 630,
                alt: 'EST Tétouan Community',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'EST Tétouan - Ressources Étudiants',
        description: 'Plateforme collaborative de partage de ressources académiques pour les étudiants de l\'EST Tétouan',
        images: ['https://estt-community.vercel.app/favicon.ico'],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#2563eb" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="ESTT" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=verified" />
            </head>
            <body className={`font-sans ${canela.variable} antialiased`} suppressHydrationWarning={true}>
                <DialogProvider>
                    <AuthProvider>
                        <LocalDevServiceWorkerCleanup />
                        <Header />
                        {children}
                        <Footer />
                        <div id="spinner-overlay" className="spinner-overlay hidden" aria-hidden="true">
                            <div className="spinner" role="status" aria-label="Chargement"></div>
                        </div>
                    </AuthProvider>
                </DialogProvider>
            </body>
        </html>
    );
}
