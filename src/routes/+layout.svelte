<script>
    import { onMount } from 'svelte';
    
    let customCursorEnabled = true;
    
    onMount(() => {
        // Check if custom cursor is enabled (default to true)
        const cursorSetting = localStorage.getItem('customCursorEnabled');
        customCursorEnabled = cursorSetting === null ? true : cursorSetting === 'true';
        
        // Apply cursor setting
        updateCursorStyle();
    });
    
    function updateCursorStyle() {
        if (customCursorEnabled) {
            document.body.classList.add('custom-cursor-enabled');
            document.body.classList.remove('custom-cursor-disabled');
        } else {
            document.body.classList.remove('custom-cursor-enabled');
            document.body.classList.add('custom-cursor-disabled');
        }
    }
    
    // Listen for storage changes from other tabs/windows
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e) => {
            if (e.key === 'customCursorEnabled') {
                customCursorEnabled = e.newValue === 'true';
                updateCursorStyle();
            }
        });
    }
</script>

<!-- The slot is where your page content appears -->
<slot />

<style>
/* Global cursor styles - only apply when enabled */
:global(body.custom-cursor-enabled *) {
    cursor: url('/cur.png'), auto !important;
}
:global(body.custom-cursor-enabled a),
:global(body.custom-cursor-enabled button),
:global(body.custom-cursor-enabled [role="button"]),
:global(body.custom-cursor-enabled input[type="button"]),
:global(body.custom-cursor-enabled input[type="submit"]),
:global(body.custom-cursor-enabled .file-picker),
:global(body.custom-cursor-enabled .emoji-picker),
:global(body.custom-cursor-enabled .project),
:global(body.custom-cursor-enabled .project-image),
:global(body.custom-cursor-enabled .project-author-wrapper),
:global(body.custom-cursor-enabled .comment-action-button),
:global(body.custom-cursor-enabled [onclick]) {
    cursor: url('/link.png'), pointer !important;
}
/* Default text cursor for text inputs */
:global(body.custom-cursor-enabled input[type="text"]),
:global(body.custom-cursor-enabled input[type="email"]),
:global(body.custom-cursor-enabled input[type="password"]),
:global(body.custom-cursor-enabled input[type="search"]),
:global(body.custom-cursor-enabled textarea),
:global(body.custom-cursor-enabled .search-bar) {
    cursor: url('/txt.png'), text !important;
}

/* When disabled, use default cursors */
:global(body.custom-cursor-disabled *) {
    cursor: auto !important;
}
:global(body.custom-cursor-disabled a),
:global(body.custom-cursor-disabled button),
:global(body.custom-cursor-disabled [role="button"]),
:global(body.custom-cursor-disabled input[type="button"]),
:global(body.custom-cursor-disabled input[type="submit"]),
:global(body.custom-cursor-disabled .file-picker),
:global(body.custom-cursor-disabled .emoji-picker),
:global(body.custom-cursor-disabled .project),
:global(body.custom-cursor-disabled .project-image),
:global(body.custom-cursor-disabled .project-author-wrapper),
:global(body.custom-cursor-disabled .comment-action-button),
:global(body.custom-cursor-disabled [onclick]) {
    cursor: pointer !important;
}
:global(body.custom-cursor-disabled input[type="text"]),
:global(body.custom-cursor-disabled input[type="email"]),
:global(body.custom-cursor-disabled input[type="password"]),
:global(body.custom-cursor-disabled input[type="search"]),
:global(body.custom-cursor-disabled textarea),
:global(body.custom-cursor-disabled .search-bar) {
    cursor: text !important;
}
</style>