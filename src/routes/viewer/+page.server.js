// +page.server.js
export async function load({ url }) {
    const projectId = url.searchParams.get('id');
    console.log('Server load called with projectId:', projectId);
    
    if (!projectId) {
        return {
            projectData: null,
            projectId: null,
            thumbnailUrl: null,
            error: null
        };
    }
    
    try {
        const apiUrl = `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=metadata`;
        console.log('Fetching:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            console.error('API response not OK:', response.status);
            throw new Error('Failed to fetch project data');
        }
        
        const projectData = await response.json();
        console.log('Fetched project data:', projectData.title);
        
        const thumbnailUrl = `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=thumbnail`;
        
        return {
            projectData,
            thumbnailUrl,
            projectId
        };
    } catch (err) {
        console.error('Server load error:', err);
        return {
            projectData: null,
            projectId: null,
            thumbnailUrl: null,
            error: err.message
        };
    }
}