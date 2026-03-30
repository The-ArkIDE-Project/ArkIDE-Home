<script>
    import { onMount } from 'svelte';
    import Button from "$lib/Button/Button.svelte";

    let visible = false;
    let dontShowAgain = false;

    const STORAGE_KEY = 'arkide_announcement_dismissed';

    onMount(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            visible = true;
        }
    });

    function close() {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        visible = false;
    }
</script>

{#if visible}
    <div class="overlay" on:click={close}>
        <div class="modal" on:click|stopPropagation>
            <div class="image-placeholder">
                <img src="/devposts/winding-down-development.png" alt="Winding down on ArkIDE Development" />
            </div>

            <div class="modal-body">
                <h2>Winding down on ArkIDE Development</h2>
                <p>
                    This project has proven to be a task that I cannot upkeep by myself anymore.
                    So I will be nearly abandoning this project for a while until I find developers
                    and proper maintainers for this project that have a more wide skillset than me
                    and that can fix all of the bugs and issues with updating the API and other things.
                </p>

                <p class="subheading"><strong>I want to help with the project, what can I do:</strong></p>
                <ul>
                    <li>You can contact me via email or discord that you want to help</li>
                    <li>You can create pull requests and issues to help me fix the app</li>
                    <li>You can send me fixed code and such for me to use, etc</li>
                </ul>

                <a class="read-more" href="/devposts/winding-down-development" on:click={close}>&gt; Read More</a>
            </div>

            <div class="modal-footer">
                <label class="dont-show">
                    <input type="checkbox" bind:checked={dontShowAgain} />
                    Don't show again
                </label>
                <Button on:click={close}>CLOSE</Button>
            </div>
        </div>
    </div>
{/if}

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .modal {
        background: #1e1e1e;
        color: white;
        border-radius: 16px;
        width: 390px;
        max-width: 200vw;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

.image-placeholder {
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    height: 160px;
}

.image-placeholder img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

    .modal-body {
        padding: 20px 20px 0;
    }

    .modal-body h2 {
        margin: 0 0 12px;
        font-size: 1.15rem;
        font-weight: 800;
        line-height: 1.3;
    }

    .modal-body p {
        font-size: 0.88rem;
        line-height: 1.6;
        margin: 0 0 12px;
        color: #ddd;
        text-align: center;
    }

    .subheading {
        color: white !important;
        text-align: left !important;
    }

    .modal-body ul {
        margin: 0 0 16px 0;
        padding-left: 20px;
        font-size: 0.88rem;
        color: #ddd;
        line-height: 1.8;
    }

    .read-more {
        display: block;
        text-align: center;
        color: #4d9fff;
        font-weight: 700;
        font-size: 0.95rem;
        text-decoration: none;
        margin-bottom: 16px;
    }

    .read-more:hover {
        text-decoration: underline;
    }

    .modal-footer {
        padding: 12px 20px 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .dont-show {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #bbb;
        cursor: pointer;
        user-select: none;
    }

    .dont-show input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #4d9fff;
    }
</style>