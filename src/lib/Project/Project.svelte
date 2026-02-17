<script>
    import { onMount } from "svelte";
    import Translations from "../../resources/translations.js";
    // import ProjectApi from "../../resources/projectapi.js";
    import Language from "../../resources/language.js";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Static values
    import LINK from "../../resources/urls.js";

    export let id;
    export let title;
    export let lastUpdate = false;
    export let featured = false;
    export let fromDonator = false;
    export let author;
    export let date = 0;
    export let style = "";

    export let linkOverride = false;
    export let openNewtab = false;

    // let isDonator = false;
    const xmlEscape = function (unsafe) {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            }
        });
    };
    const formatProjectTitle = (_title) => {
        const title = xmlEscape(String(_title));
        const emojiRegex = /:(\w+):/g;
        return title.replace(emojiRegex, (match) => {
            const emojiName = match.replace(/\:/gmi, "");
            return `<img
                src="https://library.arkide.site/files/emojis/${emojiName}.png"
                alt=":${emojiName}:"
                title=":${emojiName}:"
                style="width:1.2rem;vertical-align: middle;"
                loading="lazy"
            >`;
        });
    };

    // translation
    let currentLang = "en";
    onMount(() => {
        if (typeof author === "string") {
            author = {
                username: localStorage.getItem("username"),
                id: author
            };
        }
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function unixToDisplayDate(unix) {
        unix = Number(unix);
        return `${new Date(unix).toLocaleString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        })}`;
    }

    const projectLink = linkOverride ? linkOverride : `/viewer#${id}`;
    const projectAuthorLink = linkOverride
        ? linkOverride
        : `/profile?user=${author.username}`;
    
    const thumbnailUrl = `${LINK.projects}api/v1/projects/getproject?projectID=${id}&requestType=thumbnail`;
    const pfpUrl = `${PUBLIC_API_URL}/api/v1/users/getpfp?username=${author.username}`;
</script>

<div data-featured={featured} class="project" {style}>
    <a
        href={projectLink}
        target={openNewtab ? "_blank" : "_self"}
        class="project-image-wrapper"
    >
        <div class="project-image-glow" style="background-image: url('{thumbnailUrl}');"></div>
        <img
            src={thumbnailUrl}
            alt="Project Thumbnail"
            class="project-image"
        />
    </a>
    <a
        href={projectAuthorLink}
        target={openNewtab ? "_blank" : "_self"}
        class="project-author-wrapper"
    >
        <div class="project-author-glow" style="background-image: url('{pfpUrl}');"></div>
        <img
            src={pfpUrl}
            alt="Project Author"
            class="project-author"
        />
    </a>
    <div class="project-meta">
        <a
            href={projectLink}
            target={openNewtab ? "_blank" : "_self"}
            class="text project-title"
            title={title}
        >
            {@html formatProjectTitle(title)}
        </a>
        {#if lastUpdate}
            <a
                href={projectLink}
                target={openNewtab ? "_blank" : "_self"}
                class="text author date"
            >
                {unixToDisplayDate(date)}
            </a>
        {:else}
            <a
                href={projectAuthorLink}
                target={openNewtab ? "_blank" : "_self"}
                class={"text author" + (fromDonator ? " donator-name" : "")}
            >
                {author.username}
                {#if fromDonator}
                    <img
                        src="/badges/donator2.png"
                        alt="Donator"
                        height="16"
                        title={Translations.text(
                            "profile.badge.donator",
                            currentLang
                        )}
                    />
                {/if}
            </a>
        {/if}
    </div>
    <slot />
</div>

<style>
    /* animations */
    @keyframes gradient {
        0% {
            background-position: 0% 0%;
        }
        100% {
            background-position: 100% 100%;
        }
    }

    @keyframes glow-pulse {
        0%, 100% {
            opacity: 0.5;
        }
        50% {
            opacity: 0.7;
        }
    }

    /* stuff */
    .project {
        width: 204px;
        height: 204px;
        padding: 8px 8px 2px;
        margin: 4px;
        border-radius: 8px;
        border-style: solid;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        position: relative;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        will-change: transform;
    }

    .project:hover {
        transform: scale(1.05) translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        border-color: rgba(77, 151, 255, 0.3);
    }

    :global(body.dark-mode) .project:hover {
        border-color: rgba(77, 151, 255, 0.5);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    }

    .project-image-wrapper {
        width: 204px;
        height: 152px;
        border-radius: 6px;
        overflow: visible;
        position: relative;
        display: block;
    }

    .project-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 2;
        display: block;
    }

    .project:hover .project-image {
        transform: scale(1.05);
    }

    .project-image-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        filter: blur(16px) brightness(1.4) saturate(1.3);
        opacity: 0;
        z-index: 0;
        transition: opacity 0.5s ease-in-out;
        border-radius: 6px;
    }

    .project:hover .project-image-glow {
        opacity: 0.8;
    }

    .project-author-wrapper {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        overflow: visible;
        position: relative;
        display: block;
        transition: transform 0.3s ease;
        margin-top: 4px;
    }

    .project:hover .project-author-wrapper {
        transform: scale(1.1);
    }

    .project-author {
        width: 100%;
        height: 100%;
        border-radius: 6px;
        position: relative;
        z-index: 2;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: block;
    }

    .project-author-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        border-radius: 6px;
        filter: blur(10px) brightness(1.5) saturate(1.3);
        opacity: 0;
        z-index: 0;
        transition: opacity 0.5s ease-in-out;
    }

    .project:hover .project-author-glow {
        opacity: 0.85;
    }

    .project-meta {
        width: calc(100% - 8px);
        overflow: hidden;
        max-width: 164px;
        float: left;
        margin-left: 8px;
        transition: transform 0.3s ease;
    }

    .project:hover .project-meta {
        transform: translateY(-2px);
    }

    :global(html[dir="rtl"]) .project-meta {
        margin-left: initial;
        margin-right: 8px;
    }
    :global(body.dark-mode) .project[data-featured="false"] {
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    /* featured projects */
    .project[data-featured="true"] {
        background-color: #ffc400;
        background: linear-gradient(
            145deg,
            rgba(255, 196, 0, 1) 0%,
            rgba(255, 196, 0, 1) 45%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 196, 0, 1) 54%,
            rgba(255, 196, 0, 1) 100%
        );
        background-size: 300% 300%;
        animation: gradient 3s ease infinite;
        box-shadow: 0 4px 12px rgba(255, 196, 0, 0.3);
    }

    .project[data-featured="true"]:hover {
        box-shadow: 0 12px 28px rgba(255, 196, 0, 0.4);
    }

    .text {
        text-overflow: ellipsis;
        text-decoration: none;
        width: 100%;
        color: #4d97ff;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        font-weight: bold;
        transition: color 0.2s ease;
    }

    .text:hover {
        color: #3d7fd9;
    }

    .author {
        color: #575e75;
        font-weight: normal;
        display: flex;
        flex-direction: row;
        align-items: center;
        transition: color 0.2s ease;
    }

    .author:hover {
        color: #4d97ff;
    }

    .author > img {
        margin: 0 4px;
    }
    :global(body.dark-mode) .author {
        color: #9ba0b1;
        font-weight: normal;
    }
    :global(body.dark-mode) .author:hover {
        color: #b5bac9;
    }
    .donator-name {
        color: #dbdb37;
        font-weight: bold;
    }
    :global(body.dark-mode) .donator-name {
        color: #f7ff5c;
        font-weight: bold;
    }
    .date {
        font-size: 10px;
    }

    /* featured projects */
    .project[data-featured="true"] .text {
        color: rgb(0, 0, 0);
    }
    .project[data-featured="true"] .text:hover {
        color: rgb(40, 40, 40);
    }
    .project[data-featured="true"] .author {
        color: black;
    }
    .project[data-featured="true"] .donator-name {
        color: #8f00db;
        font-weight: bold;
    }
</style>