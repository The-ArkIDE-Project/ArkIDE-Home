<script>
    import { onMount } from "svelte";
    import { PUBLIC_API_URL } from "$env/static/public";

    // Components (adjust import paths as needed for your project)
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";

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

    onMount(async () => {
        // Get project ID from URL hash - try multiple times if needed
        const hash = window.location.hash;
        console.log("Hash:", hash); // Debug log
        
        if (hash && hash.length > 1) {
            projectId = hash.substring(1); // Remove the # symbol
            console.log("Project ID:", projectId); // Debug log
        }

        // Check if dark mode is enabled
        isDarkMode = document.body.classList.contains('dark-mode');

        if (projectId && projectId.trim() !== "") {
            await fetchProjectData();
        } else {
            error = "No project ID provided in URL hash";
            loading = false;
        }
    });

    async function fetchProjectData() {
        try {
            const response = await fetch(`https://arkideapi.arc360hub.com/api/v1/projects/getproject?projectID=${projectId}&requestType=metadata`);
            if (!response.ok) {
                throw new Error('Failed to fetch project data');
            }
            projectData = await response.json();
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    }

    function formatText(text) {
        if (!text) return '';
        // Replace \r\n and \n with <br> tags
        return text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
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

<div class="main">
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
                <h1 class="project-title">{projectData.title}</h1>
                <Button on:click={() => window.open(`https://studio.arkide.site/editor.html#${projectId}`, '_blank')}>
                    See Inside
                </Button>
            </div>
            
            <div class="main-content">
                <div class="embed-container">
                    <iframe 
                        src="https://studio.arkide.site/embed.html#{projectId}"
                        class="project-embed"
                        frameborder="0"
                        allowfullscreen
                        style="color-scheme: auto"
                    ></iframe>
                </div>

                <div class="sidebar">
                    <div class="author-section">
                        <img 
                            src="https://arkideapi.arc360hub.com/api/v1/users/getpfp?username={projectData.author.username}"
                            alt="{projectData.author.username}'s profile picture"
                            class="author-pfp"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23cccccc%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E'"
                        />
                        <a href="/profile?user={projectData.author.username}" class="author-link">
                            {projectData.author.username}
                        </a>
                    </div>

                    {#if projectData.instructions}
                        <div class="info-box">
                            <h3>Instructions</h3>
                            <div class="info-content">
                                {@html formatText(projectData.instructions)}
                            </div>
                        </div>
                    {/if}

                    {#if projectData.notes}
                        <div class="info-box">
                            <h3>Notes and Credits</h3>
                            <div class="info-content">
                                {@html formatText(projectData.notes)}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="vote-container">
                <iframe
                    src="https://arkide.site/embed/vote?id={projectId}#dark={isDarkMode}"
                    class="vote-embed"
                    frameborder="0"
                ></iframe>
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

    .author-section {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        background: white;
    }

    :global(body.dark-mode) .author-section {
        border-color: rgba(255, 255, 255, 0.35);
        background: #1a1a1a;
    }

    .author-pfp {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
    }

    .author-link {
        font-size: 1.2rem;
        font-weight: bold;
        color: #001affad;
        text-decoration: none;
    }

    .author-link:hover {
        text-decoration: underline;
    }

    :global(body.dark-mode) .author-link {
        color: #4d6bff;
    }

    .info-box {
        padding: 16px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        background: white;
    }

    :global(body.dark-mode) .info-box {
        border-color: rgba(255, 255, 255, 0.35);
        background: #1a1a1a;
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
    }

    :global(body.dark-mode) .info-content {
        color: #ddd;
    }

    .vote-container {
        width: 100%;
        margin-top: 32px;
    }

    .vote-embed {
        width: 100%;
        height: 900px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 8px;
    }

    :global(body.dark-mode) .vote-embed {
        border-color: rgba(255, 255, 255, 0.15);
    }

    @media (max-width: 1200px) {
        .main-content {
            grid-template-columns: 1fr;
        }

        .embed-container {
            padding-bottom: 56.25%; /* 16:9 aspect ratio for smaller screens */
        }
    }
    .see-inside-container {
        padding: 16px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        background: white;
    }

    :global(body.dark-mode) .see-inside-container {
        border-color: rgba(255, 255, 255, 0.35);
        background: #1a1a1a;
    }
    .title-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .project-title {
        font-size: 2.5rem;
        margin: 0;
        color: #001affad;
    }
</style>