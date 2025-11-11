<script>
    import { onMount } from "svelte";

    export let header = false;
    export let seemore = false;
    export let style = "";
    export let stylec = "";

    // translations
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

<div class="section content-category" {style}>
    {#if header}
        <div class="header">
            <p style="margin-block: 6px;"><b>{header}</b></p>
            {#if seemore}
                <p style="margin-block: 6px;">
                    <a href={seemore}>
                        <LocalizedText
                            text="See more"
                            key="home.seemore"
                            lang={currentLang}
                        />
                    </a>
                </p>
            {/if}
        </div>
    {/if}
    <div style={stylec} class="container"><slot /></div>
</div>

<style>
a {
	color: dodgerblue;
}

/* Shared base */
.section.content-category {
	width: 30%;
	margin: 10px;
	border-radius: 12px;
	padding: 6px;
	border: 1px solid transparent;
	transition: background 0.3s ease, border-color 0.3s ease;
	backdrop-filter: blur(10px) saturate(150%);
	-webkit-backdrop-filter: blur(10px) saturate(150%);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Light mode */
:global(body:not(.dark-mode)) .section.content-category {
	background: rgba(255, 255, 255, 0.6);
	border-color: rgba(0, 0, 0, 0.1);
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* Dark mode */
:global(body.dark-mode) .section.content-category {
	background: rgba(17, 17, 17, 0.4);
	border-color: rgba(255, 255, 255, 0.15);
	box-shadow: 0 2px 12px rgba(43, 43, 43, 0.5);
}

.header {
	border-bottom: 1px solid rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	margin: 0 0.35rem;
}

:global(body.dark-mode) .header {
	border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.container {
	height: 312px;
	margin: 6px;
	overflow: auto;
}
</style>

