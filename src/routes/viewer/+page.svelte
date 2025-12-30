<script>
    import { onMount, onDestroy } from "svelte";
    import { PUBLIC_API_URL } from "$env/static/public";

    // Components (adjust import paths as needed for your project)
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import VoteEmbed from "../embed/vote/+page.svelte"; // Adjust path as needed

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let projectId = "";
    let projectData = null;
    let loading = true;
    let error = null;
    let isDarkMode = false;
    let thumbnailUrl = "";
    let darkModeObserver;
    let originalDarkModeState = false;

    onMount(async () => {
        // Save the original dark mode state
        originalDarkModeState = document.body.classList.contains('dark-mode');
        
        // Force dark mode on this page only
        document.body.classList.add('dark-mode');
        
        // Prevent light mode toggle on this page
        darkModeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!document.body.classList.contains('dark-mode')) {
                        document.body.classList.add('dark-mode');
                    }
                }
            });
        });
        
        darkModeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Get project ID from URL hash
        const hash = window.location.hash;
        console.log("Hash:", hash);
        
        if (hash && hash.length > 1) {
            projectId = hash.substring(1);
            console.log("Project ID:", projectId);
            // Set thumbnail URL
            thumbnailUrl = `https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=thumbnail`;
        }

        // Check if dark mode is enabled
        isDarkMode = document.body.classList.contains('dark-mode');

        // Load emojis in parallel (don't await)
        loadEmojis().catch(err => console.error("Emoji load error:", err));

        if (projectId && projectId.trim() !== "") {
            await fetchProjectData();
        } else {
            error = "No project ID provided in URL hash";
            loading = false;
        }
    });


    onDestroy(() => {
        // Disconnect observer
        if (darkModeObserver) {
            darkModeObserver.disconnect();
        }
        
        // Restore the original dark mode state
        if (originalDarkModeState) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });

let emojiMap = {};
let emojisLoaded = false;

async function loadEmojis() {
    try {
        // Import the emoji list directly
        const { mockRequest } = await import("../../resources/emojis-compat.js");
        const emojis = mockRequest();
        
        emojis.forEach(emojiName => {
            if (typeof emojiName === 'string') {
                emojiMap[emojiName] = true;
            }
        });
        emojisLoaded = true;
        console.log("Loaded emojis:", Object.keys(emojiMap).length);
    } catch (err) {
        console.error("Failed to load emojis:", err);
    }
}

function parseEmojis(text) {
    if (!emojisLoaded || !text) return text;
    
    return text.replace(/:([a-zA-Z0-9_-]+):/g, (match, emojiName) => {
        if (emojiMap[emojiName]) {
            return `<img src="https://library.arkide.site/files/emojis/${emojiName}.png" alt="${emojiName}" class="emoji-inline" title=":${emojiName}:" />`;
        }
        return match;
    });
}

function parseMentions(text) {
    if (!text) return text;
    
    return text.replace(/@(\w+)/g, (match, username) => {
        return `<a href="/profile?user=${username}" class="mention-link">${match}</a>`;
    });
}

function parseHashtags(text) {
    if (!text) return text;
    
    return text.replace(/#(\w+)/g, (match, hashtag) => {
        return `<a href="/search?q=%23${hashtag}" class="hashtag-link">${match}</a>`;
    });
}

function parseContent(text) {
    if (!text) return text;
    
    // Parse in order: emojis -> mentions -> hashtags
    let parsed = parseEmojis(text);
    parsed = parseMentions(parsed);
    parsed = parseHashtags(parsed);
    return parsed;
}

    async function fetchProjectData() {
        try {
            const response = await fetch(`https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=metadata`);
            if (!response.ok) {
                throw new Error('Failed to fetch project data');
            }
            projectData = await response.json();
            await fetchRemixData();
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    function formatText(text) {
        if (!text) return '';
        // Replace \r\n and \n with <br> tags, then parse content
        let formatted = text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        return parseContent(formatted);
    }

    let remixData = null;

    async function fetchRemixData() {
        if (projectData && projectData.remix && projectData.remix !== "0") {
            try {
                const response = await fetch(`https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectData.remix}&requestType=metadata`);
                if (response.ok) {
                    remixData = await response.json();
                }
            } catch (err) {
                console.error("Failed to fetch remix data:", err);
            }
        }
    }
</script>

<svelte:head>
    <title>{projectData ? projectData.title : 'Loading...'} - ArkIDE Project</title>
    <meta name="title" content="{projectData ? projectData.title : 'ArkIDE Project'}" />
    <meta property="og:title" content="{projectData ? projectData.title : 'ArkIDE Project'}" />
    <meta property="twitter:title" content="{projectData ? projectData.title : 'ArkIDE Project'}">
    <meta name="description" content="{projectData ? projectData.instructions : 'View this ArkIDE project'}">
</svelte:head>

<NavigationBar />

<div class="main" style="--thumbnail-bg: url('{thumbnailUrl}')">
    <NavigationMargin />

    {#if loading}
        <div class="loading-container">
            <p>Loading project...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <h2>Error</h2>
            <p>{error}</p>
        </div>
    {:else if projectData}
        <div class="content-wrapper">
            <div class="title-container">
                <div class="title-author-section">
                    <img 
                        src="https://arkideapi.arc360hub.com/api/v1/users/getpfp?username={projectData.author.username}"
                        alt="{projectData.author.username}'s profile picture"
                        class="title-author-pfp"
                        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23cccccc%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E'"
                    />
                    <div class="title-text-section">
                        <h1 class="project-title">{projectData.title}</h1>
                        <a href="/profile?user={projectData.author.username}" class="title-author-link">
                            by {projectData.author.username}
                        </a>
                    </div>
                </div>
                <Button on:click={() => window.location.href = `https://studio.arkide.site/editor.html#${projectId}`}>
                    <span class="see-inside-content">
                        <img 
                            src="https://scratch.mit.edu/svgs/project/see-inside-white.svg" 
                            alt="See Inside"
                            class="see-inside-icon"
                        />
                        See Inside
                    </span>
                </Button>
            </div>
            
            <div class="main-content">
                <div class="left-column">
                <div class="embed-container">
                    <iframe 
                        src="https://studio.arkide.site/embed.html#{projectId}"
                        class="project-embed"
                        title="{projectData.title}"
                        frameborder="0"
                        allowfullscreen
                        sandbox="allow-scripts allow-same-origin allow-storage-access-by-user-activation"
                        style="color-scheme: auto"
                    ></iframe>
                </div>

                <div class="project-dates">
                    <span class="upload-date">Uploaded: {formatDate(projectData.date)}</span>
                    {#if projectData.lastUpdate && projectData.lastUpdate !== projectData.date}
                        <span class="update-date">(Updated: {formatDate(projectData.lastUpdate)})</span>
                    {/if}
                </div>
            </div>

            <div class="sidebar">

                    {#if remixData}
                        <div class="remix-section">
                            <p>
                            <img 
                            src="https://arkideapi.arc360hub.com/api/v1/users/getpfp?username={remixData.author.username}"
                            alt="{remixData.author.username}'s profile picture"
                            class="remix-pfp"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23cccccc%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E'"
                            />
                                Thanks to 
                                <a href="/profile?user={remixData.author.username}" class="remix-link">
                                    {remixData.author.username}
                                </a>
                                for the original project 
                                <a href="/viewer#{remixData.id}" class="remix-link">
                                    {remixData.title}
                                </a>
                            </p>
                        </div>
                    {/if}
                    <div class="info-box">
                        <h3>Instructions</h3>
                        <div class="info-content {!projectData.instructions ? 'empty-content' : ''}">
                            {#if projectData.instructions}
                                {@html formatText(projectData.instructions)}
                            {:else}
                                No instructions provided
                            {/if}
                        </div>
                    </div>

                    <div class="info-box">
                        <h3>Notes and Credits</h3>
                        <div class="info-content {!projectData.notes ? 'empty-content' : ''}">
                            {#if projectData.notes}
                                {@html formatText(projectData.notes)}
                            {:else}
                                No notes provided
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <div class="vote-container">
                <VoteEmbed projectId={projectId} />
            </div>
        </div>
    {/if}

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

    .loading-container,
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 32px;
    }

    .error-container h2 {
        color: #ff0000;
    }

    :global(body.dark-mode) .loading-container p,
    :global(body.dark-mode) .error-container p {
        color: white;
    }

    .content-wrapper {
        width: 90%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 0;
    }

    .project-title {
        font-size: 2.5rem;
        margin: 0 0 24px 0;
        color: #001affad;
    }

    :global(body.dark-mode) .project-title {
        color: #4d6bff;
    }

    .main-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        margin-bottom: 32px;
    }

    .left-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .embed-container {
        width: 100%;
        position: relative;
        padding-bottom: 75%; /* 4:3 aspect ratio */
    }

    .project-embed {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 8px;
    }

    :global(body.dark-mode) .project-embed {
        border-color: rgba(255, 255, 255, 0.15);
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .info-box {
        padding: 16px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.637);
    }

    :global(body.dark-mode) .info-box {
        border-color: rgba(255, 255, 255, 0.35);
        background: #1b1b1bb4;
    }

    .info-box h3 {
        margin: 0 0 12px 0;
        color: #001affad;
        font-size: 1.1rem;
        border-bottom: 2px solid #001affad;
        padding-bottom: 8px;
    }

    :global(body.dark-mode) .info-box h3 {
        color: #4d6bff;
        border-bottom-color: #4d6bff;
    }

    .info-content {
        line-height: 1.6;
        color: #333;
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
        max-width: 100%;
    }

    :global(body.dark-mode) .info-content {
        color: #ddd;
    }

    .vote-container {
        width: 100%;
        margin-top: 32px;
    }


    @media (max-width: 1200px) {
        .main-content {
            grid-template-columns: 1fr;
        }

        .embed-container {
            padding-bottom: 56.25%; /* 16:9 aspect ratio for smaller screens */
        }
    }

    .title-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .title-author-section {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .title-author-pfp {
        width: 72px;
        height: 72px;
        border-radius: 10%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .title-text-section {
        display: flex;
        flex-direction: column;
    }

    .project-title {
        font-size: 2.4rem;
        margin: 0;
        color: #001affad;
    }

    .title-author-link {
        font-size: 1rem;
        color: #666;
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .title-author-link:hover {
        color: #001affad;
        text-decoration: underline;
    }

    :global(body.dark-mode) .title-author-link {
        color: #999;
    }

    :global(body.dark-mode) .title-author-link:hover {
        color: #4d6bff;
    }
    .see-inside-content {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .see-inside-icon {
        width: 20px;
        height: 20px;
    }
    .remix-section {
        padding: 12px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        background: rgba(255, 200, 100, 0.1);
        font-size: 0.95rem;
    }

    :global(body.dark-mode) .remix-section {
        border-color: rgba(255, 255, 255, 0.35);
        background: rgba(255, 200, 100, 0.15);
    }

    .remix-section p {
        margin: 0;
        line-height: 1.5;
        display: flex;
        align-items: center; 
        gap: 8px;           
    }

    .remix-link {
        color: #001affad;
        font-weight: bold;
        text-decoration: none;
    }

    .remix-link:hover {
        text-decoration: underline;
    }

    :global(body.dark-mode) .remix-link {
        color: #4d6bff;
    }

    .remix-pfp {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
    }
    .project-dates {
        margin-top: 12px;
        font-size: 0.9rem;
        opacity: 0.8;
        color: #333;
    }

    :global(body.dark-mode) .project-dates {
        color: #ddd;
    }

    .update-date {
        margin-left: 8px;
        font-style: italic;
    }


:global(.emoji-inline) {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    vertical-align: middle;
    display: inline-block;
    margin: 0 2px;
    user-select: none;
    object-fit: contain;
}


:global(.mention-link),
:global(.hashtag-link) {
    color: #0074d9 !important;
    text-decoration: none !important;
    font-weight: 600 !important;
    transition: color 0.2s ease !important;
    display: inline !important;
}

:global(.mention-link:hover),
:global(.hashtag-link:hover) {
    color: #0056a8 !important;
    text-decoration: underline !important;
}

:global(body.dark-mode) :global(.mention-link),
:global(body.dark-mode) :global(.hashtag-link) {
    color: #4dabf7 !important;
}

:global(body.dark-mode) :global(.mention-link:hover),
:global(body.dark-mode) :global(.hashtag-link:hover) {
    color: #74c0fc !important;
}
.empty-content {
    color: #999;
    font-style: italic;
}

:global(body.dark-mode) .empty-content {
    color: #666;
}
.main::before {
    content: '';
    position: fixed;
    top: -30px;
    left: -42px;
    width: calc(100% + 80px);
    height: calc(100% + 80px);
    background-image: var(--thumbnail-bg);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(20px);
    z-index: -1;
    opacity: 1;
}

:global(body.dark-mode) .main::before {
    filter: blur(20px) brightness(0.2);
}

.main {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    min-width: 1000px;
    --thumbnail-bg: url('');
}
</style>