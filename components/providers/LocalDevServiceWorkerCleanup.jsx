'use client';

import { useEffect } from 'react';

export default function LocalDevServiceWorkerCleanup() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const hostname = window.location.hostname;
        const isLocalHost =
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0';

        if (!isLocalHost) return;

        const cleanup = async () => {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (registrations.length === 0) return;

                const unregistered = await Promise.all(
                    registrations.map((registration) => registration.unregister())
                );

                if (unregistered.some(Boolean) && !window.sessionStorage.getItem('sw-cleaned-local')) {
                    window.sessionStorage.setItem('sw-cleaned-local', 'true');
                    window.location.reload();
                }
            } catch (error) {
                console.error('Failed to cleanup local service workers:', error);
            }
        };

        cleanup();
    }, []);

    return null;
}
