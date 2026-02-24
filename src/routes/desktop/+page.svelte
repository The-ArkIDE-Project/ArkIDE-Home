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

let version = "2.13.5";
// Download links - replace these with your actual download URLs
const downloads = {
    windows: {
        x86: `https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v${version}/Ark.IDE.Setup.${version}.exe`,
        // arm64: `https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v${version}/arkide-windows-arm64.exe`
    },
    linux: {
        x86: `https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v${version}/Ark.IDE-${version}.AppImage`,
        arm64: `https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v${version}/Ark.IDE-${version}-arm64.AppImage`,
        flatpak: "https://github.com/The-ArkIDE-Project/ArkIDE-Desktop"
    },
    MacOS: {
        x86: `https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v${version}/Ark.IDE-${version}.dmg`,
        arm64: `https://github.com/The-ArkIDE-Project/ArkIDE-Desktop/releases/download/v${version}/Ark.IDE-${version}-arm64.dmg`
    }
};

    let selectedOS = "windows";
    let selectedArch = "x86";
    let showFlatpak = false;

    function handleDownload(os, arch) {
        const url = downloads[os][arch];
        window.location.href = url;
    }
    function getFileName(os, arch) {
    const url = downloads[os]?.[arch];
    if (!url) return '';
    // Extract filename from URL (everything after the last /)
    return url.split('/').pop();
}
// Reactive filename — auto updates any time OS or Arch changes
$: fileName = getFileName(selectedOS, selectedArch);

</script>

<svelte:head>
    <title>ArkIDE Desktop - Download</title>
    <meta name="title" content="ArkIDE Desktop - Download" />
    <meta property="og:title" content="ArkIDE Desktop - Download" />
    <meta property="twitter:title" content="ArkIDE Desktop - Download">
    <meta name="description" content="Download ArkIDE Desktop for Windows and Linux, and MacOS. Available for x86 and ARM64 architectures.">
    <meta property="twitter:description" content="Download ArkIDE Desktop for Windows and Linux, and MacOS. Available for x86 and ARM64 architectures.">
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
                    <Button on:click={() => { 
                        selectedOS = 'windows'; 
                        selectedArch = 'x86';   // FORCE rerender for Windows
                        showFlatpak = false; 
                    }}>
                        <span class:selected-indicator={selectedOS === 'windows'}>Windows</span>
                    </Button>

                    <Button on:click={() => { selectedOS = 'linux'; showFlatpak = false; }}>
                        <span class:selected-indicator={selectedOS === 'linux'}>Linux</span>
                    </Button>

                    <Button on:click={() => { selectedOS = 'MacOS'; showFlatpak = false; }}>
                        <span class:selected-indicator={selectedOS === 'MacOS'}>MacOS</span>
                    </Button>
                </div>
            </div>
            <div class="selector-group">
                <div class="selector-label">Architecture:</div>
                <div class="button-group">
                    <Button on:click={() => { selectedArch = 'x86'; showFlatpak = false; }}>
                        <span class:selected-indicator={selectedArch === 'x86' && !showFlatpak}>
                            x86-64 (Intel/AMD)
                        </span>
                    </Button>

                    {#if selectedOS === 'linux'}
                        <Button on:click={() => { selectedArch = 'arm64'; showFlatpak = false; }}>
                            <span class:selected-indicator={selectedArch === 'arm64' && !showFlatpak}>
                                ARM64
                            </span>
                        </Button>

                        <Button on:click={() => { showFlatpak = true; selectedArch = null; }}>
                            <span class:selected-indicator={showFlatpak}>
                                Flatpak (x86 & ARM64)
                            </span>
                        </Button>
                    {:else if downloads[selectedOS].arm64}
                        <Button on:click={() => { selectedArch = 'arm64'; showFlatpak = false; }}>
                            <span class:selected-indicator={selectedArch === 'arm64'}>
                                ARM64
                            </span>
                        </Button>
                    {/if}
                </div>
            </div>
            <div class="download-action">
                <Button on:click={() => {
                    if (showFlatpak) {
                        window.location.href = downloads.linux.flatpak; // Flatpak link
                    } else {
                        handleDownload(selectedOS, selectedArch);
                    }
                }}>
                    Download for {selectedOS === 'windows' ? 'Windows' : selectedOS === 'linux' ? 'Linux' : 'macOS'} 
                    {selectedArch === 'x86' ? ' (x86-64)' : selectedArch === 'arm64' ? ' (ARM64)' : showFlatpak ? ' (Flatpak)' : ''}
                </Button>
            </div>
            <p>Version: {version}</p>
        </div> <!-- closes <div class="main"> -->

<div class="content-section">
    <h2>Installation Instructions</h2>

    {#if selectedOS === 'windows'}
        <h3>Windows Installation</h3>
        <p><strong>Step 1:</strong> Download the installer by clicking the download button above.</p>
        <p><strong>Step 2:</strong> Run the downloaded <code>{fileName}</code> file. Windows may show a security warning - click "More info" and then "Run anyway" to proceed.</p>
        <p><strong>Step 3:</strong> Follow the setup wizard. We recommend keeping the default settings.</p>
        <p><strong>Step 4:</strong> Launch ArkIDE Desktop from the Start Menu or desktop shortcut.</p>
        <p class="note-text"><strong>Note:</strong> Windows 7 or later is required. (Dont worry we wont end support for win7 and 10 untill electron COMPLETLY depreciates them.)</p>

    {:else if selectedOS === 'linux' && !showFlatpak}
        <h3>Linux AppImage Installation</h3>
        <p><strong>Step 1:</strong> Download the AppImage from above.</p>
        <p><strong>Step 2:</strong> Make it executable:</p>
        <p class="code-block">chmod +x ./{fileName}</p>
        <p><strong>Step 3:</strong> Run the AppImage:</p>
        <p class="code-block">./{fileName}</p>
        <p><strong>Step 4 (Optional):</strong> Move it to <code>~/Applications</code> or <code>/opt</code>.</p>

    {:else if selectedOS === 'MacOS'}
        <h3>macOS Installation</h3>
        <p><strong>Step 1:</strong> Download the DMG by clicking the download button above.</p>
        <p><strong>Step 2:</strong> Open the downloaded <code>{fileName}</code> file.</p>
        <p><strong>Step 3:</strong> Drag the ArkIDE icon to your Applications folder.</p>
        <p><strong>Step 4:</strong> Launch ArkIDE from your Applications folder. On first launch, you may need to right-click the app and select "Open" to bypass Gatekeeper security warnings.</p>
        <p><strong>Alternative:</strong> If you see "ArkIDE cannot be opened because it is from an unidentified developer," go to <strong>System Preferences → Security & Privacy → General</strong> and click "Open Anyway".</p>
        <p class="note-text"><strong>Note:</strong> macOS 10.13 (High Sierra) or later is required. For Apple Silicon Macs (M1/M2/M3), select ARM64. For Intel Macs, select x86-64.</p>
    {/if}

    {#if selectedOS === 'linux' && showFlatpak}
        <h3>Flatpak Installation</h3>
        <p><strong>Step 1:</strong> Ensure Flatpak is installed:</p>
        <p class="code-block">sudo apt install flatpak</p>

        <p><strong>Step 2:</strong> Add our own Flatpak repo:</p>
        <p class="code-block">flatpak remote-add --user --if-not-exists --no-gpg-verify arkide https://the-arkide-project.github.io/ArkIDE-Desktop/repo</p>

        <p><strong>Step 3:</strong> Install ArkIDE:</p>
        <p class="code-block">flatpak install --user arkide com.arkide.desktop</p>

        <p><strong>Step 4:</strong> Run ArkIDE:</p>
        <p class="code-block">flatpak run com.arkide.desktop</p>
    {/if}
</div>

        <div class="content-section">
            <h2>Features</h2>
            <ul>
                <li>Native performance and faster load times</li>
                <li>Work offline without an internet connection</li>
                <li>Quick launch from your desktop</li>
                <li>Discord RPC Compatibility, so people can see that your coding on ArkIDE</li>
                <li>Verson checker to see when your desktop app is out-of-date</li>
                <li>Flatpak Compatibility for easy installation on Linux</li>
            </ul>
        </div>

        <div class="content-section">
            <h2>System Requirements</h2>
            <div class="requirements-grid">
                <div class="requirement-box">
                    <h3>Minimum</h3>
                    <p><strong>OS:</strong> Windows 7 / Any linux distro that supports Appimages / MacOS 10.15 or later</p>
                    <p><strong>RAM:</strong> 4 GB</p>
                    <p><strong>Storage:</strong> 100 MB free space</p>
                    <p><strong>Display:</strong> 1280x720 resolution</p>
                </div>
                <div class="requirement-box">
                    <h3>Recommended</h3>
                    <p><strong>OS:</strong> Windows 11 / Any linux distro that supports Appimages / MacOS 11 or later</p>
                    <p><strong>RAM:</strong> 4 GB or more</p>
                    <p><strong>Storage:</strong> 500 MB free space</p>
                    <p><strong>Display:</strong> 1920x1080 resolution or higher</p>
                </div>
            </div>
        </div>

        <div class="content-section">
            <h2>Frequently Asked Questions</h2>

            <p><strong>Why in some parts of the app do I see "Icarus Desktop"</strong></p>
            <p>You see Icarus Desktop because that is the codename for ArkIDE Desktop. And I put that in some places becuase Icarus Desktop sounds considerably cooler that ArkIDE Desktop.</p>
            
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