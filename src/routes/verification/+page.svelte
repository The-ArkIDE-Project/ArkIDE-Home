<script>
    import { onMount } from "svelte";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";

    const ProjectClient = new ProjectApi();

    let currentLang = "en";
    let canViewForm = false;
    let isLoading = true;
    let loggedIn = false;

    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    onMount(async () => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        if (!token || !username) {
            isLoading = false;
            return;
        }

        try {
            const { isAdmin, isApprover } = await Authentication.usernameFromCode(username, token);
            loggedIn = true;
            ProjectClient.setUsername(username);
            ProjectClient.setToken(token);

            const profile = await ProjectApi.getProfile(username, true);
            const badges = profile.badges || [];
            const followers = profile.followers || 0;

            const isAdministrator = isAdmin || isApprover || badges.includes("administrator");
            const has500Likes = badges.includes("likes500");
            const hasEnoughFollowers = followers >= 25;

            if (isAdministrator) {
                canViewForm = true;
            } else if (hasEnoughFollowers && has500Likes) {
                canViewForm = true;
            }
        } catch (err) {
            console.error("Failed to check eligibility:", err);
        }

        isLoading = false;
    });
</script>
<svelte:head>
    <title>Verification Forum - ArkIDE</title>
    <meta name="title" content="Verification Forum - ArkIDE" />
    <meta property="og:title" content="Verification Forum - ArkIDE" />
    <meta property="twitter:title" content="Verification Forum - ArkIDE">
    <meta name="description" content="Submit your project for verification on ArkIDE.">
    <meta property="twitter:description" content="Submit your project for verification on ArkIDE.">
    <meta property="og:url" content="https://arkide.site/verification-forum">
    <meta property="twitter:url" content="https://arkide.site/verification-forum">
</svelte:head>
<NavigationBar />
<div class="main">
    <NavigationMargin />
    <div class="section-info">
        <h1>Verification Forum</h1>
        <p>Submit a request to get your project or account verified.</p>
    </div>
    <div style="height: 16px;" />
    <div class="center-area">
        {#if isLoading}
            <p style="opacity:0.5; margin-top: 40px;">Checking eligibility...</p>
        {:else if !loggedIn}
            <p style="opacity:0.5; margin-top: 40px;">You must be logged in to access this form.</p>
        {:else if !canViewForm}
            <div class="denied-box">
                <img src="/notallowed.png" alt="Not allowed" style="height: 64px; margin-bottom: 16px;" />
                <h2>You don't meet the requirements</h2>
                <p>To access the Verification Forum you need:</p>
                <ul>
                    <li>At least <strong>25 followers</strong></li>
                    <li>The <strong>likes500</strong> badge</li>
                </ul>
                <p style="opacity:0.6; font-size:0.9em;">Both requirements must be met.</p>
            </div>
        {:else}
            <div class="embed-wrapper">
                <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSe4XseEbtbuxLtf8UdOHoe_4g_R6BDkcL0EPRVefBqhOap2lQ/viewform?usp=publish-editor"
                    title="Verification Forum"
                    frameborder="0"
                    marginheight="0"
                    marginwidth="0"
                    allowfullscreen
                >
                    Loading…
                </iframe>
            </div>
        {/if}
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
    .embed-wrapper {
        width: 90%;
        max-width: 900px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.1);
    }
    .embed-wrapper iframe {
        width: 100%;
        height: 80vh;
        min-height: 600px;
        display: block;
        border: none;
    }
    .denied-box {
    margin-top: 40px;
    text-align: center;
    padding: 40px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.6);
    max-width: 480px;
}

:global(body.dark-mode) .denied-box {
    background: rgba(30, 30, 30, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
}

.denied-box ul {
    text-align: left;
    display: inline-block;
    margin: 12px 0;
}

.denied-box li {
    margin: 6px 0;
}
</style>