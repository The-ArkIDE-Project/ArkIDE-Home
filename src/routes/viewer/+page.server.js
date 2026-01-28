// +page.server.js
export async function load({ url }) {
    // Use query parameter instead of hash
    const projectId = url.searchParams.get('id');
    
    if (!projectId) {
        return {
            projectData: null,
            projectId: null,
            thumbnailUrl: null,
            error: null // Don't set error here, let client handle hash-based URLs
        };
    }

    try {
        const response = await fetch(
            `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=metadata`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch project data');
        }
        
        const projectData = await response.json();
        const thumbnailUrl = `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=thumbnail`;
        
        return {
            projectData,
            thumbnailUrl,
            projectId
        };
    } catch (err) {
        return {
            projectData: null,
            projectId: null,
            thumbnailUrl: null,
            error: err.message
        };
    }
}