'use client';

import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp, getApps, getApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxyQZhdDbY3CN0G0o0AXPG9hueTXh7_54",
    authDomain: "estt-community.firebaseapp.com",
    databaseURL: "https://estt-community-default-rtdb.firebaseio.com",
    projectId: "estt-community",
    storageBucket: "estt-community.firebasestorage.app",
    messagingSenderId: "154353945946",
    appId: "1:154353945946:web:70546c5aec1bae742b3763",
    measurementId: "G-SQVSELPERE"
};

export default function LatestReleaseBadge() {
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            const db = getDatabase(app);

            // Listen to the latest release
            const releaseRef = ref(db, 'releases/latest');

            const unsubscribe = onValue(
                releaseRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        setRelease(snapshot.val());
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error('Error fetching release:', error);
                    setError(error.message);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } catch (err) {
            console.error('Error setting up listener:', err);
            setError(err.message);
            setLoading(false);
        }
    }, []);

    if (loading || error || !release) {
        return null;
    }

    return (
        <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full hover:border-blue-400 transition-colors group"
            title={`Latest release: ${release.name || release.tagName}`}
        >
            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    v{release.tagName.replace(/^v/, '')}
                </span>
            </span>
            {!release.draft && !release.prerelease && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Live</span>
            )}
            {release.prerelease && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Beta</span>
            )}
        </a>
    );
}
