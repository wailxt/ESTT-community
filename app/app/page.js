'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db as staticDb } from '@/lib/data';
import { db as firebaseDb, ref, get } from '@/lib/firebase';
import Hero from '@/components/features/marketing/Hero';
import AnnouncementCarousel from '@/components/features/marketing/AnnouncementCarousel';
import ProgramBanners from '@/components/features/marketing/ProgramBanners';
import SiteStats from '@/components/features/marketing/SiteStats';
import ClubsPreview from '@/components/features/marketing/ClubsPreview';
import AdsPreview from '@/components/features/marketing/AdsPreview';
import LatestActivity from '@/components/features/marketing/LatestActivity';
import StructuredData from '@/components/layout/StructuredData';

export default function AppHome() {
    const router = useRouter();
    const [stats, setStats] = useState({
        resources: 0,
        contributions: 0,
        modules: 0
    });
    const [allResources, setAllResources] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [studentAds, setStudentAds] = useState([]);
    const [loadingAds, setLoadingAds] = useState(true);

    useEffect(() => {
        if (!firebaseDb) return;

        const fetchData = async () => {
            try {
                const resourcesRef = ref(firebaseDb, 'resources');
                const resourcesSnap = await get(resourcesRef);

                const resourcesData = resourcesSnap.val() || {};
                const resourcesList = Object.entries(resourcesData).map(([id, res]) => ({
                    id,
                    ...res,
                    type: 'resource'
                }));

                setAllResources(resourcesList);

                let verifiedCount = 0;
                let pendingCount = 0;

                resourcesList.forEach(resource => {
                    if (resource.unverified === true) {
                        pendingCount++;
                    } else {
                        verifiedCount++;
                    }
                });

                const totalModules = Object.keys(staticDb.modules).reduce((sum, key) => {
                    return sum + staticDb.modules[key].length;
                }, 0);

                setStats({
                    resources: verifiedCount,
                    contributions: pendingCount,
                    modules: totalModules
                });

                const clubsRef = ref(firebaseDb, 'clubs');
                const clubsSnap = await get(clubsRef);
                let allClubs = [];
                if (clubsSnap.exists()) {
                    const clubsData = clubsSnap.val();
                    allClubs = Object.entries(clubsData)
                        .map(([id, data]) => ({ id, ...data }))
                        .filter(club => club.verified);

                    setClubs(allClubs.slice(0, 3));
                }
                setLoadingClubs(false);

                const clubPostsRef = ref(firebaseDb, 'clubPosts');
                const clubPostsSnap = await get(clubPostsRef);

                let allAnnouncements = [];
                if (clubPostsSnap.exists()) {
                    const allPostsData = clubPostsSnap.val();
                    Object.entries(allPostsData).forEach(([clubId, posts]) => {
                        const clubInfo = allClubs.find(c => c.id === clubId);
                        Object.entries(posts).forEach(([postId, post]) => {
                            if (['announcement', 'activity'].includes(post.type)) {
                                allAnnouncements.push({
                                    id: postId,
                                    clubId,
                                    clubName: clubInfo?.name || 'Club',
                                    clubLogo: clubInfo?.logo,
                                    themeColor: clubInfo?.themeColor,
                                    ...post
                                });
                            }
                        });
                    });
                }

                const adminAnnSnap = await get(ref(firebaseDb, 'adminAnnouncements'));
                if (adminAnnSnap.exists()) {
                    const adminData = adminAnnSnap.val();
                    Object.entries(adminData).forEach(([id, ann]) => {
                        allAnnouncements.push({
                            id,
                            clubName: 'EST Tétouan',
                            clubLogo: 'https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/resources/info.png',
                            themeColor: '#3b82f6',
                            ...ann,
                            isAdmin: true
                        });
                    });
                }

                allAnnouncements.sort((a, b) => b.createdAt - a.createdAt);

                const adsRef = ref(firebaseDb, 'studentAds');
                const adsSnap = await get(adsRef);
                const now = new Date();
                let liveAds = [];

                if (adsSnap.exists()) {
                    liveAds = Object.entries(adsSnap.val()).map(([id, data]) => ({
                        id,
                        ...data
                    }))
                        .filter(ad => ad.status === 'live' && (!ad.expirationDate || new Date(ad.expirationDate) > now));

                    setStudentAds(liveAds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6));
                }
                setLoadingAds(false);

                const adSlides = liveAds.slice(0, 3).map(ad => ({
                    id: ad.id,
                    title: ad.title,
                    content: ad.description,
                    imageUrl: ad.url,
                    clubName: 'Opportunité',
                    clubLogo: 'https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/resources/adsavatar.png',
                    themeColor: '#10b981',
                    isAd: true,
                    link: ad.link,
                    createdAt: new Date(ad.createdAt).getTime()
                }));

                const combinedSlides = [...allAnnouncements, ...adSlides].sort((a, b) => b.createdAt - a.createdAt);
                const withImages = combinedSlides.filter(p => p.imageUrl);
                const withoutImages = combinedSlides.filter(p => !p.imageUrl);
                setAnnouncements([...withImages, ...withoutImages].slice(0, 10));

                setLoadingAnnouncements(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoadingClubs(false);
                setLoadingAnnouncements(false);
                setLoadingAds(false);
            }
        };

        fetchData();
    }, []);

    const handleSearchClick = () => {
        router.push('/search');
    };

    useEffect(() => {
        if (announcements.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % announcements.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [announcements.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % announcements.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    return (
        <main className="min-h-screen app-optimized">
            <StructuredData data={{
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                "name": "EST Tétouan Community App",
                "url": "https://estt-community.vercel.app/app",
                "logo": "https://estt-community.vercel.app/favicon.ico",
                "description": "Version optimisée pour mobile de la plateforme collaborative EST Tétouan Community",
            }} />

            <div className="mobile-app-wrapper">
                <Hero stats={stats} />

                <AnnouncementCarousel
                    announcements={announcements}
                    currentSlide={currentSlide}
                    setCurrentSlide={setCurrentSlide}
                    nextSlide={nextSlide}
                    prevSlide={prevSlide}
                />

                <ProgramBanners />

                <SiteStats stats={stats} />

                <ClubsPreview clubs={clubs} loading={loadingClubs} />

                <AdsPreview ads={studentAds} />

                <LatestActivity />
            </div>

            <style jsx global>{`
                /* Native App Optimization for /app route */
                .app-optimized {
                    background-color: #ffffff;
                }

                @media (max-width: 640px) {
                    .app-optimized section {
                        padding-top: 3rem !important;
                        padding-bottom: 3rem !important;
                    }

                    .app-optimized #hero {
                        padding-top: 4rem !important;
                        padding-bottom: 3rem !important;
                    }

                    .app-optimized h1 {
                        font-size: 2.25rem !important;
                        line-height: 1.1 !important;
                        letter-spacing: -0.02em !important;
                    }

                    .app-optimized h2 {
                        font-size: 1.75rem !important;
                        line-height: 1.2 !important;
                    }

                    .app-optimized .container {
                        padding-left: 1.25rem !important;
                        padding-right: 1.25rem !important;
                    }

                    /* Make cards feel more like app elements */
                    .app-optimized .rounded-3xl {
                        border-radius: 1.5rem !important;
                    }

                    .app-optimized .rounded-2xl {
                        border-radius: 1rem !important;
                    }

                    /* Tighten up spacing between sections */
                    .app-optimized section + section {
                        border-top: 1px solid #f1f5f9;
                    }

                    /* Improved search bar for mobile */
                    .app-optimized .max-w-2xl.mt-10 {
                        margin-top: 1.5rem !important;
                    }
                }
            `}</style>
        </main>
    );
}
