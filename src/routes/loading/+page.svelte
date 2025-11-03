<script>
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
</script>

<svelte:head>
    <title>ArkIDE - Loading</title>
    <meta name="title" content="ArkIDE - Home" />
    <meta property="og:title" content="ArkIDE - Home" />
    <meta property="twitter:title" content="ArkIDE - Home">
    <meta name="description" content="the ArkIDE Project Hosting Website Thing">
    <meta property="twitter:description" content="the ArkIDE Project Hosting Website Thing">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="box">
        <LoadingSpinner />
    </div>
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
    .box {
        margin-top: 32px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
