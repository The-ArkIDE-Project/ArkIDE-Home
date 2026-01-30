export async function load({ url, setHeaders }) {
    const projectId = url.searchParams.get('id');
    
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
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch project data');
        }
        
        const projectData = await response.json();
        const thumbnailUrl = `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=thumbnail`;
        
        // Set cache headers so Discord can cache the result
        setHeaders({
            'cache-control': 'public, max-age=3600'
        });
        
        return {
            projectData,
            thumbnailUrl,
            projectId,
            // Add these for meta tags
            pageTitle: `${projectData.title} - ArkIDE Project`,
            pageDescription: projectData.instructions || 'View this ArkIDE project',
            pageImage: thumbnailUrl
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