<script>
    import { onMount } from "svelte";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    
    // Static values
    import LINK from "../../resources/urls.js";
    
    let currentLang = "en";
    let showTomato = false;
    let tomatoGif = null;
    let audioElement = null;

    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function playTomato() {
        showTomato = true;
        // Reset the gif by changing src
        if (tomatoGif) {
            const src = tomatoGif.src;
            tomatoGif.src = '';
            tomatoGif.src = src;
        }
        
        // Play audio after delay (adjust the 1000ms to your desired timing)
        setTimeout(() => {
            if (audioElement) {
                audioElement.currentTime = 0;
                audioElement.play();
            }
        }, 0); // Change this number to delay in milliseconds (1000 = 1 second)
    }

    function onTomatoLoad() {
        if (!tomatoGif) return;
        // Create a temporary image to get gif duration
        const img = new Image();
        img.onload = function() {
            // Estimate gif duration (usually gifs are 2-5 seconds, adjust as needed)
            setTimeout(() => {
                showTomato = false;
            }, 7500); // Hide after 3 seconds, adjust based on your gif length
        };
        img.src = tomatoGif.src;
    }
    </script>
    
    <svelte:head>
        <title>ArkIDE - Terms of Service</title>
        <meta name="title" content="ArkIDE - Terms of Service" />
        <meta property="og:title" content="ArkIDE - Terms of Service" />
        <meta property="twitter:title" content="ArkIDE - Terms of Service">
        <meta name="description" content="Terms you must follow if you would like to use ArkIDE.">
        <meta property="twitter:description" content="Terms you must follow if you would like to use ArkIDE.">
        <meta property="og:url" content="https://arkide.site/terms">
        <meta property="twitter:url" content="https://arkide.site/terms">
    </svelte:head>
    
    <NavigationBar />
    
    <div class="main">
        <NavigationMargin />
    
        <div class="section-info">
            <h1>Terms of Service</h1>
        </div>
    
        <main>
            <!-- UPDATE THIS WHEN MAKING CONTENT CHANGES -->
            <p><i>Updated April 26th, 2025 (Mountain Time)</i></p>

            <!-- some things are intentionally not formatted as they are in the HTML file on the website -->
            <p>
                This document applies to
                <a href="https://arkide.site">https://arkide.site</a>,
                <a href="{PUBLIC_STUDIO_URL}">{PUBLIC_STUDIO_URL}</a>,
                <a href="https://extensions.arkide.site">https://extensions.arkide.site</a>,
                <a href="https://projects.arkide.site">https://projects.arkide.site</a>,
                and any other arkide.site subdomains.
            </p>
            <p>
                You may see websites such as <a href="https://scratch.mit.edu/">"Scratch"</a>,
                <a href="https://turbowarp.org/">"TurboWarp"</a>, <a href="https://oauth2.scratch-wiki.info/">"Scratch OAuth2"</a>,
                and <a href="https://auth.itinerary.eu.org/">"Scratch Authentication"</a>
                referenced in multiple places.
            </p>
            <p>
                A "Service Administrator", "Admin", "Moderator", "Mod" or "Administrator" is a person who can either
                directly access the server files for ArkIDE,
                or a person who can contact the server host that is able to access the server files and server process.
                "Host" may also refer to the server host of ArkIDE's project sharing.
            </p>
            <p>
                A "Project Moderator" is a person who has the ability to remove projects or content from those projects,
                and reply or send messages to users who had moderation actions happen towards their project or account.
                These users may also be able to edit profile information about another user.
            </p><p>
                These people can contact Administrators aswell, and may have extra permissions such as banning users.
            </p>

            <h2>Punishments</h2>

            <p>
                Violating these terms may result in punishments such as:
            </p>
            <li>Violation 1: Temporary Ban (1-7 Days depending on violation)</li>
            <li>Violation 2: Temporary Ban ban of 1-2 Months and your PFP will be changed to a sonic fetish PFP (dont ask)</li>
            <button on:click={playTomato} class="tomato-button">inconspicuous red button</button>

            <audio bind:this={audioElement} src="/tomato.mp3" preload="auto"></audio>

            {#if showTomato}
                <div class="tomato-fullscreen">
                    <img 
                        bind:this={tomatoGif}
                        src="/tomato.gif" 
                        alt="Tomato" 
                        on:load={onTomatoLoad}
                        class="tomato-gif"
                    />
                </div>
            {/if}
            <li>Violation 3: Perminant Ban</li>


            <h2>Verification Requirments</h2>
            <p>Here are the Requirments to get verified on ArkIDE, If you feel you reach these requierments, join our discord and contant an admin.</p>
            <li>You must have more than 25 Followers</li>
            <li>You must have a project with 200+ Viewers</li>
            <li>Optional: If you are an admin you automaticly get verified.</li>



            <h2>General</h2>
            <p>
                By using ArkIDE, you agree to the terms outlined below. If you do not agree with these terms, please refrain from
                using our website.
            </p>

            <h2>Your use of ArkIDE</h2>
            <p>
                When uploading projects or posting content on ArkIDE, your content must abide by the
                <a href="https://arkide.site/guidelines/uploading">Uploading Guidelines</a> and Terms of Service
                at all times. 
            </p>
            <p>
                Failure to follow these rules may result in restrictions on publishing projects, updating projects, remixing projects, or editing profile information. 
                ArkIDE has the right to remove/limit your access to any services we provide if we believe you
                are violating these guidelines or the Terms of Service.
            </p>
            <p>
                Accounts may be limited from certain features, deleted, or prevented from being used if they are found to violate the 
                <a href="https://arkide.site/guidelines/uploading">Uploading Guidelines</a> or the Terms of Service.
            </p>
            <p>
                Engaging in or encouraging abusive behavior toward ArkIDE systems, such as mass reporting, impersonation,
                exploiting bugs to cause harm, botting, manipulating statistics like likes, votes, and views,
                circumventing bans or deletions, or incentivizing others to break ArkIDE's rules, is strictly prohibited.
                <br>
                Violations may lead to limiting your account's access to certain features, account deletion, or permanent loss of access to ArkIDE's services.
            </p>
            <p>
                Using ArkIDE's services to engage in, promote, or facilitate illegal activities, including but not limited to breaking laws in your country, region, or area, is strictly prohibited.
                <br>
                Violations may lead to limiting your account's access to certain features, account deletion, or permanent loss of access to ArkIDE's services.
                <br>
                Serious offenses may result in your account information being shared with law enforcement authorities.
            </p>

            <h2>Copyright</h2>
            <p>
                You may not include copyrighted content in your projects. You are responsible for making sure you have the necessary
                rights, licenses, or permission for any user-generated content you submit to ArkIDE. You may get your projects, profile info
                or posts removed, and or face punishment if you do not properly check whether or not you have permission to include something
                in your content.
            </p>
            <p>
                If you are a company, individual, etc. and you believe your copyright has been violated,
                please view contact methods here: <a href="{PUBLIC_STUDIO_URL}/contact.html">Contact Us</a>
            </p>

            <h2>Advertisements</h2>
            <p>
                We may use Google AdSense to display advertisements on ArkIDE. These ads are provided by Google
                and are subject to Google's policies. ArkIDE is not responsible for the content of these ads.
            </p>

            <h2>Security</h2>
            <ul>
                <li><b>Authentication System:</b> ArkIDE allows users to use third-party websites to login or create accounts, such as
                    <a href="https://oauth2.scratch-wiki.info/">"Scratch OAuth2"</a>,
                    <a href="https://google.com/">"Google"</a>,
                    or <a href="https://github.com/">"GitHub"</a>
                    . ArkIDE also provides it's own secure authentication system for account creation and login.</li>
                <li><b>Vulnerabilities:</b> ArkIDE has active developers and a small set of users looking through our code to ensure proper security.</li>
            </ul>

            <h2>Exclusion of Damages</h2>
            <p>
                ArkIDE, its owners, administrators, and affiliates do not assume responsibility for
                any issues, damages, or consequences arising from the use of the website.
            </p>
            <p>
                ArkIDE is not liable for any direct, indirect, incidental, consequential,
                or special damages, including but not limited to loss of data, revenue, or profits.
            </p>

            <h2>Use at Your Own Risk</h2>
            <p>
                Despite above security measures, users must acknowledge that they are using ArkIDE at their own risk.
                ArkIDE is not responsible for any harm, loss, or damage to users' devices, data, or any other property.
            </p>

            <h2>Warranties</h2>
            <p>
                ArkIDE makes no warranties, express or implied, regarding the accuracy,
                reliability, or availability of the website or its content.
            </p>

            <h2>Changes to Terms</h2>
            <p>
                ArkIDE reserves the right to update or modify these terms of service at any time. Users are
                encouraged to review this document periodically for any changes.
            </p><p>
                ArkIDE will make effort to let users know of any changes to Uploading Guidelines, Terms of Service, or Privacy Policy through
                the website's messaging system and third-party services ArkIDE may have a precense on.
            </p><p>
                By continuing to use ArkIDE, you agree to abide by the most recent version of these terms.
            </p>

            <h2>Contact</h2>

            <p>Email us at <a href="mailto:ArkIDEhelp@gmail.com">ArkIDEhelp@gmail.com</a></p>
            <p>Join <a href="https://discord.gg/aPRchS3Zdp">our Discord Server</a></p>

            <div style="width: 100%; height: 32px;"></div>

            <p>
                <a href="/privacy">Privacy Policy</a>
            </p>
            <p>
                <a href="{PUBLIC_STUDIO_URL}/contact.html">Contact Us</a>
            </p>

            <div style="width: 100%; height: 32px;"></div>
        </main>
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
    
        main {
            margin: 0 20%;
            width: 60%;
        }
    
        .section-info {
            background: #0004ffad;
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
    
        :global(body.dark-mode) a {
            color: dodgerblue;
        }

:global(body.dark-mode) a {
    color: dodgerblue;
}

.tomato-button {
    margin: 16px 0;
    padding: 10px 20px;
    background: #ff6347;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s;
}

.tomato-button:hover {
    background: #ff4500;
}

.tomato-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.tomato-gif {
    max-width: 150vw;
    max-height: 150vh;
    object-fit: contain;
}
</style>
    