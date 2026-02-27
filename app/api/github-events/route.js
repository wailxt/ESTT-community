import { NextResponse } from 'next/server';
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';
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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export async function POST(req) {
    try {
        const payload = await req.json();

        // Verify it's a release event
        if (payload.action && (payload.action === 'published' || payload.action === 'released') && payload.release) {
            const release = payload.release;

            // Extract relevant release information
            const releaseData = {
                tagName: release.tag_name,
                name: release.name || release.tag_name,
                body: release.body || '',
                url: release.html_url,
                createdAt: release.created_at,
                publishedAt: release.published_at,
                author: release.author?.login || 'Unknown',
                prerelease: release.prerelease,
                draft: release.draft,
                savedAt: serverTimestamp(),
            };

            // Save to Firebase Realtime Database
            // Store the latest release and also keep a history
            try {
                // Save as latest release
                await set(ref(db, 'releases/latest'), releaseData);

                // Also save to history with timestamp as key
                const timestamp = new Date().getTime();
                await set(ref(db, `releases/history/${timestamp}`), releaseData);

                console.log(`Release saved: ${release.tag_name}`);

                return NextResponse.json(
                    { success: true, message: 'Release data saved successfully', tagName: release.tag_name },
                    { status: 200 }
                );
            } catch (dbError) {
                console.error('Firebase error:', dbError);
                return NextResponse.json(
                    { error: 'Failed to save to database', details: dbError.message },
                    { status: 500 }
                );
            }
        } else {
            // Not a release event we care about
            return NextResponse.json(
                { success: true, message: 'Event ignored - not a release publication event' },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error('Error processing GitHub webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook', details: error.message },
            { status: 500 }
        );
    }
}

// Add a GET endpoint for testing
export async function GET(req) {
    return NextResponse.json(
        { message: 'GitHub Events webhook endpoint. Send POST requests from GitHub.' },
        { status: 200 }
    );
}
