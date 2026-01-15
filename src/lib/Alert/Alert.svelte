<script>
    import { onMount } from "svelte";
    import AutoLocalizedText from "$lib/AutoLocalizedText/Node.svelte";

    let isDismissed = false;

    export let text = "";
    export let textLocalize = true;
    export let textBreakup = false;
    export let backColor = "rgba(118, 80, 168, 0.80)";
    export let textColor = "black";
    export let dismissable = true;

    export let onlyShowID = false;

    export let hasImage = true;
    export let imgSrc = "/alert_icon.svg";
    export let imgAlt = "(!)";

    export let hasButton = false;
    export let buttonText = "";
    export let buttonHref = "/";
    export let buttonTooLight = false; // makes button text black

    const splitText = [];

    if (onlyShowID) {
        isDismissed = true;
    }
    const saveClosedLocally = () => {
        if (!onlyShowID) return;
        const key = `pm:alert-${onlyShowID}`;
        localStorage.setItem(key, "closed");
    };
    onMount(() => {
        if (!onlyShowID) return;

        const key = `pm:alert-${onlyShowID}`;
        if (localStorage.getItem(key) !== "closed") {
            isDismissed = false;
        }
    });

    if (textBreakup) {
        for (const newText of text.split(".")) {
            splitText.push(newText);
        }
    }
</script>

{#if !isDismissed}
    <div
        class="alert-banner"
        style={`background: ${backColor}; color: ${textColor};`}
    >
        <p>
            {#if hasImage}
                <img src={imgSrc} alt={imgAlt} />
            {/if}
            {#if !textLocalize}
                {text}
            {:else}
                {#if !textBreakup}
                    <AutoLocalizedText {text} />
                {:else}
                    {#each splitText as text, idx}
                        <AutoLocalizedText
                            text={text + (idx !== splitText.length - 1 ? "." : "")}
                        />
                    {/each}
                {/if}
            {/if}
            {#if hasButton}
                <a href={buttonHref}>
                    <button data-toolight={buttonTooLight}>
                        <AutoLocalizedText text={buttonText} />
                    </button>
                </a>
            {/if}
            {#if dismissable}
                <button
                    class="alert-dismiss"
                    on:click={() => {
                        isDismissed = true;
                        if (onlyShowID) {
                            saveClosedLocally();
                        }
                    }}
                />
            {/if}
        </p>
    </div>
{/if}

<style>
    .alert-banner {
        position: fixed; 
        top: 4.5rem; 
        left: 50%; 
        transform: translateX(-50%); 
        width: auto; 
        max-width: calc(100% - 2rem); 
        background: rgba(255, 251, 0, 0.7) !important; 
        font-weight: bold;
        text-align: center;
        padding: 12px 20px; 
        color: white;
        border-radius: 2rem; 
        z-index: 999; 
        backdrop-filter: blur(10px); 
        -webkit-backdrop-filter: blur(10px); 
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border: 4px solid rgba(244, 255, 150, 0.2);
        backdrop-filter: blur(10px); 
        -webkit-backdrop-filter: blur(10px); 
        z-index: 1000;
    }

    .alert-banner * {
        margin-block: 0;
    }

    .alert-banner > p {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 8px; 
    }

    .alert-banner img {
        height: 24px; 
        margin-right: 0; 
    }

    :global(html[dir="rtl"]) .alert-banner img {
        margin-right: initial;
        margin-left: 0;
    }

    .alert-banner button {
        border: 0;
        outline: 1px solid white;
        cursor: pointer;
        font-weight: bold;
        border-radius: 1rem; 
        color: white;
        background: transparent;
        font-size: 14px; 
        padding: 4px 12px; 
        margin: 0; 
        transition: 0.15s ease all;
    }

    .alert-banner button:hover {
        padding: 8px 16px;
        transition: 0.15s ease all;
    }

    .alert-banner button[data-toolight=true] {
        color: black;
        outline-color: black;
    }

    .alert-banner button:active {
        background: rgba(0, 0, 0, 0.25);
    }

    :global(html[dir="rtl"]) .alert-banner button {
        margin-left: initial;
        margin-right: 0;
    }

    .alert-dismiss {
        outline: 0 !important;
        position: relative; 
        right: initial; 
        width: 24px; 
        height: 24px; 
        background: url("/dismiss.svg") !important;
        background-size: cover !important;
        flex-shrink: 0; 
    }

    :global(html[dir="rtl"]) .alert-dismiss {
        right: initial;
        left: initial;
    }

    .alert-dismiss:active {
        filter: brightness(0.5);
    }
</style>
