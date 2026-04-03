'use client';

import { useState, useEffect } from 'react';
import { db, ref, onValue, update } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Subcomponents
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import AdminResources from './AdminResources';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminClubRequests from './AdminClubRequests';
import AdminClubChanges from './AdminClubChanges';
import AdminAnnouncements from './AdminAnnouncements';
import AdminAds from './AdminAds';
import AdminSettings from './AdminSettings';
import AdminNotifications from './AdminNotifications';
import AdminFastContribute from './AdminFastContribute';
import AdminBugReports from './AdminBugReports';
import AdminShortUrls from './AdminShortUrls';
import AdminCommunication from './AdminCommunication';


export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0,
        resources: 0,
        pending: 0
    });
    const [resources, setResources] = useState([]);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [clubRequests, setClubRequests] = useState([]);
    const [clubChangeRequests, setClubChangeRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [notificationSettings, setNotificationSettings] = useState({
        enabled: true,
        email: 'thevcercle@gmail.com'
    });
    const [adminAnnouncements, setAdminAnnouncements] = useState([]);
    const [bugReports, setBugReports] = useState([]);

    // Admin Check
    useEffect(() => {
        if (authLoading) return;
        if (!user || profile?.role !== 'admin') {
            router.push('/');
        }
    }, [user, profile, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user || profile?.role !== 'admin') return;
        if (!db) return;

        const resourcesRef = ref(db, 'resources');
        const usersRef = ref(db, 'users');
        const reportsRef = ref(db, 'reports');

        const unsubResources = onValue(resourcesRef, (snapshot) => {
            const data = snapshot.val() || {};
            // Helper to flatten nested and determine nature
            let list = [];
            Object.entries(data).forEach(([key, val]) => {
                // Check if it's a direct resource or a module container
                if (val.type) { // It has a type, likely a resource
                    list.push({ id: key, ...val });
                } else {
                    // Likely a module container, check children
                    Object.entries(val).forEach(([childKey, childVal]) => {
                        if (typeof childVal === 'object' && childVal !== null) {
                            list.push({ id: childKey, ...childVal, _isNested: true, moduleId: key });
                        }
                    });
                }
            });
            // Sort by newest first
            list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setResources(list);
            setStats(prev => ({ ...prev, resources: list.length, pending: list.filter(r => r.unverified).length }));
        });

        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            setUsers(list);
            setStats(prev => ({ ...prev, users: list.length }));
        });

        const unsubReports = onValue(reportsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            setReports(list);
        });

        const bugReportsRef = ref(db, 'bugReports');
        const unsubBugReports = onValue(bugReportsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            setBugReports(list);
        });

        const clubRequestsRef = ref(db, 'clubRequests');
        const unsubClubRequests = onValue(clubRequestsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(req => req.status === 'pending');
            setClubRequests(list);
        });

        const clubChangeRequestsRef = ref(db, 'clubChangeRequests');
        const unsubClubChangeRequests = onValue(clubChangeRequestsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(req => req.status === 'pending');
            setClubChangeRequests(list);
        });

        const adminAnnouncementsRef = ref(db, 'adminAnnouncements');
        const unsubAdminAnnouncements = onValue(adminAnnouncementsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .sort((a, b) => b.createdAt - a.createdAt);
            setAdminAnnouncements(list);
        });

        // Fetch settings
        const settingsRef = ref(db, 'adminSettings/notifications');
        const unsubSettings = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setNotificationSettings(snapshot.val());
            } else {
                // Set default if not exists
                update(ref(db, 'adminSettings/notifications'), {
                    enabled: true,
                    email: 'thevcercle@gmail.com'
                });
            }
        });

        setLoading(false);

        return () => {
            unsubResources();
            unsubUsers();
            unsubReports();
            unsubClubRequests();
            unsubClubChangeRequests();
            unsubAdminAnnouncements();
            unsubSettings();
            unsubBugReports();
        };
    }, [user, profile, authLoading]);

    // Handle tab change from outside (e.g. sidebar)
    const handleTabChange = (status) => {
        setActiveTab(status);
    };


    if (authLoading || loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    if (!user || profile?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row min-h-screen">
                <AdminSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    profile={profile}
                    stats={stats}
                    openReportsCount={reports.length}
                    openBugReportsCount={bugReports.filter(b => b.status === 'open').length}
                    openClubRequestsCount={clubRequests.length}
                    openClubChangeRequestsCount={clubChangeRequests.length}
                />

                <main className="flex-grow p-6 md:p-10 overflow-auto">
                    {activeTab === 'overview' && (
                        <AdminOverview
                            stats={stats}
                            resources={resources}
                            setActiveTab={setActiveTab}
                        />
                    )}

                    {activeTab === 'resources' && (
                        <AdminResources resources={resources} />
                    )}

                    {activeTab === 'users' && (
                        <AdminUsers users={users} />
                    )}

                    {activeTab === 'reports' && (
                        <AdminReports reports={reports} />
                    )}

                    {activeTab === 'bugReports' && (
                        <AdminBugReports reports={bugReports} />
                    )}

                    {activeTab === 'clubRequests' && (
                        <AdminClubRequests requests={clubRequests} />
                    )}

                    {activeTab === 'clubChangeRequests' && (
                        <AdminClubChanges requests={clubChangeRequests} />
                    )}

                    {activeTab === 'announcements' && (
                        <AdminAnnouncements
                            announcements={adminAnnouncements}
                            userEmail={user?.email}
                        />
                    )}

                    {activeTab === 'ads' && (
                        <AdminAds />
                    )}

                    {activeTab === 'settings' && (
                        <AdminSettings
                            settings={notificationSettings}
                            setSettings={setNotificationSettings}
                        />
                    )}

                    {activeTab === 'communication' && (
                        <AdminCommunication users={users} />
                    )}

                    {activeTab === 'notifications' && (
                        <AdminNotifications users={users} />
                    )}

                    {activeTab === 'fastContribute' && (
                        <AdminFastContribute />
                    )}

                    {activeTab === 'shortUrls' && (
                        <AdminShortUrls />
                    )}
                </main>

            </div>
        </div>
    );
}