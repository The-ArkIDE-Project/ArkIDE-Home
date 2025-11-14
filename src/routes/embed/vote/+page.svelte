<script>
    import { onMount } from "svelte";
    import Authentication from "../../../resources/authentication.js";
    import ProjectApi from "../../../resources/projectapi.js";
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

const API_URL = "https://arkideapi.arc360hub.com";

async function loadComments() {
    try {
        const response = await fetch(`${API_URL}/api/v1/projects/comments?projectId=${projectId}&page=${commentPage}&pageSize=20`);
        const data = await response.json();
        
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
    
    try {
        const response = await fetch(`${API_URL}/api/v1/projects/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                projectId: projectId,
                content: newComment.trim()
            })
        });
        
        if (response.ok) {
            newComment = "";
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
<div class="comments-section">
    <h2>Comments ({commentCount})</h2>
    
    {#if loggedIn}
        <div class="comment-box">
            <textarea 
                bind:value={newComment}
                placeholder="Write a comment..."
                maxlength="500"
                rows="3"
            ></textarea>
            <div class="comment-actions">
                <span class="char-count">{newComment.length}/500</span>
                <button on:click={postComment} disabled={newComment.trim().length === 0}>
                    Post Comment
                </button>
            </div>
        </div>
    {:else}
        <p class="login-prompt">Log in to comment</p>
    {/if}

    <div class="comments-list">
        {#each comments as comment (comment.id)}
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">{comment.username}</span>
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
                    ></textarea>
                    <div class="comment-actions">
                        <button on:click={() => saveEdit(comment.id)}>Save</button>
                        <button on:click={() => editingComment = null}>Cancel</button>
                    </div>
                {:else}
                    <p class="comment-content">{comment.content}</p>
                    
                    <div class="comment-buttons">
                        {#if loggedInAdmin || (loggedIn && comment.username === localStorage.getItem("username"))}
                            <button class="small-btn" on:click={() => startEdit(comment)}>Edit</button>
                            <button class="small-btn delete" on:click={() => deleteComment(comment.id)}>Delete</button>
                        {/if}
                        <button class="small-btn" on:click={() => reportComment(comment.id)}>Report</button>
                    </div>
                {/if}
            </div>
        {/each}
        
        {#if hasMoreComments}
            <button class="load-more" on:click={loadMoreComments}>
                Load More Comments
            </button>
        {/if}
    </div>
</div>

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
    margin-top: 40px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    backdrop-filter: blur(10px);
}

:global(body.dark-mode) .comments-section {
    background: rgba(0, 0, 0, 0.2);
}

.comments-section h2 {
    margin: 0 0 20px 0;
    font-size: 1.5rem;
}

.comment-box {
    margin-bottom: 20px;
}

.comment-box textarea {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    font-family: inherit;
    font-size: 1rem;
    resize: vertical;
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

.comment-actions button {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: background 0.2s;
}

.comment-actions button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
}

.comment-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.login-prompt {
    text-align: center;
    padding: 20px;
    opacity: 0.7;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment {
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
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
}

.edited {
    font-style: italic;
    opacity: 0.6;
}

.comment-content {
    margin: 8px 0;
    line-height: 1.5;
    word-wrap: break-word;
}

.comment-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.small-btn {
    padding: 4px 12px;
    font-size: 0.85rem;
    border-radius: 6px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: background 0.2s;
}

.small-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.small-btn.delete {
    background: rgba(255, 0, 0, 0.2);
}

.small-btn.delete:hover {
    background: rgba(255, 0, 0, 0.3);
}

.load-more {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: background 0.2s;
}

.load-more:hover {
    background: rgba(255, 255, 255, 0.2);
}
</style>
