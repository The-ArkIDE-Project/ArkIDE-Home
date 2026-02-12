<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import MarkdownIt from "markdown-it";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    import LINK from "../../resources/urls.js";
    import scratchblocks from "$lib/scratchblocks.js";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    import EmojiList from "../../resources/emojis.js";
    import censor from "../../resources/basiccensorship.js";
    const ProjectClient = new ProjectApi();
    
    // Static values
    import ProfileBadges from "../../resources/badges.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Project from "$lib/Project/Project.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    import ProfileBadge from "$lib/Badge.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../resources/icons/Penguin/confused.svelte";
    import SearchSVG from "../../resources/icons/Search/icon.svelte";

    let loggedIn = null;
    let loggedInUser = "";
    let loggedInUserId = "";
    let loggedInAdmin = false;
    let replyingTo = null;

    let user;
    const projects = {
        all: [],
        featured: [],
    };
    let badges = [];
    let isDonator = false;
    let isFollowingUser = false;
    let followOnLoad = false;
    let wasNotFound = false;
    let isForceView = false;
    let followerCount = null;
    let fullProfile = {};
    let isRankingUpMenu = false;
    let isAttemptingRankUp = false;
    let profileFeaturedProject = null;
    let backgroundImageUrl = '';
    let profileComments = [];
    let commentPage = 0;
    let commentCount = 0;
    let isLoadingComments = false;
    let newCommentContent = '';
    let showEmojiPicker = false;
let emojiMap = {};
let emojisLoaded = false;
    let editingCommentId = null;
    let editingCommentContent = '';
    let replyingToCommentId = null;
    let replyContent = '';
    let commentsEnabled = null;
    let canToggleComments = false;
    let bannerPreviewUrl = '';
    let showCropper = false;
    let cropperCanvas;
    let cropperImage;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let imagePosition = { x: 0, y: 0 };
    let imageScale = 1;
    let minScale = 1;
    let bannerImageUrl = '';
    let isEditingBanner = false;
    let bannerUploadInput;
    let isBannerUploading = false;


    $: {
        if (profileFeaturedProject && profileFeaturedProject !== 'none' && profileFeaturedProject.id) {
            backgroundImageUrl = `${ProjectApi.OriginApiUrl}/api/v1/projects/getproject?projectID=${profileFeaturedProject.id}&requestType=thumbnail`;
        } else {
            backgroundImageUrl = '';
        }
    }

    let followingList = [];
    let followerslist = [];
    
    let isProfilePrivate = false;
    let isProfilePublicToFollowers = false;
    let isFollowedByUser = false;

    const profileEditingData = {
        bio: '',
        project: 0,
        projectTitle: 1,
        isEditingBio: false,
        isBioEditLoading: false,
        isBioInappropriate: false,
        isEditingProject: false,
        isProjectEditLoading: false,
        bioComponent: null,
    };
    let canSendSaveReq = true;
    let canSendEditedProject = true;
    const saveEditedBio = () => {
        if (!canSendSaveReq) return;
        canSendSaveReq = false;
        profileEditingData.isBioInappropriate = false;
        profileEditingData.isBioEditLoading = true;
        ProjectClient.setBio(profileEditingData.bio, String(user).toLowerCase() !== String(loggedInUser).toLowerCase(), user).then(() => {
            fullProfile.bio = profileEditingData.bio;
            profileEditingData.isEditingBio = false;
            setTimeout(() => {
                renderScratchBlocks();
            }, 0);
        }).catch(err => {
            if (err === 'IllegalWordsUsed') {
                profileEditingData.isBioInappropriate = true;
            }
            console.log(err)
        }).finally(() => {
            canSendSaveReq = true;
            profileEditingData.isBioEditLoading = false;
        });
    };
    // Fetch profile comments
const fetchProfileComments = async () => {
    isLoadingComments = true;
    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments?username=${encodeURIComponent(user)}&page=${commentPage}&pageSize=20`);
        const data = await response.json();
        profileComments = data.comments || [];
        commentCount = data.count || 0;
    } catch (err) {
        console.error("Failed to load comments:", err);
    }
    isLoadingComments = false;
};

// Fetch comments enabled status
const fetchCommentsStatus = async () => {
    try {
        console.log("[Status] Fetching comments status for user:", user);
        
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments/status?username=${encodeURIComponent(user)}`);
        
        console.log("[Status] GET /status response status:", response.status);

        if (response.status === 404) {
            // User might not have the field set yet - default to enabled
            console.warn("[Status] User not found or no status set, defaulting to true");
            commentsEnabled = true;
            return;
        }

        if (!response.ok) {
            console.warn("[Status] Failed to fetch, defaulting to true");
            commentsEnabled = true;
            return;
        }

        const data = await response.json();
        console.log("[Status] Response data:", data);

        commentsEnabled = data.enabled !== false; // Explicitly check - default true if undefined
        console.log("[Status] Final commentsEnabled after fetch:", commentsEnabled);
    } catch (err) {
        console.error("[Status] Network or unexpected error:", err);
        commentsEnabled = true; // Default to enabled on error
    }
};

// Post a new comment
const postComment = async () => {
    if (!newCommentContent.trim()) return;
    
    // Check if we're replying to a specific comment
    let parentId = null;
    let content = newCommentContent.trim();
    
    if (replyingTo && replyingTo.commentId) {
        // Using the reply button - we know exactly which comment to reply to
        parentId = replyingTo.commentId;
        // Remove the @mention from the content
        const mentionMatch = content.match(/^@\w+\s+(.+)/);
        if (mentionMatch) {
            content = mentionMatch[1];
        }
    } else {
        // Manual @mention - find the most recent top-level comment by that user
        const mentionMatch = content.match(/^@(\w+)\s+(.+)/);
        if (mentionMatch) {
            const mentionedUser = mentionMatch[1];
            const restOfComment = mentionMatch[2];
            
            const userComments = profileComments.filter(c => c.username === mentionedUser && !c.parentId);
            const parentComment = userComments[0];
            if (parentComment) {
                parentId = parentComment.id;
                content = restOfComment;
            }
        }
    }
    content = censor(content);
    
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to comment");
        return;
    }

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                username: user,
                content: content,
                parentId: parentId
            })
        });

        if (response.ok) {
            newCommentContent = '';
            replyingTo = null;
            commentPage = 0;
            await fetchProfileComments();
        } else {
            const error = await response.json();
            if (error.error === "CommentsDisabled") {
                alert("Comments are disabled on this profile");
            } else if (error.error === "IllegalWordsUsed") {
                alert("Your comment contains inappropriate words");
            } else {
                alert("Failed to post comment");
            }
        }
    } catch (err) {
        console.error("Failed to post comment:", err);
        alert("Failed to post comment");
    }
};

// Update a comment
const updateComment = async (commentId, content) => {
    content = censor(content);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments/${commentId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            editingCommentId = null;
            editingCommentContent = '';
            await fetchProfileComments();
        } else {
            alert("Failed to update comment");
        }
    } catch (err) {
        console.error("Failed to update comment:", err);
        alert("Failed to update comment");
    }
};

// Delete a comment
const deleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            await fetchProfileComments();
        } else {
            alert("Failed to delete comment");
        }
    } catch (err) {
        console.error("Failed to delete comment:", err);
        alert("Failed to delete comment");
    }
};

// Report a comment
const reportComment = async (commentId) => {
    const reason = prompt("Why are you reporting this comment?");
    if (!reason) return;
    
    console.log("[Report] Starting report for commentId:", commentId);
    console.log("[Report] Reason:", reason);
    
    try {
        const headers = { "Content-Type": "application/json" };
        const token = localStorage.getItem("token");
        console.log("[Report] Token exists:", !!token);
        
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        
        console.log("[Report] Sending request to:", `${PUBLIC_API_URL}/api/v1/profiles/comments/${commentId}/report`);
        
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments/${commentId}/report`, {
            method: "POST",
            headers,
            body: JSON.stringify({ reason: reason.trim() })
        });
        
        console.log("[Report] Response status:", response.status);
        const responseText = await response.text();
        console.log("[Report] Response body:", responseText);
        
        if (response.ok) {
            alert("Comment reported successfully");
        } else {
            alert("Failed to report comment");
        }
    } catch (err) {
        console.error("[Report] Error:", err);
        alert("Failed to report comment");
    }
};

const replyToComment = (comment) => {
    replyingTo = {
        commentId: comment.id,
        username: comment.username
    };
    newCommentContent = `@${comment.username} `;
};

let toggleInProgress = false;

const toggleCommentsEnabled = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (commentsEnabled === null) {
        console.warn("Cannot toggle comments: current state unknown");
        return;
    }

    const newState = !commentsEnabled;
    console.log("[Toggle] Attempting to set commentsEnabled to:", newState);

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/profiles/comments/toggle`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                username: user,
                enabled: newState 
            })
        });

        console.log("[Toggle] POST response status:", response.status);

        if (response.ok) {
            const data = await response.json();
            console.log("[Toggle] POST response data:", data);
            
            // CRITICAL: Reassign to trigger Svelte reactivity
            commentsEnabled = data.enabled;
            
            // Force a re-render by reassigning to itself
            commentsEnabled = commentsEnabled;
            
            console.log("[Toggle] Updated local commentsEnabled:", commentsEnabled);
        } else {
            const errorData = await response.json();
            console.error("[Toggle] Failed to toggle comments:", errorData);
            alert("Failed to toggle comments: " + (errorData.error || "Unknown error"));
        }
    } catch (err) {
        console.error("[Toggle] Network or unexpected error:", err);
        alert("Failed to toggle comments");
    }
};

// Check if user can delete/edit a comment
const canModifyComment = (comment) => {
    if (!loggedIn) return false;
    if (loggedInAdmin) return true;
    if (comment.username === loggedInUser) return true;
    if (user.toLowerCase() === loggedInUser.toLowerCase()) return true;
    return false;
};

// Format date
function formatCommentDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// Add these functions after formatCommentDate
function parseEmojis(text) {
    if (!text) return text;
    
    // Match :emojiname: pattern
    return text.replace(/:([a-zA-Z0-9_-]+):/g, (match, emojiName) => {
        return `<img src="https://library.arkide.site/files/emojis/${emojiName}.png" alt="${emojiName}" class="emoji-inline" title=":${emojiName}:" />`;
    });
}

function parseMentions(text) {
    if (!text) return text;
    
    // Match @username pattern
    return text.replace(/@(\w+)/g, (match, username) => {
        return `<a href="/profile?user=${username}" class="mention-link" target="_blank">@${username}</a>`;
    });
}

function parseContent(text) {
    // First parse emojis, then mentions
    let parsed = parseEmojis(text);
    parsed = parseMentions(parsed);
    return parsed;
}
    const updateProjectFeaturedTitle = (element) => {
        const projectTitle = Number(element.target.value);
        profileEditingData.projectTitle = projectTitle;
    };
    const saveEditedProject = (id) => {
        if (!canSendEditedProject) return;
        canSendEditedProject = false;
        profileEditingData.project = id;
        console.log(profileEditingData.project, profileEditingData.projectTitle)
        profileEditingData.isProjectEditLoading = true
        ProjectClient.setMyFeaturedProject(profileEditingData.project, profileEditingData.projectTitle).then(() => {
            profileEditingData.isEditingProject = false;
            location.reload();
        }).catch(err => {
            alert(err);
        }).finally(() => {
            canSendEditedProject = true;
            profileEditingData.isProjectEditLoading = false;
        });
    };

    const projectTitles = [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20
    ];
    const projectTitleStrings = [
        "Featured Project",
        "Featured Tutorial",
        "My Big Project",
        "My Best Project",
        "My Best Work",
        "Take a look!",
        "A little bit more about me",
        "My Favorite",
        "My Favorite Things",
        "What I like",
        "Why I use ArkIDE",
        "My Life's Work",
        "What I Do",
        "In my spare time...",
        "What I spend my time doing",
        "Check this out!",
        "Join my Contest!",
        "Please play!",
        "Here's my series!",
        "My Animation",
    ];

    let fetchedFullProfile = false;
    const fetchProfile = () => {
        const username = localStorage.getItem("username");

        projects.all = [];
        projects.featured = [];
        fetchedFullProfile = false;
        const then = (projs) => {
            projects.all = projs;
            projects.featured = projs.filter((p) => p.featured);
            if (projects.all.length <= 0) {
                projects.all = ["none"];
            }
            if (projects.featured.length <= 0) {
                projects.featured = ["none"];
            }
            wasNotFound = false;
            ProjectApi.getProfile(user, true).then((proffile) => {
                fullProfile = proffile;
                badges = fullProfile.badges;
                isDonator = fullProfile.donator;
                followerCount = fullProfile.followers;

                isProfilePrivate = fullProfile.privateProfile;
                isProfilePublicToFollowers = fullProfile.canFollowingSeeProfile;

                isFollowedByUser = fullProfile.isFollowing;

                fetchBanner(user);

                let profileFeatured = fullProfile.myFeaturedProject;
                if (profileFeatured === -1) {
                    profileFeatured = 0
                }
                if (profileFeatured) {
                    ProjectApi.getProjectMeta(profileFeatured).then(metadata => {
                        //console.log(metadata);
                        profileFeaturedProject = metadata;
                    }).catch((err) => {
                        console.warn('Failed to load profile featured project;', err);
                        profileFeaturedProject = 'none';
                    });
                } else if (!profileFeatured && !projects.all[0]) {
                    profileFeaturedProject = 'none';
                } else if (!profileFeatured && projects.all[0]) {
                    profileFeaturedProject = projects.all[0];
                }
// Fetch both lists concurrently
Promise.all([
    ProjectClient.getFollowers(user),
    ProjectClient.getFollowing(user)
])
.then(([followers, following]) => {
    // Followers
    if (Array.isArray(followers) && followers.length > 0) {
        followerslist = followers.filter(u => u && u.username && u.username !== "undefined");
    } else {
        followerslist = [];
    }

    // Following
    if (Array.isArray(following) && following.length > 0) {
        followingList = following.filter(u => u && u.username && u.username !== "undefined");
    } else {
        followingList = [];
    }
})
.catch(() => {
    // If either fails, safely set empty arrays
    followerslist = [];
    followingList = [];
});
            });
        };

        const catch_func = (err) => {
            console.log(err);
            err = JSON.parse(err);
            err = err.error;
            if (err === 'NotFound' || err === 'UserNotFound') {
                wasNotFound = true;
            }
            if (err === 'PrivateProfile') {
                isProfilePrivate = true;
                then([]);
            }
        };

        if ((loggedIn && username) && String(user).toLowerCase() === String(username).toLowerCase()) {
            ProjectClient.getMyProjects(0).then(then).catch(catch_func).finally(() => {
                fetchedFullProfile = true;
                setTimeout(() => {
                    renderScratchBlocks();
                }, 0);
            });
        } else {
            ProjectClient.getUserProjects(user, 0).then(then).catch(catch_func).finally(() => {
                fetchedFullProfile = true;
                setTimeout(() => {
                    renderScratchBlocks();
                }, 0);
            });
        }
    };
    const loggedInChange = async () => {
        if (!loggedIn) {
            isFollowingUser = false;
        } else {
            try {
                const isFollowing = await ProjectClient.isFollowingUser(user);
                isFollowingUser = isFollowing;
                followOnLoad = isFollowing;
            } catch (err) {
                console.warn("Couldnt see is following", err);
            }
            try {
                checkIfBlocked();
            } catch (err) {
                console.warn("Couldnt check if blocked", err);
            }
        }
        fetchProfile();
        
        await fetchCommentsStatus();
        await fetchProfileComments();
        await loadEmojis();
        
        // Check if user can toggle comments
        if (loggedIn && (String(user).toLowerCase() === String(loggedInUser).toLowerCase() || loggedInAdmin)) {
            canToggleComments = true;
        }
    };
    
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
    
    onMount(async () => {
        const params = new URLSearchParams(location.search);
        const query = params.get("user") ?? "";
        const idQuery = params.get("id") ?? "";
        user = query;

        if (idQuery) {
            const username = await new Promise((resolve) => {
                ProjectApi.getUsernameById(idQuery)
                    .then((username) => {
                        resolve(username)
                    })
                    .catch(() => {
                        resolve();
                    });
            });
            if (username) {
                user = username;
            }
        }

        // REMOVE THESE THREE LINES FROM HERE:
        // await fetchCommentsStatus();
        // await fetchProfileComments();
        // canToggleComments check

        page.subscribe(v => {
            if (!v.url.searchParams.get("user") || !user) return;
            if (String(v.url.searchParams.get("user")).toLowerCase() === String(user).toLowerCase()) return;
            
            window.location.reload();
        });
    });

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    const waitForLogin = () => {
        return new Promise((resolve, reject) => {
            if (loggedIn) return resolve();
            Authentication.authenticate().then((privateCode) => {
                loggedIn = null;
                loggedInUser = "";
                loggedInUserId = "";
                loggedInAdmin = false;
                Authentication.usernameFromCode(privateCode)
                    .then(({ username, isAdmin, isApprover, id }) => {
                        loggedIn = true;
                        loggedInUser = username;
                        loggedInUserId = id;
                        loggedInAdmin = isAdmin || isApprover;

                        loggedInChange();
                        resolve();
                    })
                    .catch(() => {
                        loggedIn = false;
                        loggedInUser = "";
                        loggedInUserId = "";
                        loggedInAdmin = false;
                        loggedInChange();
                        reject();
                    });
            });
        });
    };
    let canClickFollow = true;
    const followUser = async () => {
        await waitForLogin();
        await ProjectClient.toggleFollowingUser(user, !isFollowingUser);
        isFollowingUser = !isFollowingUser;
    };
    const safeFollowUser = async () => {
        if (!canClickFollow) return;
        canClickFollow = false;
        try {
            await followUser();
        } catch (err) {
            console.error("couldnt follow user", err);
        }
        canClickFollow = true;
    };

    // login code below
    onMount(async () => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        if (!token || !username) {
            loggedIn = false;
            loggedInUser = "";
            loggedInUserId = "";
            loggedInAdmin = false;
            loggedInChange();
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(async ({ id, isAdmin, isApprover }) => {
                ProjectClient.setUsername(username);
                ProjectClient.setToken(token);
                loggedIn = true;
                loggedInUser = username;
                loggedInUserId = id;
                loggedInAdmin = isAdmin || isApprover;
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInUserId = "";
                loggedInAdmin = false;
                loggedInChange();
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInUser = "";
        loggedInUserId = "";
        loggedInAdmin = false;
        loggedInChange();
    });
    Authentication.onAuthentication((username, privateCode) => {
        loggedIn = null;
        loggedInUser = "";
        loggedInUserId = "";
        loggedInAdmin = false;
        Authentication.usernameFromCode(privateCode)
            .then(({ username, id, isAdmin, isApprover }) => {
                ProjectClient.setUsername(username);
                ProjectClient.setToken(privateCode);
                loggedIn = true;
                loggedInUser = username;
                loggedInUserId = id;
                loggedInAdmin = isAdmin || isApprover;
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInUserId = "";
                loggedInAdmin = false;
                loggedInChange();
            });
    });

    let isBlocked = false;
    let showAnyways = false;

    async function checkIfBlocked() {
        const ret = await ProjectClient.checkIfBlocked(user);
        isBlocked = ret;
        showAnyways = !ret;
    }

    const rankUpAccount = () => {
        isAttemptingRankUp = true;
        ProjectClient.attemptRankUp()
            .then(() => {
                window.location.reload();
            })
            .catch((err) => {
                console.error(err);
                alert(`${TranslationHandler.text(
                    "profile.rankup.error",
                    currentLang
                )}\n${err}`);
                isAttemptingRankUp = false;
                isRankingUpMenu = false;
            });
    };

    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae

    const emojiPickerRandomEmojis = [
        'angel',
        'angry',
        'annoyed',
        'bigsad',
        'disappointed',
        'happy',
        'idk',
        'meh',
        'salute',
        'shocked',
        'sobbing',
        'worried',
        'investigate',
        'grimacing',
        'confusedthinking',
        'cool',
    ];
    let emojiPickerRandomEmoji = '';
    let emojiSearchQuery = '';
    let emojiSearchBar;
    let lastSelectedFormArea;
    const pickRandomEmojiPickerDisplay = () => {
        emojiPickerRandomEmoji = emojiPickerRandomEmojis
            [Math.round(Math.random() * (emojiPickerRandomEmojis.length - 1))];
    };
    pickRandomEmojiPickerDisplay();

    let emojiPickerListUpdate = 0;
    const allowEmojiDrop = (ev) => {
        const data = ev.dataTransfer.getData("emoji");
        if (data && typeof data === 'string') {
            ev.preventDefault();
        }
    }
    const useEmojiDrag = (ev, name) => {
        ev.dataTransfer.setData("emoji", name);
    }
    const handleEmojiDrop = (ev) => {
        const data = ev.dataTransfer.getData("emoji");
        if (data && typeof data === 'string') {
            ev.dataTransfer.setData("emoji", '');
            ev.preventDefault();
        } else {
            return;
        }

        ev.toElement.value += `:${data}:`;
        // force an update
        if (profileEditingData.bioComponent) {
            profileEditingData.bio = profileEditingData.bioComponent.value;
        }
        if (emojiSearchBar) {
            emojiSearchQuery = emojiSearchBar.value;
        }
        emojiPickerListUpdate++;
    }
    const placeEmojiInTextbox = (emoji) => {
        if (!lastSelectedFormArea) return;
        lastSelectedFormArea.value += `:${emoji}:`;
        // force an update
        if (profileEditingData.bioComponent) {
            profileEditingData.bio = profileEditingData.bioComponent.value;
        }
        if (emojiSearchBar) {
            emojiSearchQuery = emojiSearchBar.value;
        }
        emojiPickerListUpdate++;
    };

    let emojiPickerOpened = false;
    onMount(() => {
        EmojiList.fetch().finally(() => {
            emojiPickerListUpdate++;
        });
    });

    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    
    const md = new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
    });

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx];

        if (token.info === "warning") {
            return `<div class="guidelines-warning-box">${md.utils.escapeHtml(
                token.content
            )}</div>`;
        }
        
        if (token.info === "scratch") {
            env.usesScratchBlocks = true;
            return `<div class="render-scratchblocks">${md.utils.escapeHtml(
                token.content
            )}</div>`;
        }

        // By default markdown-it will use a strange combination of <code> and <pre>; we'd rather it
        // just use <pre>
        return `<pre class="language-${md.utils.escapeHtml(
            token.info
        )}">${md.utils.escapeHtml(token.content)}</pre>`;
    };
    md.renderer.rules.image = () => {
        return `<img src="/notallowed.png" height="16"></img>`;
    };
    // Remember the old renderer if overridden, or proxy to the default renderer.
    const defaultLinkOpenRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    const doesntShowRedirectURLs = [
        /https:\/\/([a-z]+\.|)penguinmod\.com/i,
        /https:\/\/([a-z]+\.|)scratch\.org/i,
        /https:\/\/([a-z]+\.|)scratch\.mit\.edu/i,
        /https:\/\/(?!share\.)([a-z]+\.)?turbowarp\.org/i,
    ];
    const safeURLs = [
        /https:\/\/([a-z]+\.|)penguinmod\.com/i,
        /https:\/\/([a-z]+\.|)scratch\.org/i,
        /https:\/\/([a-z]+\.|)scratch\.mit\.edu/i,
        /https:\/\/([a-z]+\.|)turbowarp\.org/i,
        /https:\/\/([a-z]+\.|)cocrea\.world/i,
        /https:\/\/([a-z]+\.|)getgandi\.com/i,
        /https:\/\/([a-z]+\.|)snail-ide\.com/i,
        /https:\/\/snail-ide\.js\.org/i,
        /https:\/\/snail-ide\.github\.io/i,
        /https:\/\/snail-ide\.vercel\.app/i,

        /https:\/\/(www\.|)(roblox|youtube|discord|twitter|x|patreon|reddit)\.com/i,
        /https:\/\/old\.reddit\.com/i,
        /https:\/\/create\.roblox\.com/i,
        /https:\/\/(www\.|)discord\.gg/i,
        /https:\/\/(www\.|support\.|)guilded\.gg/i,
        /https:\/\/(www\.|gist\.|)github\.com/i,
        /https:\/\/(www\.|store\.|support\.|help\.|)(steampowered|steamcommunity)\.com/i,
    ];
    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const href = String(tokens[idx].attrGet('href'));
        // only force open in new tab if we are not penguinmod.com
        if (!href.match(safeURLs[1])) {
            tokens[idx].attrSet('target', '_blank');
        }
        // if we match a URL that should show a redirect, change the href attribute
        if (!doesntShowRedirectURLs.some(regex => href.match(regex))) {
            const base64 = encodeURIComponent(btoa(href));
            tokens[idx].attrSet('href', `https://arkide.site/redirect?t=${base64}`);
        }

        // disables clicking on non-verified links
        if (!safeURLs.some(regex => href.match(regex))) {
            return '';
        }

        // Pass the token to the default renderer.
        return defaultLinkOpenRender(tokens, idx, options, env, self);
    };
    
    const defaultTextRender = md.renderer.rules.text || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    
    const regexRules = {
        // we have to use far more sophisticated regex here due to weird url behavior
        // due to browser compat, we do this in the next comment
        project: /#([\w-]+)/g,
        user: /@([\w-]+)/g,
        emoji: /:(\w+):/g
    }
    // certain iOS devices do not support lookbehind-assertion, and will throw an error
    // this was present in Scratch for Discord for a bit, before i just replaced the regex entirely
    // we can handle this horrible behavior properly though:
    try {
        regexRules.project = new RegExp('(?<!\\b(?:https?:\\/\\/|www\\.)\\S*)#(\\w+|\\d+)(?!\\S)', 'g');
        regexRules.user = new RegExp('(?<!\\b(?:https?:\\/\\/|www\\.)\\S*)@(\\w+|\\d+)(?!\\S)', 'g');
    } catch {
        // iOS users will experience weird gaps and or urls with hashtags leading to 2 different places
        regexRules.project = /#([\w-]+)/g;
        regexRules.user = /@([\w-]+)/g,
        console.warn('Browser does not support lookbehind assertion in regex');
    }

    md.renderer.rules.text = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        
        let textChanged = false;
        let newText = `${md.utils.escapeHtml(token.content)}`;
        if (newText.match(regexRules.project)) {
            newText = newText.replace(regexRules.project, function(id) {
                id = id.replace('#', '');
                if (/^\d{6,}$/.test(id)) {
                    return `<a href="${PUBLIC_STUDIO_URL}/#${id}" target="_blank">#${id}</a>`;
                }
                return `<a href="https://arkide.site/search?q=%23${id}">#${id}</a>`;
            });
            textChanged = true;
        }
        if (newText.match(regexRules.user)) {
            newText = newText.replace(regexRules.user, function(name) {
                name = name.replace('@', '');
                return `<a href="https://arkide.site/profile?user=${name}">@${name}</a>`;
            });
            textChanged = true;
        }
        if (newText.match(regexRules.emoji)) {
            newText = newText.replace(regexRules.emoji, function(text) {
                const emojiName = text.replace(/:/gmi, '');
                return `<img
                    src="https://library.arkide.site/files/emojis/${emojiName}.png"
                    alt="${emojiName}"
                    title=":${emojiName}:"
                    class="profile-bio-emoji"
                    loading="lazy"
                />`;
            });
            textChanged = true;
        }

        if (textChanged) {
            return newText;
        }

        // Pass the token to the default renderer.
        return defaultTextRender(tokens, idx, options, env, self);
    };

    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };

    onMount(() => {
        scratchblocks.init();
    });

    const renderScratchBlocks = () => {
        const usesScratchBlocks = env.usesScratchBlocks;
        if (usesScratchBlocks) {
            scratchblocks.module.renderMatching(".render-scratchblocks", {
                style: "scratch3",
            });
        }
    };

    function block() {
        const doBlock = confirm(`${TranslationHandler.textSafe(
                "profile.block.confirm",
                currentLang,
                "Are you sure you want to block {{USERNAME}}?"
            ).replace("{{USERNAME}}", user)}\n${TranslationHandler.textSafe(
                "profile.blockednote2",
                currentLang,
                "If you are blocking this user for harassment, please also report them."
            )}`);
        if (doBlock) {
            ProjectClient.block(user, true).then(() => location.reload());
        }
    }

    function unblock() {
        const doUnblock = confirm(`${TranslationHandler.textSafe(
                "profile.block.confirm.remove",
                currentLang,
                "Are you sure you want to unblock {{USERNAME}}?"
            ).replace("{{USERNAME}}", user)}`);
        if (doUnblock) {
            ProjectClient.block(user, false).then(() => location.reload());
        }
    }

    function setShowAnyways() {
        console.log("hiii");
        showAnyways = true;
    }
async function compressImage(file, maxSizeMB = 2) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Only resize if image is extremely large (over 3000px)
                const maxDimension = 3000;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Start with high quality and only reduce if needed
                let quality = 0.95;
                const targetSize = maxSizeMB * 1024 * 1024;
                
                const attemptCompress = () => {
                    canvas.toBlob((blob) => {
                        console.log(`Compression attempt: quality=${quality.toFixed(2)}, size=${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                        
                        // If we're under target size or quality is too low, accept it
                        if (blob.size <= targetSize || quality <= 0.5) {
                            console.log(`Final: quality=${quality.toFixed(2)}, size=${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                            resolve(blob);
                        } else {
                            // Reduce quality in smaller steps for finer control
                            quality -= 0.05;
                            attemptCompress();
                        }
                    }, 'image/jpeg', quality);
                };
                attemptCompress();
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleBannerFileSelect() {
    if (!bannerUploadInput || !bannerUploadInput.files || !bannerUploadInput.files[0]) {
        return;
    }

    let file = bannerUploadInput.files[0];
    
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        alert("Banner must be a PNG or JPEG image");
        return;
    }

    // Compress if needed
    if (file.size > 2 * 1024 * 1024) {
        try {
            const compressed = await compressImage(file, 2);
            file = new File([compressed], file.name, { type: 'image/jpeg' });
        } catch (err) {
            console.error("Failed to compress image:", err);
            alert("Failed to compress image");
            return;
        }
    }

    // Load image for cropping
    const reader = new FileReader();
    reader.onload = (e) => {
        bannerPreviewUrl = e.target.result;
        showCropper = true;
        
        // Reset cropper state - wait for image to load
        setTimeout(() => {
            if (cropperImage && cropperImage.complete) {
                resetCropper();
            }
        }, 100);
    };
    reader.readAsDataURL(file);
}

function drawCropper() {
    if (!cropperCanvas || !cropperImage) return;
    
    const ctx = cropperCanvas.getContext('2d');
    const canvasWidth = 1200;
    const canvasHeight = 300;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw image
    ctx.drawImage(
        cropperImage,
        imagePosition.x,
        imagePosition.y,
        cropperImage.naturalWidth * imageScale,
        cropperImage.naturalHeight * imageScale
    );
}

function resetCropper() {
    if (!cropperImage) return;
    
    const canvasWidth = 1200;
    const canvasHeight = 300;
    const imgWidth = cropperImage.naturalWidth;
    const imgHeight = cropperImage.naturalHeight;
    
    // Calculate scale to fit
    const scaleX = canvasWidth / imgWidth;
    const scaleY = canvasHeight / imgHeight;
    minScale = Math.max(scaleX, scaleY);
    imageScale = minScale;
    
    // Center image
    const scaledWidth = imgWidth * imageScale;
    const scaledHeight = imgHeight * imageScale;
    imagePosition = {
        x: (canvasWidth - scaledWidth) / 2,
        y: (canvasHeight - scaledHeight) / 2
    };
    
    drawCropper();
}

function handleMouseDown(e) {
    isDragging = true;
    const rect = cropperCanvas.getBoundingClientRect();
    dragStart = {
        x: e.clientX - rect.left - imagePosition.x,
        y: e.clientY - rect.top - imagePosition.y
    };
}

function handleMouseMove(e) {
    if (!isDragging) return;
    const rect = cropperCanvas.getBoundingClientRect();
    imagePosition = {
        x: e.clientX - rect.left - dragStart.x,
        y: e.clientY - rect.top - dragStart.y
    };
    drawCropper();
}

function handleMouseUp() {
    isDragging = false;
}

function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(minScale, Math.min(imageScale * delta, 5));
    
    // Zoom towards mouse position
    const rect = cropperCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleChange = newScale / imageScale;
    imagePosition = {
        x: mouseX - (mouseX - imagePosition.x) * scaleChange,
        y: mouseY - (mouseY - imagePosition.y) * scaleChange
    };
    
    imageScale = newScale;
    drawCropper();
}

async function uploadCroppedBanner() {
    if (!cropperCanvas) return;
    
    isBannerUploading = true;
    
    try {
        // Create final cropped canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 1200;
        finalCanvas.height = 300;
        const ctx = finalCanvas.getContext('2d');
        
        // Draw the cropped portion
        ctx.drawImage(cropperCanvas, 0, 0);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            finalCanvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        
        // Upload
        const formData = new FormData();
        formData.append('banner', blob, 'banner.jpg');
        
        const token = localStorage.getItem("token");
        
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/users/setbanner?token=${token}`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showCropper = false;
            isEditingBanner = false;
            bannerPreviewUrl = '';
            alert("Banner updated successfully!");
            window.location.reload(true);
        } else {
            const error = await response.json();
            alert("Failed to upload banner: " + (error.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Failed to upload banner:", err);
        alert("Failed to upload banner");
    } finally {
        isBannerUploading = false;
    }
}

function cancelCrop() {
    showCropper = false;
    bannerPreviewUrl = '';
    imagePosition = { x: 0, y: 0 };
    imageScale = 1;
    if (bannerUploadInput) {
        bannerUploadInput.value = '';
    }
}

async function deleteBanner() {
    if (!confirm("Are you sure you want to delete your banner?")) return;

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/users/deletebanner?token=${token}&username=${user}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            isEditingBanner = false;
            alert("Banner deleted successfully!");
            // Hard reload to clear cache
            window.location.reload(true);
        } else {
            const error = await response.json();
            console.error("Delete error:", error);
            alert("Failed to delete banner: " + (error.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Failed to delete banner:", err);
        alert("Failed to delete banner: " + err.message);
    }
}
async function fetchBanner(username) {
    try {
        // Add timestamp to prevent caching
        const cacheBuster = Date.now();
        const response = await fetch(`${PUBLIC_API_URL}/api/v1/users/getbanner?username=${encodeURIComponent(username)}&t=${cacheBuster}`, {
            cache: 'no-store' // Disable caching
        });
        
        if (response.ok) {
            const blob = await response.blob();
            // Revoke old blob URL if it exists to prevent memory leaks
            if (bannerImageUrl && bannerImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(bannerImageUrl);
            }
            bannerImageUrl = URL.createObjectURL(blob);
        } else {
            bannerImageUrl = '';
        }
    } catch (error) {
        console.error('Failed to fetch banner:', error);
        bannerImageUrl = '';
    }
}
async function loadEmojis() {
    try {
        const emojis = await EmojiList.fetch();
        emojis.forEach(emojiName => {
            if (typeof emojiName === 'string') {
                emojiMap[emojiName] = true;
            }
        });
        emojisLoaded = true;
    } catch (err) {
        console.error("Failed to load emojis:", err);
    }
}

function getEmojiList() {
    return Object.keys(emojiMap).map(name => ({
        name,
        url: `https://library.arkide.site/files/emojis/${name}.png`
    }));
}

function insertEmoji(emojiName) {
    const emojiCode = `:${emojiName}:`;
    newCommentContent += emojiCode;
    showEmojiPicker = false;
}
</script>

<svelte:head>
    <title>ArkIDE - {user ? user : "Profile"}</title>
    <meta name="title"                   content="ArkIDE - {user ? user : "User Profile"}" />
    <meta property="og:title"            content="ArkIDE - {user ? user : "User Profile"}" />
    <meta property="twitter:title"       content="ArkIDE - {user ? user : "User Profile"}">
    <meta name="description"             content="View {user ? user : "this user"}'s profile on ArkIDE.">
    <meta property="twitter:description" content="View {user ? user : "this user"}'s profile on ArkIDE.">
    <meta property="og:url"              content="https://arkide.site/profile">
    <meta property="twitter:url"         content="https://arkide.site/profile">
</svelte:head>

<NavigationBar />

{#if isRankingUpMenu}
    <div class="scratch-modal-back">
        <div class="scratch-modal">
            <div class="scratch-modal-title">
                <LocalizedText
                    text="Rank up"
                    key="profile.rankup.title"
                    lang={currentLang}
                />
            </div>
            <div class="scratch-modal-content">
                <img src="/penguins/rankup.svg" alt="Rank up" />
                <p style="text-align:center;">
                    <LocalizedText
                        text="Let's see if you can become a real Butterfly!"
                        key="profile.rankup.message1"
                        lang={currentLang}
                    />
                    <br />
                    <LocalizedText
                        text="This will allow you to upload projects with custom extensions and other built-in extensions."
                        key="profile.rankup.message2"
                        lang={currentLang}
                    />
                </p>
                {#if isAttemptingRankUp}
                    <LoadingSpinner />
                {:else}
                    <Button on:click={rankUpAccount}>
                        <LocalizedText
                            text="Rank up"
                            key="profile.rankup.title"
                            lang={currentLang}
                        />
                    </Button>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if profileEditingData.isEditingProject}
    <div class="scratch-modal-back">
        <div class="scratch-modal">
            <div class="scratch-modal-title">
                <LocalizedText
                    text="Choose a project to display"
                    key="profile.featured.choose"
                    lang={currentLang}
                />
            </div>
            <div class="scratch-modal-content">
                <p>
                    <LocalizedText
                        text="Choose a label for this project"
                        key="profile.featured.chooselabel"
                        lang={currentLang}
                    />
                    <select bind:value={profileEditingData.projectTitle} on:change={updateProjectFeaturedTitle}>
                        {#each projectTitles as title}
                            <option value="{title}">
                                <LocalizedText
                                    text="{projectTitleStrings[Math.max(1, title - 1)]}"
                                    key="profile.featured.title{Math.max(0, title)}"
                                    lang={currentLang}
                                />
                            </option>
                        {/each}
                    </select>
                </p>
                <div class="featured-project-list">
                    {#if projects.all.length > 0}
                        {#if projects.all[0] !== "none"}
                            {#each (projects.all.map(x => {x.author = loggedInUser;return x})) as project}
                                <ClickableProject {...project} on:click={() => saveEditedProject(project.id)} />
                            {/each}
                        {:else}
                            <div class="none-found">
                                <PenguinConfusedSVG height="10rem" />
                                <p>
                                    <LocalizedText
                                        text="Nothing was found. Did you misspell something or does the user not exist?"
                                        key="generic.notfound"
                                        lang={currentLang}
                                    />
                                </p>
                            </div>
                        {/if}
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
                <Button color="gray" on:click={() => {
                    profileEditingData.isEditingProject = false;
                }}>
                    <LocalizedText
                        text="Cancel"
                        key="profile.featured.cancel"
                        lang={currentLang}
                    />
                </Button>
            </div>
        </div>
    </div>
{/if}

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    {#if (projects.all.length > 0 && fetchedFullProfile) || isProfilePrivate || wasNotFound || isForceView}
        {#if
            !wasNotFound
            || isForceView
        }
            <div 
                class="background" 
                data-has-image={backgroundImageUrl ? 'true' : 'false'}
                style={backgroundImageUrl ? `--bg-image: url('${backgroundImageUrl}');` : ''}
            >
            
                    {#if user}
                        <!-- Banner Edit Modal (moved outside banner container to cover entire screen) -->
                        {#if isEditingBanner}
                            <div class="scratch-modal-back">
                                <div class="scratch-modal" style="max-width: {showCropper ? '1250px' : '600px'};">
                                    <div class="scratch-modal-title">
                                        {#if loggedInAdmin && String(user).toLowerCase() !== String(loggedInUser).toLowerCase()}
                                            (Admin) Edit {user}'s Profile Banner
                                        {:else}
                                            Edit Profile Banner
                                        {/if}
                                    </div>
                                    <div class="scratch-modal-content">
                                        {#if !showCropper}
                                            <p>Upload a banner image (max 2MB, 1200x300px recommended)</p>
                                            <p style="font-size: 0.9em; opacity: 0.7;">Images over 2MB will be automatically compressed</p>
                                            <input 
                                                type="file" 
                                                accept="image/png,image/jpeg,image/jpg"
                                                bind:this={bannerUploadInput}
                                                on:change={handleBannerFileSelect}
                                                style="margin: 12px 0;"
                                            />
                                            
                                            <div style="display: flex; gap: 8px; margin-top: 16px;">
                                                {#if bannerImageUrl}
                                                    <button class="modal-button modal-button-danger" on:click={deleteBanner}>
                                                        {#if loggedInAdmin && String(user).toLowerCase() !== String(loggedInUser).toLowerCase()}
                                                            (Admin) Delete Banner
                                                        {:else}
                                                            Delete Banner
                                                        {/if}
                                                    </button>
                                                {/if}
                                                <button class="modal-button modal-button-secondary" on:click={() => isEditingBanner = false}>Cancel</button>
                                            </div>
                                        {:else}
                                            <div class="cropper-container">
                                                <p style="margin-bottom: 12px;">Drag to move • Scroll to zoom • Click "Reset" to center</p>
                                                <div style="position: relative; display: inline-block;">
                                                    <canvas
                                                        bind:this={cropperCanvas}
                                                        width="1200"
                                                        height="300"
                                                        style="border: 2px solid #ccc; cursor: move; max-width: 100%; display: block;"
                                                        on:mousedown={handleMouseDown}
                                                        on:mousemove={handleMouseMove}
                                                        on:mouseup={handleMouseUp}
                                                        on:mouseleave={handleMouseUp}
                                                        on:wheel={handleWheel}
                                                    />
                                                </div>
                                                <img
                                                    bind:this={cropperImage}
                                                    src={bannerPreviewUrl}
                                                    alt="Preview"
                                                    style="display: none;"
                                                    on:load={drawCropper}
                                                />
                                            </div>
                                            
                                            <div style="display: flex; gap: 8px; margin-top: 16px;">
                                                {#if !isBannerUploading}
                                                    <button class="modal-button modal-button-primary" on:click={uploadCroppedBanner}>
                                                        Upload Banner
                                                    </button>
                                                    <button class="modal-button modal-button-secondary" on:click={resetCropper}>
                                                        Reset Position
                                                    </button>
                                                    <button class="modal-button modal-button-secondary" on:click={cancelCrop}>
                                                        Cancel
                                                    </button>
                                                {:else}
                                                    <p>Uploading...</p>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}


                        {#if bannerImageUrl || (loggedIn && String(user).toLowerCase() === String(loggedInUser).toLowerCase()) || loggedInAdmin}
                            <div class="profile-banner-container">
                                {#if bannerImageUrl}
                                    <div class="profile-banner" 
                                        style="background-image: url('{bannerImageUrl}');"
                                        on:error={() => bannerImageUrl = ''}>
                                    </div>
                                {:else}
                                    <div class="profile-banner profile-banner-default"></div>
                                {/if}

                                
                                {#if loggedIn && (String(user).toLowerCase() === String(loggedInUser).toLowerCase() || loggedInAdmin)}
                                    <button 
                                        class="banner-edit-button" 
                                        on:click={() => isEditingBanner = true}
                                        title="Edit banner"
                                    >
                                        <img src="/pencil.png" alt="Edit" style="height: 20px; filter: invert(1);" />
                                    </button>
                                {/if}
                            </div>
                        {/if}


                        <!-- Profile Section (below banner) -->
                        <div class="section-user">
                            <div class="section-user-header">
                                <div class="subuser-section">
                                    <div class="user-username">
                                        <div class="profile-picture-container">
                                            <img
                                                style="border-color:{isDonator ? '#a237db' : '#efefef'}"
                                                src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${user}`}
                                                alt="Profile"
                                                class="profile-picture"
                                            />
                                        </div>
                                        <div class="user-after-image">
                                            {#if isDonator}
                                                <h1 class="donator-color">{fullProfile.real_username || user}</h1>
                                            {:else}
                                                <h1>{fullProfile.real_username || user}</h1>
                                            {/if}
                                            
                                            {#if isProfilePrivate && !loggedInAdmin && (!isBlocked || showAnyways)}
                                                <img src="/account/lock.svg" alt="Private" title="This profile is private." />
                                            {/if}
                                        </div>
                                    </div>
                                    {#if (!isBlocked || showAnyways) && !isProfilePrivate || String(user).toLowerCase() === String(loggedInUser).toLowerCase() || (isProfilePublicToFollowers && isFollowedByUser) || loggedInAdmin}
                                        <div class="follower-section">
                                            <p class="follower-count">
                                                {followerCount - Number(followOnLoad) + Number(isFollowingUser)} followers
                                            </p>
                                            <div>
                                                {#if !(loggedIn && String(user).toLowerCase() === String(loggedInUser).toLowerCase())}
                                                    {#key isFollowingUser}
                                                        <button
                                                            class={`follower-button${isDonator ? ' follower-button-donator' : ''}${isFollowingUser ? ' follower-button-following' : ''}`}
                                                            on:click={safeFollowUser}
                                                        >
                                                            {#if isFollowingUser}
                                                                Unfollow
                                                            {:else}
                                                                Follow
                                                            {/if}
                                                        </button>
                                                    {/key}
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}

            {#if isBlocked && !showAnyways}
                <div class="section-private">
                    <img src="/account/status_warn.svg" alt="Blocked" title="Blocked" />
                    <p style="margin-block-end: 4px">
                        <LocalizedText text="You have this user currently blocked." key="profile.blockednote" lang={currentLang} />
                    </p>
                    <p style="margin-block-start: 4px">
                        <LocalizedText text="If you are blocking this user for harassment, please also report them." key="profile.blockednote2" lang={currentLang} />
                    </p>
                    <div class="button-container">
                        <button class="unblock-button" on:click={unblock}>
                            <LocalizedText text="Unblock" key="profile.unblock" lang={currentLang} />
                        </button>
                        <button class="show-anyways" on:click={setShowAnyways}>
                            <LocalizedText text="Continue" key="account.settings.continue" lang={currentLang} />
                        </button>
                    </div>
                    <div style="height:16px" />
                    <a href={`/report?type=user&id=${user}`} target="_blank" class="report-link" style="color: red !important;">
                        <img class="report-icon" src="/report_flag.png" style="margin: 0 4px" alt="Report" />
                        <LocalizedText text="Report" key="report.title" lang={currentLang} />
                    </a>
                </div>
            {:else if isProfilePrivate && String(user).toLowerCase() !== String(loggedInUser).toLowerCase() && !(isProfilePublicToFollowers && isFollowedByUser) && !loggedInAdmin}
                <div class="section-private">
                    <img src="/account/lock.svg" alt="Private" title="Private" />
                    {#if isProfilePublicToFollowers}
                        <p>
                            <LocalizedText 
                                text={"This profile is private. Only people {{NAME}} follows can see their profile."} 
                                key="profile.private.followers" 
                                lang={currentLang} 
                                replace={{"{{NAME}}": user}} 
                            />
                        </p>
                    {:else}
                        <p>
                            <LocalizedText text="This profile is private. You cannot view it." key="profile.private" lang={currentLang} />
                        </p>
                    {/if}
                </div>
            {:else}
            {#if isProfilePrivate && String(user).toLowerCase() !== String(loggedInUser).toLowerCase() && !(isProfilePublicToFollowers && isFollowedByUser) && !loggedInAdmin}
                <div class="section-private">
                    <img
                        src="/account/lock.svg"
                        alt="Private"
                        title="Private"
                    />
                    
                    {#if isProfilePublicToFollowers}
                        <p>
                            <LocalizedText
                                text={"This profile is private. Only people {{NAME}} follows can see their profile."}
                                key="profile.private.followers"
                                lang={currentLang}
                                replace={{
                                    "{{NAME}}": user,
                                }}
                            />
                        </p>
                    {:else}
                        <p>
                            <LocalizedText
                                text="This profile is private. You cannot view it."
                                key="profile.private"
                                lang={currentLang}
                            />
                        </p>
                    {/if}
                </div>
            {:else}
            <div class="section-projects">
                <div class="user-ordering-stats" style="width:90%">
                    <div class="section-user-stats">
                        {#if profileEditingData.isEditingBio}
                            <div>
                                <button
                                    on:mouseenter={pickRandomEmojiPickerDisplay}
                                    on:click={() => {
                                        emojiPickerOpened = !emojiPickerOpened;
                                    }}
                                    title="Pick an emoji"
                                    class="emoji-picker-button"
                                >
                                    <img
                                        src={`https://library.arkide.site/files/emojis/${emojiPickerRandomEmoji}.png`}
                                        alt="Emoji"
                                        title="Pick an emoji"
                                        loading="lazy"
                                        on:dragstart={(ev) => {
                                            useEmojiDrag(ev, emojiPickerRandomEmoji);
                                        }}
                                    >
                                </button>
                                <div class="emoji-picker-list" data-opened={emojiPickerOpened}>
                                    <div class="emoji-picker-search-container">
                                        <div class="emoji-picker-search-icon">
                                            <SearchSVG
                                                width="30px"
                                                height="20px"
                                                color="#000000"
                                                scale="2px"
                                                style="margin-bottom:5px; margin-top: 5px;"
                                            />
                                        </div>
                                        <input
                                            on:dragover={allowEmojiDrop}
                                            on:drop={handleEmojiDrop}
                                            type="text"
                                            placeholder="..."
                                            bind:value={emojiSearchQuery}
                                            bind:this={emojiSearchBar}
                                        >
                                    </div>
                                    <div class="emoji-picker-emoji-container">
                                        {#key emojiPickerListUpdate}
                                            {#if EmojiList.loading}
                                                <LoadingSpinner></LoadingSpinner>
                                            {:else if EmojiList.failed}
                                                <p>
                                                    <LocalizedText
                                                        text="Unknown error."
                                                        key="generic.errorsmall"
                                                        lang={currentLang}
                                                    />
                                                </p>
                                            {:else if emojiPickerOpened}
                                                {#each EmojiList.emojis as emoji}
                                                    {#if
                                                        !emojiSearchQuery
                                                        || String(emoji).includes(
                                                            emojiSearchQuery
                                                                .toLowerCase()
                                                                .replace(/[^a-z]+/gmi, '')
                                                        )
                                                    }
                                                        <button
                                                            class="emoji-picker-emoji"
                                                            on:click={() => placeEmojiInTextbox(emoji)}
                                                        >
                                                            <img
                                                                src={`https://library.arkide.site/files/emojis/${emoji}.png`}
                                                                alt={`:${emoji}:`}
                                                                title={`:${emoji}:`}
                                                                draggable="false"
                                                                loading="lazy"
                                                            >
                                                        </button>
                                                    {/if}
                                                {/each}
                                            {/if}
                                        {/key}
                                    </div>
                                </div>
                            </div>
                            <div class="profile-bio-sidenotes">
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say your real name"
                                        key="profile.bio.warning1"
                                        lang={currentLang}
                                    />
                                </div>
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say how old you are or when you were born"
                                        key="profile.bio.warning2"
                                        lang={currentLang}
                                    />
                                </div>
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say where you live"
                                        key="profile.bio.warning3"
                                        lang={currentLang}
                                    />
                                </div>
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say your password or your email"
                                        key="profile.bio.warning4"
                                        lang={currentLang}
                                    />
                                </div>
                            </div>
                        {/if}
                        <h2 style="margin-block:4px">
                            <LocalizedText
                                text="About Me"
                                key="profile.bio.title"
                                lang={currentLang}
                            />
                            {#if profileEditingData.isEditingBio}
                                {#if !profileEditingData.isBioEditLoading}
                                    <button class="edit-done" on:click={saveEditedBio}>
                                        <img
                                            src="/badges/approver.png"
                                            alt="Save"
                                            style="height:1.5em"
                                        >
                                    </button>
                                {/if}
                            {:else}
                                {#if loggedIn && (String(user).toLowerCase() === String(loggedInUser).toLowerCase() || loggedInAdmin)}
                                    <button class="edit-link" on:click={() => {
                                        profileEditingData.bio = fullProfile.bio || '';
                                        profileEditingData.isEditingBio = true;
                                    }}>
                                        <img
                                            src="/pencil.png"
                                            alt="Edit"
                                            style="height:1.5em"
                                        >
                                    </button>
                                {/if}
                            {/if}
                        </h2>
                        <div class="profile-bio-line"></div>
                        <div class="profile-bio">
                            {#if profileEditingData.isEditingBio}
                                <textarea
                                    class="profile-bio-textarea{profileEditingData.isBioInappropriate ? ' profile-bio-textarea-inappropriate' : ''}"
                                    on:click={() => {
                                        lastSelectedFormArea = profileEditingData.bioComponent;
                                    }}
                                    on:focus={() => {
                                        lastSelectedFormArea = profileEditingData.bioComponent;
                                    }}
                                    bind:this={profileEditingData.bioComponent}
                                    bind:value={profileEditingData.bio}
                                    on:dragover={allowEmojiDrop}
                                    on:drop={handleEmojiDrop}
                                    maxLength="2048"
                                />
                                {#if profileEditingData.isBioInappropriate}
                                    <div class="profile-bio-warning-inappropriate">
                                        <LocalizedText
                                            text="Your bio contains inappropriate words or websites we don't allow. Please remove them to change your bio."
                                            key="profile.bio.inappropriate"
                                            lang={currentLang}
                                        />
                                    </div>
                                {/if}    
                            {:else}
                                {#if fullProfile.bio}
                                    {@html generateMarkdown(fullProfile.bio)}
                                {:else}
                                    <p style="opacity:0.5">
                                        {#if String(user).toLowerCase() === String(loggedInUser).toLowerCase()}
                                            <LocalizedText
                                                text="There's nothing here.. yet! Write some things you want to share here!"
                                                key="profile.bio.none"
                                                lang={currentLang}
                                            />
                                        {:else}
                                            <LocalizedText
                                                text="Nothing yet!"
                                                key="generic.noneyet"
                                                lang={currentLang}
                                            />
                                        {/if}
                                    </p>
                                {/if}
                            {/if}
                        </div>
                    </div>
                    <div class="section-user-stats">
                        <h2 style="margin-block:4px">
                            <LocalizedText
                                text={projectTitleStrings[(fullProfile.myFeaturedProjectTitle || 1) - 1] || projectTitleStrings[0]}
                                key="profile.featured.title{Math.max(1, fullProfile.myFeaturedProjectTitle || 1)}"
                                lang={currentLang}
                            />
                            {#if loggedIn && String(user).toLowerCase() === String(loggedInUser).toLowerCase() && profileFeaturedProject && !profileEditingData.isEditingProject}
                                <button class="edit-link" on:click={() => {
                                    profileEditingData.project = profileFeaturedProject.id || 0;
                                    profileEditingData.projectTitle = fullProfile.myFeaturedProjectTitle || 1;
                                    if (profileFeaturedProject.id === -1) {
                                        profileEditingData.project = 0;
                                    }
                                    if (fullProfile.myFeaturedProjectTitle === -1) {
                                        profileEditingData.projectTitle = 1;
                                    }
                                    profileEditingData.isEditingProject = true;
                                }}>
                                    <img
                                        src="/pencil.png"
                                        alt="Edit"
                                        style="height:1.5em"
                                    >
                                </button>
                            {/if}
                        </h2>
                        <div class="profile-bio-line"></div>
                        {#if !profileFeaturedProject}
                            <LoadingSpinner></LoadingSpinner>
                        {:else if profileFeaturedProject === 'none'}
                            <p style="opacity:0.5">
                                <LocalizedText
                                    text="Nothing yet!"
                                    key="generic.noneyet"
                                    lang={currentLang}
                                />
                            </p>
                        {:else if profileFeaturedProject.author.id === fullProfile.id}
                            <a href={`/viewer#${profileFeaturedProject.id}`} style="text-decoration: none">
                                <img
                                    src={`${ProjectApi.OriginApiUrl}/api/v1/projects/getproject?projectID=${profileFeaturedProject.id}&requestType=thumbnail`}
                                    alt="Project Thumbnail"
                                    class="profile-project-image"
                                />
                                <div class="profile-project-authordiv">
                                    <img
                                        src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={user}"
                                        alt="Project Author"
                                        title={user}
                                        class="profile-project-author"
                                    >
                                    <div class="profile-project-authorinfo">
                                        <p class="profile-project-link">{@html formatProjectTitle(profileFeaturedProject.title)}</p>
                                        <p class="profile-project-date">{unixToDisplayDate(profileFeaturedProject.date)}</p>
                                    </div>
                                </div>
                            </a>
                        {/if}
                    </div>
                    <div class="section-user-stats">
                        <div class="user-stat-box" style="border-bottom: 1px solid rgba(0, 0, 0, 0.15);">
                            <div class="user-stat-box-inner">
                                <LocalizedText
                                    text="Rank"
                                    key="profile.ranking.title"
                                    lang={currentLang}
                                />
                            </div>
                            <p class="small" style="margin-block:4px">
                                {#if fullProfile.admin === true}
                                    <LocalizedText
                                        text="Keith Master"
                                        key="profile.ranking.admin"
                                        lang={currentLang}
                                    />
                                {:else if fullProfile.approver === true}
                                    <LocalizedText
                                        text="Guard Keith"
                                        key="profile.ranking.mod"
                                        lang={currentLang}
                                    />
                                {:else if fullProfile.rank === 1}
                                    <LocalizedText
                                        text="Butterfly"
                                        key="profile.ranking.ranked"
                                        lang={currentLang}
                                    />
                                {:else}
                                    <LocalizedText
                                        text="Moth"
                                        key="profile.ranking.new"
                                        lang={currentLang}
                                    />
                                {/if}
                                {#if loggedIn && String(user).toLowerCase() === String(loggedInUser).toLowerCase() && fullProfile.rank === 0}
                                    {#if !fullProfile.canrankup}
                                        <span style="opacity: 0.5;font-size:.7em;">
                                            <br>
                                            <LocalizedText
                                                text="Cannot rank up yet"
                                                key="profile.rankup.cannot"
                                                lang={currentLang}
                                            />
                                        </span>
                                    {:else}
                                        <!-- svelte-ignore a11y-invalid-attribute -->
                                        <a
                                            href="#"
                                            style="color:dodgerblue;font-size:.6em;"
                                            on:click={() => {
                                                isRankingUpMenu = true;
                                            }}
                                        >
                                            <br>
                                            <LocalizedText
                                                text="Rank up"
                                                key="profile.rankup.title"
                                                lang={currentLang}
                                            />
                                            <div class="rankup-badge">
                                                !
                                            </div>
                                        </a>
                                    {/if}
                                {/if}
                            </p>
                        </div>
                        <div class="user-stat-box" style="align-content: flex-start;">
                            <div class="user-stat-box-inner">
                                <LocalizedText
                                    text="Badges"
                                    key="profile.badges.title"
                                    lang={currentLang}
                                />
                            </div>
                            <div class="user-badge-container">
                                <div class="user-badges">
                                    {#each badges as badge, idx}
                                        {#if ProfileBadges[badge]}
                                            <ProfileBadge {badge} {currentLang} />
                                        {/if}
                                    {:else}
                                        <p style="font-size: initial; font-weight: normal; width: 100%; text-align: center;">
                                            <LocalizedText
                                                text="Nothing was found."
                                                key="generic.notfound"
                                                lang={currentLang}
                                            />
                                        </p>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    <ContentCategory
                        header={TranslationHandler.text(
                            "profile.projects.all",
                            currentLang
                        )}
                        style="width:calc(90% - 10px);"
                        stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
                        seemore={`/search?q=by%3A${user}`}
                    >
                    <div class="project-list">
                        {#if projects.all.length > 0}
                            {#if projects.all[0] !== "none"}
                                {#each projects.all as project}
                                    <Project
                                        {...project}
                                        {...(loggedIn && user === loggedInUser ? {
                                            author: {
                                                username: loggedInUser,
                                                id: loggedInUserId
                                            }
                                        } : {})}
                                    />
                                {/each}
                            {:else}
                                <div class="none-found">
                                    <PenguinConfusedSVG height="10rem" />
                                    <p>
                                        <LocalizedText
                                            text="Nothing was found. Did you misspell something or does the user not exist?"
                                            key="generic.notfound"
                                            lang={currentLang}
                                        />
                                    </p>
                                </div>
                            {/if}
                        {:else}
                            <LoadingSpinner />
                        {/if}
                    </div>
                </ContentCategory>

<!-- "Followers" Section actually showing Following -->
{#if followingList.length > 0}
    <ContentCategory header="Followers ({followingList.length})" style="width:calc(90% - 10px);" stylec="height: 244px;overflow-x:auto;overflow-y:hidden;">
        <div class="following-list" style="height: 100%; width: 100%; display: flex; flex-direction: row; align-items: stretch;">
            {#each followingList as following}
                <a href={`/profile?user=${encodeURIComponent(following.username)}`} class="following-user-link">
                    <div class="following-user">
                        <img
                            src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${following.username}`}
                            alt={following.username}
                            class="following-user-pfp"
                        />
                        <span class="following-user-name">{following.username}</span>
                    </div>
                </a>
            {/each}
        </div>
    </ContentCategory>
{:else}
    <ContentCategory header="Followers ({followingList.length})" style="width:calc(90% - 10px);" stylec="height: 244px;overflow-x:auto;overflow-y:hidden;">
        <div class="following-list" style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
            <p style="opacity:0.5">Not following anyone yet.</p>
        </div>
    </ContentCategory>
{/if}

<!-- "Following" Section actually showing Followers -->
{#if followerslist.length > 0}
    <ContentCategory header="Following ({followerslist.length})" style="width:calc(90% - 10px);" stylec="height: 244px;overflow-x:auto;overflow-y:hidden;">
        <div class="following-list" style="height: 100%; width: 100%; display: flex; flex-direction: row; align-items: stretch;">
            {#each followerslist as follower}
                <a href={`/profile?user=${encodeURIComponent(follower.username)}`} class="following-user-link">
                    <div class="following-user">
                        <img
                            src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${follower.username}`}
                            alt={follower.username}
                            class="following-user-pfp"
                        />
                        <span class="following-user-name">{follower.username}</span>
                    </div>
                </a>
            {/each}
        </div>
    </ContentCategory>
{:else}
    <ContentCategory header="Following ({followerslist.length})" style="width:calc(90% - 10px);" stylec="height: 244px;overflow-x:auto;overflow-y:hidden;">
        <div class="following-list" style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
            <p style="opacity:0.5">Not following anyone yet.</p>
        </div>
    </ContentCategory>
{/if}

<!-- Profile Comments Section -->
{#if (!isBlocked || showAnyways) && !isProfilePrivate || String(user).toLowerCase() === String(loggedInUser).toLowerCase() || (isProfilePublicToFollowers && isFollowedByUser) || loggedInAdmin}
<ContentCategory 
    header="Comments ({commentCount})" 
    style="width:calc(90% - 10px);"
    stylec="padding: 0; overflow-x: hidden; overflow-y: auto; max-height: 600px;"
>
    <div style="width: 100%; overflow: hidden; padding: 16px; box-sizing: border-box;">
        <div class="comments-section" style="width: 100%; overflow: hidden; box-sizing: border-box; padding: 0;">
            <!-- Comments Toggle (only for profile owner and admins) -->
            {#if canToggleComments}
                <div class="comments-toggle">
                    <button 
                        class="comments-toggle-button" 
                        on:click={toggleCommentsEnabled}
                        title={commentsEnabled ? "Disable comments" : "Enable comments"}
                    >
                        {#if commentsEnabled}
                            <LocalizedText
                                text="Comments Enabled"
                                key="profile.comments.enabled"
                                lang={currentLang}
                            />
                        {:else}
                            <LocalizedText
                                text="Comments Disabled"
                                key="profile.comments.disabled"
                                lang={currentLang}
                            />
                        {/if}
                    </button>
                </div>
            {/if}
            <!-- New Comment Box -->
            {#if loggedIn && commentsEnabled}
                <div class="comment-input-box">
                    {#if replyingTo}
                        <div class="replying-to">
                            <span>Replying to @{replyingTo.username}</span>
                            <button 
                                class="cancel-reply" 
                                on:click={() => { 
                                    replyingTo = null; 
                                    newCommentContent = ""; 
                                }}
                            >
                                ×
                            </button>
                        </div>
                    {/if}
                    <textarea
                        bind:value={newCommentContent}
                        placeholder="Write a comment..."
                        maxLength="500"
                        class="comment-textarea"
                    />
                    <div class="comment-actions">
                        <div class="left-actions">
                            <span class="char-count">{newCommentContent.length}/500</span>
                            <button 
                                class="emoji-picker-btn" 
                                on:click={() => showEmojiPicker = !showEmojiPicker}
                                title="Add emoji"
                                type="button"
                            >
                                😊
                            </button>
                        </div>
                        <button 
                            class="comment-submit-button" 
                            on:click={() => postComment()}
                            disabled={!newCommentContent.trim()}
                        >
                            <LocalizedText
                                text="Post"
                                key="profile.comments.post"
                                lang={currentLang}
                            />
                        </button>
                    </div>
                    
                    {#if showEmojiPicker && emojisLoaded}
                        <div class="emoji-picker">
                            <div class="emoji-picker-header">
                                <span>Pick an emoji</span>
                                <button class="emoji-close" on:click={() => showEmojiPicker = false}>×</button>
                            </div>
                            <div class="emoji-grid">
                                {#each getEmojiList() as emoji}
                                    <button 
                                        class="emoji-item" 
                                        on:click={() => insertEmoji(emoji.name)}
                                        title=":{emoji.name}:"
                                        type="button"
                                    >
                                        <img src={emoji.url} alt={emoji.name} />
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else if !loggedIn}
                <p style="opacity:0.5;text-align:center;padding:20px;">
                    <LocalizedText
                        text="Log in to comment"
                        key="profile.comments.logintocomment"
                        lang={currentLang}
                    />
                </p>
            {:else if !commentsEnabled}
                <p style="opacity:0.5;text-align:center;padding:20px;">
                    <LocalizedText
                        text="Comments are disabled on this profile"
                        key="profile.comments.disabled.message"
                        lang={currentLang}
                    />
                </p>
            {/if}

<!-- Comments List -->
<div class="comments-list">
    {#if isLoadingComments}
        <LoadingSpinner />
    {:else if profileComments.length === 0}
        <p style="opacity:0.5;text-align:center;padding:20px;">
            <LocalizedText
                text="No comments yet"
                key="profile.comments.none"
                lang={currentLang}
            />
        </p>
        {:else}
            {#each profileComments.filter(c => !c.parentId) as comment}
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author-info">
                        <img
                            src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={comment.username}"
                            alt={comment.username}
                            class="comment-avatar"
                        />
                        <a href="/profile?user={comment.username}" class="comment-username">
                            {comment.username}
                        </a>
                    </div>
                    <div class="comment-meta">
                        <span class="comment-date">{formatCommentDate(comment.createdAt)}</span>
                        {#if comment.edited}
                            <span class="comment-edited">(edited)</span>
                        {/if}
                    </div>
                </div>

                {#if editingCommentId === comment.id}
                    <div class="comment-edit-box">
                        <textarea
                            bind:value={editingCommentContent}
                            maxLength="500"
                            class="comment-textarea"
                        />
                        <div class="comment-edit-actions">
                            <button 
                                class="comment-edit-save" 
                                on:click={() => updateComment(comment.id, editingCommentContent)}
                            >
                                Save
                            </button>
                            <button 
                                class="comment-edit-cancel" 
                                on:click={() => {
                                    editingCommentId = null;
                                    editingCommentContent = '';
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="comment-content">
                        {@html parseContent(comment.content)}
                    </div>
                    
                    <div class="comment-actions">
                        {#if loggedIn && commentsEnabled}
                            <button 
                                class="comment-action-button reply-btn" 
                                on:click={() => replyToComment(comment)}
                                title="Reply"
                            >
                                Reply
                            </button>
                        {/if}
                        {#if canModifyComment(comment)}
                            <button 
                                class="comment-action-button" 
                                on:click={() => {
                                    editingCommentId = comment.id;
                                    editingCommentContent = comment.content;
                                }}
                                title="Edit"
                            >
                                <img src="/pencil.png" alt="Edit" style="height:16px;" />
                            </button>
                            <button 
                                class="comment-action-button" 
                                on:click={() => deleteComment(comment.id)}
                                title="Delete"
                            >
                                <img src="/notallowed.png" alt="Delete" style="height:16px;" />
                            </button>
                        {/if}
                        <button 
                            class="comment-action-button" 
                            on:click={() => reportComment(comment.id)}
                            title="Report"
                        >
                            <img src="/report_flag.png" alt="Report" style="height:16px;" />
                        </button>
                    </div>
                {/if}

                <!-- Show replies -->
                {#if profileComments.filter(c => c.parentId === comment.id).length > 0}
                    <div class="replies">
                        {#each profileComments.filter(c => c.parentId === comment.id) as reply}
                            <div class="comment-item reply">
                                <div class="comment-header">
                                    <div class="comment-author-info">
                                        <img
                                            src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={reply.username}"
                                            alt={reply.username}
                                            class="comment-avatar"
                                        />
                                        <a href="/profile?user={reply.username}" class="comment-username">
                                            {reply.username}
                                        </a>
                                    </div>
                                    <div class="comment-meta">
                                        <span class="comment-date">{formatCommentDate(reply.createdAt)}</span>
                                        {#if reply.edited}
                                            <span class="comment-edited">(edited)</span>
                                        {/if}
                                    </div>
                                </div>

                                {#if editingCommentId === reply.id}
                                    <div class="comment-edit-box">
                                        <textarea
                                            bind:value={editingCommentContent}
                                            maxLength="500"
                                            class="comment-textarea"
                                        />
                                        <div class="comment-edit-actions">
                                            <button 
                                                class="comment-edit-save" 
                                                on:click={() => updateComment(reply.id, editingCommentContent)}
                                            >
                                                Save
                                            </button>
                                            <button 
                                                class="comment-edit-cancel" 
                                                on:click={() => {
                                                    editingCommentId = null;
                                                    editingCommentContent = '';
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="comment-content">
                                        {@html parseContent(reply.content)}
                                    </div>
                                    
                                    <div class="comment-actions">
                                        {#if canModifyComment(reply)}
                                            <button 
                                                class="comment-action-button" 
                                                on:click={() => {
                                                    editingCommentId = reply.id;
                                                    editingCommentContent = reply.content;
                                                }}
                                                title="Edit"
                                            >
                                                <img src="/pencil.png" alt="Edit" style="height:16px;" />
                                            </button>
                                            <button 
                                                class="comment-action-button" 
                                                on:click={() => deleteComment(reply.id)}
                                                title="Delete"
                                            >
                                                <img src="/notallowed.png" alt="Delete" style="height:16px;" />
                                            </button>
                                        {/if}
                                        <button 
                                            class="comment-action-button" 
                                            on:click={() => reportComment(reply.id)}
                                                    title="Report"
                                                >
                                                    <img src="/report_flag.png" alt="Report" style="height:16px;" />
                                            </button>
                            </div>
                        {/if}
                    </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    {/if}
</div> <!-- end comments-list -->
</div> <!-- end comments-section -->
</ContentCategory>
{/if}
            <div class="section-serious-actions">
                {#if !(loggedIn && String(user).toLowerCase() === String(loggedInUser).toLowerCase())}
                    <div class="report-action">
                        {#if !(isBlocked && setShowAnyways)}
                            <button
                                on:click={block}
                                target="_blank"
                                class="block-button"
                                style="color: red !important;"
                            >
                                <img
                                    class="block-icon"
                                    src="/notallowed.png"
                                    alt="Block"
                                    style="position:relative;top:4px"
                                />
                                <LocalizedText
                                    text="Block"
                                    key="profile.block"
                                    lang={currentLang}
                                />
                            </button>
                        {/if}
                        <div style="width:30px;"/>
                        <a
                            href={`/report?type=user&id=${user}`}
                            target="_blank"
                            class="report-link"
                            style="color: red !important;"
                        >
                            <img
                                class="report-icon"
                                src="/report_flag.png"
                                alt="Report"
                            />
                            <LocalizedText
                                text="Report"
                                key="report.title"
                                lang={currentLang}
                            />
                        </a>
                    </div>
                {/if}
            </div> <!-- closes section-serious-actions -->
        </div> <!-- closes section-projects -->
        {/if} <!-- closes isProfilePrivate check -->
        {/if} <!-- closes isBlocked check -->
    </div> <!-- closes background div -->
{:else}
            <div style="height:32px;" />
            <div style="display:flex;flex-direction:column;align-items:center;">
                <PenguinConfusedSVG height="10rem" />
                <p>
                    <LocalizedText
                        text="This user was not found. A user must have 1 uploaded project to view their profile."
                        key="profile.doesntexist"
                        lang={currentLang}
                    />
                </p>
                <br>
                <!-- only show if we fetched the full profile -->
                {#if fetchedFullProfile}
                    <!-- <Button link="https://scratch.mit.edu/users/{user}/" noredirect={true}>
                        <LocalizedText
                            text="View on Scratch"
                            key="profile.scratchprofile"
                            lang={currentLang}
                        />
                    </Button> -->
                    {#if loggedInAdmin}
                        <Button on:click={() => {
                            isForceView = true;
                        }}>
                            (Admin) Force view profile
                        </Button>
                    {/if}
                {/if}
            </div>
        {/if}
    {:else}
        <div style="height:32px;" />
        <LoadingSpinner enableTips={true} />
    {/if}
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        min-width: 1000px;
    }
.background {
    margin: auto;
    width: 80%;
    max-width: 1920px;
    position: relative;
}

.background::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
    background-color: #0a0a0a;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(20px) brightness(0.3);
    transform: scale(1.1);
}

:global(body:not(.dark-mode)) .background::before {
    filter: blur(20px) brightness(1.2);
    background-color: #f5f5f5;
}

.background[data-has-image="true"]::before {
    background-image: var(--bg-image);
}

.background::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(180deg, 
        rgba(0, 0, 0, 0.5) 0%, 
        rgba(0, 0, 0, 0.3) 50%, 
        rgba(0, 0, 0, 0.5) 100%);
}

:global(body:not(.dark-mode)) .background::after {
    background: linear-gradient(180deg, 
        rgba(255, 255, 255, 0.5) 0%, 
        rgba(255, 255, 255, 0.3) 50%, 
        rgba(255, 255, 255, 0.5) 100%);
}

    .user-stat-box {
        height: 50%;
        display: flex;
        justify-content: center;
        font-weight: bolder;
        font-size: 1.7em;
        flex-wrap: wrap;
    }

    .user-stat-box-inner {
        margin-top: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        height: 35px;
        text-align: center;
        width: 50%;
    }
    :global(body.dark-mode) .user-stat-box-inner {
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    }

    :global(body.dark-mode) .main {
        color: white;
    }

    .emoji-picker-button {
        position: absolute;
        left: -72px;
        top: 0;
        width: 64px;
        height: 64px;
        border-radius: 1024px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        background: transparent;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    :global(html[dir="rtl"]) .emoji-picker-button {
        left: initial;
        right: -72px;
    }
    :global(body.dark-mode) .emoji-picker-button {
        border-color: rgba(255, 255, 255, 0.35);
    }
    .emoji-picker-button img {
        width: 56px;
        height: 56px;
        transform: scale(1);
        transition-duration: 0.5s;
    }
    .emoji-picker-button:hover img {
        transform: scale(1.5);
        transition-duration: 0.5s;
    }
    .emoji-picker-button:active img {
        filter: brightness(0.7);
        transition-duration: 0s;
    }
    .emoji-picker-list {
        position: fixed;
        top: auto;
        left: auto;
        background: white;
        width: 320px;
        height: 320px;
        display: none;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        z-index: 9999;
    }
    :global(html[dir="rtl"]) .emoji-picker-list {
        left: initial;
        right: calc(100% + 8px);
    }
    :global(body.dark-mode) .emoji-picker-list {
        border-color: rgba(255, 255, 255, 0.35);
        background: #111;
    }
    @media screen and (max-width: 1105px) {
        .emoji-picker-list {
            left: initial;
            right: initial;
            top: 100%;
            width: 100%;
            height: 320px;
        }
        :global(html[dir="rtl"]) .emoji-picker-list {
            left: initial;
            right: initial;
        }
    }
    .emoji-picker-list[data-opened="true"] {
        display: initial;
    }
    .emoji-picker-search-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 32px;
    }
    .emoji-picker-search-container input {
        width: calc(100% - 48px);
        height: 24px;
        border: 0;
        padding: 0 4px;
        margin: 0;
        background: rgba(17, 17, 17, 0.4);
        border-radius: 12px;
    }
    :global(body.dark-mode) .emoji-picker-search-container input {
        background: rgba(17, 17, 17, 0.4);
        color: white;
    }
    .emoji-picker-search-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    :global(body.dark-mode) .emoji-picker-search-icon {
        filter: invert(1);
    }
    .emoji-picker-emoji-container {
        overflow: auto;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        height: calc(100% - 32px);
    }
    .emoji-picker-emoji {
        background: transparent;
        border: 0;
        width: 48px;
        height: 48px;
        margin: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .emoji-picker-emoji img {
        width: 48px;
        height: 48px;
    }
    .emoji-picker-emoji:hover {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
    }
    :global(body.dark-mode) .emoji-picker-emoji:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .section-private {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
        margin-top: 32px;
    }
    .section-private > img {
        height: 96px;
    }
    :global(body.dark-mode) img[src="/account/lock.svg"] {
        filter: invert(1);
    }

    .section-projects {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-user {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
        margin-top: 6px;
    }
    .section-serious-actions {
        /* padding-top: 120px; */
        padding-bottom: 10px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        width: 95%;
    }
    .report-action {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .report-action img {
        margin: 0 4px;
    }
    .block-button {
        background: none!important;
        border: none;
        padding: 0!important;
        text-decoration: underline;
        cursor: pointer;
        font-size: medium;
        display: flex;
        flex-direction: row;
    }
    .block-icon {
        height: 16px;
        top: 0px!important;
    }

    .unblock-button {
        min-width: 100px;
        height: 35px;
        font-size: medium;
        font-weight: bold;
        background-color: rgb(119, 0, 255);
        color: white;
        border-radius: 10px;
        border-color: rgba(0, 0, 0, 0.25);
        border-width: 1px;
        border-style: solid;
        text-align: center;
        cursor: pointer;
    }
    .show-anyways {
        min-width: 100px;
        height: 35px;
        font-size: medium;  
        font-weight: bold;
        background-color: rgb(243, 199, 199);
        color: rgb(60, 60, 60);
        border-radius: 10px;
        border-color: rgba(0, 0, 0, 0.25);
        border-width: 1px;
        border-style: solid;
        text-align: center;
        cursor: pointer;
    }

    :global(body.dark-mode) .show-anyways {
        background-color: rgb(54, 40, 38);
        color: rgb(194, 194, 194);
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }

    .none-found {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        height: 100%;
        text-align: center;
    }

    .scratch-modal-back {
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 6000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .scratch-modal {
        overflow: hidden;
        border: 4px solid hsla(0, 100%, 100%, 0.25);
        outline: none;
        border-radius: 0.5rem;
    }
    .scratch-modal-title {
        background: #0011ff;
        color: white;
        font-size: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 3.125rem;
    }
    .scratch-modal-content {
        padding: 12px;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) .scratch-modal-content {
        background: #111;
    }

.profile-picture-container {
        position: relative;
        display: inline-block;
    }
    .profile-picture {
        border-radius: 15px;
        height: 80px;
        width: 80px;
        border-style: solid;
        border-width: 2px;
    }
    /*.christmas-hat {
        position: absolute;
        top: -42px;
        left: 55%;
        transform: translateX(-50%);
        width: 110px;
        height: auto;
        z-index: 10;
        pointer-events: none;
    }
        */
    :global(html[dir="rtl"]) .profile-picture {
        margin-right: initial;
        margin-left: 8px;
    }

    .donator-color {
        color: #a237db;
    }
    :global(body.dark-mode) .donator-color {
        color: #c65cff;
    }

    .small {
        font-size: .8em;
        font-weight: lighter;
        text-align: center;
        width: 100%;
    }
    .rankup-badge {
        display: inline-block;
        text-align: center;
        background: red;
        color: white;
        font-weight: bold;
        border-radius: 1000px;
        width: 16px;
        height: 16px;
    }
    .report-link {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .report-icon {
        height: 16px;
        position: relative;
        bottom: 2px !important;
    }

    .section-user-header {
        margin: 10px;
        margin-top: 20px;
        width: 1400px;
        max-width: 90%;
        vertical-align: middle;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: rgba(17, 17, 17, 0.4);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    :global(body:not(.dark-mode)) .section-user-header {
        background: rgba(255, 255, 255, 0.6);
        border-color: rgba(0, 0, 0, 0.1);
    }

    :global(body.dark-mode) .section-user-header {
        background: rgba(17, 17, 17, 0.4);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-color: rgba(255, 255, 255, 0.2);
    }
.following-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    height: 100%;
    width: 100%;
    align-items: stretch;
}
/* Enhanced styles - add these to your existing CSS */
.following-user-link {
    text-decoration: none;
    color: inherit;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
}

.following-user-link:hover {
    transform: translateY(-3px);
}

.following-user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 12px;
    transition: background 0.2s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.following-user:hover {
    background: rgba(0,0,0,0.05);
    transform: scale(1.03);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:global(body.dark-mode) .following-user {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

:global(body.dark-mode) .following-user:hover {
    background: rgba(255,255,255,0.08);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.following-user-pfp-wrapper {
    position: relative;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
}

.following-user-pfp {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    position: relative;
    z-index: 2;
    transition: transform 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.following-user-link:hover .following-user-pfp {
    transform: scale(1.08);
}

.following-user-pfp-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    border-radius: 50%;
    filter: blur(10px) brightness(1.5) saturate(1.4);
    opacity: 0;
    z-index: 0;
    transition: opacity 0.5s ease-in-out;
}

.following-user-link:hover .following-user-pfp-glow {
    opacity: 0.85;
}

.following-user-name {
    font-weight: bold;
    font-size: 1.4em;
    transition: color 0.2s ease;
}

.following-user-link:hover .following-user-name {
    color: #5f4dff;
}

:global(body.dark-mode) .following-user-link:hover .following-user-name {
    color: #6e70ff;
}
    
    .section-user-stats {
        height: 295px;
        width: 32%;
        border-radius: 12px;
        border-width: 1px;
        border-color: rgba(255, 255, 255, 0.3);
        border-style: solid;
        padding: 6px;
        position: relative;
        z-index: 1;
        background: rgba(17, 17, 17, 0.4);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    :global(body:not(.dark-mode)) .section-user-stats {
        background: rgba(255, 255, 255, 0.6);
        border-color: rgba(0, 0, 0, 0.1);
    }

    :global(body.dark-mode) .section-user-stats {
        background: rgba(17, 17, 17, 0.4);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }
    .profile-bio {
        width: calc(100% - 6px);
        height: calc(100% - (2.2em + 1px));
        overflow: auto;
    }
    .profile-bio-line {
        width: calc(100% - 6px);
        height: 1px;
        background: rgba(0, 0, 0, 0.15);
    }
    :global(body.dark-mode) .profile-bio-line {
        background: rgba(17, 17, 17, 0.4);
    }

    .user-ordering-stats {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    @media screen and (max-width: 1915px) {
        .section-user-stats {
            width: 31%;
        }
    }
    @media screen and (max-width: 1105px) {
        .user-ordering-stats {
            flex-direction: column;
        }
        .section-user-stats {
            width: 100%;
            margin-bottom: 4px;
        }
    }

    .profile-project-image {
        width: 100%;
        height: 180px;
        margin-top: 18px;
        object-fit: cover;
    }
    .profile-project-authordiv {
        display: flex;
        align-items: center; /* vertically centers the children */
        gap: 8px; /* optional spacing between PFP and text */
    }
    .profile-project-author {
        width: 2.4em;
        height: 2.4em;
        border-radius: 4px;
        margin-right: 4px;
    }
    .profile-project-authorinfo {
        display: flex;
        flex-direction: column;
        justify-content: center; /* vertical centering inside this column */
    }
    .profile-project-authorinfo p {
        margin-block: 0;
    }
    .profile-project-link {
        color: #4d97ff;
        text-decoration: none;
        display: inline-flex;
        align-items: center; /* vertically centers if parent height is set */
        height: 100%; /* make sure it takes full height of container */
    }
    .profile-project-date {
        color: #575e75;
        text-decoration: none;
    }
    :global(body.dark-mode) .profile-project-date {
        color: #9ba0b1;
    }
    :global(html[dir="rtl"]) .profile-project-author {
        margin-right: initial;
        margin-left: 4px;
    }

    :global(body.dark-mode) .section-user-stats {
        border-color: rgba(255, 255, 255, 0.3);
    }

    .edit-link {
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0 4px;
        color: dodgerblue;
        border-bottom: 1.5px solid dodgerblue;
        cursor: pointer;
    }
    .edit-done {
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0 4px;
        cursor: pointer;
    }

    .profile-bio-textarea {
        width: calc(100% - 6px);
        height: calc(100% - 2.2em);
        margin-top: 4px;
        resize: none;
    }
    .profile-bio-textarea:focus {
        outline: none;
        border-color: black;
    }
    :global(body.dark-mode) .profile-bio-textarea {
        border-color: rgba(255, 255, 255, 0.3);
        background: none;
        color: white;
    }
    :global(body.dark-mode) .profile-bio-textarea:focus {
        outline: none;
        border-color: white;
    }
    .profile-bio-textarea-inappropriate {
        border-color: red !important;
    }
    .profile-bio-warning-inappropriate {
        background: #700;
        color: white;
        font-weight: bold;
        border-radius: 4px;
        z-index: 1000;
        position: absolute;
        padding: 4px 8px;
        max-width: 50%;
        box-shadow: black 0 0 10px;
    }

    .profile-bio-sidenotes {
        width: 70%;
        position: absolute;
        left: 100%;
        top: 12px;
        padding: 10px 8px;
        z-index: 900;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.3);
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .profile-bio-sidenote {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 4px 0;
    }
    .profile-bio-sidenote img {
        margin-right: 4px;
    }
    :global(html[dir="rtl"]) .profile-bio-sidenote img {
        margin-right: initial;
        margin-left: 4px;
    }
    :global(body.dark-mode) .profile-bio-sidenotes {
        background: #111;
        border-color: rgba(255, 255, 255, 0.3);
    }
    :global(html[dir="rtl"]) .profile-bio-sidenotes {
        left: initial;
        right: 100%;
        border-top-right-radius: initial;
        border-bottom-right-radius: initial;
        border-top-left-radius: 12px;
        border-bottom-left-radius: 12px;
    }
    @media screen and (max-width: 1105px) {
        .profile-bio-sidenotes {
            left: initial;
            right: initial;
            top: 100%;
            height: 175px;
        }
        :global(html[dir="rtl"]) .profile-bio-sidenotes {
            left: initial;
            right: initial;
        }
    }

    .featured-project-list {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 960px;
        height: 512px;
        overflow: auto;
    }

    .follower-section {
        width: auto;
        margin-right: 0px;
        text-align: center;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .follower-count {
        font-size: medium;
        text-align: center;
        font-weight: bold;
        margin: 0 6px;
    }
    .follower-button {
        min-width: 100px;
        height: 38px;
        font-size: medium;
        font-weight: bold;
        color: white;
        background: linear-gradient(135deg, rgba(89, 0, 255, 0.8), rgba(150, 60, 255, 0.9));
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.25);
        text-align: center;
        cursor: pointer;
        transition:
            background 0.35s ease,
            box-shadow 0.4s ease,
            transform 0.2s ease,
            color 0.3s ease;
        box-shadow: 0 0 12px rgba(89, 0, 255, 0.3);
        backdrop-filter: blur(6px);
    }

    .follower-button:not(.follower-button-following) {
        box-shadow: 0 0 16px rgba(120, 60, 255, 0.7);
    }

    .follower-button-following {
        background: rgba(163, 163, 163, 0.8);
        color: #e8e8e8;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
    }

    .follower-button-donator {
        background: linear-gradient(135deg, #c65cff, #9b4dff);
        box-shadow: 0 0 14px rgba(198, 92, 255, 0.7);
    }

    /* 🌙 Dark mode adjustments */
    :global(body.dark-mode) .follower-button {
        border-color: rgba(255, 255, 255, 0.25);
    }
    :global(body.dark-mode) .follower-button-following {
        background: rgba(90, 90, 90, 0.9);
    }
    :global(body.dark-mode) .follower-button:not(.follower-button-following) {
        box-shadow: 0 0 18px rgba(150, 90, 255, 0.8);
    }

    .follower-button:hover {
        transform: scale(1.05);
        box-shadow: 0 0 24px rgba(150, 90, 255, 0.9);
    }
    .follower-button:active {
        transform: scale(0.95);
        box-shadow: 0 0 10px rgba(150, 90, 255, 0.4);
    }

    .subuser-section {
        width: 100%;
        display: flex;
        justify-content: space-between; /* Changed from space-between */
        align-items: center;
    }
    .user-username {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .user-after-image {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .user-after-image img {
        margin: 0 8px;
        transform: scale(0.75);
    }
    .user-after-image > h1 {
        font-size: 3em;
        font-weight: bolder;
        margin-block: 0.2rem;
        margin-left: 20px;
        margin-right: 20px;
    }
    .user-badge-container {
        margin: 0px;
        margin-top: 4px;
        width: 100%;
        height: calc(100% - 46px);
        overflow: auto;
    }
    .user-badges {
        display: flex;
        flex-flow: row;
        flex-wrap: wrap;
        justify-content: center;
    }
    :global(body.dark-mode) :global(.content-category) {
    background: rgba(17, 17, 17, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
}
:global(body.dark-mode) :global(.content-category) {
    background: rgba(17, 17, 17, 0.4) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
}
.blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    z-index: -1;
    pointer-events: none;
}

.blob-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%);
    top: 10%;
    left: 10%;
    animation: float1 20s ease-in-out infinite;
}

.blob-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.5) 0%, transparent 70%);
    top: 50%;
    right: 15%;
    animation: float2 18s ease-in-out infinite 2s;
}

.blob-3 {
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(29, 78, 216, 0.4) 0%, transparent 70%);
    bottom: 15%;
    left: 50%;
    animation: float3 22s ease-in-out infinite 4s;
}

:global(body:not(.dark-mode)) .blob-1 {
    background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
}

:global(body:not(.dark-mode)) .blob-2 {
    background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%);
}

:global(body:not(.dark-mode)) .blob-3 {
    background: radial-gradient(circle, rgba(29, 78, 216, 0.2) 0%, transparent 70%);
}

@keyframes float1 {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(100px, -50px) scale(1.1);
    }
    66% {
        transform: translate(-50px, 80px) scale(0.9);
    }
}

@keyframes float2 {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(-80px, 60px) scale(1.15);
    }
    66% {
        transform: translate(70px, -40px) scale(0.95);
    }
}

@keyframes float3 {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(60px, 70px) scale(0.9);
    }
    66% {
        transform: translate(-90px, -30px) scale(1.1);
    }
}
/* ContentCategory background for dark mode */
:global(body.dark-mode) :global(.content-category) {
    background: rgba(17, 17, 17, 0.4) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* ContentCategory background for light mode */
:global(body:not(.dark-mode)) :global(.content-category) {
    background: rgba(255, 255, 255, 0.6) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
}
/* --- Shared style for all ContentCategory boxes --- */
:global(.content-category) {
    border-radius: 12px;
    overflow: hidden;
    padding: 12px;
    transition: background 0.3s ease, border-color 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Light mode background */
:global(body:not(.dark-mode)) :global(.content-category) {
    background: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(12px) saturate(160%);
    -webkit-backdrop-filter: blur(12px) saturate(160%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Dark mode background */
:global(body.dark-mode) :global(.content-category) {
    background: rgba(20, 20, 20, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.comments-section {
    width: 100%;
    padding: 16px;
    overflow-x: hidden;
    overflow-y: auto;
    box-sizing: border-box;
}

.comments-toggle {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.comments-toggle-button {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
}

:global(body.dark-mode) .comments-toggle-button {
    background: rgba(30, 30, 30, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
}

.comments-toggle-button:hover {
    transform: scale(1.05);
}

.comment-input-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
}


.comment-textarea {
    width: calc(100% - 24px); /* Change from 100% to account for padding */
    min-height: 80px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
    box-sizing: border-box; /* Add this line */
}

:global(body.dark-mode) .comment-textarea {
    background: rgba(30, 30, 30, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
}

.comment-submit-button {
    align-self: flex-end;
    padding: 10px 24px;
    background: linear-gradient(135deg, rgba(89, 0, 255, 0.8), rgba(150, 60, 255, 0.9));
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
}

.comment-submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.comment-submit-button:not(:disabled):hover {
    transform: scale(1.05);
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
    max-height: none; /* Allow it to grow */
}

.comment-item {
    padding: 16px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    overflow-x: hidden; /* Add this line */
    max-width: 100%; /* Add this line */
}

:global(body.dark-mode) .comment-item {
    background: rgba(30, 30, 30, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.comment-author-info {
    display: flex;          
    align-items: center;     
    gap: 8px;                
}

.comment-avatar {
    width: 2.4em;
    height: 2.4em;
    border-radius: 4px;
    object-fit: cover;
}

.comment-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.comment-username {
    color: #4d97ff;
    text-decoration: none;
    font-weight: bold;     
    font-size: 1rem;       
    line-height: normal;    
    margin: 0;              
}

.comment-date {
    font-size: 12px;
    opacity: 0.6;
}

.comment-edited {
    font-size: 12px;
    opacity: 0.5;
    font-style: italic;
}

.comment-actions {
    display: flex;
    gap: 8px;
}

.comment-action-button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    opacity: 0.6;
    transition: opacity 0.2s;
}

.comment-action-button:hover {
    opacity: 1;
}

.comment-content {
    margin-bottom: 12px;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    word-break: break-word;
    max-width: 100%;
    overflow: hidden;
    white-space: pre-wrap;
}

.comment-reply-button {
    background: transparent;
    border: none;
    color: #4d97ff;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    padding: 4px 0;
}

.comment-reply-button:hover {
    text-decoration: underline;
}

.comment-edit-box,
.comment-reply-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
}

.comment-edit-actions {
    display: flex;
    gap: 8px;
}

.comment-edit-save {
    padding: 8px 16px;
    background: #4d97ff;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
}

.comment-edit-save:hover {
    background: #3a7fe6;
}

.comment-edit-cancel {
    padding: 8px 16px;
    background: rgba(128, 128, 128, 0.3);
    color: inherit;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
}

.comment-edit-cancel:hover {
    background: rgba(128, 128, 128, 0.5);
}

.load-more-comments {
    width: 100%;
    padding: 12px;
    margin-top: 16px;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
}

:global(body.dark-mode) .load-more-comments {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
}

.load-more-comments:hover {
    background: rgba(0, 0, 0, 0.1);
}

:global(body.dark-mode) .load-more-comments:hover {
    background: rgba(255, 255, 255, 0.1);
}
.replies {
    margin-left: 40px;
    margin-top: 12px;
    padding-left: 16px;
    border-left: 3px solid rgba(0, 0, 0, 0.1);
}

:global(body.dark-mode) .replies {
    border-left-color: rgba(255, 255, 255, 0.1);
}

.comment-item.reply {
    background: rgba(0, 0, 0, 0.05);
}

:global(body.dark-mode) .comment-item.reply {
    background: rgba(0, 0, 0, 0.2);
}

:global(.mention-link) {
    color: #4dabf7 !important;
    text-decoration: none !important;
    font-weight: bold !important;
    transition: color 0.2s ease !important;
}

:global(.mention-link:hover) {
    color: #4dabf7 !important;
    text-decoration: underline !important;
}

:global(body.dark-mode) :global(.mention-link) {
    color: #4dabf7 !important;
}

:global(body.dark-mode) :global(.mention-link:hover) {
    color: #74c0fc !important;
}

:global(.emoji-inline) {
    width: 20px !important;
    height: 20px !important;
    vertical-align: middle;
    display: inline-block;
    margin: 0 2px;
    user-select: none;
    object-fit: contain;
}

.reply-btn {
    color: #4d97ff;
    background: transparent;
}

.reply-btn:hover {
    background: rgba(77, 151, 255, 0.1);
}
.replying-to {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(77, 151, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 0.9rem;
}

:global(body.dark-mode) .replying-to {
    background: rgba(74, 171, 247, 0.2);
}

.cancel-reply {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: auto;
    height: auto;
    opacity: 0.6;
}

.cancel-reply:hover {
    opacity: 1;
}

/* Add these styles to your profile page <style> section */

.profile-banner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
}

.profile-banner-default {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:global(body.dark-mode) .profile-banner-default {
    background: linear-gradient(135deg, #2d3561 0%, #3d2856 100%);
}

.banner-edit-button {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: 3;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.banner-edit-button:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.05);
}

:global(body.dark-mode) .banner-edit-button {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
}

:global(body.dark-mode) .banner-edit-button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.modal-button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modal-button-primary {
    background: linear-gradient(135deg, rgba(89, 0, 255, 0.8), rgba(150, 60, 255, 0.9));
    color: white;
}

.modal-button-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(89, 0, 255, 0.4);
}

.modal-button-danger {
    background: rgba(220, 53, 69, 0.8);
    color: white;
}

.modal-button-danger:hover {
    background: rgba(220, 53, 69, 1);
    transform: scale(1.05);
}

.modal-button-secondary {
    background: rgba(128, 128, 128, 0.3);
    color: inherit;
}

.modal-button-secondary:hover {
    background: rgba(128, 128, 128, 0.5);
}

:global(body.dark-mode) .modal-button-secondary {
    background: rgba(255, 255, 255, 0.1);
}

:global(body.dark-mode) .modal-button-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
}

.profile-banner-container {
    position: relative;
    width: 90%;
    max-width: 1400px;
    margin: 10px auto 0;
    border-radius: 12px;
    overflow: hidden;
    height: 300px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-banner-container .profile-banner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.scratch-modal-back {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 9999 !important;
}
.cropper-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.scratch-modal {
    transition: max-width 0.3s ease;
}
.left-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.char-count {
    font-size: 0.9rem;
    opacity: 0.7;
}

.emoji-picker-btn {
    padding: 6px 10px;
    border-radius: 6px;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    height: auto;
}

:global(body.dark-mode) .emoji-picker-btn {
    background: rgba(255, 255, 255, 0.1);
}

.emoji-picker-btn:hover {
    background: rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
}

:global(body.dark-mode) .emoji-picker-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.emoji-picker {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 10px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    padding: 12px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

:global(body.dark-mode) .emoji-picker {
    background: rgba(30, 30, 30, 0.95);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.emoji-picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
}

:global(body.dark-mode) .emoji-picker-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
}

.emoji-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: auto;
    height: auto;
    opacity: 0.6;
}

.emoji-close:hover {
    opacity: 1;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 6px;
}

.emoji-item {
    width: 40px;
    height: 40px;
    padding: 4px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

:global(body.dark-mode) .emoji-item {
    background: rgba(255, 255, 255, 0.05);
}

.emoji-item:hover {
    background: rgba(0, 0, 0, 0.15);
    transform: scale(1.15);
}

:global(body.dark-mode) .emoji-item:hover {
    background: rgba(255, 255, 255, 0.15);
}

.emoji-item img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.comment-input-box {
    position: relative;
}

</style>
