<script>
    import { onMount } from "svelte";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import Button from "$lib/Button/Button.svelte";
    
    let currentLang = "en";
    let loading = false;
    let error = null;
    
    onMount(() => {
        Language.forceUpdate();
    });
    
    Language.onChange((lang) => {
        currentLang = lang;
    });
    
    async function getRandomProject() {
        loading = true;
        error = null;
        
        try {
            const response = await fetch('https://arkideapi.arc360hub.com/api/v1/projects/getrandomproject');
            
            if (!response.ok) {
                throw new Error('Failed to fetch random project');
            }
            
            const project = await response.json();
            
            // Redirect to the viewer page with the project ID
            window.location.href = `/viewer#${project.id}`;
        } catch (err) {
            error = 'Failed to load random project. Please try again.';
            loading = false;
            console.error('Error fetching random project:', err);
        }
    }
</script>

<svelte:head>
    <title>Project Roulette - ArkIDE</title>
    <meta name="title" content="Project Roulette - ArkIDE" />
    <meta property="og:title" content="Project Roulette - ArkIDE" />
    <meta property="twitter:title" content="Project Roulette - ArkIDE">
    <meta name="description" content="Discover random ArkIDE projects! Click the button to explore a randomly selected project.">
    <meta property="twitter:description" content="Discover random ArkIDE projects! Click the button to explore a randomly selected project.">
    <meta property="og:url" content="https://penguinmod.com/roulette">
    <meta property="twitter:url" content="https://penguinmod.com/roulette">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />
    
    <div class="section-info">
        <h1>ArkIDE Project Roulette</h1>
        <p>Discover random projects from the ArkIDE community!</p>
    </div>
    
    <div style="height: 16px;" />
    
    <div class="center-area">
        <div class="roulette-container">
            <p class="description">
                Click the button below to be taken to a random project.
                Who knows what you'll find?
            </p>
            
            <Button 
                on:click={getRandomProject}
                disabled={loading}
            >
                {#if loading}
                    Finding a project...
                {:else}
                    🎲 Get Random Project
                {/if}
            </Button>
            
            {#if error}
                <p class="error-message">{error}</p>
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
    
    :global(body.dark-mode) .main {
        color: white;
    }
    
    .section-info {
        background: #001affad;
        height: 8rem;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
    }
    
    .section-info h1 {
        margin: 0;
        font-size: 2.5rem;
    }
    
    .section-info p {
        margin: 0.5rem 0 0 0;
        font-size: 1.1rem;
        opacity: 0.9;
    }
    
    .center-area {
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
    }
    
    .roulette-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding: 2rem;
        max-width: 600px;
    }
    
    .description {
        text-align: center;
        font-size: 1.2rem;
        color: #333;
        margin: 0;
    }
    
    :global(body.dark-mode) .description {
        color: #ddd;
    }
    
    .roulette-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 1.5rem 3rem;
        font-size: 1.5rem;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .roulette-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .roulette-button:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
    }
    
    .roulette-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .error-message {
        color: #ff4444;
        font-weight: bold;
        text-align: center;
        margin: 0;
    }
    
    :global(body.dark-mode) .error-message {
        color: #ff6666;
    }
</style>