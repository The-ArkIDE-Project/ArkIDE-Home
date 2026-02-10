<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    const dispatch = createEventDispatcher();
    
    export let projectId = "";
    export let projectTitle = "";
    export let reportType = "project"; // "project" or "user"
    export let targetUsername = ""; // for user reports
    
    let showModal = false;
    let reportText = "";
    let isSubmitting = false;
    let submitSuccess = false;
    let submitError = "";
    
    const MAX_REPORT_LENGTH = 500;
    
    // Open modal
    export function open() {
        showModal = true;
        reportText = "";
        isSubmitting = false;
        submitSuccess = false;
        submitError = "";
    }
    
    // Close modal
    function close() {
        showModal = false;
        reportText = "";
        isSubmitting = false;
        submitSuccess = false;
        submitError = "";
    }
    
    // Get user token from localStorage
    function getUserToken() {
        return localStorage.getItem('token') || '';
    }
    
    // Submit report
    async function submitReport() {
        if (!reportText.trim()) {
            submitError = "Please enter a reason for your report";
            return;
        }
        
        if (reportText.length > MAX_REPORT_LENGTH) {
            submitError = `Report must be ${MAX_REPORT_LENGTH} characters or less`;
            return;
        }
        
        const token = getUserToken();
        if (!token) {
            submitError = "You must be logged in to submit a report";
            return;
        }
        
        isSubmitting = true;
        submitError = "";
        
        try {
            const response = await fetch('https://arkideapi.arc360hub.com/api/v1/reports/sendReport', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    report: reportText.trim(),
                    target: reportType === "project" ? projectId : targetUsername,
                    type: reportType
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                submitSuccess = true;
                setTimeout(() => {
                    close();
                }, 2000);
            } else {
                submitError = data.error || "Failed to submit report. Please try again.";
            }
        } catch (err) {
            console.error('Failed to submit report:', err);
            submitError = "Network error. Please check your connection and try again.";
        } finally {
            isSubmitting = false;
        }
    }
    
    // Handle character count
    $: remainingChars = MAX_REPORT_LENGTH - reportText.length;
    $: charCountColor = remainingChars < 50 ? '#ff6b6b' : remainingChars < 100 ? '#ffa94d' : '#888';
</script>

{#if showModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={close} transition:fade={{ duration: 200 }}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="modal-content" on:click|stopPropagation transition:scale={{ duration: 200, easing: quintOut }}>
            <div class="modal-header">
                <h2 class="modal-title">Report {reportType === "project" ? "Project" : "User"}</h2>
                <button class="close-button" on:click={close} disabled={isSubmitting}>
                    <img src="/x.svg" alt="Close" class="close-icon" />
                </button>
            </div>
            
            <div class="modal-body">
                {#if submitSuccess}
                    <div class="success-message">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="22" stroke="#4c3bff" stroke-width="4"/>
                            <path d="M14 24L20 30L34 16" stroke="#4c3bff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h3>Report Submitted</h3>
                        <p>Thank you for helping keep ArkIDE safe. Our moderation team will review this report.</p>
                    </div>
                {:else}
                    <div class="report-content">
                        <div class="info-section">
                            <p class="info-text">
                                {#if reportType === "project"}
                                    You are reporting the project: <strong>{projectTitle}</strong>
                                {:else}
                                    You are reporting the user: <strong>{targetUsername}</strong>
                                {/if}
                            </p>
                            <p class="warning-text">
                                ⚠️ False reports may result in action being taken on your account.
                            </p>
                        </div>
                        
                        <div class="textarea-container">
                            <label for="report-reason">Reason for report</label>
                            <textarea 
                                id="report-reason"
                                bind:value={reportText}
                                placeholder="Please describe why you are reporting this {reportType}. Include specific details about what violates ArkIDE's community guidelines..."
                                maxlength={MAX_REPORT_LENGTH}
                                disabled={isSubmitting}
                                class="report-textarea"
                            ></textarea>
                            <div class="char-count" style="color: {charCountColor}">
                                {remainingChars} characters remaining
                            </div>
                        </div>
                        
                        {#if submitError}
                            <div class="error-message">
                                {submitError}
                            </div>
                        {/if}
                        
                        <div class="button-group">
                            <button 
                                class="cancel-btn" 
                                on:click={close}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                class="submit-btn" 
                                on:click={submitReport}
                                disabled={isSubmitting || !reportText.trim()}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                {/if}
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
        max-width: 520px;
        max-height: 90vh;
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
        background: #ff4757;
        color: white;
        position: relative;
    }
    
    .modal-title {
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

    .close-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .close-icon {
        width: 16px;
        height: 16px;
        display: block;
        transform: rotate(45deg);
    }
    
    .close-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }
    
    .report-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .info-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .info-text {
        color: #e0e0e0;
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    .info-text strong {
        color: #fff;
        font-weight: 600;
    }
    
    .warning-text {
        color: #ffa94d;
        margin: 0;
        font-size: 0.9rem;
        padding: 8px 12px;
        background: rgba(255, 169, 77, 0.1);
        border-left: 3px solid #ffa94d;
        border-radius: 4px;
    }
    
    .textarea-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .textarea-container label {
        color: #b0b0b0;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .report-textarea {
        width: 100%;
        min-height: 150px;
        padding: 12px;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 0.9rem;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }
    
    .report-textarea:focus {
        outline: none;
        border-color: #ff4757;
    }
    
    .report-textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .report-textarea::placeholder {
        color: #666;
    }
    
    .char-count {
        font-size: 0.85rem;
        text-align: right;
        transition: color 0.2s;
    }
    
    .error-message {
        color: #ff6b6b;
        background: rgba(255, 107, 107, 0.1);
        padding: 12px;
        border-radius: 4px;
        border-left: 3px solid #ff6b6b;
        font-size: 0.9rem;
    }
    
    .success-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        gap: 16px;
    }
    
    .success-message h3 {
        color: #4c3bff;
        margin: 0;
        font-size: 1.5rem;
    }
    
    .success-message p {
        color: #b0b0b0;
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    .button-group {
        display: flex;
        gap: 12px;
        margin-top: 8px;
    }
    
    .cancel-btn,
    .submit-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
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
    
    .cancel-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .submit-btn {
        background: #ff4757;
        color: white;
    }
    
    .submit-btn:hover:not(:disabled) {
        background: #ff3344;
    }
    
    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Scrollbar styling for dark theme */
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
</style>