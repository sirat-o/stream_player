<script>
  import Icon from "@iconify/svelte";

  /** @type {{
    icon?: any,
    headline?: string,
    class?: string,
    buttons?: any,
    children: any,
    open: boolean,
    closedby?: "none" | "any" | "closerequest",
    closeOnEsc?: boolean,
    onEsc?: Function,
    closeOnClick?: boolean,
    onClick?: Function,
    style?: string
  }} */
  let {
    icon,
    headline,
    class: className = "",
    buttons,
    children,
    open = $bindable(),
    closedby = "any",
    ...extra
  } = $props();

  let dialog = $state();
  $effect(() => {
    if (!dialog) return;
    const isVideoDialog = className.includes("video-player-dialog");
    if (open) {
      if (!dialog.open) {
        dialog.show();
      }
      document.body.classList.add("modal-open");
      document.body.classList.toggle("video-modal-open", isVideoDialog);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.classList.remove("modal-open");
      document.body.classList.remove("video-modal-open");
    }
  });
</script>

<dialog
  class={`glass-panel ${className}`}
  ontoggle={(e) => {
    open = e.newState == "open";
  }}
  oncancel={(e) => {
    if (e.target != e.currentTarget) return;
    if (extra.closeOnEsc && extra.onEsc) {
      extra.onEsc();
    }
  }}
  onclick={(e) => {
    if (e.target != e.currentTarget) return;
    if (extra.closeOnClick && extra.onClick) {
      extra.onClick();
    }
  }}
  bind:this={dialog}
  closedby={closedby}
  role="alertdialog"
  {...extra}
>
  <div class="flex flex-col h-full w-full">
    {#if icon}
      <div class="pt-6 px-6 flex justify-center">
        <Icon {icon} class="text-3xl text-primary" />
      </div>
    {/if}
    {#if headline}
      <div class="pt-6 px-8">
        <h2 class="text-xl font-black text-white tracking-tight {icon ? 'text-center' : ''}">{headline}</h2>
      </div>
    {/if}
    <div class="flex-1 overflow-auto">
      {@render children()}
    </div>
    {#if buttons}
      <form method="dialog" class="flex justify-end gap-3 p-6 border-t border-white/5">
        {@render buttons()}
      </form>
    {/if}
  </div>
</dialog>

<style>
  dialog {
    z-index: 5000;
    background: rgba(var(--m3-scheme-surface) / 0.94) !important;
    backdrop-filter: blur(34px);
    border: 1px solid rgba(var(--m3-scheme-outline) / 0.14) !important;
    border-radius: 2rem;
    min-width: 20rem;
    max-width: 95vw;
    max-height: 95vh;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 35px 90px rgba(2, 6, 23, 0.18);
  }

  dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    margin: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
      visibility 0.28s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    transform: translate(-50%, -50%) scale(0.97);
  }

  dialog[open] {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translate(-50%, -50%) scale(1);
  }

  dialog::backdrop {
    background-color: rgba(var(--m3-scheme-background) / 0.16);
    backdrop-filter: blur(8px);
    transition: opacity 0.28s ease;
  }

  :global(dialog.video-player-dialog > div) {
    overflow: hidden;
    background: #000;
    border-radius: 1.35rem;
  }

  dialog.video-player-dialog {
    --video-width: 1280;
    --video-height: 720;
    width: min(
      calc((100vh - var(--navbar-height) - 4rem) * (var(--video-width) / var(--video-height))),
      calc(100vw - 3rem)
    );
    height: min(
      calc((100vw - 3rem) * (var(--video-height) / var(--video-width))),
      calc(100vh - var(--navbar-height) - 4rem)
    );
    min-width: min(42rem, calc(100vw - 2rem));
    min-height: min(23.625rem, calc(100vh - var(--navbar-height) - 2rem));
    max-width: calc(100vw - 3rem);
    max-height: calc(100vh - var(--navbar-height) - 4rem);
    top: calc(50% + (var(--navbar-height) / 2));
    padding: 0;
    border-radius: 1.35rem;
    border: 0 !important;
    background: #000 !important;
    backdrop-filter: none;
    box-shadow: none;
    overflow: hidden;
  }

  dialog.video-player-dialog::backdrop {
    background: transparent;
    backdrop-filter: none;
  }

  @media (max-width: 720px) {
    dialog.video-player-dialog {
      min-width: calc(100vw - 1rem);
      width: calc(100vw - 1rem);
      height: min(56.25vw, calc(100vh - var(--navbar-height) - 2rem));
      max-height: calc(100vh - var(--navbar-height) - 2rem);
      padding: 0;
      border-radius: 1rem;
    }

    :global(dialog.video-player-dialog > div),
    :global(.video-player-frame),
    :global(.youtube-theme.shaka-video-container) {
      border-radius: 1rem;
    }
  }
</style>
