<script>
    import { onMount } from "svelte";
    import { PUBLIC_STUDIO_URL } from "$env/static/public";
    onMount(() => {
        window.location.href =
            `https://packager.arkide.site/`;
    });
</script>

<svelte:head>
    <title>Redirecting</title>
    <meta name="title" content="ArkIDE - Home" />
    <meta property="og:title" content="ArkIDE - Home" />
    <meta property="twitter:title" content="ArkIDE - Home">
    <meta name="description" content="the ArkIDE Project Hosting Website Thing">
    <meta property="twitter:description" content="the ArkIDE Project Hosting Website Thing">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>
<div>
    If you are not redirected automatically,
    <a href="https://packager.arkide.site/">click here</a>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: white;
    }

    a {
        margin-left: 4px;
    }

    div {
        background: #009ccc;
        display: flex;
        align-items: center;
        height: 100%;
        width: 100%;
        position: absolute;
        left: 0px;
        top: 0px;
        overflow: hidden;
        justify-content: center;
    }
</style>
