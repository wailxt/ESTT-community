/**
 * browserNotifications.js
 * 
 * Pure utility for the Web Notifications API.
 * Framework-agnostic — can be called from anywhere in the app.
 * 
 * Browser support: Chrome 22+, Firefox 22+, Edge 14+, Safari 16.1+
 */

const APP_ICON = '/icons/icon-192x192.png';
const APP_NAME = 'ESTT Community';

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * Returns the current notification permission state.
 * Returns 'unsupported' if the Notification API is unavailable.
 */
export function getNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Requests notification permission from the browser.
 * Returns the resulting permission state.
 * Safe to call multiple times — if already granted/denied, resolves immediately.
 */
export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    try {
        const result = await Notification.requestPermission();
        return result;
    } catch {
        return 'denied';
    }
}

// ---------------------------------------------------------------------------
// Core show function
// ---------------------------------------------------------------------------

/**
 * Show a browser notification.
 *
 * @param {Object} options
 * @param {string}   options.title         - Notification title (required)
 * @param {string}  [options.body]         - Body text
 * @param {string}  [options.icon]         - Icon URL (defaults to app icon)
 * @param {string}  [options.tag]          - Deduplication tag (same tag replaces previous)
 * @param {string}  [options.url]          - URL to open on click
 * @param {boolean} [options.requireFocus] - If true, skip notification when tab is focused
 * @returns {Notification|null}
 */
export function showBrowserNotification({
    title,
    body = '',
    icon = APP_ICON,
    tag = APP_NAME,
    url = null,
    requireFocus = true,
}) {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;
    if (Notification.permission !== 'granted') return null;

    // Skip if the user is actively looking at the tab
    if (requireFocus && document.visibilityState === 'visible') return null;

    const notification = new Notification(title, {
        body,
        icon,
        badge: APP_ICON,
        tag,
    });

    if (url) {
        notification.onclick = () => {
            window.focus();
            window.location.href = url;
            notification.close();
        };
    } else {
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    // Auto-close after 6 seconds
    setTimeout(() => notification.close(), 6000);

    return notification;
}

// ---------------------------------------------------------------------------
// Pre-built helpers for common scenarios
// ---------------------------------------------------------------------------

/**
 * Notify the current user they were @mentioned in a group chat.
 *
 * @param {string} mentionedBy   - Display name of the person who mentioned them
 * @param {string} roomName      - Name of the chat room (e.g. "ICS 2024")
 * @param {string} [preview]     - First ~80 chars of the message
 * @param {string} [photoUrl]    - URL of the sender's avatar
 */
export function notifyMention(mentionedBy, roomName, preview = '', photoUrl = null) {
    return showBrowserNotification({
        title: `${mentionedBy} vous a mentionné dans ${roomName}`,
        body: preview ? `"${preview.slice(0, 80)}${preview.length > 80 ? '…' : ''}"` : '',
        icon: photoUrl || APP_ICON,
        tag: `mention_${mentionedBy}`,
        url: '/chat',
    });
}

/**
 * Notify the current user they received a new Direct Message.
 *
 * @param {string} senderName    - Display name of the sender
 * @param {string} [preview]     - Decrypted message preview
 * @param {string} [conversationUrl] - URL to the conversation (e.g. /messages/uid)
 * @param {string} [photoUrl]    - URL of the sender's avatar
 */
export function notifyDM(senderName, preview = '', conversationUrl = '/messages', photoUrl = null) {
    return showBrowserNotification({
        title: `Nouveau message de ${senderName}`,
        body: preview ? `"${preview.slice(0, 80)}${preview.length > 80 ? '…' : ''}"` : '',
        icon: photoUrl || APP_ICON,
        tag: `dm_${senderName}`,
        url: conversationUrl,
    });
}

/**
 * Generic notification — for future use across the site.
 *
 * @param {string} title
 * @param {string} [body]
 * @param {Object} [opts]  - Any extra options passed to showBrowserNotification
 */
export function notifyCustom(title, body = '', opts = {}) {
    return showBrowserNotification({ title, body, tag: 'estt_custom', ...opts });
}
