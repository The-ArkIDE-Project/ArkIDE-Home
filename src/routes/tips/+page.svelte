<script>
    import { onMount } from "svelte";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    
    // Import tips directly from the JSON file
    import tipsData from "$lib/LoadingSpinner/Tips.json";
    
    let currentLang = "en";
    let tips = [];
    
    // Handle different possible JSON structures
    if (Array.isArray(tipsData)) {
        tips = tipsData;
    } else if (tipsData.tips && Array.isArray(tipsData.tips)) {
        tips = tipsData.tips;
    } else {
        tips = [tipsData];
    }
    
    onMount(() => {
        Language.forceUpdate();
    });
    
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<svelte:head>
    <title>Tip Viewer - ArkIDE</title>
    <meta name="title" content="Tip Viewer - ArkIDE" />
    <meta property="og:title" content="Tip Viewer - ArkIDE" />
    <meta property="twitter:title" content="Tip Viewer - ArkIDE">
    <meta name="description" content="View all available tips and helpful information.">
    <meta property="twitter:description" content="View all available tips and helpful information.">
    <meta property="og:url" content="https://penguinmod.com/tip-viewer">
    <meta property="twitter:url" content="https://penguinmod.com/tip-viewer">
</svelte:head>

<NavigationBar />
<div class="main">
    <NavigationMargin />
    <div class="section-info">
        <h1>Tip Viewer</h1>
        <p>Browse all available tips and helpful information</p>
    </div>
    <div style="height: 16px;" />
    <div class="center-area">
        {#if tips.length === 0}
            <div class="no-tips">No tips available</div>
        {:else}
            <div class="tips-container">
                {#each tips as tip, index}
                    <div class="tip-card">
                        <div class="tip-number">Tip #{index + 1}</div>
                        <div class="tip-content">
                            {#if typeof tip === 'string'}
                                {tip}
                            {:else if tip.text}
                                {tip.text}
                            {:else}
                                {JSON.stringify(tip)}
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
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
        max-width: 100%;
        overflow-x: hidden;
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
        padding: 0 20px;
    }
    
    .no-tips {
        font-size: 1.2rem;
        padding: 2rem;
        text-align: center;
    }
    
    .tips-container {
        max-width: 800px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .tip-card {
        background: rgba(0, 0, 0, 0.08);
        border-left: 4px solid #001affad;
        padding: 1.5rem;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    :global(body.dark-mode) .tip-card {
        background: rgba(0, 0, 0, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .tip-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .tip-number {
        font-weight: bold;
        color: #001affad;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }
    
    .tip-content {
        color: rgba(0, 0, 0, 0.9);
        line-height: 1.6;
        font-size: 1rem;
    }
    
    :global(body.dark-mode) .tip-content {
        color: rgba(255, 255, 255, 0.9);
    }
</style>