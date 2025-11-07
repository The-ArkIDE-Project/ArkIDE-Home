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

    // Download links - replace these with your actual download URLs
    const downloads = {
        windows: {
            x86: "https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v1.10.0/Ark.IDE.Setup.1.10.0.exe",
            // arm64: "https://example.com/arkide-windows-arm64.exe"
        },
        linux: {
            x86: "https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v1.10.0/Ark.IDE-1.10.0.AppImage",
            arm64: "https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v1.10.0/Ark.IDE-1.10.0-arm64.AppImage"
        }
    };

    let selectedOS = "windows";
    let version = "1.9.0";
    let selectedArch = "x86";

    function handleDownload(os, arch) {
        const url = downloads[os][arch];
        window.location.href = url;
    }
</script>

<svelte:head>
    <title>ArkIDE Desktop - Download</title>
    <meta name="title" content="ArkIDE Desktop - Download" />
    <meta property="og:title" content="ArkIDE Desktop - Download" />
    <meta property="twitter:title" content="ArkIDE Desktop - Download">
    <meta name="description" content="Download ArkIDE Desktop for Windows and Linux. Available for x86 and ARM64 architectures.">
    <meta property="twitter:description" content="Download ArkIDE Desktop for Windows and Linux. Available for x86 and ARM64 architectures.">
    <meta property="og:url" content="https://penguinmod.com/arkide-desktop">
    <meta property="twitter:url" content="https://penguinmod.com/arkide-desktop">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <h1>ArkIDE Desktop</h1>
        <p>Download the desktop version of ArkIDE for enhanced performance and offline capabilities.</p>
    </div>

    <div style="height: 16px;" />

    <div class="center-area">
        <div class="product-image-container">
            <img 
                src="/arkide.png" 
                alt="ArkIDE Desktop Interface"
                class="product-image"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22450%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22800%22 height=%22450%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%23999%22%3EArkIDE Desktop Screenshot%3C/text%3E%3C/svg%3E'"
            />
        </div>

        <div class="download-container">
            <h2>Download ArkIDE Desktop</h2>
            <p>Select your operating system and architecture:</p>

            <div class="selector-group">
                <div class="selector-label">Operating System:</div>
                <div class="button-group">
                    <Button on:click={() => selectedOS = 'windows'}>
                        <span class:selected-indicator={selectedOS === 'windows'}>
                            Windows
                        </span>
                    </Button>
                    <Button on:click={() => selectedOS = 'linux'}>
                        <span class:selected-indicator={selectedOS === 'linux'}>
                            Linux
                        </span>
                    </Button>
                </div>
            </div>

<div class="selector-group">
    <div class="selector-label">Architecture:</div>
    <div class="button-group">
        <Button on:click={() => selectedArch = 'x86'}>
            <span class:selected-indicator={selectedArch === 'x86'}>
                x86-64 (Intel/AMD)
            </span>
        </Button>

        {#if downloads[selectedOS].arm64} <!-- ✅ Only show ARM64 if link exists -->
            <Button on:click={() => selectedArch = 'arm64'}>
                <span class:selected-indicator={selectedArch === 'arm64'}>
                    ARM64
                </span>
            </Button>
        {/if}
    </div>
</div>


            <div class="download-action">
                <Button on:click={() => handleDownload(selectedOS, selectedArch)}>
                    Download for {selectedOS === 'windows' ? 'Windows' : 'Linux'} ({selectedArch === 'x86' ? 'x86-64' : 'ARM64'})
                </Button>
            </div>

            <p class="version-text">Latest version: 1.9.0</p>
        </div>

        <div class="content-section">
            <h2>Features</h2>
            <ul>
                <li>Native performance and faster load times</li>
                <li>Work offline without an internet connection</li>
                <li>Quick launch from your desktop</li>
            </ul>
        </div>

        <div class="content-section">
            <h2>Installation Instructions</h2>

            {#if selectedOS === 'windows'}
                <h3>Windows Installation</h3>
                <p><strong>Step 1:</strong> Download the installer by clicking the download button above.</p>
                <p><strong>Step 2:</strong> Run the downloaded <code>.exe</code> file. Windows may show a security warning - click "More info" and then "Run anyway" to proceed.</p>
                <p><strong>Step 3:</strong> Follow the setup wizard. We recommend keeping the default settings.</p>
                <p><strong>Step 4:</strong> Launch ArkIDE Desktop from the Start Menu or desktop shortcut.</p>
                <p class="note-text"><strong>Note:</strong> Windows 10 or later is required. For ARM64 systems, make sure you're running Windows 11 or later.</p>
            {:else}
                <h3>Linux Installation</h3>
                <p><strong>Step 1:</strong> Download the AppImage file by clicking the download button above.</p>
                <p><strong>Step 2:</strong> Make the file executable. Open a terminal in your downloads folder and run:</p>
                <p class="code-block">chmod +x ./Ark.IDE-{version}-{selectedArch}.AppImage</p>
                <p><strong>Step 3:</strong> Run the AppImage by double-clicking it or running from terminal:</p>
                <p class="code-block">./Ark.IDE-{version}-{selectedArch}.AppImage</p>
                <p><strong>Step 4 (Optional):</strong> Move the AppImage to <code>~/Applications</code> or <code>/opt</code> and create a desktop entry for easier access.</p>
                <p class="note-text"><strong>Note:</strong> Most modern Linux distributions are supported. FUSE is required to run AppImages - it's pre-installed on most systems.</p>
            {/if}
        </div>

        <div class="content-section">
            <h2>System Requirements</h2>
            <div class="requirements-grid">
                <div class="requirement-box">
                    <h3>Minimum</h3>
                    <p><strong>OS:</strong> Windows 10 / Any linux distro that supports Appimages</p>
                    <p><strong>RAM:</strong> 4 GB</p>
                    <p><strong>Storage:</strong> 100 MB free space</p>
                    <p><strong>Display:</strong> 1280x720 resolution</p>
                </div>
                <div class="requirement-box">
                    <h3>Recommended</h3>
                    <p><strong>OS:</strong> Windows 11 / Any linux distro that supports Appimages</p>
                    <p><strong>RAM:</strong> 4 GB or more</p>
                    <p><strong>Storage:</strong> 500 MB free space</p>
                    <p><strong>Display:</strong> 1920x1080 resolution or higher</p>
                </div>
            </div>
        </div>

        <div class="content-section">
            <h2>Frequently Asked Questions</h2>
            
            <p><strong>Is ArkIDE Desktop free?</strong></p>
            <p>Yes! ArkIDE Desktop is completely free to download and use.</p>

            <p><strong>How do I update ArkIDE Desktop?</strong></p>
            <p>Each time ArkIDE is updated you will need to download a new version.</p>

            <p><strong>What's the difference between the web and desktop versions?</strong></p>
            <p>The desktop version offers better performance, offline capabilities, Your projects can sync between both versions (web and desktop).</p>
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

    .product-image-container {
        width: 65%;
        margin-bottom: 32px;
    }

    .product-image {
        width: 100%;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.15);
    }

    :global(body.dark-mode) .product-image {
        border-color: rgba(255, 255, 255, 0.15);
    }

    .download-container {
        width: 65%;
        padding: 24px;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        margin-bottom: 32px;
    }

    :global(body.dark-mode) .download-container {
        border-color: rgba(255, 255, 255, 0.35);
    }

    .download-container h2 {
        margin-top: 0;
    }

    :global(body.dark-mode) .download-container h2,
    :global(body.dark-mode) .download-container p {
        color: white;
    }

    .selector-group {
        margin: 16px 0;
    }

    .selector-label {
        font-weight: bold;
        margin-bottom: 8px;
    }

    :global(body.dark-mode) .selector-label {
        color: white;
    }

    .button-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .selected-indicator {
        font-weight: bold;
        text-decoration: underline;
    }

    .download-action {
        margin-top: 24px;
    }

    .version-text {
        margin-top: 16px;
        font-size: 0.9rem;
        opacity: 0.7;
    }

    .content-section {
        width: 65%;
        margin-bottom: 32px;
    }

    .content-section h2 {
        color: #001affad;
        border-bottom: 2px solid #001affad;
        padding-bottom: 8px;
    }

    :global(body.dark-mode) .content-section h2 {
        color: #4d6bff;
        border-bottom-color: #4d6bff;
    }

    .content-section h3 {
        margin-top: 16px;
        margin-bottom: 8px;
    }

    :global(body.dark-mode) .content-section h3 {
        color: white;
    }

    .content-section ul {
        line-height: 1.8;
    }

    .content-section p {
        line-height: 1.6;
        margin: 12px 0;
    }

    :global(body.dark-mode) .content-section p {
        color: #ddd;
    }

    .content-section code {
        background: rgba(0, 26, 255, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
    }

    :global(body.dark-mode) .content-section code {
        background: rgba(77, 107, 255, 0.2);
        color: #b8c7ff;
    }

    .code-block {
        background: #f5f5f5;
        padding: 12px;
        border-left: 3px solid #001affad;
        font-family: 'Courier New', monospace;
        overflow-x: auto;
        margin: 12px 0;
    }

    :global(body.dark-mode) .code-block {
        background: #1a1a1a;
        border-left-color: #4d6bff;
        color: #ddd;
    }

    .note-text {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px;
        margin: 16px 0;
        color: #856404;
    }

    :global(body.dark-mode) .note-text {
        background: #3a3000;
        border-left-color: #ffc107;
        color: #ffd966;
    }

    .requirements-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 16px;
    }

    .requirement-box {
        border: 1px solid rgba(0, 0, 0, 0.35);
        padding: 16px;
        border-radius: 4px;
    }

    :global(body.dark-mode) .requirement-box {
        border-color: rgba(255, 255, 255, 0.35);
    }

    .requirement-box h3 {
        margin-top: 0;
        color: #001affad;
    }

    :global(body.dark-mode) .requirement-box h3 {
        color: #4d6bff;
    }

    .requirement-box p {
        margin: 8px 0;
    }

    :global(body.dark-mode) .requirement-box p {
        color: #ddd;
    }

    @media (max-width: 1200px) {
        .requirements-grid {
            grid-template-columns: 1fr;
        }
    }
</style>