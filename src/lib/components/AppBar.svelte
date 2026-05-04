<script>
  import { onDestroy } from "svelte";
  import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
  const appWindow = isTauri ? getCurrentWindow() : null;
  let isMaximized = false;
  let windowResizeUnListen;

  async function tauriResizeEvent() {
    if (!isTauri || !appWindow) return;
    await appWindow.setMinSize(new LogicalSize(900, 640));
    windowResizeUnListen = await appWindow.onResized(async () => {
      isMaximized = await appWindow.isMaximized();
    });
  }

  if (isTauri) {
    tauriResizeEvent();
  }

  onDestroy(async () => {
    await windowResizeUnListen?.();
  });
</script>

<div class="appbar flex items-center h-[var(--navbar-height)] fixed w-full top-0 start-0 z-[1000] px-3">
  <div class="appbar-inner flex items-center w-full h-full">
    <div class="drag flex items-center gap-2.5 flex-1 h-full px-2">
      <div class="logo-mark">
        <img src="favicon.png" alt="NS" class="h-3.5 w-3.5" />
      </div>
      <div class="flex items-center gap-1">
        <span class="appbar-title-main">Stream</span>
        <span class="appbar-title-accent">Player</span>
      </div>
    </div>

    <div class="flex justify-end window-controls no-drag h-full items-center gap-0.5 pr-1">
      <button
        type="button"
        class="no-drag titlebar-btn"
        onclick={() => appWindow.minimize()}
        title="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        class="no-drag titlebar-btn"
        onclick={() => appWindow.toggleMaximize()}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          {#if isMaximized}
            <path d="M2 0H9V7M0 2H7V9H0V2Z" stroke="currentColor" stroke-width="1.1" fill="none"/>
          {:else}
            <rect x="0.5" y="0.5" width="8" height="8" stroke="currentColor" stroke-width="1.1" />
          {/if}
        </svg>
      </button>

      <button
        type="button"
        class="no-drag titlebar-btn close-btn"
        onclick={() => appWindow.close()}
        title="Close"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1 1L8 8M8 1L1 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  .appbar {
    background: transparent;
  }

  .appbar-inner {
    background: rgba(var(--m3-scheme-surface-container) / 0.55);
    backdrop-filter: blur(40px) saturate(1.5);
    -webkit-backdrop-filter: blur(40px) saturate(1.5);
    border-bottom: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.35);
    border-radius: 0;
    box-shadow: 0 1px 0 rgba(255,255,255,0.03);
  }

  .drag { -webkit-app-region: drag; }
  .no-drag { -webkit-app-region: no-drag; }

  .logo-mark {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(var(--m3-scheme-primary) / 0.25), rgba(var(--m3-scheme-primary-container) / 0.1));
    border: 1px solid rgba(var(--m3-scheme-primary) / 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 12px rgba(var(--m3-scheme-primary) / 0.15);
  }

  .appbar-title-main {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgb(var(--m3-scheme-on-surface));
  }

  .appbar-title-accent {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgb(var(--m3-scheme-primary));
  }

  .titlebar-btn {
    width: 40px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.8);
    border-radius: 6px;
    border: none;
    background: transparent;
    transition: background 0.15s ease, color 0.15s ease;
    cursor: pointer;
  }

  .titlebar-btn:hover {
    background: rgba(var(--m3-scheme-surface-container-high) / 0.7);
    color: rgb(var(--m3-scheme-on-surface));
  }

  .close-btn:hover {
    background: rgba(220, 60, 60, 0.85);
    color: white;
  }
</style>
