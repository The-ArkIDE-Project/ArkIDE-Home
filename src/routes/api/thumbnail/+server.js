export async function GET({ url }) {
    const projectId = url.searchParams.get('id');
    if (!projectId) return new Response('Missing id', { status: 400 });

    const response = await fetch(
        `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=thumbnail`
    );

    if (!response.ok) return new Response('Not found', { status: 404 });

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new Response(buffer, {
        headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=3600'
        }
    });
}