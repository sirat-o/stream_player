<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import playlistIcon from "@iconify-icons/mdi/playlist-play";
  import searchIcon from "@iconify-icons/mdi/magnify";
  import playIcon from "@iconify-icons/mdi/play-circle";
  import refreshIcon from "@iconify-icons/mdi/refresh";
  import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
  import closeIcon from "@iconify-icons/mdi/close";

  import Dialog from "$lib/components/Dialog.svelte";
  import VideoPlayer from "$lib/components/VideoPlayer.svelte";
  import { parseM3U } from "$lib/m3uParser.js";
  import { showToast } from "$lib/toast.svelte.js";

  const STORAGE_KEY = "msp_saved_playlists";
  const TEMP_PLAYLIST_KEY = "msp_temp_playlist";

  let playlist = $state(null);
  let channels = $state([]);
  let isLoading = $state(false);
  let isFilePlaylist = $state(false);
  let searchText = $state("");
  let selectedGroup = $state("All");
  let isModalOpen = $state(false);
  let selectedStream = $state(null);
  let playerDimensions = $state({ width: 1280, height: 720 });

  const isTauri = typeof window !== "undefined" && !!window["__TAURI_INTERNALS__"];

  const fetchText = async (url) => {
    if (isTauri) {
      const { fetch } = await import("@tauri-apps/plugin-http");
      const response = await fetch(url, {
        method: "GET",
        danger: { acceptInvalidCerts: true, acceptInvalidHostnames: true },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  };

  const getSavedPlaylists = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  };

  const loadSavedPlaylist = async (id) => {
    const saved = getSavedPlaylists().find((item) => item.id === id);
    if (!saved) {
      showToast("Playlist not found.");
      goto("/playlist");
      return;
    }

    playlist = saved;
    isFilePlaylist = false;
    isLoading = true;
    try {
      const text = await fetchText(saved.url);
      const parsed = parseM3U(text);
      channels = parsed;
      selectedGroup = "All";
      if (parsed.length) {
        showToast(`Loaded ${parsed.length} channels.`);
      } else {
        showToast("No channels were found in this playlist.");
      }
    } catch (error) {
      showToast(`Playlist load failed: ${error.message || error}`);
    } finally {
      isLoading = false;
    }
  };

  const loadFilePlaylist = () => {
    try {
      const temp = JSON.parse(sessionStorage.getItem(TEMP_PLAYLIST_KEY) || "null");
      if (!temp || !Array.isArray(temp.channels)) {
        showToast("File playlist not found. Please load it again using the File button.");
        goto("/playlist");
        return;
      }
      playlist = temp;
      channels = temp.channels;
      isFilePlaylist = true;
      selectedGroup = "All";
    } catch (error) {
      showToast("File playlist load failed.");
      goto("/playlist");
    }
  };

  const reloadPlaylist = () => {
    const id = $page.params.id;
    if (id === "file") loadFilePlaylist();
    else loadSavedPlaylist(id);
  };

  const playChannel = (channel) => {
    selectedStream = channel.stream;
    playerDimensions = { width: 1280, height: 720 };
    isModalOpen = true;
  };

  const handleVideoSize = ({ width, height }) => {
    if (!width || !height) return;
    playerDimensions = { width, height };
  };

  const groups = $derived(["All", ...Array.from(new Set(channels.map((channel) => channel.group || "Ungrouped"))).sort()]);

  const filteredChannels = $derived(channels.filter((channel) => {
    const groupOk = selectedGroup === "All" || channel.group === selectedGroup;
    const q = searchText.trim().toLowerCase();
    const searchOk = !q || `${channel.name} ${channel.group} ${channel.tvgId}`.toLowerCase().includes(q);
    return groupOk && searchOk;
  }));

  onMount(reloadPlaylist);
</script>

<div class="space-y-8 animate-fade-in">
  <header class="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
    <div class="space-y-4 min-w-0">
      <button class="app-btn app-btn-ghost w-fit" onclick={() => goto("/playlist")}>
        <Icon icon={arrowLeftIcon} />
        Back
      </button>
      <div class="space-y-2 min-w-0">
        <div class="hero-badge bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
          {isFilePlaylist ? "File Playlist" : "Saved Playlist"}
        </div>
        <h1 class="text-4xl font-black text-on-surface tracking-tight truncate">{playlist?.name || "Playlist"}</h1>
        {#if playlist?.url}
          <p class="text-on-surface-variant text-sm max-w-3xl break-all">{playlist.url}</p>
        {:else}
          <p class="text-on-surface-variant text-sm max-w-3xl">Playlist Loaded from file.</p>
        {/if}
      </div>
    </div>

    <button class="app-btn app-btn-primary w-fit" onclick={reloadPlaylist} disabled={isLoading || isFilePlaylist}>
      <Icon icon={isLoading ? refreshIcon : playlistIcon} class={isLoading ? "animate-spin" : ""} />
      {isLoading ? "Loading" : isFilePlaylist ? "Loaded" : "Reload"}
    </button>
  </header>

  <section class="glass-card p-6 space-y-5">
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/10">
          <Icon icon={playlistIcon} class="text-secondary text-xl" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-on-surface leading-none">Channels</h2>
          <p class="text-[11px] text-on-surface-variant mt-1">{filteredChannels.length} showing / {channels.length} total</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
        <div class="relative min-w-[240px]">
          <Icon icon={searchIcon} class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            bind:value={searchText}
            placeholder="Search channel..."
            class="app-input pl-11 pr-4 py-3 text-sm"
          />
        </div>
        <select
          bind:value={selectedGroup}
          class="app-input px-4 py-3 text-sm appearance-none min-w-[190px]"
        >
          {#each groups as group}
            <option value={group}>{group}</option>
          {/each}
        </select>
      </div>
    </div>

    {#if isLoading}
      <div class="app-empty-state">
        <Icon icon={refreshIcon} class="text-5xl text-secondary animate-spin mb-4" />
        <h3 class="text-on-surface font-bold">Loading channels...</h3>
        <p class="text-on-surface-variant text-sm mt-1">M3U parser is reading the playlist.</p>
      </div>
    {:else if channels.length === 0}
      <div class="app-empty-state">
        <Icon icon={playlistIcon} class="text-5xl text-on-surface-variant/50 mb-4" />
        <h3 class="text-on-surface font-bold">No channel loaded</h3>
        <p class="text-on-surface-variant text-sm mt-1">Playlist URL is correct. Please check the playlist content.</p>
      </div>
    {:else if filteredChannels.length === 0}
      <div class="app-empty-state min-h-[180px]">
        <Icon icon={searchIcon} class="text-4xl text-on-surface-variant/50 mb-3" />
        <h3 class="text-on-surface font-bold">No matching channel</h3>
        <p class="text-on-surface-variant text-sm mt-1">Search or group filter change.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {#each filteredChannels as channel}
          <button
            class="text-left glass-card rounded-3xl p-4 group"
            onclick={() => playChannel(channel)}
          >
            <div class="flex gap-4 items-center">
              <div class="w-16 h-16 rounded-2xl app-logo-shell flex items-center justify-center overflow-hidden shrink-0">
                {#if channel.logo}
                  <img src={channel.logo} alt={channel.name} class="w-full h-full object-contain p-2" loading="lazy" />
                {:else}
                  <Icon icon={playlistIcon} class="text-2xl text-on-surface-variant" />
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-on-surface truncate">{channel.name}</h3>
                <p class="text-xs text-on-surface-variant truncate mt-1">{channel.group || "Ungrouped"}</p>
                <div class="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider text-on-surface-variant">
                  <span class="app-chip">{channel.stream.streamType.includes('dash') ? 'DASH' : channel.stream.streamType.includes('mpegurl') ? 'HLS' : 'AUTO'}</span>
                  {#if channel.stream.drmScheme !== "none"}
                    <span class="app-chip bg-pink-500/10 text-pink-300">DRM</span>
                  {/if}
                </div>
              </div>
              <Icon icon={playIcon} class="text-3xl text-secondary opacity-85 group-hover:scale-110 transition-all" />
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </section>
</div>

{#if selectedStream}
  <Dialog
    bind:open={isModalOpen}
    closeOnClick={true}
    onClick={() => (isModalOpen = false)}
    closeOnEsc={true}
    onEsc={() => (isModalOpen = false)}
    class="video-player-dialog"
    style={`--video-width: ${playerDimensions.width}; --video-height: ${playerDimensions.height};`}
  >
    {#snippet children()}
      <div class="player-dialog-header">
        <button
          type="button"
          aria-label="Close player"
          onclick={() => (isModalOpen = false)}
          class="player-dialog-close"
        >
          <Icon icon={closeIcon} />
        </button>
      </div>

      {#if isModalOpen}
        <div class="video-player-frame">
          <VideoPlayer stream={selectedStream} onVideoSize={handleVideoSize} />
        </div>
      {/if}
    {/snippet}
  </Dialog>
{/if}
