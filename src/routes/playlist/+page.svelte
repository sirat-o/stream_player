<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import playlistIcon from "@iconify-icons/mdi/playlist-play";
  import plusIcon from "@iconify-icons/mdi/plus";
  import linkIcon from "@iconify-icons/mdi/link-variant";
  import uploadIcon from "@iconify-icons/mdi/upload";
  import deleteIcon from "@iconify-icons/mdi/delete-outline";
  import refreshIcon from "@iconify-icons/mdi/refresh";
  import chevronIcon from "@iconify-icons/mdi/chevron-right";
  import closeIcon from "@iconify-icons/mdi/close";

  import { parseM3U } from "$lib/m3uParser.js";
  import { showToast } from "$lib/toast.svelte.js";

  const STORAGE_KEY = "msp_saved_playlists";
  const TEMP_PLAYLIST_KEY = "msp_temp_playlist";

  let playlists = $state([]);
  let showAddForm = $state(false);
  let playlistName = $state("");
  let playlistUrl = $state("");
  let isFileLoading = $state(false);

  const createId = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const loadPlaylists = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      playlists = Array.isArray(saved) ? saved : [];
    } catch (error) {
      playlists = [];
    }
  };

  const savePlaylists = (items) => {
    playlists = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const normalizeUrl = (value) => value.trim();

  const addPlaylist = () => {
    const name = playlistName.trim();
    const url = normalizeUrl(playlistUrl);

    if (!name) {
      showToast("Playlist name required.");
      return;
    }
    if (!url) {
      showToast("Playlist URL required.");
      return;
    }
    try {
      new URL(url);
    } catch (error) {
      showToast("Valid playlist URL দিন।");
      return;
    }

    const now = new Date().toISOString();
    const item = {
      id: createId(),
      name,
      url,
      createdAt: now,
      updatedAt: now,
    };

    savePlaylists([item, ...playlists]);
    playlistName = "";
    playlistUrl = "";
    showAddForm = false;
    showToast("Playlist saved.");
  };

  const removePlaylist = (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    savePlaylists(playlists.filter((item) => item.id !== id));
    showToast("Playlist removed.");
  };

  const openPlaylist = (id) => {
    goto(`/playlist/${id}`);
  };

  const readFilePlaylist = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    isFileLoading = true;
    try {
      const text = await file.text();
      const channels = parseM3U(text);
      if (!channels.length) {
        showToast("এই file-এ কোনো channel পাওয়া যায়নি।");
        return;
      }

      sessionStorage.setItem(TEMP_PLAYLIST_KEY, JSON.stringify({
        id: "file",
        name: file.name.replace(/\.(m3u8?|txt)$/i, "") || "File Playlist",
        source: "file",
        loadedAt: new Date().toISOString(),
        channels,
      }));
      showToast(`Loaded ${channels.length} channels from file.`);
      goto("/playlist/file");
    } catch (error) {
      showToast(`File load failed: ${error.message || error}`);
    } finally {
      isFileLoading = false;
      event.target.value = "";
    }
  };

  onMount(loadPlaylists);
</script>

<div class="space-y-8 animate-fade-in">
  <header class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
    <div class="space-y-2">
      <div class="hero-badge bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">Advanced M3U</div>
      <h1 class="text-4xl font-black text-on-surface tracking-tight">Playlist</h1>
    </div>

    <div class="flex flex-wrap gap-3">
      <button class="app-btn app-btn-primary" onclick={() => (showAddForm = true)}>
        <Icon icon={plusIcon} />
        Add Playlist
      </button>
      <label class="app-btn app-btn-ghost cursor-pointer" class:opacity-70={isFileLoading}>
        <Icon icon={isFileLoading ? refreshIcon : uploadIcon} class={isFileLoading ? "animate-spin" : ""} />
        File
        <input type="file" accept=".m3u,.m3u8,.txt" class="hidden" onchange={readFilePlaylist} disabled={isFileLoading} />
      </label>
    </div>
  </header>

  {#if showAddForm}
    <section class="glass-card p-6 space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-on-surface">Add Playlist</h2>
        </div>
        <button class="w-10 h-10 rounded-xl app-icon-surface hover:bg-surface-container-high/90 flex items-center justify-center text-on-surface-variant" onclick={() => (showAddForm = false)} aria-label="Close add playlist form">
          <Icon icon={closeIcon} />
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="playlistName" class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Playlist Name</label>
          <div class="relative">
            <Icon icon={playlistIcon} class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="playlistName"
              type="text"
              bind:value={playlistName}
              placeholder="Sports Playlist"
              class="app-input pl-11 pr-4 py-3 text-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="playlistUrl" class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Playlist URL</label>
          <div class="relative">
            <Icon icon={linkIcon} class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="playlistUrl"
              type="text"
              bind:value={playlistUrl}
              placeholder="https://example.com/playlist.m3u"
              class="app-input pl-11 pr-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button class="app-btn app-btn-ghost" onclick={() => (showAddForm = false)}>Cancel</button>
        <button class="app-btn app-btn-primary" onclick={addPlaylist}>
          <Icon icon={plusIcon} />
          Save Playlist
        </button>
      </div>
    </section>
  {/if}

  <section class="glass-card p-6 space-y-5">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/10">
        <Icon icon={playlistIcon} class="text-secondary text-xl" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-on-surface leading-none">Saved Playlists</h2>
        <p class="text-[11px] text-on-surface-variant mt-1">{playlists.length} playlist saved</p>
      </div>
    </div>

    {#if playlists.length === 0}
      <div class="app-empty-state">
        <Icon icon={playlistIcon} class="text-5xl text-on-surface-variant/50 mb-4" />
        <h3 class="text-on-surface font-bold">No saved playlist</h3>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {#each playlists as item}
          <div
            class="text-left glass-card rounded-3xl p-5 group cursor-pointer"
            role="button"
            tabindex="0"
            onclick={() => openPlaylist(item.id)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPlaylist(item.id);
              }
            }}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-3">
                <div class="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/10 flex items-center justify-center">
                  <Icon icon={playlistIcon} class="text-3xl text-secondary" />
                </div>
                <div class="min-w-0">
                  <h3 class="font-black text-on-surface text-lg truncate">{item.name}</h3>
                  <p class="text-xs text-on-surface-variant mt-1 break-all line-clamp-2">{item.url}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  class="w-10 h-10 rounded-xl app-icon-surface hover:bg-red-500/10 hover:text-red-500 text-on-surface-variant flex items-center justify-center transition-all"
                  aria-label="Delete playlist"
                  onclick={(event) => removePlaylist(event, item.id)}
                >
                  <Icon icon={deleteIcon} />
                </button>
                <Icon icon={chevronIcon} class="text-3xl text-secondary opacity-80 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
