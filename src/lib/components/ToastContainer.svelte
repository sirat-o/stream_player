<script>
  import { toastStack } from "$lib/toast.svelte.js";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
</script>

<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] flex flex-col items-center gap-2.5 pointer-events-none">
  {#each toastStack as toast (toast.id)}
    <div
      in:fly={{ y: 16, duration: 280, easing: (t) => 1 - Math.pow(1 - t, 3) }}
      out:fade={{ duration: 180 }}
      animate:flip={{ duration: 250 }}
      class="toast-pill pointer-events-auto"
    >
      <div class="toast-dot"></div>
      <span class="toast-msg">{toast.message}</span>
    </div>
  {/each}
</div>

<style>
  .toast-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border-radius: 999px;
    background: rgba(var(--m3-scheme-surface-container-high) / 0.88);
    backdrop-filter: blur(32px) saturate(1.5);
    -webkit-backdrop-filter: blur(32px) saturate(1.5);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.45);
    box-shadow: 0 8px 28px rgba(0,0,10,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
    white-space: nowrap;
  }

  .toast-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgb(var(--m3-scheme-primary));
    box-shadow: 0 0 8px rgba(var(--m3-scheme-primary) / 0.6);
    animation: pulse 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  .toast-msg {
    font-size: 12.5px;
    font-weight: 700;
    color: rgb(var(--m3-scheme-on-surface));
    letter-spacing: 0.005em;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
</style>
