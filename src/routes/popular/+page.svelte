<script>
    import { onMount } from "svelte";

    // Static values
    import LINK from "../../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Project from "$lib/Project/Project.svelte";
    import Button from "$lib/Button/Button.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    let projects = [];
    let requestFailed = false;
    let page = 0;
    let pageIsLast = false;
    let sortType = "loves";
    let loading = false;

    const sortOptions = [
        { value: "loves", label: "Most Liked" },
        { value: "votes", label: "Most Favorited" },
        { value: "views", label: "Most Viewed" }
    ];

    const fetchProjects = async () => {
        if (loading || pageIsLast) return;
        loading = true;

        try {
            const token = localStorage.getItem("token") || "";
            
            const url = `${LINK.projects}api/v1/projects/searchprojects?query=&page=${page}&type=${sortType}&reverse=false&token=${token}`;
            
            console.log("Fetching:", url);
            const response = await fetch(url);
            const result = await response.json();
            console.log(`Page ${page} results:`, result.length, "projects");
            console.log("First project:", result[0]);

            if (!Array.isArray(result)) {
                console.error("Invalid response:", result);
                requestFailed = true;
                loading = false;
                return;
            }

            if (result.length < 20) {
                pageIsLast = true;
            }

            // Filter out duplicates before adding
            const existingIds = new Set(projects.map(p => p.id));
            const newProjects = result.filter(p => !existingIds.has(p.id));
            
            console.log(`Added ${newProjects.length} new projects (${result.length - newProjects.length} were duplicates)`);
            
            projects = [...projects, ...newProjects];

            if (projects.length === 0 && page === 0) {
                projects = ["notfound"];
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            requestFailed = true;
        } finally {
            loading = false;
        }
    };

    const handleSortChange = () => {
        projects = [];
        page = 0;
        pageIsLast = false;
        requestFailed = false;
        fetchProjects();
    };

    const loadMore = () => {
        page += 1;
        fetchProjects();
    };

    onMount(() => {
        const params = new URLSearchParams(location.search);
        const sort = params.get("sort");
        if (sort && sortOptions.some(opt => opt.value === sort)) {
            sortType = sort;
        }
        
        fetchProjects();
        Language.forceUpdate();
    });

    let currentLang = "en";
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<svelte:head>
    <title>ArkIDE - Most Popular</title>
    <meta name="title" content="ArkIDE - Most Popular Projects" />
    <meta property="og:title" content="ArkIDE - Most Popular Projects" />
    <meta property="twitter:title" content="ArkIDE - Most Popular Projects">
    <meta name="description" content="Discover the most popular projects on ArkIDE - sorted by likes, favorites, and views.">
    <meta property="twitter:description" content="Discover the most popular projects on ArkIDE - sorted by likes, favorites, and views.">
    <meta property="og:url" content="https://penguinmod.com/popular">
    <meta property="twitter:url" content="https://penguinmod.com/popular">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="section-info">
        <div>
            <h1>
                <LocalizedText
                    text="Most Popular"
                    key="popular.title"
                    lang={currentLang}
                />
            </h1>
            <p>
                Discover the most popular projects on ArkIDE
            </p>
        </div>
    </div>

    <div class="section-sort">
        <label for="sort-select">Sort by:</label>
        <select 
            id="sort-select" 
            bind:value={sortType} 
            on:change={handleSortChange}
        >
            {#each sortOptions as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    </div>

    <div class="section-projects">
        {#if loading && projects.length === 0}
            <div style="margin-top: 16px;">
                <LoadingSpinner enableTips={true} />
            </div>
        {:else if projects[0] !== "notfound"}
            {#each projects as project (project.id)}
                <Project {...project} />
            {/each}
        {:else}
            <div>
                <PenguinConfusedSVG height="12rem" />
                <p>
                    <LocalizedText
                        text="No projects found."
                        key="generic.notfound"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}
    </div>

    {#if projects[0] !== "notfound" && !pageIsLast && projects.length > 0}
        <div style="height: 16px;" />
        <div class="more-projects-wrapper">
            <Button
                label={loading ? "Loading..." : "<img alt='More' src='/dropdown-caret-hd.png' width='20'></img>"}
                on:click={loadMore}
                disabled={loading}
            />
        </div>
    {/if}

    {#if requestFailed}
        <div class="error-message">
            <p>Failed to load projects. Please try again later.</p>
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
        height: 8.5rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
        text-align: center;
    }

    .section-sort {
        background: #e8f4ff;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        border-bottom: 2px solid #d0e8ff;
    }

    :global(body.dark-mode) .section-sort {
        background: #1a1a2e;
        border-bottom-color: #2a2a3e;
    }

    .section-sort label {
        font-weight: 600;
        font-size: 1.1rem;
    }

    :global(body.dark-mode) .section-sort label {
        color: white;
    }

    .section-sort select {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        border: 2px solid #0066ff;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .section-sort select:hover {
        border-color: #0052cc;
        box-shadow: 0 2px 8px rgba(0, 102, 255, 0.2);
    }

    :global(body.dark-mode) .section-sort select {
        background: #2a2a3e;
        color: white;
        border-color: #4a4a6e;
    }

    :global(body.dark-mode) .section-sort select:hover {
        border-color: #6a6a8e;
        box-shadow: 0 2px 8px rgba(106, 106, 142, 0.3);
    }

    .section-projects {
        margin: 0;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
    }

    .more-projects-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .error-message {
        text-align: center;
        padding: 2rem;
        color: #ff4444;
        font-weight: 600;
    }

    :global(body.dark-mode) .error-message {
        color: #ff6666;
    }
</style>