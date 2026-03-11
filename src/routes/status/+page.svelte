<script lang="js">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    goto('https://status.arkide.site');
  });
</script>

<p>Redirecting you now...</p>
