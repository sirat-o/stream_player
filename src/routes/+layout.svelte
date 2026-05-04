<script>
  import "../app.css";
  import AppBar from "$lib/components/AppBar.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";
  import { applyTheme, getSettings } from "$lib/settingsStore.js";
  import { onMount, onDestroy } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { Menu, PredefinedMenuItem } from "@tauri-apps/api/menu";

  const isTauri = typeof window !== "undefined" && !!window["__TAURI_INTERNALS__"];

  const getFullscreenElement = () => {
    const doc = /** @type {any} */ (document);
    return (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  };

  const fullscreenchanged = async () => {
    const isFullscreen = !!getFullscreenElement();
    document.body.classList.toggle("is-fullscreen", isFullscreen);
    if (!isTauri) return;
    const appWindow = getCurrentWindow();
    try {
      await appWindow.setFullscreen(isFullscreen);
      await appWindow.setShadow(!isFullscreen);
    } catch (err) {
      console.warn("Failed to sync fullscreen state with app window", err);
    }
  };

  const disableUserInteraction = () => {
    document.addEventListener("keydown", function (event) {
      if (
        event.key === "F5" ||
        (event.ctrlKey && event.key === "r") ||
        (event.metaKey && event.key === "r")
      ) {
        event.preventDefault();
      }
    });
  };

  if (!import.meta.env.DEV) {
    disableUserInteraction();
  }

  onMount(async () => {
    applyTheme(getSettings().theme);
    document.addEventListener("fullscreenchange", fullscreenchanged);
    document.addEventListener("webkitfullscreenchange", fullscreenchanged);
    document.addEventListener("mozfullscreenchange", fullscreenchanged);
    document.addEventListener("MSFullscreenChange", fullscreenchanged);

    if (isTauri) {
      const menuItems = await Promise.all([
        PredefinedMenuItem.new({ text: "Copy", item: "Copy" }),
        PredefinedMenuItem.new({ text: "Cut", item: "Cut" }),
        PredefinedMenuItem.new({ text: "Paste", item: "Paste" }),
        PredefinedMenuItem.new({ text: "Select All", item: "SelectAll" }),
      ]);

      const menu = await Menu.new({ items: menuItems });

      document.addEventListener("contextmenu", async (event) => {
        if (import.meta.env.DEV) return;
        event.preventDefault();
        const target = /** @type {HTMLElement} */ (event.target);
        if (["TEXTAREA", "INPUT"].includes(target.tagName)) {
          await menu.popup();
        }
      });

      requestIdleCallback(() => {
        invoke("show_main_window");
      });
    }
  });

  onDestroy(async () => {
    document.removeEventListener("fullscreenchange", fullscreenchanged);
    document.removeEventListener("webkitfullscreenchange", fullscreenchanged);
    document.removeEventListener("mozfullscreenchange", fullscreenchanged);
    document.removeEventListener("MSFullscreenChange", fullscreenchanged);
  });
</script>

<AppBar />

<div id="app-container" class="pt-[var(--navbar-height)]">
  <Sidebar />
  <main id="main-content">
    <div id="scroll-area">
      <slot />
    </div>
  </main>
  <ToastContainer />
</div>

<style>
  :global(.is-fullscreen) #app-container {
    padding-top: 0;
  }
  :global(.is-fullscreen) :global(.sidebar),
  :global(.is-fullscreen) :global(.appbar) {
    display: none;
  }
</style>
