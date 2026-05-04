<script>
  import { page } from "$app/stores";
  import Icon from "@iconify/svelte";
  import libraryIcon from "@iconify-icons/mdi/library-shelves";
  import playlistIcon from "@iconify-icons/mdi/playlist-play";
  import workspaceIcon from "@iconify-icons/mdi/view-dashboard-outline";
  import settingsIcon from "@iconify-icons/mdi/cog-outline";

  const navItems = [
    { name: "Workspace", href: "/", icon: workspaceIcon },
    { name: "Library", href: "/library", icon: libraryIcon },
    { name: "Playlist", href: "/playlist", icon: playlistIcon },
  ];

  const bottomNavItems = [
    { name: "Settings", href: "/settings", icon: settingsIcon },
  ];

  $: activePath = $page.url.pathname;
</script>

<aside class="sidebar h-full flex flex-col">
  <!-- Logo area -->
  <div class="sidebar-brand">
    <div class="brand-icon">
      <Icon icon="mdi:play-circle" class="text-white text-[18px]" />
    </div>
    <div class="brand-text">
      <span class="brand-name">Stream Player</span>
    </div>
  </div>

  <!-- Nav label -->
  <div class="nav-section-label">Navigation</div>

  <nav class="flex-1 px-2.5 space-y-1">
    {#each navItems as item}
      {@const isActive = activePath === item.href || (item.href !== '/' && activePath.startsWith(item.href))}
      <a
        href={item.href}
        class="nav-item {isActive ? 'nav-item-active' : ''}"
      >
        <div class="nav-icon-wrap {isActive ? 'nav-icon-active' : ''}">
          <Icon icon={item.icon} class="text-[16px]" />
        </div>
        <span class="nav-label">{item.name}</span>
        {#if isActive}
          <div class="nav-pip"></div>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="sidebar-footer">
    <div class="footer-divider"></div>
    {#each bottomNavItems as item}
      {@const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`)}
      <a
        href={item.href}
        class="nav-item {isActive ? 'nav-item-active' : ''}"
      >
        <div class="nav-icon-wrap {isActive ? 'nav-icon-active' : ''}">
          <Icon icon={item.icon} class="text-[16px]" />
        </div>
        <span class="nav-label">{item.name}</span>
        {#if isActive}
          <div class="nav-pip"></div>
        {/if}
      </a>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    background: rgba(var(--m3-scheme-surface-container-lowest) / 0.6);
    backdrop-filter: blur(32px) saturate(1.3);
    -webkit-backdrop-filter: blur(32px) saturate(1.3);
    border-right: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.3);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 16px 14px;
    border-bottom: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.2);
    margin-bottom: 8px;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgb(var(--m3-scheme-primary)), rgb(var(--m3-scheme-primary-container)));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(var(--m3-scheme-primary) / 0.35);
    flex-shrink: 0;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
  }

  .brand-name {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.01em;
    color: rgb(var(--m3-scheme-on-surface));
    line-height: 1;
  }

  .brand-sub {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.65);
    line-height: 1;
  }

  .nav-section-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.5);
    padding: 0 18px 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    position: relative;
    text-decoration: none;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.85);
    transition: background 0.15s ease, color 0.15s ease;
  }

  .nav-item:hover:not(.nav-item-active) {
    background: rgba(var(--m3-scheme-surface-container-high) / 0.55);
    color: rgb(var(--m3-scheme-on-surface));
  }

  .nav-item-active {
    background: rgba(var(--m3-scheme-primary) / 0.1);
    color: rgb(var(--m3-scheme-primary));
  }

  .nav-icon-wrap {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(var(--m3-scheme-surface-container-high) / 0.5);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .nav-icon-active {
    background: rgba(var(--m3-scheme-primary) / 0.15);
    border-color: rgba(var(--m3-scheme-primary) / 0.25);
    box-shadow: 0 0 10px rgba(var(--m3-scheme-primary) / 0.15);
  }

  .nav-label {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.005em;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgb(var(--m3-scheme-primary));
    box-shadow: 0 0 6px rgba(var(--m3-scheme-primary) / 0.6);
    flex-shrink: 0;
  }

  .sidebar-footer {
    padding: 0 10px 14px;
  }

  .footer-divider {
    height: 1px;
    background: rgba(var(--m3-scheme-outline-variant) / 0.25);
    margin: 8px 6px 10px;
  }
</style>
