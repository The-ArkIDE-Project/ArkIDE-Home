<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import Authentication from "../../resources/authentication.js";
    import Captcha from "$lib/Captcha.svelte";
    import { PUBLIC_API_URL } from "$env/static/public";
    
    const dispatch = createEventDispatcher();
    
    export let currentUsername = "";
    export const currentLang = "en"; // External reference only
    
    let showModal = false;
    let accounts = [];
    let editingIndex = -1;
    let showAddForm = false;
    let newUsername = "";
    let newPassword = "";
    let showPassword = false;
    let saving = false;
    let errorMessage = "";
    let captchaToken = null;
    let addFormCaptchaKey = 0; // Separate key for add/edit form
    let switchCaptchaKey = 0; // Separate key for switch dialog
    let switchingAccount = null; // Account being switched to
    let showSwitchCaptcha = false;
    let captchaUsedOnce = false; // NEW: Track if captcha was used
    
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
        
        // Check if current username needs to be added or updated
        if (currentUsername) {
            const existingIndex = accounts.findIndex(acc => acc.username === currentUsername);
            if (existingIndex === -1) {
                // Current account not in list - user needs to add it manually
                console.log("Current account not in saved accounts - user must add it manually with password");
            }
        }
        
        showModal = true;
        showAddForm = false;
        errorMessage = "";
    }
    
    // Close modal
    function close() {
        showModal = false;
        editingIndex = -1;
        showAddForm = false;
        showSwitchCaptcha = false;
        switchingAccount = null;
        newUsername = "";
        newPassword = "";
        showPassword = false;
        captchaToken = null;
        addFormCaptchaKey++;
        switchCaptchaKey++;
        errorMessage = "";
    }
    
    // Add new account
    async function addAccount() {
        if (!newUsername || !newPassword) {
            errorMessage = "Username and password are required";
            return;
        }
        
        if (!captchaToken) {
            errorMessage = "Please complete the captcha";
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
            // Direct API call with captcha
            const response = await fetch(`${PUBLIC_API_URL}/api/v1/users/passwordlogin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    captcha_token: captchaToken
                })
            });
            
            const data = await response.json();
            
            console.log("Add account response:", data); // Debug log
            
            if (data.token) {
                accounts = [...accounts, { username: newUsername, password: newPassword }];
                saveAccounts();
                newUsername = "";
                newPassword = "";
                showPassword = false;
                showAddForm = false;
                captchaToken = null;
                addFormCaptchaKey++;
                errorMessage = "";
                captchaUsedOnce = true; // NEW
            } else if (data.error) {
                errorMessage = `Login failed: ${data.error}`;
                captchaToken = null;
                addFormCaptchaKey++; // Reset captcha on error
            } else {
                errorMessage = "Invalid credentials. Please check and try again.";
                captchaToken = null;
                addFormCaptchaKey++; // Reset captcha on error
            }
        } catch (e) {
            console.error("Add account error:", e); // Debug log
            errorMessage = "Failed to verify credentials. Please try again.";
            captchaToken = null;
            addFormCaptchaKey++; // Reset captcha on error
        } finally {
            saving = false;
        }
    }
    
    // Start editing an account
    function startEdit(index) {
        editingIndex = index;
        showAddForm = false;
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
        
        if (!captchaToken) {
            errorMessage = "Please complete the captcha";
            return;
        }
        
        saving = true;
        errorMessage = "";
        
        try {
            // Direct API call with captcha
            const response = await fetch(`${PUBLIC_API_URL}/api/v1/users/passwordlogin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    captcha_token: captchaToken
                })
            });
            
            const data = await response.json();
            
            console.log("Edit account response:", data); // Debug log
            
            if (data.token) {
                accounts[editingIndex] = { username: newUsername, password: newPassword };
                saveAccounts();
                editingIndex = -1;
                newUsername = "";
                newPassword = "";
                showPassword = false;
                captchaToken = null;
                addFormCaptchaKey++;
                errorMessage = "";
                captchaUsedOnce = true; // NEW
            } else if (data.error) {
                errorMessage = `Login failed: ${data.error}`;
                captchaToken = null;
                addFormCaptchaKey++; // Reset captcha on error
            } else {
                errorMessage = "Invalid credentials. Please check and try again.";
                captchaToken = null;
                addFormCaptchaKey++; // Reset captcha on error
            }
        } catch (e) {
            console.error("Edit account error:", e); // Debug log
            errorMessage = "Failed to verify credentials. Please try again.";
            captchaToken = null;
            addFormCaptchaKey++; // Reset captcha on error
        } finally {
            saving = false;
        }
    }
    
    // Cancel editing
    function cancelEdit() {
        editingIndex = -1;
        showAddForm = false;
        newUsername = "";
        newPassword = "";
        showPassword = false;
        captchaToken = null;
        addFormCaptchaKey++; // Reset captcha
        errorMessage = "";
    }
    
    // Delete account
    function deleteAccount(index) {
        const account = accounts[index];
        
        if (confirm(`Remove ${account.username} from saved accounts?`)) {
            accounts = accounts.filter((_, i) => i !== index);
            saveAccounts();
        }
    }
    
    // Switch to account - show captcha dialog first
    function initiateSwitchAccount(account) {
        captchaToken = null;
        switchCaptchaKey++; // Instead of captchaKey++
        switchingAccount = account;
        showSwitchCaptcha = true;
        errorMessage = "";
    }

    // Actually perform the switch after captcha
    async function performSwitch() {
        if (!captchaToken) {
            errorMessage = "Please complete the captcha to switch accounts";
            return;
        }
        
        if (!switchingAccount) return;
        
        saving = true;
        errorMessage = "";
        
        try {
            const response = await fetch(`${PUBLIC_API_URL}/api/v1/users/passwordlogin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: switchingAccount.username,
                    password: switchingAccount.password,
                    captcha_token: captchaToken
                })
            });
            
            const data = await response.json();
            
            console.log("Switch account response:", data);
            
            if (data.token) {
                captchaUsedOnce = true; // NEW (though page will reload)
                // Store in localStorage
                localStorage.setItem("username", switchingAccount.username);
                localStorage.setItem("token", data.token);
                
                // Set cookie for cross-subdomain auth
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                
                document.cookie = `arkide_username=${encodeURIComponent(switchingAccount.username)}; domain=.arkide.site; path=/; expires=${expiryDate.toUTCString()}; SameSite=None; Secure`;
                document.cookie = `arkide_token=${encodeURIComponent(data.token)}; domain=.arkide.site; path=/; expires=${expiryDate.toUTCString()}; SameSite=None; Secure`;
                
                // Fire authentication event
                Authentication.fireAuthenticated(switchingAccount.username, data.token);
                
                // Reload page to apply new login
                location.reload();
            } else if (data.error) {
                errorMessage = `Failed to login as ${switchingAccount.username}: ${data.error}. The password may have changed - try editing and re-entering credentials.`;
                captchaToken = null;
                switchCaptchaKey++; // Instead of captchaKey++
                saving = false; // Important: reset saving state on error
            } else {
                errorMessage = `Failed to login as ${switchingAccount.username}. The password may have changed - try editing and re-entering credentials.`;
                captchaToken = null;
                switchCaptchaKey++;
                saving = false; // Important: reset saving state on error
            }
        } catch (e) {
            console.error("Switch account error:", e);
            errorMessage = `Failed to switch to ${switchingAccount.username}. Please try again.`;
            captchaToken = null;
            switchCaptchaKey++;
            saving = false; // Important: reset saving state on error
        }
    }
    
    // Cancel switch
    function cancelSwitch() {
        showSwitchCaptcha = false;
        switchingAccount = null;
        captchaToken = null;
        switchCaptchaKey++; // Instead of captchaKey++
        errorMessage = "";
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
                    <div class="accounts-header">
                        <h3>Saved Accounts</h3>
                        <button class="add-account-btn" on:click={() => { showAddForm = true; editingIndex = -1; }} disabled={saving}>
                            + Add Account
                        </button>
                    </div>
                    {#if currentUsername && !accounts.some(acc => acc.username === currentUsername)}
                        <div class="info-message">
                            💡 To enable switching back to your current account ({currentUsername}), click "+ Add Account" and enter your credentials.
                        </div>
                    {/if}
                    {#if accounts.length === 0}
                        <p class="empty-state">No saved accounts yet. Click "+ Add Account" to get started!</p>
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
                                        <button class="action-btn switch-btn" on:click={() => initiateSwitchAccount(account)} disabled={saving}>
                                            Switch
                                        </button>
                                        <button class="action-btn edit-btn" on:click={() => startEdit(index)} disabled={saving}>
                                            Edit
                                        </button>
                                        <button class="action-btn delete-btn" on:click={() => deleteAccount(index)} disabled={saving}>
                                            Delete
                                        </button>
                                    {:else}
                                        <span class="current-session-label">Active Session</span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                
                <!-- Add/Edit Account Form -->
                {#if showAddForm || editingIndex >= 0}
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
                        
                        {#if captchaUsedOnce}
                            <div class="captcha-warning">
                                ⚠️ Captcha may not work properly after first use. If it fails, please refresh the page.
                            </div>
                        {/if}
                        
                        {#key `add-${addFormCaptchaKey}`}
                            <Captcha on:update={(event) => {
                                captchaToken = event.detail;
                            }} />
                        {/key}
                        
                        <div class="form-actions">
                            {#if editingIndex >= 0}
                                <button class="form-btn save-btn" on:click={saveEdit} disabled={saving || !newUsername || !newPassword || !captchaToken}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button class="form-btn cancel-btn" on:click={cancelEdit} disabled={saving}>
                                    Cancel
                                </button>
                            {:else}
                                <button class="form-btn add-btn" on:click={addAccount} disabled={saving || !newUsername || !newPassword || !captchaToken}>
                                    {saving ? 'Adding...' : 'Add Account'}
                                </button>
                                <button class="form-btn cancel-btn" on:click={() => { showAddForm = false; newUsername = ''; newPassword = ''; captchaToken = null; addFormCaptchaKey++; errorMessage = ''; }} disabled={saving}>
                                    Cancel
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}
                
                <!-- Switch Account Captcha Dialog -->
                {#if showSwitchCaptcha && switchingAccount}
                    <div class="account-form switch-captcha-dialog">
                        <h3>Switch to {switchingAccount.username}</h3>
                        <p style="margin: 8px 0; color: #666;">Complete the captcha to switch accounts</p>
                        
                        {#if captchaUsedOnce}
                            <div class="captcha-warning">
                                ⚠️ Captcha may not work properly after first use. If it fails, please refresh the page.
                            </div>
                        {/if}
                        
                        {#key `switch-${switchCaptchaKey}`}
                            <Captcha on:update={(event) => {
                                captchaToken = event.detail;
                            }} />
                        {/key}
                        
                        <div class="form-actions">
                            <button class="form-btn save-btn" on:click={performSwitch} disabled={saving || !captchaToken}>
                                {saving ? 'Switching...' : 'Switch Account'}
                            </button>
                            <button class="form-btn cancel-btn" on:click={cancelSwitch} disabled={saving}>
                                Cancel
                            </button>
                        </div>
                    </div>
                {/if}
                
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
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

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
    
    .accounts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .accounts-list h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
    }
    
    :global(body.dark-mode) .accounts-list h3 {
        color: white;
    }
    
    .add-account-btn {
        background: #0011ff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .add-account-btn:hover:not(:disabled) {
        background: #0009cc;
    }
    
    .add-account-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
    
    .current-session-label {
        font-size: 0.85rem;
        color: #666;
        font-style: italic;
    }
    
    :global(body.dark-mode) .current-session-label {
        color: #999;
    }
    
    .switch-captcha-dialog {
        border: 2px solid #0011ff;
    }
    
    .switch-captcha-dialog p {
        font-size: 0.9rem;
    }
    
    :global(body.dark-mode) .switch-captcha-dialog p {
        color: #999;
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
    .info-message {
        background: rgba(0, 119, 255, 0.1);
        border: 1px solid rgba(0, 119, 255, 0.3);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        color: #0077ff;
        font-size: 0.9rem;
    }

    :global(body.dark-mode) .info-message {
        background: rgba(0, 119, 255, 0.15);
        color: #66b3ff;
    }
    .captcha-warning {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.3);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 12px;
        color: #f57c00;
        font-size: 0.85rem;
        text-align: center;
    }

    :global(body.dark-mode) .captcha-warning {
        background: rgba(255, 152, 0, 0.15);
        color: #ffb74d;
    }
</style>