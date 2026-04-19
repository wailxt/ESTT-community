import { db, ref, push, set } from './firebase';

/**
 * Logs a moderator action to the database for auditing purposes.
 * @param {string} moderatorId - The UID of the moderator performing the action.
 * @param {string} action - The type of action (e.g., 'accept', 'deletion', 'modification').
 * @param {Object} details - Additional information about the action.
 */
export async function logModeratorAction(moderatorId, action, details) {
    if (!moderatorId || !action) {
        console.warn('logModeratorAction: moderatorId or action is missing', { moderatorId, action });
        return;
    }

    try {
        const logsRef = ref(db, 'logs/moderator');
        const newLogRef = push(logsRef);
        
        await set(newLogRef, {
            timestamp: Date.now(),
            moderatorId,
            action,
            details
        });
    } catch (error) {
        console.error('Failed to log moderator action:', error);
    }
}
