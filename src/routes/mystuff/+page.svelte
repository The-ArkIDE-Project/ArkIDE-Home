<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    import HTMLUtility from "../../resources/html.js";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import Project from "$lib/Project/Project.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../resources/icons/Penguin/confused.svelte";

    let projects = [];
    let error = null;
    let loggedIn = null;
    let page = 0;
    let pageIsLast = false;
    let username = "";

    // Tab management
    let currentTab = "local"; // "local" or "drive"

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
    
    // dropdown
    let editProjectDropdownMenu;
    let editProjectOptions = [];
    function showEditProjectDropdown(pointer, options) {
        editProjectOptions = options;
        editProjectDropdownMenu.style.display = "flex";
        editProjectDropdownMenu.style.left = `${pointer.x}px`;
        editProjectDropdownMenu.style.top = `${pointer.y}px`;
    }
    onMount(() => {
        window.addEventListener("mousedown", (e) => {
            if (!editProjectDropdownMenu) return;
            if (!HTMLUtility.isDescendantOf(editProjectDropdownMenu, e.target)) {
                editProjectDropdownMenu.style.display = "none";
            }
        });
    });

    // things
    function fetchNewProjects() {
        ProjectClient.getMyProjects(page).then((projectss) => {
            if (!projectss) {
                pageIsLast = true;
                return;
            }
            if (projectss.length <= 0) {
                pageIsLast = true;
                return;
            }
            if (projectss.length < 20) {
                pageIsLast = true;
            }
            projects.push(...projectss);
            projects = projects;
        });
    }

    function loggedInChange(username, privateCode) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setToken(privateCode);
        projects = [];
        ProjectClient.getMyProjects()
            .then((projectss) => {
                console.log(projectss);
                if (!projectss) {
                    projects = ["notfound"];
                    pageIsLast = true;
                    return;
                }
                if (projectss.length <= 0) {
                    projects = ["notfound"];
                    pageIsLast = true;
                    return;
                }
                if (projectss.length < 20) {
                    pageIsLast = true;
                }
                projects = projectss;
            })
            .catch((err) => {
                error = TranslationHandler.text("mystuff.error", currentLang);
                console.error(err);
            });
    }
    function deleteProject(id, name) {
        const correctCode = Math.round((Math.random() * 500000) + 100000);
        const code = prompt(
            String(
                TranslationHandler.textSafe("mystuff.confirm.delete", currentLang)
            )
                .replace("$2", correctCode)
                .replace("$1", name)
        );
        if (String(code).replace(/[^0-9]*/gim, "") !== String(correctCode)) {
            return;
        }
        ProjectClient.deleteProject(id).then(loggedInChange);
        if (!editProjectDropdownMenu) return;
        editProjectDropdownMenu.style.display = "none";
    }

    onMount(async () => {
        username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(() => {
                loggedIn = true;
                loggedInChange(username, token);
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({username}) => {
                    if (username) {
                        loggedIn = true;
                        loggedInChange(username, privateCode);
                        return;
                    }
                    loggedIn = false;
                })
                .catch(() => {
                    loggedIn = false;
                });
        });
    }

    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((username, privateCode) => {
        loggedIn = true;
        loggedInChange(username, privateCode);
    });
</script>

<svelte:head>
    <title>ArkIDE - My Stuff</title>
    <meta name="title"                   content="ArkIDE - My Stuff" />
    <meta property="og:title"            content="ArkIDE - My Stuff" />
    <meta property="twitter:title"       content="ArkIDE - My Stuff">
    <meta name="description"             content="View your own projects & content.">
    <meta property="twitter:description" content="View your own projects & content.">
    <meta property="og:url"              content="https://penguinmod.com/mystuff">
    <meta property="twitter:url"         content="https://penguinmod.com/mystuff">
</svelte:head>

<NavigationBar />

<!-- project editing menu -->
<div bind:this={editProjectDropdownMenu} class="dropdown-options">
    {#each editProjectOptions as option}
        {#if option.href}
            <a
                href={option.href}
                target={option.newtab ? "_blank" : "_self"}
                class="dropdown-redirect"
            >
                <button
                    class={"dropdown-option dropdown-option-" +
                        (option.color ? option.color : "default")}
                    on:click={option.callback ? option.callback : null}
                >
                    {option.name}
                </button>
            </a>
        {:else}
            <button
                class={"dropdown-option dropdown-option-" +
                    (option.color ? option.color : "default")}
                on:click={option.callback ? option.callback : null}
            >
                {option.name}
            </button>
        {/if}
    {/each}
</div>

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="section-info">
        <h1>
            <LocalizedText
                text="My Stuff"
                key="mystuff.title"
                lang={currentLang}
            />
        </h1>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
        <button 
            class="tab-button" 
            class:active={currentTab === 'local'}
            on:click={() => currentTab = 'local'}
        >
            <LocalizedText
                text="Local Projects"
                key="mystuff.tab.local"
                lang={currentLang}
            />
        </button>
        <button 
            class="tab-button" 
            class:active={currentTab === 'drive'}
            on:click={() => currentTab = 'drive'}
        >
            <img src="/google.svg" alt="Google Drive" class="tab-icon" />
            <LocalizedText
                text="Google Drive"
                key="mystuff.tab.drive"
                lang={currentLang}
            />
        </button>
    </div>

    {#if currentTab === 'local'}
        <!-- Original My Stuff Content -->
        <div class="section-projects">
            {#if loggedIn === null}
                <div style="margin-top: 16px;">
                    <LoadingSpinner enableTips={true} />
                </div>
            {:else if loggedIn === false}
                <div class="login-prompt">
                    <p>
                        <LocalizedText
                            text="Please log in to view your PenguinMod projects."
                            key="mystuff.login"
                            lang={currentLang}
                        />
                    </p>
                    <Button on:click={askForLogin}>
                        <LocalizedText
                            text="Sign In"
                            key="navigation.login"
                            lang={currentLang}
                        />
                    </Button>
                </div>
            {:else if projects[0] !== "notfound"}
                {#each projects as project}
                    <div style="position: relative;">
                        <button class="dots-menu" on:click={(pointer) => showEditProjectDropdown(pointer, [
                            {
                                name: String(project.remix) !== "0"
                                    ? TranslationHandler.textSafe(
                                          "project.menu.remix.edit",
                                          currentLang
                                      )
                                    : TranslationHandler.textSafe(
                                          "project.menu.project.edit",
                                          currentLang
                                      ),
                                href: `/edit?id=${project.id}`,
                                color: String(project.remix) !== "0" ? "remix" : null,
                            },
                            {
                                name: String(project.remix) !== "0"
                                    ? TranslationHandler.textSafe(
                                          "project.menu.remix.delete",
                                          currentLang
                                      )
                                    : TranslationHandler.textSafe(
                                          "project.menu.project.delete",
                                          currentLang
                                      ),
                                callback: () => {
                                    deleteProject(project.id, project.title);
                                },
                                color: "red",
                            },
                        ])}>
                            <img class="dots-icon" src="/dots.svg" alt="..." />
                        </button>
                        <Project
                            id={project.id}
                            title={project.title}
                            author={{username: username, id:project.author}}
                            date={project.date}
                            featured={project.featured}
                            rejected={project.removedsoft}
                            style="padding:8px;height:auto"
                            lastUpdate={project.lastUpdate}
                        >
                            <div class="inside-project">
                                {#if project.hidden}
                                    <p>
                                        <i>
                                            <LocalizedText
                                                text="(hidden)"
                                                key="project.status.hidden"
                                                lang={currentLang}
                                            />
                                        </i>
                                    </p>
                                {:else if project.removedsoft}
                                    <p>
                                        <i>
                                            <LocalizedText
                                                text="(under review)"
                                                key="project.status.reviewing"
                                                lang={currentLang}
                                            />
                                        </i>
                                    </p>
                                    <a href="/edit?id={project.id}">
                                        <LocalizedText
                                            text="Edit Project"
                                            key="project.menu.project.edit"
                                            lang={currentLang}
                                        />
                                    </a>
                                {/if}
                            </div>
                        </Project>
                    </div>
                {:else}
                    <!-- projects.length === 0 -->
                    <div style="margin-top: 16px;">
                        <LoadingSpinner />
                    </div>
                {/each}
            {:else}
                <div>
                    <PenguinConfusedSVG height="12rem" />
                    <p>
                        <LocalizedText
                            text="Nothing was found."
                            key="generic.notfound"
                            lang={currentLang}
                        />
                    </p>
                </div>
            {/if}
        </div>

        {#if projects[0] !== "notfound"}
            {#if !pageIsLast && projects.length > 0}
                <div style="height: 16px;" />
                <div class="more-projects-wrapper">
                    <Button
                        label="<img alt='More' src='/dropdown-caret-hd.png' width='20'></img>"
                        on:click={() => {
                            page += 1;
                            fetchNewProjects();
                        }}
                    />
                </div>
            {/if}
        {/if}
    {:else if currentTab === 'drive'}
        <!-- Google Drive Tab -->
        <div class="drive-container">
            <div class="drive-info">
                <img src="/google.svg" alt="Google Drive" class="drive-logo" />
                <h2>
                    <LocalizedText
                        text="Google Drive Projects"
                        key="mystuff.drive.title"
                        lang={currentLang}
                    />
                </h2>
                <p>
                    <LocalizedText
                        text="Access your ArkIDE projects stored in Google Drive. Create a folder named 'arkide-projects' to get started!"
                        key="mystuff.drive.description"
                        lang={currentLang}
                    />
                </p>
            </div>
            
            <div class="drive-iframe-wrapper">
                <iframe
                    src="https://drive.google.com/drive/my-drive"
                    title="Google Drive"
                    class="drive-iframe"
                    allow="clipboard-read; clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                ></iframe>
            </div>

            <div class="drive-instructions">
                <h3>📁 Quick Setup:</h3>
                <ol>
                    <li>Sign in to your Google account in the iframe above</li>
                    <li>Create a folder called <strong>"arkide-projects"</strong></li>
                    <li>Upload your .arkide project files to that folder</li>
                    <li>You can open files from Drive in the editor!</li>
                </ol>
            </div>
        </div>
    {/if}

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

    .section-info {
        background: #001affad;
        height: 6rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
    }

    /* Tab Navigation */
    .tab-navigation {
        display: flex;
        justify-content: center;
        gap: 0;
        background: #f0f0f0;
        padding: 0;
        border-bottom: 2px solid #ccc;
    }

    .tab-button {
        padding: 12px 32px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        color: #666;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 3px solid transparent;
    }

    .tab-button:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
    }

    .tab-button.active {
        color: #0011ff;
        border-bottom-color: #0011ff;
        background: white;
    }

    .tab-icon {
        width: 20px;
        height: 20px;
    }

    :global(body.dark-mode) .tab-navigation {
        background: #2a2a2a;
        border-bottom-color: #444;
    }

    :global(body.dark-mode) .tab-button {
        color: #aaa;
    }

    :global(body.dark-mode) .tab-button:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ddd;
    }

    :global(body.dark-mode) .tab-button.active {
        color: #4d88ff;
        border-bottom-color: #4d88ff;
        background: #1a1a1a;
    }

    /* Google Drive Section */
    .drive-container {
        width: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .drive-info {
        text-align: center;
        max-width: 800px;
    }

    .drive-logo {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
    }

    .drive-info h2 {
        margin: 0 0 12px 0;
        color: #333;
    }

    .drive-info p {
        color: #666;
        font-size: 14px;
    }

    :global(body.dark-mode) .drive-info h2 {
        color: #fff;
    }

    :global(body.dark-mode) .drive-info p {
        color: #aaa;
    }

    .drive-iframe-wrapper {
        width: 90%;
        max-width: 1200px;
        height: 600px;
        border: 2px solid #ccc;
        border-radius: 8px;
        overflow: hidden;
        background: white;
    }

    .drive-iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    :global(body.dark-mode) .drive-iframe-wrapper {
        border-color: #444;
        background: #1a1a1a;
    }

    .drive-instructions {
        background: #f9f9f9;
        padding: 20px 32px;
        border-radius: 8px;
        max-width: 800px;
        border-left: 4px solid #0011ff;
    }

    .drive-instructions h3 {
        margin-top: 0;
        color: #333;
    }

    .drive-instructions ol {
        margin: 12px 0;
        padding-left: 20px;
    }

    .drive-instructions li {
        margin: 8px 0;
        color: #555;
    }

    :global(body.dark-mode) .drive-instructions {
        background: #2a2a2a;
        border-left-color: #4d88ff;
    }

    :global(body.dark-mode) .drive-instructions h3 {
        color: #fff;
    }

    :global(body.dark-mode) .drive-instructions li {
        color: #bbb;
    }

    .section-projects {
        margin: 0;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
    }

    .inside-project {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    :global(body.dark-mode) .inside-project {
        color: white;
    }

    .login-prompt {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
        margin-bottom: 16px;
        align-items: center;
    }

    .more-projects-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }

    /* edit project dropdown & options */
    .dots-menu {
        position: absolute;
        right: 16px;
        top: 16px;
        background: transparent;
        border: 0;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        cursor: pointer;
        transition-duration: 250ms;
        overflow: hidden;
        z-index: 500;
    }
    .dots-menu:focus,
    .dots-menu:hover {
        background: rgba(0, 0, 0, 0.1);
        transition-duration: 250ms;
    }
    .dots-menu:active {
        background: rgba(0, 0, 0, 0.25);
        transition-duration: 250ms;
    }

    .dots-icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }

    .dropdown-options {
        width: 128px;
        background: white;
        border-radius: 4px;
        outline-style: solid;
        outline-width: 4px;
        outline-color: rgba(0, 0, 0, 0.25);
        display: none;
        flex-direction: column;
        align-items: stretch;
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10000;
        padding: 6px;
    }

    .dropdown-option {
        border: 0;
        border-radius: 4px;
        margin: 2px 0px;
        background: transparent;
        cursor: pointer;
        padding: 4px 0px;
    }
    .dropdown-redirect {
        text-decoration: none;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    .dropdown-option-default:focus,
    .dropdown-option-default:hover {
        background: #0011ff;
    }

    .dropdown-option-remix:focus,
    .dropdown-option-remix:hover {
        background: #48ac72;
    }
    .dropdown-option-gray:focus,
    .dropdown-option-gray:hover {
        background: #a1a1a1;
    }
    .dropdown-option-orange:focus,
    .dropdown-option-orange:hover {
        background: #ffab00;
    }
    .dropdown-option-red:focus,
    .dropdown-option-red:hover {
        background: #ff5151;
    }
</style>
