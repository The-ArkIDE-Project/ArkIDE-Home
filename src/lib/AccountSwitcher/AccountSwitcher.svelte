<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import Authentication from "../../resources/authentication.js";
    import { PUBLIC_API_URL } from "$env/static/public";
    
    const dispatch = createEventDispatcher();
    
    export let currentUsername = "";
    export const currentLang = "en"; // External reference only
    
    let showModal = false;
    let accounts = [];
    let editingIndex = -1;
    let newUsername = "";
    let newPassword = "";
    let showPassword = false;
    let saving = false;
    let errorMessage = "";
    
    // Load accounts from localStorage
    function loadAccounts() {
        try {
            const stored = localStorage.getItem("pm:saved_accounts");
            if (stored) {
                accounts = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load accounts:", e);
            accounts = [];
        }
    }
    
    // Save accounts to localStorage
    function saveAccounts() {
        try {
            localStorage.setItem("pm:saved_accounts", JSON.stringify(accounts));
        } catch (e) {
            console.error("Failed to save accounts:", e);
            errorMessage = "Failed to save accounts to browser storage";
        }
    }
    
    // Open modal
    export function open() {
        loadAccounts();
        showModal = true;
        errorMessage = "";
    }
    
    // Close modal
    function close() {
        showModal = false;
        editingIndex = -1;
        newUsername = "";
        newPassword = "";
        showPassword = false;
        errorMessage = "";
    }
    
    // Add new account
    async function addAccount() {
        if (!newUsername || !newPassword) {
            errorMessage = "Username and password are required";
            return;
        }
        
        // Check if account already exists
        if (accounts.some(acc => acc.username === newUsername)) {
            errorMessage = "This account is already saved";
            return;
        }
        
        saving = true;
        errorMessage = "";
        
        try {
            // Verify credentials before saving
            const token = await Authentication.verifyPassword(newUsername, newPassword, "bypass");
            
            if (token) {
                accounts = [...accounts, { username: newUsername, password: newPassword }];
                saveAccounts();
                newUsername = "";
                newPassword = "";
                showPassword = false;
                errorMessage = "";
            } else {
                errorMessage = "Invalid credentials. Please check and try again.";
            }
        } catch (e) {
            if (e === "InvalidCaptcha") {
                errorMessage = "Captcha validation required. Please login normally first.";
            } else {
                errorMessage = "Failed to verify credentials. Please try again.";
            }
        } finally {
            saving = false;
        }
    }
    
    // Start editing an account
    function startEdit(index) {
        editingIndex = index;
        newUsername = accounts[index].username;
        newPassword = accounts[index].password;
        showPassword = true;
    }
    
    // Save edited account
    async function saveEdit() {
        if (!newUsername || !newPassword) {
            errorMessage = "Username and password are required";
            return;
        }
        
        saving = true;
        errorMessage = "";
        
        try {
            // Verify new credentials
            const token = await Authentication.verifyPassword(newUsername, newPassword, "bypass");
            
            if (token) {
                accounts[editingIndex] = { username: newUsername, password: newPassword };
                saveAccounts();
                editingIndex = -1;
                newUsername = "";
                newPassword = "";
                showPassword = false;
                errorMessage = "";
            } else {
                errorMessage = "Invalid credentials. Please check and try again.";
            }
        } catch (e) {
            if (e === "InvalidCaptcha") {
                errorMessage = "Captcha validation required. Please login normally first.";
            } else {
                errorMessage = "Failed to verify credentials. Please try again.";
            }
        } finally {
            saving = false;
        }
    }
    
    // Cancel editing
    function cancelEdit() {
        editingIndex = -1;
        newUsername = "";
        newPassword = "";
        showPassword = false;
        errorMessage = "";
    }
    
    // Delete account
    function deleteAccount(index) {
        if (confirm(`Remove ${accounts[index].username} from saved accounts?`)) {
            accounts = accounts.filter((_, i) => i !== index);
            saveAccounts();
        }
    }
    
    // Switch to account
    async function switchAccount(account) {
        saving = true;
        errorMessage = "";
        
        try {
            const token = await Authentication.verifyPassword(account.username, account.password, "bypass");
            
            if (token) {
                // Store in localStorage
                localStorage.setItem("username", account.username);
                localStorage.setItem("token", token);
                
                // Set cookie for cross-subdomain auth
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                
                document.cookie = `arkide_username=${encodeURIComponent(account.username)}; domain=.arkide.site; path=/; expires=${expiryDate.toUTCString()}; SameSite=None; Secure`;
                document.cookie = `arkide_token=${encodeURIComponent(token)}; domain=.arkide.site; path=/; expires=${expiryDate.toUTCString()}; SameSite=None; Secure`;
                
                // Fire authentication event
                Authentication.fireAuthenticated(account.username, token);
                
                // Reload page to apply new login
                location.reload();
            } else {
                errorMessage = `Failed to login as ${account.username}. Credentials may be outdated.`;
            }
        } catch (e) {
            if (e === "InvalidCaptcha") {
                errorMessage = `Captcha required. Please login as ${account.username} normally, then try again.`;
            } else {
                errorMessage = `Failed to switch to ${account.username}. Please try again.`;
            }
        } finally {
            saving = false;
        }
    }
</script>

{#if showModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={close} transition:fade={{ duration: 200 }}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="modal-content" on:click|stopPropagation transition:scale={{ duration: 200, easing: quintOut }}>
            <div class="modal-header">
                <h2>Account Switcher</h2>
                <button class="close-button" on:click={close}>×</button>
            </div>
            
            <div class="modal-body">
                {#if errorMessage}
                    <div class="error-message">{errorMessage}</div>
                {/if}
                
                <!-- Saved Accounts List -->
                <div class="accounts-list">
                    <h3>Saved Accounts</h3>
                    {#if accounts.length === 0}
                        <p class="empty-state">No saved accounts yet. Add one below!</p>
                    {:else}
                        {#each accounts as account, index}
                            <div class="account-item" class:current={account.username === currentUsername}>
                                <div class="account-info">
                                    <img 
                                        src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${account.username}`}
                                        alt={account.username}
                                        class="account-pfp"
                                    />
                                    <div class="account-details">
                                        <span class="account-username">{account.username}</span>
                                        {#if account.username === currentUsername}
                                            <span class="current-badge">Current</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="account-actions">
                                    {#if account.username !== currentUsername}
                                        <button class="action-btn switch-btn" on:click={() => switchAccount(account)} disabled={saving}>
                                            Switch
                                        </button>
                                    {/if}
                                    <button class="action-btn edit-btn" on:click={() => startEdit(index)} disabled={saving}>
                                        Edit
                                    </button>
                                    <button class="action-btn delete-btn" on:click={() => deleteAccount(index)} disabled={saving}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                
                <!-- Add/Edit Account Form -->
                <div class="account-form">
                    <h3>{editingIndex >= 0 ? 'Edit Account' : 'Add Account'}</h3>
                    <div class="form-group">
                        <label for="account-username-input">Username</label>
                        <input 
                            id="account-username-input"
                            type="text" 
                            bind:value={newUsername}
                            placeholder="Enter username"
                            maxlength="20"
                            disabled={saving}
                        />
                    </div>
                    <div class="form-group">
                        <label for="account-password-input">Password</label>
                        <div class="password-input-wrapper">
                            {#if showPassword}
                                <input 
                                    id="account-password-input"
                                    type="text"
                                    bind:value={newPassword}
                                    placeholder="Enter password"
                                    maxlength="50"
                                    disabled={saving}
                                />
                            {:else}
                                <input 
                                    id="account-password-input"
                                    type="password"
                                    bind:value={newPassword}
                                    placeholder="Enter password"
                                    maxlength="50"
                                    disabled={saving}
                                />
                            {/if}
                            <button 
                                class="password-toggle"
                                on:click={() => showPassword = !showPassword}
                                type="button"
                            >
                                {#if showPassword}
                                    <img src="/account/hidepassword.svg" alt="Hide" class="invert-on-dark" />
                                {:else}
                                    <img src="/account/showpassword.svg" alt="Show" class="invert-on-dark" />
                                {/if}
                            </button>
                        </div>
                    </div>
                    <div class="form-actions">
                        {#if editingIndex >= 0}
                            <button class="form-btn save-btn" on:click={saveEdit} disabled={saving || !newUsername || !newPassword}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button class="form-btn cancel-btn" on:click={cancelEdit} disabled={saving}>
                                Cancel
                            </button>
                        {:else}
                            <button class="form-btn add-btn" on:click={addAccount} disabled={saving || !newUsername || !newPassword}>
                                {saving ? 'Adding...' : 'Add Account'}
                            </button>
                        {/if}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <p class="info-text">
                        ⚠️ Accounts are stored locally in your browser. Clearing browser data will remove saved accounts.
                    </p>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .modal-content {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 600px;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    :global(body.dark-mode) .modal-content {
        background: rgba(34, 34, 34, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    :global(body.dark-mode) .modal-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
    }
    
    :global(body.dark-mode) .modal-header h2 {
        color: white;
    }
    
    .close-button {
        background: transparent;
        border: none;
        font-size: 2rem;
        color: #666;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s;
    }
    
    .close-button:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
    }
    
    :global(body.dark-mode) .close-button {
        color: #ccc;
    }
    
    :global(body.dark-mode) .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
    }
    
    .error-message {
        background: rgba(255, 82, 82, 0.15);
        border: 1px solid #ff5252;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        color: #d32f2f;
        font-weight: 500;
    }
    
    :global(body.dark-mode) .error-message {
        background: rgba(255, 82, 82, 0.2);
        color: #ff8a80;
    }
    
    .accounts-list {
        margin-bottom: 24px;
    }
    
    .accounts-list h3 {
        margin: 0 0 12px 0;
        font-size: 1.1rem;
        color: #333;
    }
    
    :global(body.dark-mode) .accounts-list h3 {
        color: white;
    }
    
    .empty-state {
        text-align: center;
        color: #666;
        padding: 20px;
        font-style: italic;
    }
    
    :global(body.dark-mode) .empty-state {
        color: #999;
    }
    
    .account-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(98, 81, 255, 0.08);
        border: 1px solid rgba(98, 81, 255, 0.2);
        border-radius: 8px;
        margin-bottom: 8px;
        transition: all 0.2s;
    }
    
    .account-item:hover {
        background: rgba(98, 81, 255, 0.12);
        border-color: rgba(98, 81, 255, 0.3);
    }
    
    .account-item.current {
        background: rgba(98, 81, 255, 0.15);
        border-color: rgba(98, 81, 255, 0.4);
    }
    
    :global(body.dark-mode) .account-item {
        background: rgba(98, 81, 255, 0.15);
        border-color: rgba(98, 81, 255, 0.3);
    }
    
    :global(body.dark-mode) .account-item:hover {
        background: rgba(98, 81, 255, 0.2);
        border-color: rgba(98, 81, 255, 0.4);
    }
    
    .account-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .account-pfp {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
    }
    
    .account-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .account-username {
        font-weight: 600;
        color: #333;
    }
    
    :global(body.dark-mode) .account-username {
        color: white;
    }
    
    .current-badge {
        font-size: 0.75rem;
        color: #0011ff;
        font-weight: 600;
    }
    
    :global(body.dark-mode) .current-badge {
        color: #6251ff;
    }
    
    .account-actions {
        display: flex;
        gap: 8px;
    }
    
    .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .switch-btn {
        background: #0011ff;
        color: white;
    }
    
    .switch-btn:hover:not(:disabled) {
        background: #0009cc;
    }
    
    .edit-btn {
        background: rgba(98, 81, 255, 0.15);
        color: #0011ff;
    }
    
    .edit-btn:hover:not(:disabled) {
        background: rgba(98, 81, 255, 0.25);
    }
    
    :global(body.dark-mode) .edit-btn {
        color: #9580ff;
    }
    
    .delete-btn {
        background: rgba(255, 82, 82, 0.15);
        color: #d32f2f;
    }
    
    .delete-btn:hover:not(:disabled) {
        background: rgba(255, 82, 82, 0.25);
    }
    
    :global(body.dark-mode) .delete-btn {
        color: #ff8a80;
    }
    
    .account-form {
        background: rgba(0, 0, 0, 0.03);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    :global(body.dark-mode) .account-form {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.08);
    }
    
    .account-form h3 {
        margin: 0 0 12px 0;
        font-size: 1.1rem;
        color: #333;
    }
    
    :global(body.dark-mode) .account-form h3 {
        color: white;
    }
    
    .form-group {
        margin-bottom: 12px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 4px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #555;
    }
    
    :global(body.dark-mode) .form-group label {
        color: #ccc;
    }
    
    .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        box-sizing: border-box;
    }
    
    :global(body.dark-mode) .form-group input {
        background: #1a1a1a;
        border-color: rgba(255, 255, 255, 0.2);
        color: white;
    }
    
    .password-input-wrapper {
        position: relative;
    }
    
    .password-toggle {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .password-toggle img {
        width: 20px;
        height: 20px;
        opacity: 0.6;
    }
    
    .password-toggle:hover img {
        opacity: 1;
    }
    
    :global(body.dark-mode) .invert-on-dark {
        filter: invert(1);
    }
    
    .form-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
    }
    
    .form-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .form-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .add-btn, .save-btn {
        background: #0011ff;
        color: white;
    }
    
    .add-btn:hover:not(:disabled), .save-btn:hover:not(:disabled) {
        background: #0009cc;
    }
    
    .cancel-btn {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
    }
    
    .cancel-btn:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.15);
    }
    
    :global(body.dark-mode) .cancel-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    :global(body.dark-mode) .cancel-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
    }
    
    .modal-footer {
        padding-top: 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        margin-top: 16px;
    }
    
    :global(body.dark-mode) .modal-footer {
        border-top-color: rgba(255, 255, 255, 0.1);
    }
    
    .info-text {
        font-size: 0.85rem;
        color: #666;
        margin: 0;
        text-align: center;
    }
    
    :global(body.dark-mode) .info-text {
        color: #999;
    }
</style>