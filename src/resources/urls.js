import ProjectApi from "./projectapi"

import { PUBLIC_STUDIO_URL } from "$env/static/public";

export default {
    /**
     * PenguinMod's normal page
     */
    base: `${PUBLIC_STUDIO_URL}/`,

    /**
     * PenguinMod's editor page
     */
    editor: `${PUBLIC_STUDIO_URL}/editor.html`,

    /**
     * PenguinMod's credits page
     */
    credits: `${PUBLIC_STUDIO_URL}/credits.html`,
    
    /**
     * PenguinMod's contact page
     */
    contact: `${PUBLIC_STUDIO_URL}/contact.html`,

    /**
     * PenguinMod's terms of service page
     */
    terms: "/terms",

    /**
     * PenguinMod's privacy policy page
     */
    privacy: "/privacy",

    /**
     * PenguinMod's guideline pages for services
     */
    guidelines: {
        /**
         * PenguinMod's project uploading guidelines
         */
        projects: `${PUBLIC_STUDIO_URL}/PenguinMod-Guidelines/PROJECTS`
    },

    /**
     * Donation pages for sites
     */
    donate: {
        scratch: "https://www.scratchfoundation.org/donate",
        turbowarp: "https://github.com/sponsors/GarboMuffin"
    },

    /**
     * PenguinMod's project page
     */
    projects: `${ProjectApi.OriginApiUrl}/`,

    /**
     * PenguinMod's my stuff page
     */
    mystuff: `${ProjectApi.OriginApiUrl}/mystuff`,

    /**
     * PenguinMod's home page
     */
    home: "https://arkide.site/",

    /**
     * PenguinMod's packager page
     */
    packager: `https://packager.arkide.site/`,

    /**
     * PenguinMod's unofficial wiki
     */
    wiki: "https://forums.arkide.site/",

    /**
     * PenguinMod's Discord invite
     */
    discord: "https://discord.gg/aPRchS3Zdp",

    /**
     * Scratch's website
     */
    scratch: "https://scratch.mit.edu",

    /**
     * TurboWarp's website
     */
    turbowarp: "https://turbowarp.org",

    /**
     * PenguinMod's github page
     */
    github: "https://github.com/The-ArkIDE-Project",

    /**
     * PenguinMod's basic API
     */
    basicApi: "https://arkidebasicapi.arkide.site/",

    /**
     * The admin panel for pm projects api
     */
    adminPanel: "https://arkide.site/panel",

    /**
     * The link to the Desktop App
     */
    desktop: "/desktop",

    /**
     * The link to the Popular Projects page
     */

    popular: "/popular"
}
