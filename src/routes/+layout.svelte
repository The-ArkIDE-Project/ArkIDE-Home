<script>
    import { onMount } from 'svelte';
let customCursorEnabled = true;

// List of verified usernames
let verifiedUsernames = [];

onMount(async () => {
// Check if custom cursor is enabled (default to true)
const cursorSetting = localStorage.getItem('customCursorEnabled');
customCursorEnabled = cursorSetting === null ? true : cursorSetting === 'true';
// Apply cursor setting
updateCursorStyle();

// Fetch verified usernames from API
try {
    const response = await fetch('https://arkideapi.arc360hub.com/api/v1/misc/getVerifiedUsernames?token=' + localStorage.getItem('token'));
    if (response.ok) {
        const data = await response.json();
        verifiedUsernames = data.verifiedUsernames || [];
    }
} catch (err) {
    console.error('Failed to load verified usernames:', err);
    verifiedUsernames = []; // fallback to empty array
}

// Apply verified badges
applyVerifiedBadges();

// Re-apply badges when content changes (using MutationObserver)
const observer = new MutationObserver(() => {
    applyVerifiedBadges();
});
observer.observe(document.body, { childList: true, subtree: true });

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

function applyVerifiedBadges() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const nodesToReplace = [];
    let node;

    while (node = walker.nextNode()) {
        // Skip if already processed or in script/style tags
        if (node.parentElement?.classList.contains('verified-username') ||
            node.parentElement?.tagName === 'SCRIPT' ||
            node.parentElement?.tagName === 'STYLE') {
            continue;
        }

        const text = node.textContent;
        for (const username of verifiedUsernames) {
            if (text.includes(username)) {
                nodesToReplace.push({ node, username });
                break;
            }
        }
    }

    nodesToReplace.forEach(({ node, username }) => {
        const text = node.textContent;
        const regex = new RegExp(`\\b${username}\\b`, 'g');
        
        if (regex.test(text)) {
            const parent = node.parentElement;
            const computedStyle = parent ? window.getComputedStyle(parent) : null;
            const fontSize = computedStyle ? computedStyle.fontSize : '16px';
            const fontSizeNum = parseFloat(fontSize);
            const badgeSize = fontSizeNum * 0.85; // 85% of text size
            
            // Check if dark mode is enabled
            const isDarkMode = document.documentElement.classList.contains('dark') || 
                               document.body.classList.contains('dark') ||
                               window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // Purple color in both modes, lighter in dark mode
            const svgColor = isDarkMode ? '#9d7fff' : '#7e5eff';
            
            // Adjust vertical alignment for larger text
            const verticalAlign = fontSizeNum > 20 ? 'baseline' : 'middle';
            
            // Fetch and modify the SVG
            fetch('/verified.svg')
                .then(response => response.text())
                .then(svgContent => {
                    // Replace all color attributes in the SVG with our color, but keep transparent/none values
                    let modifiedSvg = svgContent
                        .replace(/fill="(?!none|transparent)([^"]*)"/g, `fill="${svgColor}"`)
                        .replace(/stroke="(?!none|transparent)([^"]*)"/g, `stroke="${svgColor}"`)
                        .replace(/<svg/, `<svg class="verified-badge" style="height: ${badgeSize}px; width: ${badgeSize}px; vertical-align: ${verticalAlign};"`);
                    
                    const span = document.createElement('span');
                    span.innerHTML = text.replace(regex, `<span class="verified-username">${username}${modifiedSvg}</span>`);
                    parent?.replaceChild(span, node);
                });
        }
    });
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