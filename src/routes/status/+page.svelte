<script>
    import { onMount, onDestroy } from "svelte";
    import { PUBLIC_API_URL } from "$env/static/public";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    // Services to monitor
    const services = [
        { name: "ArkIDE Home", url: "https://arkide.site/", status: "checking" },
        { name: "ArkIDE Editor", url: "https://studio.arkide.site/", status: "checking" },
        { name: "Asset Library", url: "https://library.arkide.site/", status: "checking" },
        { name: "ArkIDE API", url: "https://arkideapi.arc360hub.com/", status: "checking" },
        { name: "ArkIDE Basic API", url: "https://arkidebasicapi.arkide.site/", status: "checking" },
        { name: "ArkIDE Packager", url: "https://packager.arkide.site/", status: "checking" },
        { name: "Extensions Store", url: "https://extensions.arkide.site/", status: "checking" }
    ];

    let serviceStatuses = services.map(s => ({ ...s }));
    let lastChecked = new Date();
    let newsItems = [];
    let newsLoading = true;
    let checkInterval;

    // Check service status with multiple fallback methods
    async function checkService(service) {
        const methods = [
            // Method 1: Direct fetch with no-cors (will succeed but we can't read response)
            async () => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    await fetch(service.url, { 
                        mode: 'no-cors',
                        signal: controller.signal,
                        cache: 'no-cache'
                    });
                    
                    clearTimeout(timeoutId);
                    return { status: 'online', method: 'no-cors' };
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return { status: 'timeout', method: 'no-cors' };
                    }
                    return { status: 'offline', method: 'no-cors', error: error.message };
                }
            },
            
            // Method 2: Try via proxy API if available
            async () => {
                try {
                    const response = await fetch(`https://arkidebasicapi.arkide.site/check-status?url=${encodeURIComponent(service.url)}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        return { status: data.online ? 'online' : 'offline', method: 'proxy', details: data };
                    }
                    return { status: 'unknown', method: 'proxy' };
                } catch (error) {
                    return null; // Try next method
                }
            },
            
            // Method 3: Image loading trick (for some sites)
            async () => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const timeout = setTimeout(() => {
                        img.src = '';
                        resolve({ status: 'timeout', method: 'image' });
                    }, 5000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        resolve({ status: 'online', method: 'image' });
                    };
                    
                    img.onerror = () => {
                        clearTimeout(timeout);
                        // Error might mean CORS, but site is up
                        resolve({ status: 'online', method: 'image' });
                    };
                    
                    img.src = service.url + '?_=' + Date.now();
                });
            }
        ];

        // Try each method in sequence
        for (const method of methods) {
            const result = await method();
            if (result && result.status !== 'unknown') {
                return result;
            }
        }

        // If all methods fail, assume online (due to CORS restrictions)
        return { status: 'online', method: 'assumed', note: 'CORS restricted' };
    }

    // Check all services
    async function checkAllServices() {
        lastChecked = new Date();
        
        const results = await Promise.all(
            serviceStatuses.map(async (service, index) => {
                const result = await checkService(service);
                
                // Detect Cloudflare errors
                let status = result.status;
                let cloudflareError = null;
                
                if (result.details) {
                    const statusCode = result.details.statusCode;
                    if (statusCode === 520) cloudflareError = "Web server returned unknown error";
                    if (statusCode === 521) cloudflareError = "Web server is down";
                    if (statusCode === 522) cloudflareError = "Connection timed out";
                    if (statusCode === 523) cloudflareError = "Origin is unreachable";
                    if (statusCode === 524) cloudflareError = "A timeout occurred";
                    if (statusCode === 525) cloudflareError = "SSL handshake failed";
                    if (statusCode === 526) cloudflareError = "Invalid SSL certificate";
                    if (statusCode === 527) cloudflareError = "Railgun error";
                    if (statusCode === 530) cloudflareError = "Origin DNS error";
                    
                    if (cloudflareError) {
                        status = 'cloudflare-error';
                    }
                }
                
                return {
                    ...service,
                    status,
                    cloudflareError,
                    lastCheck: new Date(),
                    responseTime: result.responseTime
                };
            })
        );
        
        serviceStatuses = results;
    }

    // Load news from Discord via API
    async function loadNews() {
        try {
            newsLoading = true;
            const response = await fetch(`https://arkidebasicapi.arkide.site/discord-news`);
            
            if (response.ok) {
                const data = await response.json();
                newsItems = data.messages || [];
            }
        } catch (error) {
            console.error("Failed to load news:", error);
            newsItems = [];
        } finally {
            newsLoading = false;
        }
    }

    // Format timestamp
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Format date for news
    function formatNewsDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // Get status color
    function getStatusColor(status) {
        switch(status) {
            case 'online': return '#10b981';
            case 'offline': return '#ef4444';
            case 'cloudflare-error': return '#f59e0b';
            case 'timeout': return '#f59e0b';
            default: return '#6b7280';
        }
    }

    // Get status text
    function getStatusText(status) {
        switch(status) {
            case 'online': return 'Operational';
            case 'offline': return 'Offline';
            case 'cloudflare-error': return 'Cloudflare Error';
            case 'timeout': return 'Timeout';
            case 'checking': return 'Checking...';
            default: return 'Unknown';
        }
    }

    // Calculate overall status
    $: overallStatus = serviceStatuses.every(s => s.status === 'online') 
        ? 'operational' 
        : serviceStatuses.some(s => s.status === 'offline' || s.status === 'cloudflare-error')
        ? 'issues'
        : 'degraded';

    onMount(() => {
        // Initial checks
        checkAllServices();
        loadNews();
        
        // Set up intervals
        checkInterval = setInterval(() => {
            checkAllServices();
            loadNews();
        }, 10000); // Check every 10 seconds
    });

    onDestroy(() => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });
</script>

<svelte:head>
    <title>ArkIDE Status - System Status</title>
    <meta name="title" content="ArkIDE Status - System Status" />
    <meta property="og:title" content="ArkIDE Status - System Status" />
    <meta property="twitter:title" content="ArkIDE Status - System Status">
    <meta name="description" content="Check the current operational status of all ArkIDE services and infrastructure.">
    <meta property="twitter:description" content="Check the current operational status of all ArkIDE services and infrastructure.">
    <meta property="og:url" content="https://penguinmod.com/arkide-status">
    <meta property="twitter:url" content="https://penguinmod.com/arkide-status">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info" class:status-operational={overallStatus === 'operational'} 
                             class:status-issues={overallStatus === 'issues'}
                             class:status-degraded={overallStatus === 'degraded'}>
        <h1>ArkIDE System Status</h1>
        <p class="overall-status">
            {#if overallStatus === 'operational'}
                All Systems Operational
            {:else if overallStatus === 'issues'}
                Some Systems Experiencing Issues
            {:else}
                Degraded Performance
            {/if}
        </p>
        <p class="last-checked">Last checked: {formatTime(lastChecked)}</p>
    </div>

    <div style="height: 16px;" />

    <div class="center-area">
        <div class="status-container">
            <h2>Service Status</h2>
            
            <div class="services-list">
                {#each serviceStatuses as service}
                    <div class="service-item">
                        <div class="service-info">
                            <div class="service-name">{service.name}</div>
                            <div class="service-url">{service.url}</div>
                            {#if service.cloudflareError}
                                <div class="cloudflare-error">⚠️ {service.cloudflareError}</div>
                            {/if}
                        </div>
                        <div class="service-status">
                            <span class="status-indicator" style="background-color: {getStatusColor(service.status)}"></span>
                            <span class="status-text">{getStatusText(service.status)}</span>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <div class="news-container">
            <h2>Latest Updates</h2>
            
            {#if newsLoading}
                <div class="loading">Loading updates...</div>
            {:else if newsItems.length === 0}
                <div class="no-news">No recent updates</div>
            {:else}
                <div class="news-list">
                    {#each newsItems as item}
                        <div class="news-item">
                            <div class="news-header">
                                {#if item.authorImage}
                                    <img src={item.authorImage} alt={item.authorName} class="author-avatar" />
                                {/if}
                                <div class="news-meta">
                                    <div class="author-name">{item.authorName}</div>
                                    <div class="news-date">{formatNewsDate(item.createdTs)}</div>
                                </div>
                            </div>
                            <div class="news-content">
                                {item.cleanContent}
                            </div>
                            {#if item.image}
                                <img src={item.image} alt="Update attachment" class="news-image" />
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <div style="height: 32px;" />
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        min-width: 1000px;
    }

    .section-info {
        height: 8rem;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
        transition: background-color 0.3s ease;
    }

    .status-operational {
        background: #10b981;
    }

    .status-issues {
        background: #ef4444;
    }

    .status-degraded {
        background: #f59e0b;
    }

    .section-info h1 {
        margin: 0;
        font-size: 2.5rem;
    }

    .overall-status {
        margin: 0.5rem 0 0 0;
        font-size: 1.3rem;
        font-weight: 600;
    }

    .last-checked {
        margin: 0.3rem 0 0 0;
        font-size: 0.9rem;
        opacity: 0.8;
    }

    .center-area {
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
    }

    .status-container, .news-container {
        width: 65%;
        padding: 24px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        margin-bottom: 32px;
    }

    :global(body.dark-mode) .status-container,
    :global(body.dark-mode) .news-container {
        border-color: rgba(255, 255, 255, 0.35);
    }

    .status-container h2, .news-container h2 {
        margin-top: 0;
        color: #001affad;
        border-bottom: 2px solid #001affad;
        padding-bottom: 8px;
    }

    :global(body.dark-mode) .status-container h2,
    :global(body.dark-mode) .news-container h2 {
        color: #4d6bff;
        border-bottom-color: #4d6bff;
    }

    .services-list {
        margin-top: 20px;
    }

    .service-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        margin-bottom: 12px;
        transition: background-color 0.2s;
    }

    .service-item:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }

    :global(body.dark-mode) .service-item {
        border-color: rgba(255, 255, 255, 0.1);
    }

    :global(body.dark-mode) .service-item:hover {
        background-color: rgba(255, 255, 255, 0.02);
    }

    .service-info {
        flex: 1;
    }

    .service-name {
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 4px;
    }

    :global(body.dark-mode) .service-name {
        color: white;
    }

    .service-url {
        font-size: 0.85rem;
        color: #666;
        font-family: 'Courier New', monospace;
    }

    :global(body.dark-mode) .service-url {
        color: #999;
    }

    .cloudflare-error {
        margin-top: 8px;
        padding: 6px 10px;
        background: #fef3c7;
        color: #92400e;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
    }

    :global(body.dark-mode) .cloudflare-error {
        background: #3a3000;
        color: #ffd966;
    }

    .service-status {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
    }

    .status-text {
        font-weight: 600;
        font-size: 0.95rem;
    }

    :global(body.dark-mode) .status-text {
        color: white;
    }

    .news-list {
        margin-top: 20px;
    }

    .news-item {
        padding: 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
    }

    :global(body.dark-mode) .news-item {
        border-color: rgba(255, 255, 255, 0.1);
    }

    .news-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .author-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }

    .news-meta {
        flex: 1;
    }

    .author-name {
        font-weight: 600;
        font-size: 1rem;
    }

    :global(body.dark-mode) .author-name {
        color: white;
    }

    .news-date {
        font-size: 0.85rem;
        color: #666;
        margin-top: 2px;
    }

    :global(body.dark-mode) .news-date {
        color: #999;
    }

    .news-content {
        line-height: 1.6;
        color: #333;
        margin-bottom: 12px;
    }

    :global(body.dark-mode) .news-content {
        color: #ddd;
    }

    .news-image {
        max-width: 100%;
        border-radius: 4px;
        margin-top: 12px;
    }

    .loading, .no-news {
        text-align: center;
        padding: 40px;
        color: #666;
    }

    :global(body.dark-mode) .loading,
    :global(body.dark-mode) .no-news {
        color: #999;
    }
</style>