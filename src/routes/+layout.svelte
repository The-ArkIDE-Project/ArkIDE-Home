<script>
    // This slot renders all your page content
</script>

<!-- The slot is where your page content appears -->
<slot />

<style>
    /* Global cursor styles */
    :global(*) {
        cursor: url('/cur.png'), auto !important;
    }

    :global(a),
    :global(button),
    :global([role="button"]),
    :global(input[type="button"]),
    :global(input[type="submit"]),
    :global(.file-picker),
    :global(.emoji-picker),
    :global(.project),
    :global(.project-image),
    :global(.project-author-wrapper),
    :global(.comment-action-button),
    :global([onclick]) {
        cursor: url('/link.png'), pointer !important;
    }

    /* Default text cursor for text inputs */
    :global(input[type="text"]),
    :global(input[type="email"]),
    :global(input[type="password"]),
    :global(input[type="search"]),
    :global(textarea),
    :global(.search-bar) {
        cursor: url('/txt.png'), text !important;
    }
</style>