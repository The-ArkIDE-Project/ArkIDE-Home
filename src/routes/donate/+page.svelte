<script>
    import { onMount } from "svelte";
    import MarkdownIt from "markdown-it";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Static values
    import LINK from "../../resources/urls.js";

    let currentLang = "en";
    let forceHtmlClass;
    let forceHtmlClass2;
    let forceHtmlClass3;
    onMount(() => {
        Language.forceUpdate();
        forceHtmlClass.classList.add('donate-card-html');
        forceHtmlClass2.classList.add('donate-card-html');
        forceHtmlClass3.classList.add('donate-card-html');
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
    
    const md = new MarkdownIt({
        html: false,
        linkify: false,
        breaks: true,
    });
    
    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };
    let kofiPopupOpen = false;
    const showKofiPopup = () => { kofiPopupOpen = true; };
    const closeKofiPopup = () => { kofiPopupOpen = false; };
</script>

<svelte:head>
    <title>ArkIDE - Donate</title>
    <meta name="title"                   content="ArkIDE - Donate" />
    <meta property="og:title"            content="ArkIDE - Donate" />
    <meta property="twitter:title"       content="ArkIDE - Donate">
    <meta name="description"             content="Help support ArkIDE and it's development!">
    <meta property="twitter:description" content="Help support ArkIDE and it's development!">
    <meta property="og:url"              content="https://penguinmod.com/donate">
    <meta property="twitter:url"         content="https://penguinmod.com/donate">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <div>
            <h1 style="margin-block: 0;">
                <LocalizedText
                    text="Donate"
                    key="donate.title"
                    lang={currentLang}
                />
            </h1>
            <p>
                <LocalizedText
                    text="Help ArkIDE pay for our servers, link & more!"
                    key="donate.description"
                    lang={currentLang}
                />
            </p>
        </div>
        <img src="/penguins/donate.svg" alt="Penguin" class="penguin-donate" />
    </div>

    <div style="height: 16px;" />

    <div class="section-discussion-wrapper">
        <div class="section-discussions">
            <div class="section-discussion">
                <p>
                    <LocalizedText
                        text="ArkIDE helps people around the world create the games that they want and share the fun stuff they make with the community."
                        key="donate.message1"
                        lang={currentLang}
                    />
                </p>
                <p>
                    {@html generateMarkdown(`${TranslationHandler.textSafe(
                        "donate.people1",
                        currentLang,
                        "In the last month, ***$1 new people found ArkIDE*** and we sent our website to ***$2*** returning users."
                    )
                    .replace('$1', (20).toLocaleString())
                    .replace('$2', (10).toLocaleString())}`)}

                    {@html generateMarkdown(`${TranslationHandler.textSafe(
                        "donate.people2",
                        currentLang,
                        "Some people even use ArkIDE from the **United Kingdom**, **Japan**, **Brazil**, **Russia**, and more."
                    )}`)}
                </p>
                <p>
                    <LocalizedText
                        text="We would appreciate if you could donate below to help us pay for our domain and server costs! 😀"
                        key="donate.message2"
                        lang={currentLang}
                    />
                </p>

                <div style="height: 16px;" />

                <!-- donation buttons -->
                <div class="donation-section">
                    <div class="donation-buttons">
                        <p class="small">
                            <LocalizedText
                                text="Donate using"
                                key="donate.methods"
                                lang={currentLang}
                            />
                        </p>
                        <a
                            target="_blank"
                            class="donation-unavailable"
                            href="/error?error=404"
                            style="text-decoration: none !important;"
                        >
                            <button
                                class="donation-container"
                                title="Cash App - Do more with your money"
                            >
                                <img src="/cashapp.png" alt="Cash App" />
                                <span>
                                    <LocalizedText
                                        text="(unavailable)"
                                        key="project.status.unavailable"
                                        lang={currentLang}
                                    />
                                </span>
                            </button>
                        </a>
                        <br />
                        <a
                            target="_blank"
                            href="/error?error=410"
                            class="donation-unavailable"
                            style="text-decoration: none !important;"
                        >
                            <button
                                class="donation-container"
                                title="Stripe - Financial infrastructure for the internet"
                            >
                                <img src="/stripe.png" alt="Stripe" />
                                <span>
                                    <LocalizedText
                                        text="(unavailable)"
                                        key="project.status.unavailable"
                                        lang={currentLang}
                                    />
                                </span>
                            </button>
                        </a>
                        <br />
                        <a
                            target="_blank"
                            href="/error?error=410"
                            class="donation-unavailable"
                            style="text-decoration: none !important;"
                        >
                            <button
                                class="donation-container"
                                title="PayPal - The safer, easier way to pay online!"
                            >
                                <img src="/paypal.png" alt="PayPal" />
                                <span>
                                    <LocalizedText
                                        text="(unavailable)"
                                        key="project.status.unavailable"
                                        lang={currentLang}
                                    />
                                </span>
                            </button>
                        </a>
                        <br />
                        <a
                            target="_blank"
                                href="https://ko-fi.com/arc360"
                                class="donation"
                                style="text-decoration: none !important;"
                                on:click|preventDefault={showKofiPopup}
                            >
                                <button
                                    class="donation-container"
                                    title="KoFi Tip - Buy me a coffee!"
                                >
                                    <img src="/kofi.png" alt="KoFi" />
                                    <span>
                                        <LocalizedText
                                            text="Ko-Fi (Minimum 5$)"
                                            key="donation.kofi"
                                            lang={currentLang}
                                        />
                                    </span>
                                </button>
                            </a>

                            {#if kofiPopupOpen}
                            <div class="popup-overlay" on:click={closeKofiPopup}>
                                <div class="popup-card" on:click|stopPropagation>
                                    <h2>Before you donate!</h2>
                                    <p>To receive your <strong>Donator badge</strong> and benefits on ArkIDE, include the following in your Ko-fi tip message:</p>
                                    <div class="popup-example">
                                        <span class="popup-label">Required</span>
                                        <code>ArkIDE: YourUsername</code>
                                        <span class="popup-label optional">Optional</span>
                                        <code>Discord: @yourdiscord</code>
                                    </div>
                                    <p class="popup-note">Example message: <em>"ArkIDE: verycooldonator, Discord: @verycooldonator"</em></p>
                                    <div class="popup-buttons">
                                        <button class="popup-cancel" on:click={closeKofiPopup}>Cancel</button>
                                        <a href="https://ko-fi.com/arc360" target="_blank" on:click={closeKofiPopup}>
                                            <button class="popup-confirm">Got it, take me to Ko-fi →</button>
                                        </a>
                                    </div>
                                    <h3>You will not instantly get the badge, it may take a few hours.</h3> (everything will be done manualy, so please be patient)
                                </div>
                            </div>
                            {/if}
                        <strong class="e">If you donate in KoFi and want benifits on ArkIDE, Donate 5$ or more and we will reward you with the Donator badge wich will give you lots of Benifits!</strong>
                    </div>
                    <div class="donation-images">
                        <img
                            src="/penguins/donating.svg"
                            alt="Penguins Donating"
                        />
                    </div>
                </div>

                <!-- other stuff -->
                <div style="height: 48px;" />

                <p class="small">
                    <LocalizedText
                        text="ArkIDE is not affiliated with Scratch, TurboWarp, Penguinmod, the Scratch Team, or the Scratch Foundation."
                        key="home.footer.notaffiliated"
                        lang={currentLang}
                    />
                </p>
                <p class="small">
                    <LocalizedText
                        text="You can always donate to our parent projects Scratch, TurboWarp, or PenguinMod as well, to help them stay online."
                        key="donate.parents"
                        dolink={true}
                        lang={currentLang}
                    />
                </p>
                <br />
                <p class="small">
                    <LocalizedText
                        text="Donate"
                        key="home.footer.sections.donate"
                        lang={currentLang}
                    />
                </p>
                <a class="small" target="_blank" href={LINK.donate.scratch}>
                    Scratch
                </a>
                <br />
                <a class="small" target="_blank" href={LINK.donate.turbowarp}>
                    TurboWarp
                </a>
                <br />
                <a class="small" target="_blank" href="https://penguinmod.com/donate/">
                    PenguinMod
                </a>
            </div>
            <div class="section-details">
                <p style="text-align: center;">
                    <LocalizedText
                        text="For completely free:"
                        key="donate.served.title"
                        lang={currentLang}
                    />
                </p>
                <div class="detail-card" bind:this={forceHtmlClass} style="background: dodgerblue">
                    {@html String(TranslationHandler.text(
                        "donate.served.projects",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.served.projects",
                        'en'
                    ))
                    // we serve __ projects
                    .replace('$1', (200).toLocaleString())}
                </div>
                <div class="detail-card" bind:this={forceHtmlClass2} style="background: darkviolet">
                    {@html String(TranslationHandler.text(
                        "donate.served.size",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.served.size",
                        'en'
                    ))
                    // we send __ gb of stuff
                    .replace('$1', (1000).toLocaleString())}
                </div>
                <div class="detail-card" bind:this={forceHtmlClass3} style="background: #ffb300">
                    {@html String(TranslationHandler.text(
                        "donate.served.requests",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.served.requests",
                        'en'
                    ))
                    // we handle ___ reqs
                    .replace('$1', (120000).toLocaleString())}
                </div>
            </div>
        </div>
    </div>

    <div style="height: 16px;" />
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
    .small {
        font-size: 12px;
    }

    .detail-card {
        width: calc(100% - 24px);
        padding: 48px 12px;
        background: dodgerblue;
        color: white;
        text-align: center;
    }

    .section-info {
        background: #001affad;
        height: 12rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-info h1 {
        margin-block: 0;
        margin-left: 32px;
    }
    .section-info p {
        margin-block-end: 0;
        margin-left: 32px;
    }
    :global(html[dir="rtl"]) .section-info h1 {
        margin-left: initial;
        margin-right: 32px;
    }
    :global(html[dir="rtl"]) .section-info p {
        margin-left: initial;
        margin-right: 32px;
    }

    .penguin-donate {
        height: 80%;
        margin-right: 32px;
    }
    :global(html[dir="rtl"]) .penguin-donate {
        margin-right: initial;
        margin-left: 32px;
        transform: scaleX(-1);
    }

    .section-discussion-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .section-discussions {
        display: flex;
        flex-direction: row;
        width: 65%;
    }
    .section-discussion {
        width: 65%;
        margin-right: 5%;
    }
    :global(html[dir="rtl"]) .section-discussion {
        margin-right: initial;
        margin-left: 5%;
    }
    .section-details {
        width: 35%;
    }
    
    .donation-unavailable {
        filter: grayscale(1);
        opacity: 0.5;
        cursor: not-allowed !important;
    }
    .donation-container {
        position: relative;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.5);
        background: white;
        overflow: hidden;
        padding-left: 60px;
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        box-shadow: 1px 1px 2px black;
        height: 52px;
    }
    .donation-container:hover {
        box-shadow: 1px 1px 10px black;
    }
    .donation-container:active {
        background: rgb(219, 219, 219);
    }
    .donation-container > img {
        position: absolute;
        left: 0;
        top: 0;
        height: calc(100% + 1px);
    }
    .donation-container > span {
        font-size: 20px;
        margin-right: 8px;
        font-weight: bold;
        text-decoration: none !important;
    }

    :global(body.dark-mode) .donation-container {
        background: transparent;
        border-color: white;
        color: white;
        box-shadow: 1px 1px 2px white;
    }
    :global(body.dark-mode) .donation-container:hover {
        box-shadow: 1px 1px 10px white;
    }
    :global(body.dark-mode) .donation-container:active {
        background: rgba(255, 255, 255, 0.2);
    }

    .donation-section {
        display: flex;
        flex-direction: row;
    }
    .donation-buttons {
        width: 50%;
    }
    .donation-images {
        width: 50%;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }
    .donation-images img {
        height: 192px;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
    .e {
        margin-top: 16px;
        display: block;
    }
    .popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
    }
    .popup-card {
        background: white;
        border-radius: 12px;
        padding: 32px 28px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        text-align: center;
    }
    .popup-card h2 {
        margin: 0 0 12px;
        font-size: 22px;
    }
    .popup-card p {
        font-size: 14px;
        color: #333;
        margin-bottom: 16px;
    }
    .popup-example {
        background: #f4f4f4;
        border-radius: 8px;
        padding: 16px 16px;
        padding-right: 34px;
        margin: 16px 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        text-align: left;
    }
    .popup-example code {
        font-size: 15px;
        font-weight: bold;
        color: #111;
        background: #e0e0e0;
        padding: 4px 10px;
        border-radius: 4px;
        width: 100%;
    }
    .popup-label {
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #e06000;
    }
    .popup-label.optional { color: #888; }
    .popup-note {
        font-size: 12px !important;
        color: #888 !important;
    }
    .popup-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
    }
    .popup-cancel {
        padding: 10px 20px;
        border-radius: 6px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 14px;
    }
    .popup-cancel:hover { background: #f0f0f0; }
    .popup-confirm {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        background: #ff5e5b;
        color: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
    }
    .popup-confirm:hover { opacity: 0.88; }
    :global(body.dark-mode) .popup-card {
        background: #1e1e2e;
        color: white;
    }
    :global(body.dark-mode) .popup-card p { color: #ccc; }
    :global(body.dark-mode) .popup-example { background: #2a2a3a; }
    :global(body.dark-mode) .popup-example code { background: #333348; color: #eee; }
    :global(body.dark-mode) .popup-cancel { background: #2a2a3a; border-color: #444; color: white; }
</style>
