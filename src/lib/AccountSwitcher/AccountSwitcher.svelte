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
    let addFormCaptchaShownCount = 0; // NEW: Track how many times add form captcha shown
    let switchCaptchaShownCount = 0; // NEW: Track how many times switch captcha shown
    
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
        addFormCaptchaShownCount++; // NEW: Increment when showing edit form
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
        switchCaptchaKey++;
        switchingAccount = account;
        showSwitchCaptcha = true;
        switchCaptchaShownCount++; // NEW: Increment when showing
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
                <button class="close-button" on:click={close}>
                    <img src="/x.svg" alt="Close" class="close-icon" />
                </button>
            </div>
            
            <div class="modal-body">
                {#if errorMessage}
                    <div class="error-message">{errorMessage}</div>
                {/if}
                
                <!-- Saved Accounts List -->
                <div class="accounts-list">
                    <div class="accounts-header">
                        <h3>Saved Accounts</h3>
                        <button class="add-account-btn" on:click={() => { 
                            showAddForm = true; 
                            editingIndex = -1; 
                            addFormCaptchaShownCount++; // Increment when showing
                        }} disabled={saving}>
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
                        
                        {#if addFormCaptchaShownCount > 1}
                            <div class="captcha-warning">
                                ⚠️ Captcha may not work after being shown multiple times. Please refresh the page if it doesn't load.
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
                        
                        {#if switchCaptchaShownCount > 1}
                            <div class="captcha-warning">
                                ⚠️ Captcha may not work after being shown multiple times. Please refresh the page if it doesn't load.
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
        background: rgba(0, 0, 0, 0.384);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .modal-content {
        background: rgba(17, 17, 17, 0.788);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        width: 90%;
        max-width: 600px;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: rgba(255, 255, 255, 0.15) 4px solid;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }
    
    .modal-header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px 20px;
        background: #4c3bff;
        color: white;
        position: relative;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        text-align: center;
    }
    
    .close-button {
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 96px;
        transition: background 0.2s;
        position: absolute;
        right: 12px;
        user-select: none;
        padding: 0;
        background: rgba(255, 255, 255, 0.1);
    }
    
    .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }
    
    .error-message {
        background: rgba(255, 107, 107, 0.1);
        padding: 12px;
        border-radius: 4px;
        border-left: 3px solid #ff6b6b;
        font-size: 0.9rem;
        color: #ff6b6b;
        margin-bottom: 16px;
    }
    
    .accounts-list {
        margin-bottom: 24px;
    }
    
    .accounts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .accounts-list h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #e0e0e0;
        font-weight: 500;
    }
    
    .add-account-btn {
        background: #4c3bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .add-account-btn:hover:not(:disabled) {
        background: #3d2ecc;
    }
    
    .add-account-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .empty-state {
        text-align: center;
        color: #888;
        padding: 20px;
        font-style: italic;
        font-size: 0.95rem;
    }
    
    .info-message {
        background: rgba(76, 59, 255, 0.1);
        border: 1px solid rgba(76, 59, 255, 0.3);
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 12px;
        color: #9580ff;
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .account-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        margin-bottom: 8px;
        transition: all 0.2s;
    }
    
    .account-item:hover {
        background: #222;
        border-color: #555;
    }
    
    .account-item.current {
        background: rgba(76, 59, 255, 0.15);
        border-color: #4c3bff;
    }
    
    .account-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .account-pfp {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
    }
    
    .account-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .account-username {
        font-weight: 600;
        color: #e0e0e0;
        font-size: 0.95rem;
    }
    
    .current-badge {
        font-size: 0.75rem;
        color: #4c3bff;
        font-weight: 600;
    }
    
    .account-actions {
        display: flex;
        gap: 6px;
    }
    
    .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .switch-btn {
        background: #4c3bff;
        color: white;
    }
    
    .switch-btn:hover:not(:disabled) {
        background: #3d2ecc;
    }
    
    .edit-btn {
        background: transparent;
        color: #999;
        border: 1px solid #444;
    }
    
    .edit-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        border-color: #666;
        color: #ccc;
    }
    
    .delete-btn {
        background: transparent;
        color: #ff6b6b;
        border: 1px solid rgba(255, 107, 107, 0.3);
    }
    
    .delete-btn:hover:not(:disabled) {
        background: rgba(255, 107, 107, 0.1);
        border-color: rgba(255, 107, 107, 0.5);
    }
    
    .current-session-label {
        font-size: 0.85rem;
        color: #888;
        font-style: italic;
    }
    
    .account-form {
        background: #1a1a1a;
        border-radius: 4px;
        padding: 16px;
        border: 1px solid #444;
        margin-bottom: 16px;
    }
    
    .switch-captcha-dialog {
        border-color: #4c3bff;
    }
    
    .switch-captcha-dialog p {
        color: #b0b0b0;
        margin: 8px 0 16px 0;
    }
    
    .account-form h3 {
        margin: 0 0 16px 0;
        font-size: 1.1rem;
        color: #e0e0e0;
        font-weight: 500;
    }
    
    .form-group {
        margin-bottom: 14px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        color: #b0b0b0;
    }
    
    .form-group input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #444;
        border-radius: 4px;
        font-size: 0.9rem;
        background: #0d0d0d;
        color: #e0e0e0;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }
    
    .form-group input:focus {
        outline: none;
        border-color: #4c3bff;
    }
    
    .form-group input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .form-group input::placeholder {
        color: #666;
    }
    
    .password-input-wrapper {
        position: relative;
    }
    
    .password-input-wrapper input {
        padding-right: 40px;
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
        opacity: 0.6;
        transition: opacity 0.2s;
    }
    
    .password-toggle:hover {
        opacity: 1;
    }
    
    .password-toggle img {
        width: 20px;
        height: 20px;
        filter: invert(1);
    }
    
    .captcha-warning {
        background: rgba(255, 169, 77, 0.1);
        border: 1px solid rgba(255, 169, 77, 0.3);
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 12px;
        color: #ffa94d;
        font-size: 0.85rem;
        text-align: center;
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
        border-radius: 4px;
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .form-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .add-btn, .save-btn {
        background: #4c3bff;
        color: white;
    }
    
    .add-btn:hover:not(:disabled), .save-btn:hover:not(:disabled) {
        background: #3d2ecc;
    }
    
    .cancel-btn {
        background: transparent;
        color: #999;
        border: 1px solid #444;
    }
    
    .cancel-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        border-color: #666;
        color: #ccc;
    }
    
    .modal-footer {
        padding-top: 16px;
        border-top: 1px solid #444;
        margin-top: 16px;
    }
    
    .info-text {
        font-size: 0.85rem;
        color: #888;
        margin: 0;
        text-align: center;
        line-height: 1.5;
    }
    
    /* Scrollbar styling */
    .modal-body::-webkit-scrollbar {
        width: 8px;
    }
    
    .modal-body::-webkit-scrollbar-track {
        background: #1a1a1a;
    }
    
    .modal-body::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 4px;
    }
    
    .modal-body::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
    .close-icon {
    width: 16px;
    height: 16px;
    display: block;
    transform: rotate(45deg);
    }
</style>