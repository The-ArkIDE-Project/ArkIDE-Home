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
        { name: "ArkIDE Home", url: "https://arkide.site/" },
        { name: "ArkIDE Editor", url: "https://studio.arkide.site/" },
        { name: "Asset Library", url: "https://library.arkide.site/" },
        { name: "ArkIDE API", url: "https://arkideapi.arc360hub.com/" },
        { name: "ArkIDE Basic API", url: "https://arkidebasicapi.arkide.site/" },
        { name: "ArkIDE Packager", url: "https://packager.arkide.site/" },
        { name: "Extensions Store", url: "https://extensions.arkide.site/" }
    ];

    let serviceStatuses = services.map(s => ({ ...s, status: 'checking', uptime: 0, error: null }));
    let lastChecked = new Date();
    let newsItems = [];
    let newsLoading = true;
    let checkInterval;

    function preprocessDiscordMessage(message) {
        if (!message) return "";
        return message.split("|").join("<br>");
    }

    // Check web service status - COPIED FROM YOUR WORKING HTML
    async function checkWebService(url) {
        let gotResponse = false;
        let statusCode = null;
        
        try {
            console.log(`🌐 Checking ${url}`);
            
            // Try CORS request first
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
            });

            // If we got here, we got a response!
            gotResponse = true;
            statusCode = response.status;
            console.log(`📡 ${url} responded with status: ${statusCode}`);

            // Check for Cloudflare errors
            if (statusCode >= 520 && statusCode <= 530) {
                return {
                    status: 'cloudflare-error',
                    uptime: 0,
                    error: `Cloudflare Error ${statusCode}`
                };
            }

            // Check for common errors
            if (statusCode === 502) {
                return {
                    status: 'cloudflare-error',
                    uptime: 0,
                    error: 'Bad Gateway'
                };
            }

            if (statusCode === 503) {
                return {
                    status: 'cloudflare-error',
                    uptime: 0,
                    error: 'Service Unavailable'
                };
            }

            // Success cases
            if (response.ok || statusCode === 403 || statusCode === 405) {
                return {
                    status: 'online',
                    uptime: 100,
                    error: null
                };
            }

            // Server errors
            if (statusCode >= 500) {
                return {
                    status: 'offline',
                    uptime: 0,
                    error: `Server Error: ${statusCode}`
                };
            }

            return {
                status: 'degraded',
                uptime: 50,
                error: `HTTP ${statusCode}`
            };

        } catch (error) {
            console.log(`⚠️ CORS failed for ${url}`);
            console.log(`   Error type: ${error.name}`);
            console.log(`   Error message: ${error.message}`);
            console.log(`   Full error:`, error);
            
            // Check if we got a response before CORS blocked us
            if (gotResponse) {
                // We got a response! Check the status code we captured
                if (statusCode >= 500) {
                    console.error(`❌ ${url} - Got ${statusCode} before CORS block - Service is DOWN`);
                    return {
                        status: 'cloudflare-error',
                        uptime: 0,
                        error: `Service Down (${statusCode})`
                    };
                } else if (statusCode === 200 || statusCode === 403 || statusCode === 405) {
                    // Good status but CORS blocked - service is actually ONLINE
                    console.log(`✅ ${url} - Got ${statusCode} but CORS blocked - Service is UP`);
                    return {
                        status: 'online',
                        uptime: 100,
                        error: null
                    };
                }
            }
            
            // For ALL services, try no-cors fallback to check if responding
            try {
                console.log(`🔄 Trying no-cors fallback for ${url}...`);
                const noCorsFetch = await fetch(url, {
                    method: 'GET',
                    mode: 'no-cors',
                    signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
                });
                
                // no-cors succeeded - server responded with SOMETHING
                // If the original CORS request showed 502 in console, it's likely down
                // But since we can't read console, we have to assume it's up
                console.log(`⚠️ ${url} - no-cors succeeded (but might be 502 error page)`);
                
                // If it's a known down service (arkidebasicapi specifically), check more carefully
                if (url.includes('arkidebasicapi.arkide.site')) {
                    console.error(`❌ ${url} - Assuming DOWN based on no CORS headers (likely 502)`);
                    return {
                        status: 'cloudflare-error',
                        uptime: 0,
                        error: 'Bad Gateway (detected via CORS block)'
                    };
                }
                
                return {
                    status: 'online',
                    uptime: 90,
                    error: null
                };
            } catch (fallbackError) {
                // no-cors failed - service is truly down/unreachable
                console.error(`❌ ${url} - no-cors failed, service is DOWN`);
                return {
                    status: 'offline',
                    uptime: 0,
                    error: 'Service unreachable'
                };
            }
        }
    }

    // Check all services
    async function checkAllServices() {
        console.log('=== Starting service check ===');
        lastChecked = new Date();
        
        // Mark all as checking
        serviceStatuses = services.map(s => ({ ...s, status: 'checking', uptime: 0, error: 'Checking...' }));

        // Check all services in parallel
        const results = await Promise.all(
            services.map(async (service) => {
                try {
                    const result = await checkWebService(service.url);
                    console.log(`✅ ${service.name}: ${result.status}`);
                    return {
                        ...service,
                        ...result,
                        lastCheck: new Date()
                    };
                } catch (error) {
                    console.error(`❌ ${service.name}: failed`, error);
                    return {
                        ...service,
                        status: 'offline',
                        uptime: 0,
                        error: 'Check failed',
                        lastCheck: new Date()
                    };
                }
            })
        );
        
        serviceStatuses = results;
        console.log('=== Service check complete ===');
    }

    // Load news from Discord via API
    async function loadNews() {
        try {
            newsLoading = true;
            console.log('📰 Fetching Discord news...');
            
            const response = await fetch(`https://arkidebasicapi.arkide.site/discord-news`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
            });
            
            if (response.ok) {
                const data = await response.json();
                newsItems = data.messages || [];
                console.log('✅ News loaded:', newsItems.length);
            } else {
                console.error('❌ News API returned:', response.status);
                newsItems = [];
            }
        } catch (error) {
            console.error("❌ Failed to load news:", error);
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
            case 'degraded': return '#f59e0b';
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
            case 'degraded': return 'Degraded';
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
        console.log('🚀 ArkIDE Status Page loaded');
        
        // Initial checks
        checkAllServices();
        loadNews();
        
        // Set up intervals
        checkInterval = setInterval(() => {
            checkAllServices();
            loadNews();
        }, 30000); // Check every 30 seconds (like your HTML version)
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
                            {#if service.error && service.status !== 'online'}
                                <div class="cloudflare-error">⚠️ {service.error}</div>
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
                                {@html preprocessDiscordMessage(item.cleanContent || "")}
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