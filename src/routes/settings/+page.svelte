<script>
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import settingsIcon from "@iconify-icons/mdi/cog-outline";
  import themeLightDarkIcon from "@iconify-icons/mdi/theme-light-dark";
  import volumeMuteIcon from "@iconify-icons/mdi/volume-mute";
  import { getSettings, saveSettings } from "$lib/settingsStore.js";
  import { showToast } from "$lib/toast.svelte.js";

  let theme = $state("dark");
  let playMuted = $state(false);

  const loadSettings = () => {
    const saved = getSettings();
    theme = saved.theme;
    playMuted = saved.playMuted;
  };

  const persistSettings = () => {
    saveSettings({ theme, playMuted });
    showToast("Settings saved.");
  };

  const setTheme = (value) => {
    theme = value;
    persistSettings();
  };

  const togglePlayMuted = () => {
    playMuted = !playMuted;
    persistSettings();
  };

  onMount(loadSettings);
</script>

<div class="space-y-8 animate-fade-in">
  <header>
    <div class="page-badge">App Settings</div>
    <h1 class="page-title">Settings</h1>
  </header>

  <section class="settings-card max-w-2xl">
    <div class="settings-card-header">
      <div class="section-icon">
        <Icon icon={settingsIcon} class="text-secondary text-[18px]" />
      </div>
      <div>
        <h2 class="settings-section-title">General</h2>
        <p class="settings-section-sub">Saved locally on this device</p>
      </div>
    </div>

    <div class="settings-items">
      <!-- Theme -->
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-icon-wrap">
            <Icon icon={themeLightDarkIcon} class="text-secondary text-[18px]" />
          </div>
          <div>
            <h3 class="setting-name">Theme</h3>
            <p class="setting-desc">Choose your display mode</p>
          </div>
        </div>
        <div class="theme-toggle">
          <button
            type="button"
            class="theme-btn {theme === 'dark' ? 'theme-btn-active' : ''}"
            onclick={() => setTheme('dark')}
          >
            Dark
          </button>
          <button
            type="button"
            class="theme-btn {theme === 'light' ? 'theme-btn-active' : ''}"
            onclick={() => setTheme('light')}
          >
            Light
          </button>
        </div>
      </div>

      <!-- Play Muted -->
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-icon-wrap">
            <Icon icon={volumeMuteIcon} class="text-secondary text-[18px]" />
          </div>
          <div>
            <h3 class="setting-name">Play video as muted</h3>
            <p class="setting-desc">Start all streams without audio</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={playMuted}
          class="toggle-switch {playMuted ? 'toggle-on' : 'toggle-off'}"
          onclick={togglePlayMuted}
        >
          <span class="toggle-thumb {playMuted ? 'thumb-on' : 'thumb-off'}"></span>
        </button>
      </div>
    </div>
  </section>
</div>

<style>
  .page-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(var(--m3-scheme-secondary) / 0.1);
    border: 1px solid rgba(var(--m3-scheme-secondary) / 0.2);
    color: rgb(var(--m3-scheme-secondary));
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .page-title {
    font-size: clamp(1.7rem, 3.5vw, 2.4rem);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: rgb(var(--m3-scheme-on-surface));
    margin: 0;
    line-height: 1;
  }

  .settings-card {
    background: rgba(var(--m3-scheme-surface-container-low) / 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.45);
    border-radius: 1.4rem;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,10,0.12), inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .settings-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 1.4rem 1.6rem;
    border-bottom: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.3);
  }

  .section-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(var(--m3-scheme-secondary) / 0.1);
    border: 1px solid rgba(var(--m3-scheme-secondary) / 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .settings-section-title {
    font-size: 15px;
    font-weight: 800;
    color: rgb(var(--m3-scheme-on-surface));
    letter-spacing: -0.01em;
    margin: 0;
  }

  .settings-section-sub {
    font-size: 11px;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.65);
    margin: 3px 0 0;
  }

  .settings-items { padding: 0.5rem 0; }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.6rem;
    transition: background 0.15s ease;
  }

  .setting-row + .setting-row {
    border-top: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.2);
  }

  .setting-row:hover {
    background: rgba(var(--m3-scheme-surface-container) / 0.4);
  }

  .setting-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .setting-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(var(--m3-scheme-surface-container-highest) / 0.6);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .setting-name {
    font-size: 14px;
    font-weight: 700;
    color: rgb(var(--m3-scheme-on-surface));
    margin: 0;
  }

  .setting-desc {
    font-size: 11px;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.6);
    margin: 2px 0 0;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px;
    border-radius: 10px;
    background: rgba(var(--m3-scheme-surface-container-lowest) / 0.9);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.45);
  }

  .theme-btn {
    padding: 6px 16px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    border: none;
    background: transparent;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.7);
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  }

  .theme-btn-active {
    background: rgb(var(--m3-scheme-primary));
    color: white;
    box-shadow: 0 2px 10px rgba(var(--m3-scheme-primary) / 0.3);
  }

  .toggle-switch {
    position: relative;
    width: 50px;
    height: 28px;
    border-radius: 999px;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
    flex-shrink: 0;
  }

  .toggle-on {
    background: rgb(var(--m3-scheme-primary));
    border-color: rgba(var(--m3-scheme-primary) / 0.3);
    box-shadow: 0 0 12px rgba(var(--m3-scheme-primary) / 0.3);
  }

  .toggle-off {
    background: rgba(var(--m3-scheme-surface-container-highest) / 0.9);
    border-color: rgba(var(--m3-scheme-outline-variant) / 0.5);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    transition: left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .thumb-on { left: 26px; }
  .thumb-off { left: 3px; }
</style>
