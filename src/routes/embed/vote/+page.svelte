<script>
    import { onMount } from "svelte";
    import Authentication from "../../../resources/authentication.js";
    import ProjectApi from "../../../resources/projectapi.js";
    import EmojiHandler from "../../../resources/emojis.js";
    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";

    function numberCast(num) {
        const neww = Number(num);
        if (isNaN(neww)) return 0;
        return neww;
    }

    let likes = 0;
    let votes = 0;
    let views = 0;

    let userLiked = false;
    let userVoted = false;
    let userLikedOnLoad = false;
    let userVotedOnLoad = false;

    let loaded = false;
    let loggedIn = true;
    let loggedInAdmin = false;

    // emoji handeling

    let emojiMap = {};
    let emojisLoaded = false;
    let showEmojiPicker = false;
    let commentTextarea;

    let projectId = 0;

    function vote() {
        if (loggedIn === false) {
            Authentication.authenticate().then(() => {
                const username = localStorage.getItem("username");
                const token = localStorage.getItem("token");
                Authentication.usernameFromCode(username, token)
                    .then(({isAdmin, isApprover}) => {
                        loggedIn = true;
                        loggedInAdmin = isAdmin || isApprover;
                        ProjectClient.setUsername(username);
                        ProjectClient.setToken(token);
                        registerView();
                        vote();
                        return;
                    })
                    .catch(() => {
                        loggedIn = false;
                    });
            });
            return;
        }
        ProjectClient.toggleVoteProject(projectId, "vote", !userVoted)
            .catch((err) => alert(String(err)));
        userVoted = !userVoted;
    }
    function love() {
        if (loggedIn === false) {
            Authentication.authenticate().then(() => {
                const username = localStorage.getItem("username");
                const token = localStorage.getItem("token");
                Authentication.usernameFromCode(username, token)
                    .then(({isAdmin, isApprover}) => {
                        loggedIn = true;
                        loggedInAdmin = isAdmin || isApprover;
                        ProjectClient.setUsername(username);
                        ProjectClient.setToken(token);
                        registerView();
                        love();
                        return;
                    })
                    .catch(() => {
                        loggedIn = false;
                    });
            });
            return;
        }
        ProjectClient.toggleVoteProject(projectId, "love", !userLiked)
            .catch((err) => alert(String(err)));
        userLiked = !userLiked;
    }

    function updateVoteStates() {
        ProjectClient.getVoteStates(projectId)
            .then((states) => {
                userLiked = states.loved;
                userVoted = states.voted;
                userLikedOnLoad = userLiked;
                userVotedOnLoad = userVoted;
                loaded = true;
            })
            .catch(() => {
                userLiked = false;
                userVoted = false;
                loaded = true;
            });
    }
    onMount(() => {
        const params = new URLSearchParams(location.search);
        const projId = String(params.get("id"));
        projectId = projId;
        
        // Load emojis
        loadEmojis();
        
        ProjectApi.getProjectMeta(projId)
            .then((meta) => {
                likes = numberCast(meta.loves);
                votes = numberCast(meta.votes);
                views = numberCast(meta.views);
            })
            .catch(() => {
                likes = 0;
                votes = 0;
                views = 0;
            });

        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        
        if (!token || !username) {
            loggedIn = false;
            userLiked = false;
            userVoted = false;
            loaded = true;
            loadComments();
            console.log("what", username, token)
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(({ isAdmin, isApprover }) => {
                console.log("suces")
                ProjectClient.setToken(token);
                ProjectClient.setUsername(username);

                updateVoteStates();
                loggedIn = true;
                loggedInAdmin = isAdmin || isApprover;

                registerView();
                loadComments(); 
            })
            .catch((e) => {
                console.log("err", e)
                loggedIn = false;
                userLiked = false;
                userVoted = false;
                loaded = true;
            });
    });

    // RTODO: change this
    Authentication.onAuthentication((username, privateCode) => {
        ProjectClient.setUsername(username);
        ProjectClient.setToken(privateCode);
        Authentication.usernameFromCode(username, privateCode).then(({ isAdmin, isApprover}) => {
            loggedIn = true;
            loadComments();
            loggedInAdmin = isAdmin || isApprover;
        });
    });

    // used for algorithm
    function registerView() {
        ProjectClient.registerView(projectId);
    }
// Comment state
let comments = [];
let commentCount = 0;
let commentPage = 0;
let hasMoreComments = true;
let newComment = "";
let editingComment = null;
let editContent = "";
let replyingTo = null;

const API_URL = "https://arkideapi.arc360hub.com";

async function loadComments() {
    try {
        const response = await fetch(`${API_URL}/api/v1/projects/comments?projectId=${projectId}&page=${commentPage}&pageSize=20`);
        const data = await response.json();
        
        console.log("Comments data:", data.comments); // ADD THIS LINE TO DEBUG
        
        if (commentPage === 0) {
            comments = data.comments;
        } else {
            comments = [...comments, ...data.comments];
        }
        
        commentCount = data.count;
        hasMoreComments = comments.length < data.count;
    } catch (err) {
        console.error("Failed to load comments:", err);
    }
}
async function postComment() {
    if (!newComment.trim()) return;
    
    // Check if we're replying to a specific comment
    let parentId = null;
    let content = newComment.trim();
    
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
            
            const userComments = comments.filter(c => c.username === mentionedUser && !c.parentId);
            const parentComment = userComments[0];
            if (parentComment) {
                parentId = parentComment.id;
                content = restOfComment;
            }
        }
    }
    
    try {
        const response = await fetch(`${API_URL}/api/v1/projects/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                projectId: projectId,
                content: content,
                parentId: parentId
            })
        });
        
        if (response.ok) {
            newComment = "";
            replyingTo = null;
            commentPage = 0;
            await loadComments();
        } else {
            const error = await response.json();
            alert(error.error || "Failed to post comment");
        }
    } catch (err) {
        alert("Failed to post comment");
    }
}

function startEdit(comment) {
    editingComment = comment.id;
    editContent = comment.content;
}

async function saveEdit(commentId) {
    try {
        const response = await fetch(`${API_URL}/api/v1/projects/comments/${commentId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                content: editContent.trim()
            })
        });
        
        if (response.ok) {
            editingComment = null;
            commentPage = 0;
            await loadComments();
        } else {
            alert("Failed to update comment");
        }
    } catch (err) {
        alert("Failed to update comment");
    }
}

async function deleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;
    
    try {
        const response = await fetch(`${API_URL}/api/v1/projects/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        
        if (response.ok) {
            commentPage = 0;
            await loadComments();
        } else {
            alert("Failed to delete comment");
        }
    } catch (err) {
        alert("Failed to delete comment");
    }
}

function replyToComment(comment) {
    newComment = `@${comment.username} `;
    replyingTo = { username: comment.username, commentId: comment.id };
    if (commentTextarea) {
        commentTextarea.focus();
        commentTextarea.setSelectionRange(newComment.length, newComment.length);
    }
}

async function reportComment(commentId) {
    const reason = prompt("Why are you reporting this comment?");
    if (!reason) return;
    
    try {
        const headers = { "Content-Type": "application/json" };
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/api/v1/projects/comments/${commentId}/report`, {
            method: "POST",
            headers,
            body: JSON.stringify({ reason: reason.trim() })
        });
        
        if (response.ok) {
            alert("Comment reported successfully");
        } else {
            alert("Failed to report comment");
        }
    } catch (err) {
        alert("Failed to report comment");
    }
}

function loadMoreComments() {
    commentPage++;
    loadComments();
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}
async function loadEmojis() {
    try {
        const emojis = await EmojiHandler.fetch();
        console.log("Loaded emojis:", emojis); // Debug
        
        // The emojis are just an array of strings (names)
        emojis.forEach(emojiName => {
            if (typeof emojiName === 'string') {
                emojiMap[emojiName] = true; // Just mark it as existing
            }
        });
        console.log("Emoji map:", emojiMap); // Debug
        emojisLoaded = true;
    } catch (err) {
        console.error("Failed to load emojis:", err);
    }
}

function parseEmojis(text) {
    if (!emojisLoaded || !text) return text;
    
    // Match :emojiname: pattern
    return text.replace(/:([a-zA-Z0-9_-]+):/g, (match, emojiName) => {
        if (emojiMap[emojiName]) {
            return `<img src="https://library.arkide.site/files/emojis/${emojiName}.png" alt="${emojiName}" class="emoji-inline" title=":${emojiName}:" />`;
        }
        return match; // Return original if emoji not found
    });
}
function parseMentions(text) {
    if (!text) return text;
    
    console.log("Before parsing mentions:", text);
    
    // Match @username pattern
    const result = text.replace(/@(\w+)/g, (match, username) => {
        console.log("Found mention:", match, username);
        return `<a href="https://arkide.site/profile?user=${username}" class="mention-link" target="_blank">@${username}</a>`;
    });
    
    console.log("After parsing mentions:", result);
    return result;
}

function parseContent(text) {
    // First parse emojis, then mentions
    let parsed = parseEmojis(text);
    parsed = parseMentions(parsed);
    return parsed;
}
function insertEmoji(emojiName) {
    const emojiCode = `:${emojiName}:`;
    if (commentTextarea) {
        const start = commentTextarea.selectionStart;
        const end = commentTextarea.selectionEnd;
        const text = newComment;
        newComment = text.substring(0, start) + emojiCode + text.substring(end);
        
        // Set cursor position after inserted emoji
        setTimeout(() => {
            commentTextarea.selectionStart = commentTextarea.selectionEnd = start + emojiCode.length;
            commentTextarea.focus();
        }, 0);
    } else {
        newComment += emojiCode;
    }
    showEmojiPicker = false;
}
function getEmojiList() {
    // emojiMap keys are the emoji names
    const list = Object.keys(emojiMap).map(name => ({
        name,
        url: `https://library.arkide.site/files/emojis/${name}.png`
    }));
    return list;
}
</script>

<div class="main">
    {#if loaded}
        <div title="Like this project" class="parent button-text">
            <button class="like" on:click={love}>
                <img
                    src="/vote/heart{userLiked ? "" : "_white"}.svg"
                    alt="Like"
                    class="button-image"
                    draggable="false"
                    data-activated={userLiked}
                />
            </button>
            <p>{likes - Number(userLikedOnLoad) + Number(userLiked)}</p>
        </div>
        <div title="Vote to Feature this project" class="parent button-text">
            <button class="feature" on:click={vote}>
                <img
                    src="/vote/feature{userVoted ? "" : "_white"}.svg"
                    alt="Vote to Feature"
                    class="button-image"
                    draggable="false"
                    data-activated={userVoted}
                />
            </button>
            <p>
                {votes - Number(userVotedOnLoad) + Number(userVoted)}
            </p>
        </div>
        <div title="Project views" class="parent button-text">
            <button class="view" disabled>
                <img
                    src="/vote/view_white.svg"
                    alt="View Count"
                    class="button-image"
                    draggable="false"
                />
            </button>
            <p>{views}</p>
        </div>
        {#if loggedInAdmin}
            <div>
                <p>
                    <a href="/panel?reject={projectId}" target="_blank">
                        <img
                            src="/notallowed.png"
                            alt="Reject Project"
                            title="Reject Project"
                            height="32"
                        >
                    </a>
                </p>
                <br>
                <p>
                    <a href="/edit?id={projectId}" target="_blank">
                        <img
                            src="/pencil.png"
                            alt="Edit Project"
                            title="Edit Project"
                            height="32"
                        >
                    </a>
                </p>
            </div>
        {/if}
    {:else}
        <LoadingSpinner />
    {/if}
</div>
{#if loaded}
    <div class="comments-section">
        <div class="comments-header">
            <h2>Comments</h2>
            <span class="comment-count">{commentCount}</span>
        </div>
        
        {#if loggedIn}
            <div class="comment-box">
                {#if replyingTo}
                    <div class="replying-to">
                        <span>Replying to @{replyingTo.username}</span>
                        <button class="cancel-reply" on:click={() => { replyingTo = null; newComment = ""; }}>×</button>
                    </div>
                {/if}
                <textarea 
                    bind:this={commentTextarea}
                    bind:value={newComment}
                    placeholder={replyingTo ? `Reply to @${replyingTo}...` : "Write a comment..."}
                    maxlength="500"
                    rows="3"
                ></textarea>
                <div class="comment-actions">
                    <div class="left-actions">
                        <span class="char-count">{newComment.length}/500</span>
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
                        class="post-btn" 
                        on:click={postComment} 
                        disabled={newComment.trim().length === 0}
                        title="Post Comment"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
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
        {:else}
            <div class="login-prompt">
                <p>Log in to post comments</p>
            </div>
        {/if}

        <div class="comments-list">
            {#each comments.filter(c => !c.parentId) as comment (comment.id)}
                <div class="comment">
                    <div class="comment-header">
                        <div class="comment-author-info">
                            <img 
                                src={`https://arkideapi.arc360hub.com/api/v1/users/getpfp?username=${comment.username}`}
                                alt={comment.username}
                                class="comment-pfp"
                            />
                            <a 
                                href={`https://arkide.site/profile?user=${comment.username}`}
                                class="comment-author"
                                target="_blank"
                            >
                                {comment.username}
                            </a>
                        </div>
                        <span class="comment-time">
                            {formatTime(comment.createdAt)}
                            {#if comment.edited}
                                <span class="edited">(edited)</span>
                            {/if}
                        </span>
                    </div>
                    
                    {#if editingComment === comment.id}
                        <textarea 
                            bind:value={editContent}
                            maxlength="500"
                            rows="3"
                            class="edit-textarea"
                        ></textarea>
                        <div class="comment-buttons">
                            <button class="icon-btn save-btn" on:click={() => saveEdit(comment.id)} title="Save">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </button>
                            <button class="icon-btn cancel-btn" on:click={() => editingComment = null} title="Cancel">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
{:else}
                        <p class="comment-content">{@html parseContent(comment.content)}</p>
                        
                        <div class="comment-buttons">
                            {#if loggedIn}
                                <button class="icon-btn reply-btn" on:click={() => replyToComment(comment)} title="Reply">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                    </svg>
                                </button>
                            {/if}
                            {#if loggedInAdmin || (loggedIn && comment.username === localStorage.getItem("username"))}
                                <button class="icon-btn edit-btn" on:click={() => startEdit(comment)} title="Edit">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button class="icon-btn delete-btn" on:click={() => deleteComment(comment.id)} title="Delete">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            {/if}
                            <button class="icon-btn report-btn" on:click={() => reportComment(comment.id)} title="Report">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                            </button>
                        </div> <!-- closes comment-buttons -->
                    {/if} <!-- closes the {:else} block for editingComment -->
                
                {#if comments.filter(c => c.parentId === comment.id).length > 0}
                    <div class="replies">
                        {#each comments.filter(c => c.parentId === comment.id) as reply (reply.id)}
                            <div class="comment reply">
                                <div class="comment-header">
                                    <div class="comment-author-info">
                                        <img 
                                            src={`https://arkideapi.arc360hub.com/api/v1/users/getpfp?username=${reply.username}`}
                                            alt={reply.username}
                                            class="comment-pfp"
                                        />
                                        <a 
                                            href={`https://arkide.site/profile?user=${reply.username}`}
                                            class="comment-author"
                                            target="_blank"
                                        >
                                            {reply.username}
                                        </a>
                                    </div> <!-- closes comment-author-info -->
                                    <span class="comment-time">
                                        {formatTime(reply.createdAt)}
                                        {#if reply.edited}
                                            <span class="edited">(edited)</span>
                                        {/if}
                                    </span>
                                </div> <!-- closes comment-header -->
                                
                                {#if editingComment === reply.id}
                                    <textarea 
                                        bind:value={editContent}
                                        maxlength="500"
                                        rows="3"
                                        class="edit-textarea"
                                    ></textarea>
                                    <div class="comment-buttons">
                                        <button class="icon-btn save-btn" on:click={() => saveEdit(reply.id)} title="Save">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        </button>
                                        <button class="icon-btn cancel-btn" on:click={() => editingComment = null} title="Cancel">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    </div> <!-- closes comment-buttons -->
                                {:else}
                                    <p class="comment-content">{@html parseContent(reply.content)}</p>
                                    
                                    <div class="comment-buttons">
                                        {#if loggedInAdmin || (loggedIn && reply.username === localStorage.getItem("username"))}
                                            <button class="icon-btn edit-btn" on:click={() => startEdit(reply)} title="Edit">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                            <button class="icon-btn delete-btn" on:click={() => deleteComment(reply.id)} title="Delete">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                </svg>
                                            </button>
                                        {/if}
                                        <button class="icon-btn report-btn" on:click={() => reportComment(reply.id)} title="Report">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                                <line x1="12" y1="9" x2="12" y2="13"/>
                                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                                            </svg>
                                        </button>
                                    </div> 
                                {/if} 
                            </div> 
                        {/each} 
                    </div> 
                {/if} 
            </div> 
            {/each} 
            {#if comments.length === 0 && commentCount === 0}
                <div class="no-comments">
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            {/if}
            
            {#if hasMoreComments}
                <button class="load-more" on:click={loadMoreComments}>
                    Load More Comments
                </button>
            {/if}
        </div>
    </div>
{/if}

<style>
	* {
		font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
	}

.container {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    overflow-y: auto;
    background: transparent;
    backdrop-filter: blur(6px);
}

.main {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    min-height: 100px;
    padding: 20px 0;
    background: transparent;
}

	button {
		cursor: pointer;
		border: none;
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		transition: 
			transform 0.2s ease,
			box-shadow 0.3s ease,
			background 0.3s ease,
			filter 0.2s ease;
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.08);
	}

	button:hover:enabled {
		transform: scale(1.1);
		box-shadow: 0 0 25px rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.1);
		filter: brightness(1.2);
	}

	button:active:enabled {
		transform: scale(0.95);
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
		filter: brightness(0.9);
	}

	button:disabled {
		cursor: not-allowed !important;
		opacity: 0.5;
		box-shadow: none;
	}

	.button-text {
		color: rgba(0, 0, 0, 0.9);
		text-shadow: 0 0 6px rgba(255, 255, 255, 0.2);
	}
	:global(body.dark-mode) .button-text {
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
	}

	.button-image {
		width: 70%;
		user-select: none;
		filter: brightness(0) opacity(0.8);
		transition: filter 0.25s ease, transform 0.25s ease, drop-shadow 0.25s ease;
	}
	:global(body.dark-mode) .button-image {
		filter: saturate(0) brightness(2);
	}

	.button-image[data-activated="true"] {
		filter: none !important;
		transform: scale(1.15);
	}

	img {
		width: 100%;
	}

	p {
		margin-block: 6px;
		text-align: center;
		font-size: 1.1rem;
	}

	.parent {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-weight: bold;
		font-size: 20px;
		transition: transform 0.2s ease;
	}

	.parent:hover {
		transform: translateY(-2px);
	}

	/* Glowing color cues for each button type */
	.like:hover {
		box-shadow: 0 0 25px rgba(255, 106, 200, 0.6);
	}
	.like[data-activated="true"] {
		box-shadow: 0 0 30px rgba(255, 106, 200, 0.9);
	}

	.feature:hover {
		box-shadow: 0 0 25px rgba(255, 229, 107, 0.6);
	}
	.feature[data-activated="true"] {
		box-shadow: 0 0 30px rgba(255, 229, 107, 0.9);
	}

	.view:hover {
		box-shadow: 0 0 25px rgba(47, 0, 255, 0.6);
	}
.comments-section {
    margin: 20px auto;
    padding: 20px;
    max-width: 800px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}
:global(body.dark-mode) .comments-section {
    background: rgba(0, 0, 0, 0.3);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}

.comments-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}
.comments-header h2 {
    margin: 0;
    font-size: 1.5rem;
}
.comment-count {
    background: rgba(0, 0, 0, 0.15);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: bold;
}
:global(body.dark-mode) .comment-count {
    background: rgba(255, 255, 255, 0.15);
}

.comment-box textarea,
.edit-textarea {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    font-family: inherit;
    font-size: 1rem;
    resize: vertical;
    box-sizing: border-box;
}
:global(body.dark-mode) .comment-box textarea,
:global(body.dark-mode) .edit-textarea {
    background: rgba(0, 0, 0, 0.3);
    color: rgba(255, 255, 255, 0.9);
}

.comment-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}
.char-count {
    font-size: 0.9rem;
    opacity: 0.7;
}
.post-btn {
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    background: rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
:global(body.dark-mode) .post-btn {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.9);
}
.post-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.25);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}
:global(body.dark-mode) .post-btn {
    background: rgba(255, 255, 255, 0.15);
}
:global(body.dark-mode) .post-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
}

.post-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.login-prompt {
    text-align: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-bottom: 20px;
}
.login-prompt p {
    margin: 0;
    opacity: 0.7;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.comment {
    padding: 16px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
:global(body.dark-mode) .comment {
    background: rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.9rem;
}
.comment-author {
    font-weight: bold;
}
.comment-time {
    opacity: 0.7;
    font-size: 0.85rem;
}
.edited {
    font-style: italic;
    opacity: 0.7;
}

.comment-content {
    margin: 8px 0 12px 0;
    line-height: 1.6;
    word-wrap: break-word;
    text-align: left;
    white-space: pre-wrap;
}

.comment-buttons {
    display: flex;
    gap: 8px;
}
.icon-btn {
    padding: 6px 10px;
    border-radius: 6px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(0, 0, 0, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
:global(body.dark-mode) .icon-btn {
    color: rgba(255, 255, 255, 0.9);
}
.icon-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}
.delete-btn:hover {
    background: rgba(255, 0, 0, 0.3);
}
.report-btn:hover {
    background: rgba(255, 165, 0, 0.3);
}

.no-comments {
    text-align: center;
    padding: 40px 20px;
    opacity: 0.6;
}
.load-more {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(0, 0, 0, 0.9);
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: bold;
}
:global(body.dark-mode) .load-more {
    color: rgba(255, 255, 255, 0.9);
}
.load-more:hover {
    background: rgba(255, 255, 255, 0.2);
}
.comment-author-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.comment-pfp {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
}

.comment-author {
    font-weight: bold;
    color: rgba(0, 0, 0, 0.9);
    text-decoration: none;
    transition: color 0.2s ease;
}

.comment-author:hover {
    color: #0074d9;
    text-decoration: underline;
}

:global(body.dark-mode) .comment-author {
    color: rgba(255, 255, 255, 0.9);
}

:global(body.dark-mode) .comment-author:hover {
    color: #4dabf7;
}
.emoji-inline {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    vertical-align: middle;
    display: inline-block;
    margin: 0 2px;
    user-select: none;
    object-fit: contain;
}

.left-actions {
    display: flex;
    align-items: center;
    gap: 10px;
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
    width: 100%;
    max-width: 100%;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    backdrop-filter: blur(10px);
    box-sizing: border-box;
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

.emoji-picker-header span {
    font-weight: bold;
    font-size: 0.9rem;
}

.emoji-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: auto;
    height: auto;
    color: rgba(0, 0, 0, 0.6);
    transition: color 0.2s ease;
}

:global(body.dark-mode) .emoji-close {
    color: rgba(255, 255, 255, 0.6);
}

.emoji-close:hover {
    color: rgba(0, 0, 0, 0.9);
}

:global(body.dark-mode) .emoji-close:hover {
    color: rgba(255, 255, 255, 0.9);
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
    display: flex;
    align-items: center;
    justify-content: center;
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

.comment-box {
    position: relative;
}
.comment-content .emoji-inline {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    vertical-align: middle;
    display: inline-block;
    margin: 0 2px;
    user-select: none;
    object-fit: contain;
}
:global(.emoji-inline) {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    vertical-align: middle;
    display: inline-block;
    margin: 0 2px;
    user-select: none;
    object-fit: contain;
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

.comment.reply {
    background: rgba(0, 0, 0, 0.05);
}

:global(body.dark-mode) .comment.reply {
    background: rgba(0, 0, 0, 0.2);
}

.mention-link {
    color: #0074d9;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
}

.mention-link:hover {
    color: #0056a8;
    text-decoration: underline;
}

:global(body.dark-mode) .mention-link {
    color: #4dabf7;
}

:global(body.dark-mode) .mention-link:hover {
    color: #74c0fc;
}

.replying-to {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 123, 255, 0.1);
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
    color: rgba(0, 0, 0, 0.6);
    transition: color 0.2s ease;
}

:global(body.dark-mode) .cancel-reply {
    color: rgba(255, 255, 255, 0.6);
}

.cancel-reply:hover {
    color: rgba(0, 0, 0, 0.9);
}

:global(body.dark-mode) .cancel-reply:hover {
    color: rgba(255, 255, 255, 0.9);
}

.reply-btn:hover {
    background: rgba(0, 123, 255, 0.2);
}
:global(.mention-link) {
    color: #4dabf7 !important;
    text-decoration: none !important;
    font-weight: bold !important;
    transition: color 0.2s ease, transform 0.2s ease !important;
    display: inline !important;
}

:global(.mention-link:hover) {
    color: #4dabf7 !important;
    text-decoration: underline !important;
    transform: scale(1.05) !important;
}

:global(body.dark-mode) :global(.mention-link) {
    color: #4dabf7 !important;
}

:global(body.dark-mode) :global(.mention-link:hover) {
    color: #74c0fc !important;
    text-decoration: underline !important;
}
</style>
