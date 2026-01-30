<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    const dispatch = createEventDispatcher();
    
    export let projectId = "";
    export let projectTitle = "";
    
    let showModal = false;
    let activeTab = "link"; // "link" or "embed"
    let embedWidth = 480;
    let embedHeight = 360;
    let embedScale = 1.00;
    let copiedLink = false;
    let copiedEmbed = false;
    
    // Open modal
    export function open() {
        showModal = true;
        activeTab = "link";
        copiedLink = false;
        copiedEmbed = false;
    }
    
    // Close modal
    function close() {
        showModal = false;
        activeTab = "link";
        copiedLink = false;
        copiedEmbed = false;
    }
    
    // Switch tab
    function switchTab(tab) {
        activeTab = tab;
        copiedLink = false;
        copiedEmbed = false;
    }
    
    // Get share link
    function getShareLink() {
        return `${window.location.origin}/viewer?id=${projectId}`;
    }
    
    // Get embed code
    function getEmbedCode() {
        const actualWidth = Math.round(embedWidth * embedScale);
        const actualHeight = Math.round(embedHeight * embedScale);
        
        return `<iframe src="https://studio.arkide.site/embed.html#${projectId}" width="${actualWidth}" height="${actualHeight}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation allow-pointer-lock" allow="camera *; microphone *; geolocation *; accelerometer *; gyroscope *; magnetometer *; fullscreen *; picture-in-picture *; display-capture *; autoplay *; encrypted-media *; midi *; usb *; serial *; hid *; payment *; web-share *; clipboard-read *; clipboard-write *" style="color-scheme: auto"></iframe>`;
    }
    
    // Copy link to clipboard
    async function copyLink() {
        try {
            await navigator.clipboard.writeText(getShareLink());
            copiedLink = true;
            setTimeout(() => copiedLink = false, 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }
    
    // Copy embed code to clipboard
    async function copyEmbed() {
        try {
            await navigator.clipboard.writeText(getEmbedCode());
            copiedEmbed = true;
            setTimeout(() => copiedEmbed = false, 2000);
        } catch (err) {
            console.error('Failed to copy embed code:', err);
        }
    }
    
    // Handle scale slider change
    function handleScaleChange(event) {
        embedScale = parseFloat(event.target.value);
    }
$: embedCode = `<iframe src="https://studio.arkide.site/embed.html#${projectId}" width="${Math.round(embedWidth * embedScale)}" height="${Math.round(embedHeight * embedScale)}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation allow-pointer-lock" allow="camera *; microphone *; geolocation *; accelerometer *; gyroscope *; magnetometer *; fullscreen *; picture-in-picture *; display-capture *; autoplay *; encrypted-media *; midi *; usb *; serial *; hid *; payment *; web-share *; clipboard-read *; clipboard-write *" style="color-scheme: auto"></iframe>`;
function handleWidthChange(event) {
    embedWidth = parseInt(event.target.value) || 480;
}

function handleHeightChange(event) {
    embedHeight = parseInt(event.target.value) || 360;
}
</script>

{#if showModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={close} transition:fade={{ duration: 200 }}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="modal-content" on:click|stopPropagation transition:scale={{ duration: 200, easing: quintOut }}>
            <div class="modal-header">
                <h2 class="modal-title">Share Project</h2>
               <button class="close-button" on:click={close}>
                    <img src="/x.svg" alt="Close" class="close-icon" />
                </button>
            </div>
            
            <!-- Tabs -->
            <div class="tabs">
                <button 
                    class="tab" 
                    class:active={activeTab === "link"}
                    on:click={() => switchTab("link")}
                >
                    Link
                </button>
                <button 
                    class="tab" 
                    class:active={activeTab === "embed"}
                    on:click={() => switchTab("embed")}
                >
                    Embed
                </button>
            </div>
            
            <div class="modal-body">
                {#if activeTab === "link"}
                    <!-- Link Tab -->
                    <div class="tab-content">
                        <div class="input-group">
                            <input 
                                type="text" 
                                readonly 
                                value={getShareLink()}
                                class="link-input"
                                on:click={(e) => e.target.select()}
                            />
                            <button class="copy-btn" on:click={copyLink}>
                                {copiedLink ? '✓' : 'Copy'}
                            </button>
                        </div>
                        <small>* This link will not make an embed appear with the project thumbnail on social media platforms like how YouTube has an embed of its player when you send a link to someone.</small>
                    </div>
                {:else}
                    <!-- Embed Tab -->
                    <div class="tab-content">
                        <div class="settings-row">
                            <label>Resolution</label>
                            <div class="resolution-inputs">
                            <input 
                                type="number" 
                                value={embedWidth}
                                on:input={handleWidthChange}
                                min="100" 
                                max="1920"
                                class="number-input"
                            />
                            <span class="separator">×</span>
                            <input 
                                type="number" 
                                value={embedHeight}
                                on:input={handleHeightChange}
                                min="100" 
                                max="1080"
                                class="number-input"
                            />
                            </div>
                            <div class="original-size">Original size: 480×360</div>
                        </div>
                        
                        <div class="settings-row">
                            <label>Scale ({embedScale.toFixed(2)}x)</label>
                            <div class="slider-container">
                            <input 
                                type="range" 
                                min="0.25" 
                                max="4" 
                                step="0.01" 
                                bind:value={embedScale}
                                class="scale-slider"
                            />
                            </div>
                        </div>
                        
                        <div class="embed-code-container">
                        <textarea 
                            readonly 
                            value={embedCode}
                            class="embed-textarea"
                            on:click={(e) => e.target.select()}
                        ></textarea>
                        </div>
                        
                        <button class="download-btn" on:click={copyEmbed}>
                            {copiedEmbed ? '✓ Copied!' : 'Copy'}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.384);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .modal-content {
        background: rgba(17, 17, 17, 0.788);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        width: 90%;
        max-width: 520px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: rgba(255, 255, 255, 0.15) 4px solid;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }
    
    .modal-header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px 20px;
        background: #4c3bff;
        color: white;
        position: relative;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
    }
    
    .close-button {
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 96px;
        transition: background 0.2s;
        position: absolute;
        right: 12px;
        user-select: none;
        padding: 0;
        background: rgba(255, 255, 255, 0.1);
    }

    .close-icon {
        width: 16px;
        height: 16px;
        display: block;
        transform: rotate(45deg);
    }
    
    .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .tabs {
        display: flex;
        background: rgb(17, 17, 17, 0.788);
        border-bottom: 1px solid #444;
    }
    
    .tab {
        flex: 1;
        padding: 12px 16px;
        background: transparent;
        border: none;
        color: #999;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
    }
    
    .tab:hover {
        color: #ccc;
    }
    
    .tab.active {
        color: #4c3bff;
        border-bottom-color: #4c3bff;
    }
    
    .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }
    
    .tab-content {
        animation: fadeIn 0.2s ease-in;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    .input-group {
        display: flex;
        gap: 8px;
    }
    
    .link-input {
        flex: 1;
        padding: 10px 12px;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 0.9rem;
        font-family: monospace;
    }
    
    .link-input:focus {
        outline: none;
        border-color: #4c3bff;
    }
    
    .copy-btn {
        padding: 10px 20px;
        background: #4c3bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        white-space: nowrap;
    }
    
    .copy-btn:hover {
        background: #3d2ecc;
    }
    
    .settings-row {
        margin-bottom: 16px;
    }
    
    .settings-row label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: #b0b0b0;
        font-weight: 500;
    }
    
    .resolution-inputs {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .number-input {
        flex: 1;
        padding: 8px 12px;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 0.9rem;
        text-align: center;
    }
    
    .number-input:focus {
        outline: none;
        border-color: #4c3bff;
    }
    
    .separator {
        color: #666;
        font-weight: bold;
    }
    
    .original-size {
        margin-top: 4px;
        font-size: 0.8rem;
        color: #888;
    }
    
    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        padding: 0 4px;
    }

    .slider-label {
        font-size: 0.85rem;
        color: #888;
    }

    .scale-slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #1a1a1a;
        outline: none;
        -webkit-appearance: none;
    }
    .scale-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #4c3bff;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .scale-slider::-webkit-slider-thumb:hover {
        background: #5d4cff;
    }
    
    .scale-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #4c3bff;
        cursor: pointer;
        border: none;
        transition: background 0.2s;
    }
    
    .scale-slider::-moz-range-thumb:hover {
        background: #5d4cff;
    }
    
    .embed-code-container {
        margin-bottom: 12px;
    }
    
    .embed-textarea {
        width: 100%;
        min-height: 120px;
        padding: 12px;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 0.85rem;
        font-family: monospace;
        resize: vertical;
        box-sizing: border-box;
    }
    
    .embed-textarea:focus {
        outline: none;
        border-color: #4c3bff;
    }
    
    .download-btn {
        width: 100%;
        padding: 12px;
        background: #4c3bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .download-btn:hover {
        background: #3d2ecc;
    }
    
    /* Scrollbar styling for dark theme */
    .modal-body::-webkit-scrollbar {
        width: 8px;
    }
    
    .modal-body::-webkit-scrollbar-track {
        background: #1a1a1a;
    }
    
    .modal-body::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 4px;
    }
    
    .modal-body::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
    .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        text-align: center;
    }
    small {
        color: #888;
        font-size: 0.6rem;
    display: flex;
    align-items: center;
    gap: 0;
    margin-top: 6px;
}
</style>