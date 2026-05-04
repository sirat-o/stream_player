<script>
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import playCircleIcon from "@iconify-icons/mdi/play-circle";
  import bookmarkIcon from "@iconify-icons/mdi/bookmark";
  import historyIcon from "@iconify-icons/mdi/history";
  import trashIcon from "@iconify-icons/mdi/trash-can-outline";
  import infoIcon from "@iconify-icons/mdi/information-outline";
  import closeIcon from "@iconify-icons/mdi/close";

  import VideoPlayer from "$lib/components/VideoPlayer.svelte";
  import Dialog from "$lib/components/Dialog.svelte";
  import { showToast } from "$lib/toast.svelte.js";

  let isModalOpen = $state(false);
  let playerDimensions = $state({ width: 1280, height: 720 });

  const defaultFormData = {
    streamUrl: "", streamType: "auto", cookie: "", referer: "", origin: "",
    userAgent: "", drmScheme: "none", clearKey: "", licenseUrl: "",
    licenseHeaders: "", certificateUrl: "", certificateHeaders: "", requestHeaders: "", shakaConfig: "",
  };

  let formData = $state({ ...defaultFormData });
  let streamHistory = $state([]);
  let savedStreams = $state([]);

  const STORAGE_KEYS = { history: "msp_stream_history", saved: "msp_saved_streams" };
  const HISTORY_LIMIT = 12;

  const rules = {
    streamUrl: (value) => {
      if (!value.toString().trim()) return "Stream URL is required";
      try { new URL(value); } catch (e) { return "Must be a valid URL"; }
      return null;
    },
  };

  const createId = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getStreamPayload = (data) => {
    const payload = {};
    Object.keys(defaultFormData).forEach((key) => { payload[key] = data[key] ?? defaultFormData[key]; });
    return payload;
  };

  const loadStoredList = (key) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) { return []; }
  };

  const persistList = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); };

  const updateHistory = (stream) => {
    const payload = getStreamPayload(stream);
    const signature = JSON.stringify(payload);
    const newEntry = { id: createId(), lastPlayed: new Date().toISOString(), signature, stream: payload };
    streamHistory = [newEntry, ...streamHistory.filter((item) => item.signature !== signature)].slice(0, HISTORY_LIMIT);
    persistList(STORAGE_KEYS.history, streamHistory);
  };

  const updateSavedStreams = (streams) => {
    savedStreams = streams;
    persistList(STORAGE_KEYS.saved, savedStreams);
  };

  const playStreamFromData = (stream) => {
    const urlError = rules.streamUrl(stream.streamUrl);
    if (urlError) { showToast(urlError); return; }
    formData = { ...defaultFormData, ...stream };
    updateHistory(stream);
    isModalOpen = true;
  };

  const handleVideoSize = ({ width, height }) => {
    if (!width || !height) return;
    playerDimensions = { width, height };
  };

  const formatTimestamp = (value) => {
    if (!value) return "Just now";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "Just now" : parsed.toLocaleString();
  };

  onMount(() => {
    streamHistory = loadStoredList(STORAGE_KEYS.history);
    savedStreams = loadStoredList(STORAGE_KEYS.saved);
  });

  const deleteSavedStream = (itemId) => {
    updateSavedStreams(savedStreams.filter((item) => item.id !== itemId));
    showToast("Profile removed from library.");
  };

  const clearHistory = () => {
    streamHistory = [];
    persistList(STORAGE_KEYS.history, streamHistory);
    showToast("Playback history cleared.");
  };

  $effect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  });
</script>

<div class="space-y-8 animate-fade-in">
  <header class="page-header">
    <div>
      <div class="page-badge">Library & History</div>
      <h1 class="page-title">Your Collection</h1>
    </div>
    <div class="stat-row">
      <div class="stat-pill">
        <span class="stat-label">Saved</span>
        <span class="stat-val stat-val-primary">{savedStreams.length}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">History</span>
        <span class="stat-val stat-val-secondary">{streamHistory.length}</span>
      </div>
    </div>
  </header>

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <!-- Saved Streams -->
    <section class="space-y-5">
      <div class="flex items-center gap-3 px-1">
        <div class="section-icon-sm" style="background:rgba(var(--m3-scheme-primary)/0.1);border-color:rgba(var(--m3-scheme-primary)/0.2);">
          <Icon icon={bookmarkIcon} class="text-primary text-[15px]" />
        </div>
        <h2 class="lib-section-title">Saved Profiles</h2>
      </div>

      {#if savedStreams.length}
        <div class="space-y-3">
          {#each savedStreams as item}
            <div class="stream-card group">
              <div class="stream-card-body">
                <div class="stream-card-top">
                  <h3 class="stream-card-name truncate">{item.name}</h3>
                  <span class="stream-type-badge">
                    {item.stream.streamType === 'auto' ? 'Auto' : (item.stream.streamType.includes('dash') ? 'DASH' : 'HLS')}
                  </span>
                </div>
                <p class="stream-card-url truncate">{item.stream.streamUrl}</p>
                <span class="stream-card-time">Added {formatTimestamp(item.updatedAt ?? item.createdAt)}</span>
              </div>
              <div class="stream-card-actions">
                <button onclick={() => playStreamFromData(item.stream)} class="app-btn app-btn-primary app-icon-btn" title="Play Stream">
                  <Icon icon={playCircleIcon} class="text-[18px]" />
                </button>
                <a href={`/saved/${item.id}`} class="app-btn app-btn-ghost app-icon-btn" title="Details">
                  <Icon icon={infoIcon} class="text-[16px]" />
                </a>
                <button onclick={() => deleteSavedStream(item.id)} class="app-btn app-btn-ghost app-icon-btn delete-btn" title="Delete">
                  <Icon icon={trashIcon} class="text-[16px]" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <Icon icon={bookmarkIcon} class="text-[28px]" style="color:rgba(var(--m3-scheme-on-surface-variant)/0.3)" />
          </div>
          <p class="empty-title">Your library is empty</p>
          <p class="empty-sub">Save profiles in the Workspace</p>
        </div>
      {/if}
    </section>

    <!-- History -->
    <section class="space-y-5">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-3">
          <div class="section-icon-sm" style="background:rgba(var(--m3-scheme-secondary)/0.1);border-color:rgba(var(--m3-scheme-secondary)/0.2);">
            <Icon icon={historyIcon} class="text-secondary text-[15px]" />
          </div>
          <h2 class="lib-section-title">Playback History</h2>
        </div>
        {#if streamHistory.length}
          <button onclick={clearHistory} class="clear-btn">Clear All</button>
        {/if}
      </div>

      {#if streamHistory.length}
        <div class="space-y-2.5">
          {#each streamHistory as item}
            <button
              type="button"
              class="history-item group w-full text-left"
              onclick={() => playStreamFromData(item.stream)}
            >
              <div class="history-item-body">
                <p class="history-url truncate">{item.stream.streamUrl}</p>
                <p class="history-time">Last played {formatTimestamp(item.lastPlayed)}</p>
              </div>
              <div class="history-play-btn">
                <Icon icon={playCircleIcon} class="text-[18px]" />
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <Icon icon={historyIcon} class="text-[28px]" style="color:rgba(var(--m3-scheme-on-surface-variant)/0.3)" />
          </div>
          <p class="empty-title">No recent activity</p>
          <p class="empty-sub">Start a session to build history</p>
        </div>
      {/if}
    </section>
  </div>
</div>

<!-- Player Dialog -->
<div class="player-modal">
  <Dialog
    class="video-player-dialog"
    style={`--video-width: ${playerDimensions.width}; --video-height: ${playerDimensions.height};`}
    bind:open={isModalOpen}
    closedby="closerequest"
    closeOnEsc={true}
    icon={false}
  >
    {#snippet children()}
      <div class="player-dialog-header">
        <button class="player-dialog-close" onclick={() => (isModalOpen = false)} aria-label="Close player">
          <Icon icon={closeIcon} />
        </button>
      </div>
      {#if isModalOpen}
        <div class="video-player-frame">
          <VideoPlayer stream={formData} onVideoSize={handleVideoSize} />
        </div>
      {/if}
    {/snippet}
  </Dialog>
</div>

<style>
  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  @media (min-width: 768px) {
    .page-header { flex-direction: row; align-items: flex-end; justify-content: space-between; }
  }

  .page-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(var(--m3-scheme-primary) / 0.1);
    border: 1px solid rgba(var(--m3-scheme-primary) / 0.2);
    color: rgb(var(--m3-scheme-primary));
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .page-title {
    font-size: clamp(1.7rem, 3.5vw, 2.4rem);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: rgb(var(--m3-scheme-on-surface));
    margin: 0;
    line-height: 1;
  }

  .stat-row { display: flex; gap: 10px; flex-shrink: 0; }

  .stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 18px;
    background: rgba(var(--m3-scheme-surface-container-low) / 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.4);
    border-radius: 1rem;
    min-width: 80px;
    box-shadow: 0 2px 10px rgba(0,0,10,0.1);
  }

  .stat-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.6);
    margin-bottom: 3px;
  }

  .stat-val {
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .stat-val-primary { color: rgb(var(--m3-scheme-primary)); }
  .stat-val-secondary { color: rgb(var(--m3-scheme-secondary)); }

  .section-icon-sm {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .lib-section-title {
    font-size: 15px;
    font-weight: 800;
    color: rgb(var(--m3-scheme-on-surface));
    letter-spacing: -0.01em;
    margin: 0;
  }

  .stream-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(var(--m3-scheme-surface-container-low) / 0.8);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.4);
    border-radius: 1.1rem;
    padding: 14px 16px;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }

  .stream-card:hover {
    border-color: rgba(var(--m3-scheme-primary) / 0.25);
    background: rgba(var(--m3-scheme-surface-container) / 0.85);
    transform: translateY(-1px);
  }

  .stream-card-body { flex: 1; min-width: 0; }

  .stream-card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .stream-card-name {
    font-size: 14px;
    font-weight: 700;
    color: rgb(var(--m3-scheme-on-surface));
    margin: 0;
  }

  .stream-type-badge {
    flex-shrink: 0;
    padding: 2px 7px;
    border-radius: 5px;
    background: rgba(var(--m3-scheme-surface-container-highest) / 0.7);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.4);
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.75);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .stream-card-url {
    font-size: 10.5px;
    font-family: monospace;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.45);
    margin: 0 0 5px;
  }

  .stream-card-time {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(var(--m3-scheme-on-surface) / 0.3);
  }

  .stream-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .delete-btn { color: rgba(var(--m3-scheme-on-surface-variant) / 0.6); }
  .delete-btn:hover { color: rgb(var(--m3-scheme-error)) !important; border-color: rgba(var(--m3-scheme-error) / 0.2) !important; }

  .history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(var(--m3-scheme-surface-container-low) / 0.7);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.35);
    border-radius: 1rem;
    padding: 12px 14px;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }

  .history-item:hover {
    border-color: rgba(var(--m3-scheme-secondary) / 0.25);
    background: rgba(var(--m3-scheme-surface-container) / 0.85);
    transform: translateY(-1px);
  }

  .history-item-body { flex: 1; min-width: 0; }

  .history-url {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--m3-scheme-on-surface));
    margin: 0 0 4px;
    line-height: 1.2;
  }

  .history-time {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.55);
    margin: 0;
  }

  .history-play-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(var(--m3-scheme-secondary) / 0.1);
    border: 1px solid rgba(var(--m3-scheme-secondary) / 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(var(--m3-scheme-secondary));
    flex-shrink: 0;
    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }

  .history-item:hover .history-play-btn {
    background: rgb(var(--m3-scheme-secondary));
    color: white;
    box-shadow: 0 4px 14px rgba(var(--m3-scheme-secondary) / 0.35);
  }

  .clear-btn {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(var(--m3-scheme-error) / 0.7);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .clear-btn:hover { color: rgb(var(--m3-scheme-error)); background: rgba(var(--m3-scheme-error) / 0.08); }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    border: 1.5px dashed rgba(var(--m3-scheme-outline-variant) / 0.3);
    border-radius: 1.25rem;
    background: rgba(var(--m3-scheme-surface-container-lowest) / 0.5);
    text-align: center;
  }

  .empty-icon-wrap {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    background: rgba(var(--m3-scheme-surface-container-high) / 0.5);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .empty-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.7);
    margin: 0 0 4px;
  }

  .empty-sub {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.4);
    margin: 0;
  }
</style>
