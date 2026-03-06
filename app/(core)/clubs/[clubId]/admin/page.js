'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, ref, get, push, set, update, remove, query, orderByChild, equalTo, onValue } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isClubAdmin, uploadClubImage } from '@/lib/clubUtils';
import { db as staticDb } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, FileText, Megaphone, Calendar, Edit, Trash2, Plus, Upload, Ticket, Users, LayoutDashboard, Settings, LineChart, Menu, X, Share2, ClipboardList, Scan, Bell } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { sendPrivateNotification, NOTIF_TYPES } from '@/lib/notifications';
import { generatePDF, generateCertificate, generateAttendanceList, generatePostPDF } from '@/lib/pdfUtils';


export default function ClubAdminPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const clubId = params.clubId;

    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Club info editing
    const [editingInfo, setEditingInfo] = useState(false);
    const [clubInfo, setClubInfo] = useState({ description: '', themeColor: '#64748b', socialLinks: {} });

    // Post creation
    const [newPost, setNewPost] = useState({ type: 'article', title: '', content: '', linkedFormId: '' });
    const [postImage, setPostImage] = useState(null);
    const [uploadingPostImage, setUploadingPostImage] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);

    // Change request
    const [changeRequest, setChangeRequest] = useState({ type: 'name', newName: '', newOrgChart: {} });
    const [submittingChange, setSubmittingChange] = useState(false);
    const [orgChartItems, setOrgChartItems] = useState([]); // For editing organigram

    // Members management
    const [newMember, setNewMember] = useState({ name: '', email: '', filiere: '' });
    const [addingMember, setAddingMember] = useState(false);

    // Logo upload
    const [logoFile, setLogoFile] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Posts list
    const [posts, setPosts] = useState([]);

    // Join Requests
    const [joinRequests, setJoinRequests] = useState([]);
    const [joinFormQuestions, setJoinFormQuestions] = useState([]); // Custom questions for join form

    // Tickets
    const [tickets, setTickets] = useState([]);
    const [sendingRemindersForEventId, setSendingRemindersForEventId] = useState(null);

    // Custom Forms
    const [forms, setForms] = useState([]);
    const [creatingForm, setCreatingForm] = useState(false);
    const [newForm, setNewForm] = useState({
        title: '',
        description: '',
        fields: [{ id: Date.now(), label: '', type: 'text', required: true }] // Improved initial ID
    });

    // Events Management
    const [events, setEvents] = useState([]);
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxCapacity: '',
        price: 0,
        status: 'published',
        fields: [
            { id: 'name', label: 'Nom complet', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true }
        ]
    });
    const [eventImage, setEventImage] = useState(null);
    const [uploadingEventImage, setUploadingEventImage] = useState(false);


    // Form Submissions
    const [selectedForm, setSelectedForm] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Rejection Modal for Tickets
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [ticketToReject, setTicketToReject] = useState(null);
    const [rejecting, setRejecting] = useState(false);

    const handleGeneratePDF = async (data, type, clubInfo, selectedForm = null) => {
        try {
            if (type === 'certificate') {
                await generateCertificate(data, clubInfo);
            } else {
                await generatePDF(data, type, clubInfo, selectedForm);
            }
            setMessage('Document exporté avec succès');
        } catch (error) {
            console.error("PDF Export Error:", error);
            setMessage("Erreur lors de l'exportation du PDF");
        }
    };

    useEffect(() => {
        if (clubId && !authLoading) {
            fetchClubData();
        }
    }, [clubId, authLoading]);

    useEffect(() => {
        if (club && user) {
            const adminStatus = isClubAdmin(user.email, club);
            setIsAdmin(adminStatus);

            // Check if president
            const presidentKey = Object.keys(club.organizationalChart || {}).find(k =>
                club.organizationalChart[k].role.toLowerCase() === 'président'
            );
            const isPresident = presidentKey && club.organizationalChart[presidentKey].email === user.email;

            // Initialize org chart for editing if needed
            if (club.organizationalChart) {
                const items = Object.entries(club.organizationalChart).map(([key, val], idx) => ({
                    id: idx + 1,
                    key, // original key
                    ...val
                }));
                setOrgChartItems(items);
                // Also set initial newOrgChart
                setChangeRequest(prev => ({ ...prev, newOrgChart: club.organizationalChart }));
            }

            if (!adminStatus) {
                setTimeout(() => {
                    router.push(`/clubs/${clubId}`);
                }, 2000);
            }
        }
    }, [club, user]);

    // Notification Settings
    const [notificationSettings, setNotificationSettings] = useState({
        enabled: true,
        email: ''
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (!db || !clubId) return;

        const settingsRef = ref(db, `clubs/${clubId}/settings/notifications`);

        // We use a separate listener for settings to avoid re-triggering main data fetch
        const unsubSettings = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setNotificationSettings(snapshot.val());
            } else {
                // Determine default email (President)
                let defaultEmail = '';
                if (club && club.organizationalChart) {
                    const presidentKey = Object.keys(club.organizationalChart).find(k =>
                        club.organizationalChart[k].role.toLowerCase().includes('président')
                    );
                    if (presidentKey) {
                        defaultEmail = club.organizationalChart[presidentKey].email;
                    }
                }

                // If we found a default email, we could auto-set it, or just use empty if not set yet
                // For now, let's just initialize state without writing to DB until they save, 
                // OR duplicate the default behavior if we want robust "default enabled"
                setNotificationSettings({ enabled: true, email: defaultEmail });
            }
        });

        return () => unsubSettings();
    }, [db, clubId, club]); // Depend on club to get president email once loaded

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await set(ref(db, `clubs/${clubId}/settings/notifications`), notificationSettings);
            setMessage("Paramètres de notification mis à jour !");
        } catch (err) {
            console.error(err);
            setMessage("Erreur lors de la sauvegarde.");
        } finally {
            setSavingSettings(false);
        }
    };

    // ... existing fetchClubData ...
    const fetchClubData = async () => {
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Club Details
            const clubRef = ref(db, `clubs/${clubId}`);
            const clubSnap = await get(clubRef);

            if (!clubSnap.exists()) {
                router.push('/clubs');
                return;
            }

            const clubData = { id: clubId, ...clubSnap.val() };
            setClub(clubData);

            // Initialize club info state for editing
            setClubInfo({
                description: clubData.description || '',
                themeColor: clubData.themeColor || '#64748b',
                socialLinks: clubData.socialLinks || {}
            });

            setJoinFormQuestions(clubData.joinFormQuestions || []);

            // Set Join Requests
            if (clubData.joinRequests) {
                const requests = Object.entries(clubData.joinRequests).map(([id, req]) => ({
                    id,
                    ...req
                }));
                setJoinRequests(requests);
            } else {
                setJoinRequests([]);
            }

            // Set Forms
            if (clubData.forms) {
                const formsList = Object.entries(clubData.forms).map(([id, f]) => ({
                    id,
                    ...f
                }));
                setForms(formsList);
            } else {
                setForms([]);
            }

            // 2. Fetch Posts
            const postsRef = ref(db, `clubPosts/${clubId}`);
            const postsSnap = await get(postsRef);
            if (postsSnap.exists()) {
                const postsList = Object.entries(postsSnap.val())
                    .map(([id, p]) => ({ id, ...p }))
                    .sort((a, b) => b.createdAt - a.createdAt);
                setPosts(postsList);
            } else {
                setPosts([]);
            }

            // 3. Fetch Tickets (for validation)
            const ticketsRef = ref(db, 'tickets');
            // We can't query by clubId directly easily unless indexed, so we fetch all and filter or ensure index
            // Assuming we might not have index on clubId for tickets yet, let's fetch all (careful with scale) 
            // OR better: use the existing tickets approach if possible. 
            // In the other file we used: query(ticketsRef, orderByChild('userId')...)
            // Here we want ALL tickets for THIS club.
            // Let's try to query by clubId if possible, or just fetch all and filter if dataset is small.
            // Given the previous user context "Fixing Firebase Indexing Error" for tickets, maybe we can assume index exists or just do client filter for now.
            // Let's use get(ticketsRef) and filter for safety until we are sure about indexes.
            const ticketsSnap = await get(ticketsRef);
            if (ticketsSnap.exists()) {
                const ticketsList = Object.entries(ticketsSnap.val())
                    .map(([id, t]) => ({ id, ...t }))
                    .filter(t => t.clubId === clubId)
                    .sort((a, b) => b.createdAt - a.createdAt);
                setTickets(ticketsList);
            } else {
                setTickets([]);
            }

            // 4. Fetch Events
            const eventsRef = ref(db, `clubs/${clubId}/events`);
            const eventsSnap = await get(eventsRef);
            if (eventsSnap.exists()) {
                const eventsList = Object.entries(eventsSnap.val())
                    .map(([id, e]) => ({ id, ...e }))
                    .sort((a, b) => b.createdAt - a.createdAt);
                setEvents(eventsList);
            } else {
                setEvents([]);
            }

        } catch (error) {
            console.error("Error fetching club admin data:", error);
            setMessage("Erreur lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async (form) => {
        setSelectedForm(form);
        setLoadingSubmissions(true);
        setSubmissions([]);

        try {
            const subRef = ref(db, `clubs/${clubId}/formSubmissions/${form.id}`);
            const subSnap = await get(subRef);

            if (subSnap.exists()) {
                const data = subSnap.val();
                const subArray = Object.entries(data)
                    .map(([id, val]) => ({ id, ...val }))
                    .sort((a, b) => b.submittedAt - a.submittedAt);
                setSubmissions(subArray);
            }
        } catch (error) {
            console.error(error);
            setMessage('Erreur chargement réponses');
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleUpdateInfo = async () => {
        setMessage('');
        setEditingInfo(true);

        try {
            const clubRef = ref(db, `clubs/${clubId}`);
            let updates = {
                description: clubInfo.description,
                themeColor: clubInfo.themeColor,
                socialLinks: clubInfo.socialLinks
            };

            if (logoFile) {
                const logoUrl = await uploadClubImage(logoFile);
                updates.logo = logoUrl;
                setClub(prev => ({ ...prev, logo: logoUrl }));
            }

            await update(clubRef, updates);

            setClub(prev => ({
                ...prev,
                description: clubInfo.description,
                themeColor: clubInfo.themeColor
            }));
            setMessage('Informations mises à jour avec succès');
            setEditingInfo(false);
            setLogoFile(null);
            setUploadingLogo(false);
        } catch (error) {
            console.error('Error updating club info:', error);
            setMessage('Erreur lors de la mise à jour');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setMessage('');
        setSubmittingPost(true);

        try {
            let imageUrl = '';
            if (postImage) {
                setUploadingPostImage(true);
                imageUrl = await uploadClubImage(postImage);
                setUploadingPostImage(false);
            }

            const postsRef = ref(db, `clubPosts/${clubId}`);
            const newPostRef = push(postsRef);

            const postData = {
                ...newPost,
                imageUrl,
                author: user.email,
                createdAt: Date.now()
            };

            await set(newPostRef, postData);

            setPosts(prev => [{ id: newPostRef.key, ...postData }, ...prev]);
            setNewPost({ type: 'article', title: '', content: '', linkedFormId: '' });
            setPostImage(null);
            setMessage('Publication créée avec succès');
        } catch (error) {
            console.error('Error creating post:', error);
            setMessage('Erreur lors de la création de la publication');
            setUploadingPostImage(false);
        } finally {
            setSubmittingPost(false);
        }
    };

    const handleApproveRequest = async (request) => {
        try {
            // Add to members
            const currentMembers = club.members || [];
            if (currentMembers.some(m => m.email === request.email)) {
                setMessage('Cet utilisateur est déjà membre.');
                await remove(ref(db, `clubs/${clubId}/joinRequests/${request.id}`)); // Just remove request
                fetchClubData();
                return;
            }

            const joinedAt = Date.now();
            const updatedMembers = [...currentMembers, {
                name: request.name,
                email: request.email,
                phone: request.phone,
                filiere: 'N/A', // Default or fetch if available
                id: request.userId || `member_${Date.now()}`,
                joinedAt: joinedAt
            }];

            await update(ref(db, `clubs/${clubId}`), {
                members: updatedMembers
            });

            // Send Acceptance Email with Certificate Link
            try {
                const { membershipAcceptedEmail } = await import('@/lib/email-templates');
                const memberId = request.userId || updatedMembers[updatedMembers.length - 1].id;
                const certificateLink = `${window.location.origin}/clubs/${clubId}/certificate/${memberId}`;
                const html = membershipAcceptedEmail(request.name, club.name, certificateLink);

                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: request.email,
                        subject: `Félicitations ! Bienvenue chez ${club.name}`,
                        html: html
                    })
                });
            } catch (emailErr) {
                console.error("Failed to send acceptance email:", emailErr);
            }

            // Remove request
            await remove(ref(db, `clubs/${clubId}/joinRequests/${request.id}`));

            setMessage('Demande approuvée. Membre ajouté et email de bienvenue envoyé.');
            fetchClubData();
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de l\'approbation.');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await remove(ref(db, `clubs/${clubId}/joinRequests/${requestId}`));
            setMessage('Demande rejetée.');
            fetchClubData();
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors du rejet.');
        }
    };

    const handleApproveTicket = async (ticketId) => {
        try {
            await update(ref(db, `tickets/${ticketId}`), {
                status: 'valid'
            });

            setMessage('Ticket approuvé.');
            fetchClubData();

            // Background Email and Notification
            (async () => {
                try {
                    // Find ticket details
                    const ticket = tickets.find(t => t.id === ticketId);

                    if (ticket) {
                        // Send In-App Notification
                        if (ticket.userId && ticket.userId !== 'guest') {
                            await sendPrivateNotification(ticket.userId, {
                                type: NOTIF_TYPES.SYSTEM,
                                title: "Billet validé !",
                                message: `Votre billet pour "${ticket.eventName}" a été validé par ${club?.name || 'le club'}.`,
                                icon: 'ticket',
                                action: {
                                    type: 'navigate',
                                    target: `/tickets/${ticketId}`
                                }
                            });
                        }

                        // Send Email
                        const { ticketValidatedEmail } = await import('@/lib/email-templates');
                        const html = ticketValidatedEmail(ticket, ticket.eventName, ticket.clubName);

                        let recipientEmail = ticket.userEmail;

                        if (!recipientEmail || recipientEmail === 'N/A') {
                            if (ticket.userId && ticket.userId !== 'guest') {
                                const userSnap = await get(ref(db, `users/${ticket.userId}`));
                                if (userSnap.exists()) {
                                    recipientEmail = userSnap.val().email;
                                }
                            }
                        }

                        if (recipientEmail) {
                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: recipientEmail,
                                    subject: `Billet Validé : ${ticket.eventName}`,
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send ticket validation email:", err);
                }
            })();
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de l\'approbation.');
        }
    };

    const openRejectionModal = (ticket) => {
        setTicketToReject(ticket);
        setRejectionReason('');
        setRejectionModalOpen(true);
    };

    const handleConfirmRejection = async () => {
        if (!ticketToReject) return;
        setRejecting(true);

        try {
            await executeTicketRejection(ticketToReject, rejectionReason);
        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue lors du rejet.");
        } finally {
            setRejecting(false);
            setRejectionModalOpen(false);
            setTicketToReject(null);
        }
    };

    const executeTicketRejection = async (ticket, reason) => {
        try {
            await remove(ref(db, `tickets/${ticket.id}`));

            setMessage('Ticket rejeté.');
            fetchClubData();

            // Background Email
            (async () => {
                try {
                    let recipientEmail = ticket.userEmail;

                    if (!recipientEmail || recipientEmail === 'N/A') {
                        // Try to find email from user node if missing in ticket (legacy)
                        if (ticket.userId && ticket.userId !== 'guest') {
                            const userSnap = await get(ref(db, `users/${ticket.userId}`));
                            if (userSnap.exists()) {
                                recipientEmail = userSnap.val().email;
                            }
                        }
                    }

                    if (recipientEmail) {
                        const { ticketRejectedEmail } = await import('@/lib/email-templates');
                        const html = ticketRejectedEmail(ticket, ticket.eventName, ticket.clubName, reason);

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: recipientEmail,
                                subject: `Mise à jour billet : ${ticket.eventName}`,
                                html: html
                            })
                        });
                    }
                } catch (emailErr) {
                    console.error("Failed to send ticket rejection email:", emailErr);
                }
            })();
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const handleRejectTicket = (ticket) => {
        openRejectionModal(ticket);
    };

    const handleAddField = () => {
        setNewForm(prev => ({
            ...prev,
            fields: [
                ...prev.fields,
                { id: Date.now(), label: '', type: 'text', required: false, options: '' }
            ]
        }));
    };

    const handleRemoveField = (id) => {
        setNewForm(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== id)
        }));
    };

    const handleUpdateField = (id, key, value) => {
        setNewForm(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.id === id ? { ...f, [key]: value } : f)
        }));
    };

    const handleCreateForm = async (e) => {
        e.preventDefault();

        try {
            if (!newForm.title) throw new Error("Le titre est requis");
            if (newForm.fields.length === 0) throw new Error("Au moins un champ est requis");


            setCreatingForm(true);

            const formsRef = ref(db, `clubs/${clubId}/forms`);
            const newFormRef = push(formsRef);

            await set(newFormRef, {
                ...newForm,
                createdAt: Date.now()
            });

            setMessage('Formulaire créé avec succès');
            setNewForm({
                title: '',
                description: '',
                fields: [{ id: Date.now(), label: '', type: 'text', required: true }]
            });
            fetchClubData();
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Erreur lors de la création');
        } finally {
            setCreatingForm(false);
        }
    };

    const handleDeleteForm = async (formId) => {
        if (!confirm('Êtes-vous sûr ? Cela supprimera également toutes les soumissions associées.')) return;

        try {
            await remove(ref(db, `clubs/${clubId}/forms/${formId}`));
            // Optionally remove submissions
            // await remove(ref(db, `clubs/${clubId}/formSubmissions/${formId}`));
            setMessage('Formulaire supprimé');
            fetchClubData();
        } catch (e) {
            console.error(e);
            setMessage('Erreur de suppression');
        }
    };

    // Event Management Functions
    const handleAddEventField = () => {
        setNewEvent(prev => ({
            ...prev,
            fields: [
                ...prev.fields,
                { id: Date.now(), label: '', type: 'text', required: false, options: '' }
            ]
        }));
    };

    const handleRemoveEventField = (id) => {
        setNewEvent(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== id)
        }));
    };

    const handleUpdateEventField = (id, key, value) => {
        setNewEvent(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.id === id ? { ...f, [key]: value } : f)
        }));
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            if (!newEvent.title || !newEvent.date) throw new Error("Le titre et la date sont requis");

            setCreatingEvent(true);

            let imageUrl = '';
            if (eventImage) {
                setUploadingEventImage(true);
                imageUrl = await uploadClubImage(eventImage);
                setUploadingEventImage(false);
            }

            const eventsRef = ref(db, `clubs/${clubId}/events`);
            const newEventRef = push(eventsRef);

            await set(newEventRef, {
                ...newEvent,
                imageUrl,
                registrationCount: 0,
                createdAt: Date.now()
            });

            setMessage('Événement créé avec succès');
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                maxCapacity: '',
                price: 0,
                status: 'published',
                fields: [
                    { id: 'name', label: 'Nom complet', type: 'text', required: true },
                    { id: 'email', label: 'Email', type: 'email', required: true }
                ]
            });
            setEventImage(null);
            fetchClubData();
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Erreur lors de la création');
        } finally {
            setCreatingEvent(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Êtes-vous sûr ? Les tickets associés resteront en base mais ne seront plus liés à un événement actif.')) return;

        try {
            await remove(ref(db, `clubs/${clubId}/events/${eventId}`));
            setMessage('Événement supprimé');
            fetchClubData();
        } catch (e) {
            console.error(e);
            setMessage('Erreur de suppression');
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const postRef = ref(db, `clubPosts/${clubId}/${postId}`);
            await remove(postRef);
            setPosts(prev => prev.filter(p => p.id !== postId));
            setMessage('Publication supprimée');
        } catch (error) {
            console.error('Error deleting post:', error);
            setMessage('Erreur lors de la suppression');
        }
    };

    const handleAddJoinQuestion = () => {
        setJoinFormQuestions(prev => [
            ...prev,
            { id: Date.now(), label: '', type: 'text', required: false, options: '' }
        ]);
    };

    const handleRemoveJoinQuestion = (id) => {
        setJoinFormQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handleUpdateJoinQuestion = (id, field, value) => {
        setJoinFormQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleSaveJoinQuestions = async () => {
        try {
            await set(ref(db, `clubs/${clubId}/joinFormQuestions`), joinFormQuestions);
            setMessage('Questions du formulaire mises à jour !');
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de la sauvegarde des questions');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!newMember.name || !newMember.email) return;

        setAddingMember(true);
        try {
            const currentMembers = club.members || [];
            const updatedMembers = [...currentMembers, { ...newMember, id: Date.now() }];

            await update(ref(db, `clubs/${clubId}`), {
                members: updatedMembers
            });

            setClub(prev => ({ ...prev, members: updatedMembers }));
            setNewMember({ name: '', email: '', filiere: '' });
            setMessage('Membre ajouté avec succès');
        } catch (error) {
            console.error('Error adding member:', error);
            setMessage('Erreur lors de l\'ajout du membre');
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberEmail) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

        try {
            const currentMembers = club.members || [];
            const updatedMembers = currentMembers.filter(m => m.email !== memberEmail);

            await update(ref(db, `clubs/${clubId}`), {
                members: updatedMembers
            });

            setClub(prev => ({ ...prev, members: updatedMembers }));
            setMessage('Membre supprimé avec succès');
        } catch (error) {
            console.error('Error removing member:', error);
            setMessage('Erreur lors de la suppression');
        }
    };

    // Manual event reminders (no automation – triggered from admin UI)
    const handleSendEventReminders = async (eventId) => {
        if (!confirm("Envoyer un email de rappel à tous les participants inscrits à cet événement ?")) return;

        try {
            setSendingRemindersForEventId(eventId);
            setMessage('');

            const event = events.find(e => e.id === eventId);
            if (!event) {
                throw new Error("Événement introuvable");
            }

            const relatedTickets = tickets.filter(t => t.eventId === eventId);
            if (relatedTickets.length === 0) {
                setMessage("Aucun participant inscrit pour cet événement.");
                return;
            }

            const notifiedEmails = new Set();
            let sentCount = 0;

            for (const ticket of relatedTickets) {
                let recipientEmail = ticket.userEmail;

                // Fallback: fetch from users/{userId} if needed
                if ((!recipientEmail || recipientEmail === 'N/A') && ticket.userId && ticket.userId !== 'guest') {
                    try {
                        const userSnap = await get(ref(db, `users/${ticket.userId}`));
                        if (userSnap.exists()) {
                            recipientEmail = userSnap.val().email;
                        }
                    } catch (err) {
                        console.error("Failed to fetch user for reminder:", err);
                    }
                }

                if (!recipientEmail || notifiedEmails.has(recipientEmail)) continue;
                notifiedEmails.add(recipientEmail);

                const subject = `Rappel : ${event.title}`;
                const html = `
                    <p>Bonjour,</p>
                    <p>Ceci est un rappel pour l'événement <strong>${event.title}</strong> organisé par <strong>${club?.name || 'votre club'}</strong>.</p>
                    <p>
                        Date : ${event.date || ''} ${event.time || ''}<br/>
                        Lieu : ${event.location || 'Campus'}
                    </p>
                    <p>À très bientôt,</p>
                    <p><strong>${club?.name || 'Club'}</strong></p>
                `;

                try {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: recipientEmail,
                            subject,
                            html
                        })
                    });
                    sentCount++;
                } catch (emailErr) {
                    console.error("Failed to send reminder email:", emailErr);
                }
            }

            if (sentCount > 0) {
                setMessage(`Rappels envoyés à ${sentCount} participant(s).`);
            } else {
                setMessage("Aucun email valide trouvé pour l'envoi des rappels.");
            }
        } catch (err) {
            console.error("Error while sending event reminders:", err);
            setMessage("Erreur lors de l'envoi des rappels.");
        } finally {
            setSendingRemindersForEventId(null);
        }
    };

    // Update org chart items state handler
    const handleOrgChartItemChange = (id, field, value) => {
        setOrgChartItems(prev => {
            const newItems = prev.map(item => item.id === id ? { ...item, [field]: value } : item);

            // Reconstruct organizationalChart object
            const newOrgChart = {};
            newItems.forEach(item => {
                const key = item.role.toLowerCase().replace(/\s+/g, '');
                newOrgChart[key] = {
                    name: item.name,
                    email: item.email,
                    role: item.role,
                    filiere: item.filiere,
                    photo: item.photo || ''
                };
            });
            setChangeRequest(r => ({ ...r, newOrgChart }));

            return newItems;
        });
    };

    const handleSubmitChangeRequest = async (e) => {
        e.preventDefault();
        setMessage('');
        setSubmittingChange(true);

        try {
            const requestsRef = ref(db, 'clubChangeRequests');
            const newRequestRef = push(requestsRef);

            const requestData = {
                clubId,
                clubName: club.name,
                changeType: changeRequest.type,
                newData: changeRequest.type === 'name'
                    ? { name: changeRequest.newName }
                    : changeRequest.newOrgChart,
                requestedBy: user.email,
                requestedAt: Date.now(),
                status: 'pending'
            };

            await set(newRequestRef, requestData);

            setMessage('Demande de modification envoyée aux administrateurs');
            setChangeRequest({ type: 'name', newName: '' });
        } catch (error) {
            console.error('Error submitting change request:', error);
            setMessage('Erreur lors de l\'envoi de la demande');
        } finally {
            setSubmittingChange(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Connexion requise</CardTitle>
                        <CardDescription>Vous devez être connecté pour accéder à cette page</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/login">Se connecter</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-12 pb-8 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
                        <p className="text-muted-foreground mb-4">
                            Vous n'êtes pas autorisé à gérer ce club. Seuls les membres de l'organigramme peuvent accéder à cette page.
                        </p>
                        <Button asChild>
                            <Link href={`/clubs/${clubId}`}>Retour au club</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link href={`/clubs/${clubId}`}>
                            <ArrowLeft className="w-4 h-4" />
                            Retour au club
                        </Link>
                    </Button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Gestion du club</h1>
                    <p className="text-muted-foreground">{club?.name}</p>
                </div>

                {message && (
                    <Alert className={message.includes('succès') || message.includes('envoyée') ? 'border-green-500 bg-green-50 mb-6' : 'mb-6'}>
                        {message.includes('succès') || message.includes('envoyée') ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar / Navigation */}
                        <div className={cn(
                            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:bg-transparent md:border-none",
                            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                        )}>
                            <div className="p-4 md:p-0">
                                <TabsList className="flex flex-col h-auto bg-transparent border-none gap-2 items-stretch p-0">
                                    <TabsTrigger value="info" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Settings className="w-4 h-4" /> Infos
                                    </TabsTrigger>
                                    <TabsTrigger value="members" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Users className="w-4 h-4" /> Membres
                                    </TabsTrigger>
                                    <TabsTrigger value="requests" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <ClipboardList className="w-4 h-4" /> Demandes
                                        {joinRequests.length > 0 && <Badge className="ml-auto bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{joinRequests.length}</Badge>}
                                    </TabsTrigger>
                                    <TabsTrigger value="events" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Calendar className="w-4 h-4" /> Événements
                                        {events.length > 0 && <Badge className="ml-auto bg-blue-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{events.length}</Badge>}
                                    </TabsTrigger>
                                    <TabsTrigger value="tickets" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Ticket className="w-4 h-4" /> Billetterie
                                        {tickets.filter(t => t.status === 'pending').length > 0 && <Badge className="ml-auto bg-orange-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{tickets.filter(t => t.status === 'pending').length}</Badge>}
                                    </TabsTrigger>
                                    <Link
                                        href={`/clubs/${clubId}/admin/scanner`}
                                        className="flex items-center gap-3 h-11 px-4 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors text-primary"
                                    >
                                        <Scan className="w-4 h-4" /> Ouvrir le Scanneur
                                    </Link>
                                    <TabsTrigger value="forms" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <FileText className="w-4 h-4" /> Formulaires
                                    </TabsTrigger>
                                    <TabsTrigger value="posts" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <LayoutDashboard className="w-4 h-4" /> Publications
                                    </TabsTrigger>
                                    <TabsTrigger value="create" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Plus className="w-4 h-4" /> Créer
                                    </TabsTrigger>
                                    <TabsTrigger value="changes" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Edit className="w-4 h-4" /> Modifications
                                    </TabsTrigger>
                                    <TabsTrigger value="settings" className="justify-start gap-3 h-11 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                                        <Settings className="w-4 h-4" /> Paramètres
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        {/* Overlay for mobile sidebar */}
                        {isSidebarOpen && (
                            <div
                                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}

                        {/* Main Content Area */}
                        <div className="flex-1 min-w-0">
                            <div className="md:hidden mb-4">
                                <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(true)} className="gap-2">
                                    <Menu className="w-4 h-4" /> Menu de gestion
                                </Button>
                            </div>

                            {/* Club Info Tab */}
                            <TabsContent value="info">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Informations du club</CardTitle>
                                        <CardDescription>
                                            Modifiez la description et les activités du club
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nom du club</Label>
                                            <Input value={club?.name} disabled />
                                            <p className="text-xs text-muted-foreground">
                                                Le nom ne peut pas être modifié directement. Utilisez l'onglet "Modifications" pour soumettre une demande.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Logo</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                                    {logoFile ? (
                                                        <img
                                                            src={URL.createObjectURL(logoFile)}
                                                            alt="New logo"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={club.logo}
                                                            alt="Current logo"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) setLogoFile(e.target.files[0]);
                                                        }}
                                                        disabled={editingInfo}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={clubInfo.description}
                                                onChange={(e) => setClubInfo(prev => ({ ...prev, description: e.target.value }))}
                                                rows={6}
                                                disabled={editingInfo}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="themeColor">Couleur du thème</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="color"
                                                    id="themeColor"
                                                    value={clubInfo.themeColor}
                                                    onChange={(e) => setClubInfo(prev => ({ ...prev, themeColor: e.target.value }))}
                                                    className="w-20 h-10 p-1 cursor-pointer"
                                                    disabled={editingInfo}
                                                />
                                                <div
                                                    className="w-10 h-10 rounded-full border shadow-sm"
                                                    style={{ backgroundColor: clubInfo.themeColor }}
                                                />
                                                <span className="text-sm text-muted-foreground font-mono">{clubInfo.themeColor}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Cette couleur sera utilisée comme thème pour votre page et comme fond par défaut pour les annonces sans image.
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Share2 className="w-5 h-5" /> Réseaux Sociaux
                                            </h3>
                                            <p className="text-sm text-muted-foreground">Ajoutez les liens vers vos réseaux sociaux pour les afficher sur votre profil.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { id: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram' },
                                                    { id: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook' },
                                                    { id: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin' },
                                                    { id: 'reddit', label: 'Reddit', icon: 'fa-brands fa-reddit' },
                                                    { id: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube' },
                                                    { id: 'github', label: 'GitHub', icon: 'fa-brands fa-github' },
                                                    { id: 'other', label: 'Autre site', icon: 'fa-solid fa-globe' }
                                                ].map((platform) => (
                                                    <div key={platform.id} className="space-y-2">
                                                        <Label htmlFor={`social-${platform.id}`} className="flex items-center gap-2">
                                                            <i className={platform.icon}></i> {platform.label}
                                                        </Label>
                                                        <Input
                                                            id={`social-${platform.id}`}
                                                            placeholder={platform.id === 'other' ? "https://votre-site.com" : `Lien ${platform.label}`}
                                                            value={clubInfo.socialLinks?.[platform.id] || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setClubInfo(prev => ({
                                                                    ...prev,
                                                                    socialLinks: {
                                                                        ...prev.socialLinks,
                                                                        [platform.id]: val
                                                                    }
                                                                }));
                                                            }}
                                                            disabled={editingInfo}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button onClick={handleUpdateInfo} disabled={editingInfo}>
                                            {editingInfo ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Mise à jour...
                                                </>
                                            ) : (
                                                'Enregistrer les modifications'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Events Management Tab */}
                            <TabsContent value="events">
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Créer un Événement</CardTitle>
                                            <CardDescription>
                                                Un événement dédié avec formulaire d'inscription et tickets automatiques.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleCreateEvent} className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Titre de l'événement</Label>
                                                        <Input
                                                            value={newEvent.title}
                                                            onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                                                            placeholder="Ex: Conférence Tech"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Lieu</Label>
                                                        <Input
                                                            value={newEvent.location}
                                                            onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))}
                                                            placeholder="Ex: Amphi A"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={newEvent.date}
                                                            onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Heure</Label>
                                                        <Input
                                                            type="time"
                                                            value={newEvent.time}
                                                            onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Capacité maximale (0 pour illimité)</Label>
                                                        <Input
                                                            type="number"
                                                            value={newEvent.maxCapacity}
                                                            onChange={e => setNewEvent(p => ({ ...p, maxCapacity: e.target.value }))}
                                                            placeholder="200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Prix (DH) (0 pour gratuit)</Label>
                                                        <Input
                                                            type="number"
                                                            value={newEvent.price}
                                                            onChange={e => setNewEvent(p => ({ ...p, price: Number(e.target.value) }))}
                                                            placeholder="0"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Image de couverture (Optionnel)</Label>
                                                        <div className="flex items-center gap-4">
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) setEventImage(e.target.files[0]);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            {eventImage && (
                                                                <div className="w-10 h-10 border rounded bg-slate-50 flex items-center justify-center">
                                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <Textarea
                                                        value={newEvent.description}
                                                        onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                                                        placeholder="Détails de l'événement..."
                                                        rows={3}
                                                    />
                                                </div>

                                                <div className="space-y-4 border p-4 rounded-md bg-slate-50/50">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="font-bold">Champs du formulaire d'inscription</Label>
                                                        <Button type="button" variant="outline" size="sm" onClick={handleAddEventField}>
                                                            <Plus className="w-4 h-4 mr-2" /> Ajouter un champ
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {newEvent.fields.map((field) => (
                                                            <div key={field.id} className="flex gap-2 items-start bg-white p-2 rounded-md border shadow-sm">
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                                                                    <Input
                                                                        placeholder="Nom du champ"
                                                                        value={field.label}
                                                                        onChange={e => handleUpdateEventField(field.id, 'label', e.target.value)}
                                                                        required
                                                                        disabled={['name', 'email'].includes(field.id)}
                                                                    />
                                                                    <Select
                                                                        value={field.type}
                                                                        onValueChange={v => handleUpdateEventField(field.id, 'type', v)}
                                                                        disabled={['name', 'email'].includes(field.id)}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="text">Texte court</SelectItem>
                                                                            <SelectItem value="textarea">Paragraphe</SelectItem>
                                                                            <SelectItem value="number">Nombre</SelectItem>
                                                                            <SelectItem value="email">Email</SelectItem>
                                                                            <SelectItem value="tel">Téléphone</SelectItem>
                                                                            <SelectItem value="select">Liste déroulante</SelectItem>
                                                                            <SelectItem value="radio">Choix unique (Radio)</SelectItem>
                                                                            <SelectItem value="checkbox">Choix multiples (Cocher)</SelectItem>
                                                                            <SelectItem value="boolean">Case à cocher (Oui/Non)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-xs">Requis ?</Label>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={field.required}
                                                                            onChange={e => handleUpdateEventField(field.id, 'required', e.target.checked)}
                                                                            disabled={['name', 'email'].includes(field.id)}
                                                                        />
                                                                    </div>
                                                                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                                                                        <div className="col-span-full space-y-1 mt-1">
                                                                            <Label className="text-xs font-semibold">Options (séparées par des virgules)</Label>
                                                                            <Input
                                                                                placeholder="Option 1, Option 2, Option 3"
                                                                                value={field.options || ''}
                                                                                onChange={e => handleUpdateEventField(field.id, 'options', e.target.value)}
                                                                                className="h-8"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive"
                                                                    onClick={() => handleRemoveEventField(field.id)}
                                                                    disabled={['name', 'email'].includes(field.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Button type="submit" disabled={creatingEvent} className="w-full">
                                                    {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                                    Créer l'Événement & Activer la Billetterie
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Événements en cours</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {events.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8 italic">Aucun événement créé.</p>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {events.map((event) => (
                                                        <div key={event.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4">
                                                            <div className="flex gap-4">
                                                                {event.imageUrl && (
                                                                    <div className="w-16 h-16 rounded-md overflow-hidden border shrink-0">
                                                                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                )}
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="font-bold text-lg">{event.title}</h3>
                                                                        <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                                                                            {event.status === 'published' ? 'Actif' : 'Brouillon'}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}</span>
                                                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.registrationCount || 0} / {event.maxCapacity || '∞'}</span>
                                                                        <span className="flex items-center gap-1 font-semibold text-primary">
                                                                            <Ticket className="w-3 h-3 text-muted-foreground mr-1" />
                                                                            {event.price > 0 ? `${event.price} DH` : 'Gratuit'}
                                                                        </span>
                                                                        <span className="flex items-center gap-1"><Ticket className="w-3 h-3" /> Billetterie active</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full lg:w-auto">
                                                                <Button variant="outline" size="sm" asChild className="w-full">
                                                                    <Link href={`/clubs/${clubId}/events/${event.id}/registration`} target="_blank">
                                                                        <Share2 className="w-4 h-4 mr-2" /> Lien
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full"
                                                                    onClick={() => {
                                                                        setActiveTab('tickets');
                                                                    }}
                                                                >
                                                                    <Users className="w-4 h-4 mr-2" />
                                                                    Tickets
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="bg-slate-50 border-slate-200 w-full"
                                                                    onClick={() => {
                                                                        const eventParticipants = tickets.filter(t => t.eventId === event.id);
                                                                        generateAttendanceList(eventParticipants, event, club);
                                                                        setMessage('Liste des participants exportée');
                                                                    }}
                                                                >
                                                                    <ClipboardList className="w-4 h-4 mr-2" />
                                                                    Export
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full"
                                                                    onClick={() => handleSendEventReminders(event.id)}
                                                                    disabled={sendingRemindersForEventId === event.id}
                                                                >
                                                                    {sendingRemindersForEventId === event.id ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                            Envoi...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Bell className="w-4 h-4 mr-2" />
                                                                            Rappels
                                                                        </>
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:bg-destructive/10 w-full col-span-2 sm:col-span-1"
                                                                    onClick={() => handleDeleteEvent(event.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                                                                    <span className="sm:hidden">Supprimer</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Members Tab */}
                            <TabsContent value="members">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Membres du club</CardTitle>
                                        <CardDescription>Gérez les membres réguliers de votre club.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Add Member Form */}
                                        <div className="p-4 bg-slate-50 rounded-lg border">
                                            <h3 className="text-sm font-semibold mb-3">Ajouter un membre</h3>
                                            <form onSubmit={handleAddMember} className="grid sm:grid-cols-4 gap-3">
                                                <Input
                                                    placeholder="Nom complet"
                                                    value={newMember.name}
                                                    onChange={(e) => setNewMember(p => ({ ...p, name: e.target.value }))}
                                                    required
                                                />
                                                <Input
                                                    placeholder="Email"
                                                    type="email"
                                                    value={newMember.email}
                                                    onChange={(e) => setNewMember(p => ({ ...p, email: e.target.value }))}
                                                    required
                                                />
                                                <Select
                                                    value={newMember.filiere}
                                                    onValueChange={(v) => setNewMember(p => ({ ...p, filiere: v }))}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
                                                    <SelectContent>
                                                        {staticDb.fields.map(f => (
                                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="submit" disabled={addingMember}>
                                                    <Plus className="w-4 h-4 mr-2" /> Ajouter
                                                </Button>
                                            </form>
                                        </div>

                                        {/* Members List */}
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Liste des membres ({club?.members?.length || 0})</h3>
                                            {(club?.members || []).length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">Aucun membre enregistré.</p>
                                            ) : (
                                                <div className="grid gap-2">
                                                    {club.members.map((member, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                                            <div>
                                                                <p className="font-medium text-sm">{member.name}</p>
                                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                                            </div>
                                                            <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
                                                                <Badge variant="secondary" className="text-xs">{member.filiere}</Badge>
                                                                <div /> {/* Spacer */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                                                                    onClick={() => handleGeneratePDF(member, 'certificate', club)}
                                                                    title="Générer le certificat"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                                    onClick={() => handleRemoveMember(member.email)}
                                                                    title="Supprimer le membre"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Posts Management Tab */}
                            <TabsContent value="posts">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Publications du club</CardTitle>
                                        <CardDescription>
                                            Gérez les articles, annonces et activités publiés
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {posts.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">
                                                Aucune publication pour le moment
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                {posts.map(post => (
                                                    <Card key={post.id} className="border-muted">
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <CardTitle className="text-lg">{post.title}</CardTitle>
                                                                    <p className="text-sm text-muted-foreground mt-1">
                                                                        {new Date(post.createdAt).toLocaleDateString('fr-FR')} • {post.type === 'article' ? 'Article' : post.type === 'announcement' ? 'Annonce' : 'Activité'}
                                                                    </p>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8"
                                                                        onClick={() => generatePostPDF(post, club)}
                                                                        title="Exporter en PDF"
                                                                    >
                                                                        <FileText className="w-4 h-4 mr-2" />
                                                                        PDF
                                                                    </Button>
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10">
                                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                                Supprimer
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle>Supprimer la publication</DialogTitle>
                                                                                <DialogDescription>
                                                                                    Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                            <DialogFooter>
                                                                                <Button variant="outline" onClick={() => { }}>Annuler</Button>
                                                                                <Button variant="destructive" onClick={() => handleDeletePost(post.id)}>
                                                                                    Supprimer
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                                                {post.content}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Create Post Tab */}
                            <TabsContent value="create">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Créer une publication</CardTitle>
                                        <CardDescription>
                                            Publiez un article, une annonce ou une activité
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleCreatePost} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Type de publication</Label>
                                                <Select
                                                    value={newPost.type}
                                                    onValueChange={(v) => setNewPost(prev => ({ ...prev, type: v }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="article">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                Article
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="announcement">
                                                            <div className="flex items-center gap-2">
                                                                <Megaphone className="w-4 h-4" />
                                                                Annonce
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="activity">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                Activité
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Image (optionnel)</Label>
                                                <div className="flex items-center gap-4">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) setPostImage(e.target.files[0]);
                                                        }}
                                                        disabled={submittingPost}
                                                    />
                                                    {postImage && (
                                                        <div className="text-sm text-green-600 flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Image sélectionnée
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="title">Titre</Label>
                                                <Input
                                                    id="title"
                                                    value={newPost.title}
                                                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                                                    placeholder="Titre de la publication"
                                                    required
                                                    disabled={submittingPost}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Lier un formulaire (Optionnel)</Label>
                                                <Select
                                                    value={newPost.linkedFormId}
                                                    onValueChange={(v) => setNewPost(prev => ({ ...prev, linkedFormId: v === 'none' ? '' : v }))}
                                                    disabled={submittingPost}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Aucun formulaire lié" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Aucun formulaire</SelectItem>
                                                        {forms.map(form => (
                                                            <SelectItem key={form.id} value={form.id}>
                                                                {form.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="content">Contenu</Label>
                                                <Textarea
                                                    id="content"
                                                    value={newPost.content}
                                                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                                    placeholder="Contenu de la publication..."
                                                    rows={8}
                                                    required
                                                    disabled={submittingPost}
                                                />
                                            </div>

                                            <Button type="submit" disabled={submittingPost}>
                                                {submittingPost ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Publication...
                                                    </>
                                                ) : (
                                                    'Publier'
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Join Requests Tab */}
                            <TabsContent value="requests">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Demandes d'adhésion</CardTitle>
                                        <CardDescription>Gérez les demandes pour rejoindre le club.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Invitation Link */}
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-blue-900">Lien d'invitation</h3>
                                                <p className="text-sm text-blue-700">Partagez ce lien pour inviter des étudiants à rejoindre le club.</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <Input
                                                    readOnly
                                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/clubs/${clubId}/join`}
                                                    className="bg-white"
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/clubs/${clubId}/join`);
                                                        setMessage('Lien copié !');
                                                    }}
                                                >
                                                    Copier
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Custom Questions Management */}
                                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold">Questions personnalisées</h3>
                                                    <p className="text-sm text-muted-foreground">Ajoutez des questions spécifiques pour votre formulaire d'adhésion.</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={handleAddJoinQuestion}>
                                                    <Plus className="w-4 h-4 mr-2" /> Ajouter une question
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="bg-white p-3 border rounded-md space-y-2 opacity-60">
                                                    <Badge variant="outline">Questions standard (fixes)</Badge>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2 p-2 border rounded bg-slate-50">Nom complet</div>
                                                        <div className="flex items-center gap-2 p-2 border rounded bg-slate-50">Email</div>
                                                        <div className="flex items-center gap-2 p-2 border rounded bg-slate-50">Téléphone</div>
                                                        <div className="flex items-center gap-2 p-2 border rounded bg-slate-50">Motivation</div>
                                                    </div>
                                                </div>

                                                {joinFormQuestions.map((q) => (
                                                    <div key={q.id} className="flex gap-2 items-start bg-white p-3 border rounded-md shadow-sm">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                                                            <Input
                                                                placeholder="Votre question"
                                                                value={q.label}
                                                                onChange={e => handleUpdateJoinQuestion(q.id, 'label', e.target.value)}
                                                            />
                                                            <div className="flex items-center gap-4">
                                                                <Select
                                                                    value={q.type}
                                                                    onValueChange={v => handleUpdateJoinQuestion(q.id, 'type', v)}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="text">Texte court</SelectItem>
                                                                        <SelectItem value="textarea">Paragraphe</SelectItem>
                                                                        <SelectItem value="number">Nombre</SelectItem>
                                                                        <SelectItem value="email">Email</SelectItem>
                                                                        <SelectItem value="tel">Téléphone</SelectItem>
                                                                        <SelectItem value="select">Liste déroulante</SelectItem>
                                                                        <SelectItem value="radio">Choix unique (Radio)</SelectItem>
                                                                        <SelectItem value="checkbox">Choix multiples (Cocher)</SelectItem>
                                                                        <SelectItem value="boolean">Case à cocher (Oui/Non)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <Label className="text-xs">Requis</Label>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={q.required}
                                                                        onChange={e => handleUpdateJoinQuestion(q.id, 'required', e.target.checked)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {['select', 'radio', 'checkbox'].includes(q.type) && (
                                                                <div className="md:col-span-2 space-y-1">
                                                                    <Label className="text-xs">Options (séparées par des virgules)</Label>
                                                                    <Input
                                                                        placeholder="Option 1, Option 2, Option 3"
                                                                        value={q.options || ''}
                                                                        onChange={e => handleUpdateJoinQuestion(q.id, 'options', e.target.value)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-red-50"
                                                            onClick={() => handleRemoveJoinQuestion(q.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-2 border-t">
                                                <Button size="sm" onClick={handleSaveJoinQuestions}>
                                                    Enregistrer les questions
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {joinRequests.length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                                                    <p className="text-muted-foreground">Aucune demande en attente.</p>
                                                </div>
                                            ) : (
                                                joinRequests.map((req) => (
                                                    <Card key={req.id} className="overflow-hidden">
                                                        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                            <div>
                                                                <h3 className="font-bold">{req.name}</h3>
                                                                <div className="text-sm text-muted-foreground space-y-1">
                                                                    <p>{req.email}</p>
                                                                    <p>{req.phone}</p>
                                                                    <p className="mt-2 text-slate-800 bg-slate-100 p-2 rounded text-xs italic">
                                                                        "{req.reason}"
                                                                    </p>

                                                                    {req.answers && Object.keys(req.answers).length > 0 && (
                                                                        <div className="mt-3 space-y-2 pt-2 border-t border-slate-200">
                                                                            <p className="text-xs font-semibold text-primary">Réponses complémentaires :</p>
                                                                            {joinFormQuestions.map(q => req.answers[q.id] && (
                                                                                <div key={q.id} className="text-xs">
                                                                                    <span className="font-medium text-slate-600">{q.label} : </span>
                                                                                    <span className="text-slate-700">
                                                                                        {typeof req.answers[q.id] === 'boolean'
                                                                                            ? (req.answers[q.id] ? 'Oui' : 'Non')
                                                                                            : req.answers[q.id]}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                            {/* If question was deleted but answer exists */}
                                                                            {Object.entries(req.answers).map(([qid, ans]) => (
                                                                                !joinFormQuestions.find(jq => jq.id.toString() === qid.toString()) && (
                                                                                    <div key={qid} className="text-xs italic opacity-70">
                                                                                        <span className="font-medium">Ancienne question ({qid}) : </span>
                                                                                        <span>{ans}</span>
                                                                                    </div>
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <p className="text-xs">
                                                                        Reçu le {new Date(req.submittedAt).toLocaleDateString('fr-FR')} à {new Date(req.submittedAt).toLocaleTimeString('fr-FR')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-wrap justify-end">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleGeneratePDF(req, 'join', club)}
                                                                    className="w-full sm:w-auto"
                                                                    title="Exporter en PDF"
                                                                >
                                                                    <FileText className="w-4 h-4 sm:mr-2" />
                                                                    <span className="sm:inline">PDF</span>
                                                                </Button>
                                                                <Button
                                                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                                                                    size="sm"
                                                                    onClick={() => handleApproveRequest(req)}
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                    Approuver
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    className="flex-1 sm:flex-none"
                                                                    size="sm"
                                                                    onClick={() => handleRejectRequest(req.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Rejeter
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Forms Tab */}
                            <TabsContent value="forms">
                                {selectedForm ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <Button variant="outline" onClick={() => setSelectedForm(null)}>
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                                            </Button>
                                            <div>
                                                <h2 className="text-2xl font-bold">{selectedForm.title}</h2>
                                                <p className="text-muted-foreground">Réponses reçues</p>
                                            </div>
                                        </div>

                                        <Card>
                                            <CardContent className="p-0 overflow-x-auto">
                                                {loadingSubmissions ? (
                                                    <div className="p-12 text-center">
                                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                                    </div>
                                                ) : submissions.length === 0 ? (
                                                    <div className="p-12 text-center text-muted-foreground">
                                                        Aucune réponse pour le moment.
                                                    </div>
                                                ) : (
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                                            <tr>
                                                                <th className="p-4 w-[200px]">Date</th>
                                                                {selectedForm.fields.map(field => (
                                                                    <th key={field.id} className="p-4 min-w-[150px]">{field.label}</th>
                                                                ))}
                                                                <th className="p-4 w-[100px] text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {submissions.map(sub => (
                                                                <tr key={sub.id} className="hover:bg-slate-50/50">
                                                                    <td className="p-4 text-slate-500">
                                                                        {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}
                                                                    </td>
                                                                    {selectedForm.fields.map(field => (
                                                                        <td key={field.id} className="p-4">
                                                                            {typeof sub.data?.[field.id] === 'boolean'
                                                                                ? (sub.data[field.id] ? 'Oui' : 'Non')
                                                                                : (sub.data?.[field.id] || '-')}
                                                                        </td>
                                                                    ))}
                                                                    <td className="p-4 text-right">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleGeneratePDF(sub, 'form', club)}
                                                                            title="Exporter en PDF"
                                                                        >
                                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {/* Create Form Card */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Créer un formulaire</CardTitle>
                                                <CardDescription>
                                                    Créez des formulaires personnalisés pour vos événements ou sondages.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <form onSubmit={handleCreateForm} className="space-y-4">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Titre du formulaire</Label>
                                                            <Input
                                                                value={newForm.title}
                                                                onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                                                                placeholder="Ex: Inscription Hackathon"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Description</Label>
                                                            <Input
                                                                value={newForm.description}
                                                                onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                                                                placeholder="Courte description..."
                                                            />
                                                        </div>
                                                    </div>


                                                    <div className="space-y-3 border p-4 rounded-md">
                                                        <div className="flex items-center justify-between">
                                                            <Label>Champs du formulaire</Label>
                                                            <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
                                                                <Plus className="w-4 h-4 mr-2" /> Ajouter un champ
                                                            </Button>
                                                        </div>

                                                        {newForm.fields.map((field) => (
                                                            <div key={field.id} className="flex gap-2 items-start">
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                                                                    <Input
                                                                        placeholder="Nom du champ"
                                                                        value={field.label}
                                                                        onChange={e => handleUpdateField(field.id, 'label', e.target.value)}
                                                                        required
                                                                    />
                                                                    <Select
                                                                        value={field.type}
                                                                        onValueChange={v => handleUpdateField(field.id, 'type', v)}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="text">Texte court</SelectItem>
                                                                            <SelectItem value="textarea">Paragraphe</SelectItem>
                                                                            <SelectItem value="number">Nombre</SelectItem>
                                                                            <SelectItem value="email">Email</SelectItem>
                                                                            <SelectItem value="tel">Téléphone</SelectItem>
                                                                            <SelectItem value="select">Liste déroulante</SelectItem>
                                                                            <SelectItem value="radio">Choix unique (Radio)</SelectItem>
                                                                            <SelectItem value="checkbox">Choix multiples (Cocher)</SelectItem>
                                                                            <SelectItem value="boolean">Case à cocher (Oui/Non)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-xs">Requis ?</Label>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={field.required}
                                                                            onChange={e => handleUpdateField(field.id, 'required', e.target.checked)}
                                                                        />
                                                                    </div>
                                                                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                                                                        <div className="col-span-full space-y-1 mt-1">
                                                                            <Label className="text-xs font-semibold">Options (séparées par des virgules)</Label>
                                                                            <Input
                                                                                placeholder="Option 1, Option 2, Option 3"
                                                                                value={field.options || ''}
                                                                                onChange={e => handleUpdateField(field.id, 'options', e.target.value)}
                                                                                className="h-8"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive"
                                                                    onClick={() => handleRemoveField(field.id)}
                                                                    disabled={newForm.fields.length <= 1}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <Button type="submit" disabled={creatingForm}>
                                                        {creatingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le formulaire'}
                                                    </Button>
                                                </form>
                                            </CardContent>
                                        </Card>

                                        {/* Existing Forms List */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Vos formulaires</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {forms.length === 0 ? (
                                                    <p className="text-muted-foreground text-center py-6">Aucun formulaire créé.</p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {forms.map(form => (
                                                            <Card key={form.id} className="bg-slate-50">
                                                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                    <div>
                                                                        <h3 className="font-bold flex items-center gap-2">
                                                                            {form.title}
                                                                        </h3>
                                                                        <p className="text-sm text-muted-foreground">{form.description}</p>
                                                                        <div className="flex gap-2 mt-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(`${window.location.origin}/clubs/${clubId}/forms/${form.id}`);
                                                                                    setMessage('Lien copié !');
                                                                                }}
                                                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                                            >
                                                                                Copier le lien
                                                                            </button>
                                                                            <span className="text-slate-300">|</span>
                                                                            <Link href={`/clubs/${clubId}/forms/${form.id}`} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                                Voir le formulaire
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => fetchSubmissions(form)}
                                                                            className="h-8"
                                                                        >
                                                                            <Users className="w-4 h-4 mr-2" />
                                                                            Réponses
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-destructive hover:bg-destructive/10 h-8"
                                                                            onClick={() => handleDeleteForm(form.id)}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Supprimer
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tickets Tab Content */}
                            <TabsContent value="tickets">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Gestion de la Billetterie</CardTitle>
                                        <CardDescription>Gérez les tickets émis pour vos événements.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {tickets.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-6">Aucun ticket émis.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {tickets.map(ticket => (
                                                        <Card key={ticket.id} className={`p-4 ${ticket.status === 'pending' ? 'border-orange-200 bg-orange-50' : 'bg-white'}`}>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-bold">
                                                                            {ticket.firstName ? `${ticket.firstName} ${ticket.lastName || ''}` : (ticket.userName || ticket.userEmail || 'Participant')}
                                                                        </h3>
                                                                        <Badge variant={ticket.status === 'valid' ? 'default' : 'secondary'} className={ticket.status === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}>
                                                                            {ticket.status === 'valid' ? 'Validé' : 'En attente'}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">Événement: {ticket.eventName}</p>
                                                                    <p className="text-xs text-muted-foreground">Date: {new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {ticket.status === 'pending' && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                                                            onClick={() => handleApproveTicket(ticket.id)}
                                                                            title="Approuver"
                                                                        >
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="h-8 w-8 p-0"
                                                                        onClick={() => handleRejectTicket(ticket)}
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Change Requests Tab */}
                            <TabsContent value="changes">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Demandes de modification</CardTitle>
                                        <CardDescription>
                                            Soumettez une demande pour modifier le nom du club ou l'organigramme
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Alert className="mb-6">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Les modifications du nom et de l'organigramme doivent être approuvées par les administrateurs de la plateforme.
                                            </AlertDescription>
                                        </Alert>

                                        <form onSubmit={handleSubmitChangeRequest} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Type de modification</Label>
                                                <Select
                                                    value={changeRequest.type}
                                                    onValueChange={(v) => setChangeRequest(prev => ({ ...prev, type: v }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="name">Nom du club</SelectItem>
                                                        <SelectItem value="organizationalChart">Organigramme</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {changeRequest.type === 'name' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="newName">Nouveau nom</Label>
                                                    <Input
                                                        id="newName"
                                                        value={changeRequest.newName}
                                                        onChange={(e) => setChangeRequest(prev => ({ ...prev, newName: e.target.value }))}
                                                        placeholder="Nouveau nom du club"
                                                        required
                                                        disabled={submittingChange}
                                                    />
                                                </div>
                                            )}

                                            {changeRequest.type === 'organizationalChart' && (
                                                <div className="space-y-4">
                                                    {(!user || !club.organizationalChart || !Object.entries(club.organizationalChart).find(([_, m]) => m.email === user.email && m.role.toLowerCase() === 'président')) ? (
                                                        <Alert variant="destructive">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <AlertDescription>
                                                                Seul le Président du club est autorisé à modifier l'organigramme.
                                                            </AlertDescription>
                                                        </Alert>
                                                    ) : (
                                                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                                                            <h3 className="font-medium text-sm mb-2">Modifier l'organigramme</h3>
                                                            {orgChartItems.map((item) => (
                                                                <div key={item.id} className="bg-white p-3 border rounded space-y-3">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Rôle</Label>
                                                                            <Input
                                                                                value={item.role}
                                                                                onChange={(e) => handleOrgChartItemChange(item.id, 'role', e.target.value)}
                                                                                className="h-8 text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Nom</Label>
                                                                            <Input
                                                                                value={item.name}
                                                                                onChange={(e) => handleOrgChartItemChange(item.id, 'name', e.target.value)}
                                                                                className="h-8 text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Email</Label>
                                                                            <Input
                                                                                value={item.email}
                                                                                onChange={(e) => handleOrgChartItemChange(item.id, 'email', e.target.value)}
                                                                                className="h-8 text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <p className="text-xs text-muted-foreground">
                                                                Note: Cette action soumettra une demande de validation aux administrateurs.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={submittingChange || (changeRequest.type === 'name' && !changeRequest.newName)}
                                            >
                                                {submittingChange ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Envoi...
                                                    </>
                                                ) : (
                                                    'Soumettre la demande'
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Paramètres du club</CardTitle>
                                        <CardDescription>
                                            Configurez les notifications et autres préférences.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSaveSettings} className="space-y-6">
                                            <h3 className="text-sm font-medium">Notifications</h3>
                                            <div className="flex items-center space-x-2 border p-4 rounded-md bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    id="notifEnabledClub"
                                                    checked={notificationSettings.enabled}
                                                    onChange={(e) => setNotificationSettings(p => ({ ...p, enabled: e.target.checked }))}
                                                    className="w-4 h-4"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor="notifEnabledClub"
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        Activer les notifications
                                                    </label>
                                                    <p className="text-[0.8rem] text-muted-foreground">
                                                        Si activé, le responsable recevra un email pour chaque nouvelle demande d'adhésion ou commande de billet.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Email de réception</Label>
                                                <Input
                                                    type="email"
                                                    value={notificationSettings.email}
                                                    onChange={(e) => setNotificationSettings(p => ({ ...p, email: e.target.value }))}
                                                    placeholder="president@est.com"
                                                    required={notificationSettings.enabled}
                                                    disabled={!notificationSettings.enabled}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Si laissé vide, nous tenterons d'utiliser l'email du Président actuel.
                                                </p>
                                            </div>

                                            <Button type="submit" disabled={savingSettings}>
                                                {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Sauvegarder les paramètres
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
                {/* Rejection Modal */}
                <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Motif du rejet</DialogTitle>
                            <DialogDescription>
                                Veuillez indiquer la raison pour laquelle vous rejetez ce billet.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Ex: Paiement non reçu, informations incorrectes..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectionModalOpen(false)} disabled={rejecting}>
                                Annuler
                            </Button>
                            <Button variant="destructive" onClick={handleConfirmRejection} disabled={!rejectionReason.trim() || rejecting}>
                                {rejecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirmer le rejet
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </main >
    );
}
