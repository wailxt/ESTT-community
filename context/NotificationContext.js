'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    getNotificationPermission,
    requestNotificationPermission,
    notifyMention,
    notifyDM,
    notifyCustom,
    showBrowserNotification,
} from '@/lib/browserNotifications';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NotificationContext = createContext({
    isSupported: false,
    permission: 'default',
    requestPermission: async () => 'unsupported',
    notify: () => null,
    notifyMention: () => null,
    notifyDM: () => null,
});

export const useNotifications = () => useContext(NotificationContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NotificationProvider({ children }) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');

    // Detect support & current permission on mount (client-only)
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    /**
     * Ask the browser for permission.
     * Exposed so any part of the UI (e.g. the bell button) can trigger the prompt.
     */
    const handleRequestPermission = useCallback(async () => {
        const result = await requestNotificationPermission();
        setPermission(result);
        return result;
    }, []);

    /**
     * Generic low-level notification — forwards to showBrowserNotification.
     */
    const notify = useCallback((options) => {
        if (!isSupported || permission !== 'granted') return null;
        return showBrowserNotification(options);
    }, [isSupported, permission]);

    /**
     * @mention notification.
     */
    const handleNotifyMention = useCallback((mentionedBy, roomName, preview) => {
        if (!isSupported || permission !== 'granted') return null;
        return notifyMention(mentionedBy, roomName, preview);
    }, [isSupported, permission]);

    /**
     * DM notification.
     */
    const handleNotifyDM = useCallback((senderName, preview, conversationUrl) => {
        if (!isSupported || permission !== 'granted') return null;
        return notifyDM(senderName, preview, conversationUrl);
    }, [isSupported, permission]);

    /**
     * Custom notification — for future use across the site.
     */
    const handleNotifyCustom = useCallback((title, body, opts) => {
        if (!isSupported || permission !== 'granted') return null;
        return notifyCustom(title, body, opts);
    }, [isSupported, permission]);

    return (
        <NotificationContext.Provider value={{
            isSupported,
            permission,
            requestPermission: handleRequestPermission,
            notify,
            notifyMention: handleNotifyMention,
            notifyDM: handleNotifyDM,
            notifyCustom: handleNotifyCustom,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
