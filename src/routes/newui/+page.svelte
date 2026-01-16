<script>
    import { onMount } from "svelte";
    import 'img-comparison-slider';
    
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
</script>

<svelte:head>
    <title>UI Overhaul - ArkIDE</title>
    <meta name="title" content="UI Overhaul - ArkIDE" />
    <meta property="og:title" content="UI Overhaul - ArkIDE" />
    <meta property="twitter:title" content="UI Overhaul - ArkIDE">
    <meta name="description" content="UI Overhaul description goes here.">
    <meta property="twitter:description" content="UI Overhaul description goes here.">
    <meta property="og:url" content="https://penguinmod.com/your-page">
    <meta property="twitter:url" content="https://penguinmod.com/your-page">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <h1>UI Overhaul</h1>
        <p>Revamping the user interface for a better experience.</p>
    </div>

    <div style="height: 16px;" />

    <div class="center-area">
        <h2>We have been working hard on a redesign and we are almost done!</h2>
        <h3>Homepage (before and after)</h3>
        
        <div class="comparison-container">
            <img-comparison-slider>
                <img slot="first" src="/before.png" alt="Before UI" />
                <img slot="second" src="/after.png" alt="After UI" />
            </img-comparison-slider>
        </div>
        <h3>Project Viewer (before and after)</h3>
        
        <div class="comparison-container">
            <img-comparison-slider>
                <img slot="first" src="/viewer-before.png" alt="Before UI" />
                <img slot="second" src="/viewer-after.png" alt="After UI" />
            </img-comparison-slider>
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

    .center-area h2 {
        margin: 16px 0;
    }

    :global(body.dark-mode) .center-area h2,
    :global(body.dark-mode) .center-area p {
        color: white;
    }

    .comparison-container {
        width: 80%;
        max-width: 1200px;
        margin: 24px 0;
    }

    .comparison-container img-comparison-slider {
        width: 100%;
        --divider-width: 2px;
        --divider-color: #001affad;
        --default-handle-opacity: 1;
    }

    :global(body.dark-mode) .comparison-container img-comparison-slider {
        --divider-color: #4d6bff;
    }

    .comparison-container img {
        width: 100%;
        display: block;
        border-radius: 8px;
    }
</style>