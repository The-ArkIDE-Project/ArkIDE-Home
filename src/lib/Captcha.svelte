<script>
  import { browser } from "$app/environment";
  import { onMount, createEventDispatcher } from "svelte";
  import { PUBLIC_CAPTCHA_ENABLED, PUBLIC_CAPTCHA_SITEKEY } from "$env/static/public";

  const dispatch = createEventDispatcher();
  let mockCompleted = false;
  let mockExpired = false;

  const mockComplete = () => {
    mockCompleted = true;
    dispatch("update", "captcha_disabled");
  };
  const mockExpire = () => {
    mockExpired = true;
    dispatch("update", false);
  };
  const mockError = () => {
    mockCompleted = false;
    mockExpired = false;
    dispatch("update", false);
  };

onMount(() => {
    if (String(PUBLIC_CAPTCHA_ENABLED) === "false") return;

    window.on_captcha_complete = (token) => dispatch("update", token);
    window.on_captcha_expired = () => dispatch("update", false);
    window.on_captcha_error = () => dispatch("update", false);

    const renderCaptcha = () => {
        if (!window.hcaptcha) {
            setTimeout(renderCaptcha, 100);
            return;
        }
        const elements = document.querySelectorAll(".h-captcha");
        elements.forEach(el => {
            if (!el.getAttribute("data-hcaptcha-widget-id")) {
                hcaptcha.render(el, {
                    sitekey: PUBLIC_CAPTCHA_SITEKEY,
                    callback: "on_captcha_complete",
                    "expired-callback": "on_captcha_expired",
                    "error-callback": "on_captcha_error"
                });
            }
        });
    };

    setTimeout(renderCaptcha, 100);
});
</script>

<svelte:head>
  {#if String(PUBLIC_CAPTCHA_ENABLED) !== "false"}
    <script
      src="https://js.hcaptcha.com/1/api.js"
      async
      defer
    ></script>
  {/if}
</svelte:head>

{#if String(PUBLIC_CAPTCHA_ENABLED) === "false"}
  <div style="border: 1px solid black; padding: 8px;">
    <span style="font-size: 24px">
      {#if mockExpired}
        You took too long
      {:else if mockCompleted}
        ✅ Success!
      {:else}
        <button style="border: 1px solid black; padding: 14px;" on:click={mockComplete}>X</button>
        I'm not a robot
      {/if}
    </span>
    <br /><br />
    <button on:click={mockExpire}>Expire</button>
    <button on:click={mockError}>Error (Reset)</button>
    <br />
    Emulator, Captcha is disabled in .env, see PUBLIC_CAPTCHA_ENABLED
  </div>
{:else}
<div class="h-captcha" />
{/if}