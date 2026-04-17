import { db, ref, get } from './firebase';

/**
 * Searches for resources in Firebase given a query and optional field filter.
 * @param {string} rawQuery - The search query from the AI.
 * @param {string} userField - The user's field (e.g., 'IDD').
 * @returns {Promise<Array>} - List of relevant resource objects.
 */
export async function searchResourcesAction(rawQuery, userField = null) {
    if (!db) return [];
    
    try {
        const query = rawQuery.toLowerCase().trim();
        const resourcesRef = ref(db, 'resources');
        const snapshot = await get(resourcesRef);
        
        if (!snapshot.exists()) return [];
        
        const allResources = snapshot.val();
        const results = Object.entries(allResources)
            .map(([id, data]) => ({ id, ...data }))
            .filter(res => {
                // Basic validation
                if (res.unverified === true) return false;
                if (!res.title) return false;
                
                // Match query in title, description, or module
                const titleMatch = res.title.toLowerCase().includes(query);
                const descMatch = res.description?.toLowerCase().includes(query);
                const moduleMatch = res.module?.toLowerCase().includes(query);
                
                const isMatch = titleMatch || descMatch || moduleMatch;
                
                if (!isMatch) return false;
                
                // Filter by user field if provided
                if (userField) {
                    const matchesField = res.field === userField || 
                        (res.fields && Array.isArray(res.fields) && res.fields.some(f => f.id === userField || f.fieldId === userField));
                    return matchesField;
                }
                
                return true;
            });
            
        return results.slice(0, 15); // Return top 15 candidates for AI selection
    } catch (error) {
        console.error('Error in searchResourcesAction:', error);
        return [];
    }
}
