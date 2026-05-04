<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Icon from "@iconify/svelte";
  import playCircleIcon from "@iconify-icons/mdi/play-circle";
  import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
  import closeIcon from "@iconify-icons/mdi/close";
  import tuneIcon from "@iconify-icons/mdi/tune-variant";
  import shieldIcon from "@iconify-icons/mdi/shield-key-outline";
  import webIcon from "@iconify-icons/mdi/web";
  import codeIcon from "@iconify-icons/mdi/xml";
  import VideoPlayer from "$lib/components/VideoPlayer.svelte";
  import Dialog from "$lib/components/Dialog.svelte";
  import { showToast } from "$lib/toast.svelte.js";

  let isModalOpen = $state(false);
  let playerDimensions = $state({ width: 1280, height: 720 });
  let savedStreams = $state([]);
  let savedStream = $state(null);
  let isLoaded = $state(false);

  const defaultFormData = {
    streamUrl: "",
    streamType: "auto",
    cookie: "",
    referer: "",
    origin: "",
    userAgent: "",
    drmScheme: "none",
    clearKey: "",
    licenseUrl: "",
    licenseHeaders: "",
    certificateUrl: "",
    certificateHeaders: "",
    requestHeaders: "",
    shakaConfig: "",
  };

  /**
   * @type {StreamFormData}
   */
  let formData = $state({ ...defaultFormData });

  const STORAGE_KEYS = {
    saved: "msp_saved_streams",
  };

  const rules = {
    streamUrl: (value) => {
      if (!value.toString().trim()) return "Stream URL is required";
      try { new URL(value); } catch (e) { return "Must be a valid URL"; }
      return null;
    },
  };

  const loadStoredList = (key) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const applyStreamToForm = (stream) => {
    formData = { ...defaultFormData, ...stream };
  };

  const playStreamFromData = (stream) => {
    const urlError = rules.streamUrl(stream.streamUrl);
    if (urlError) {
      showToast(urlError);
      return;
    }
    applyStreamToForm(stream);
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

  const getValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  onMount(() => {
    savedStreams = loadStoredList(STORAGE_KEYS.saved);
    const id = $page.params.id;
    savedStream = savedStreams.find((item) => item.id === id) ?? null;
    isLoaded = true;
  });

  $effect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  });
</script>

<div class="space-y-10 animate-fade-in">
  <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <div class="hero-badge bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Profile Details</div>
        {#if savedStream}
           <span class="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-on-surface-variant text-[9px] font-bold uppercase tracking-widest">
            {savedStream.stream.streamType === 'auto' ? 'Auto' : (savedStream.stream.streamType.includes('dash') ? 'DASH' : 'HLS')}
          </span>
        {/if}
      </div>
      <h1 class="text-4xl font-black text-white tracking-tight leading-tight">{savedStream?.name ?? "Saved Stream"}</h1>
      <p class="text-on-surface-variant text-sm max-w-lg leading-relaxed">
        Comprehensive configuration breakdown for this saved profile. Review manifest, headers, and DRM settings.
      </p>
      <a class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-all text-xs font-bold border border-white/5" href="/library">
        <Icon icon={arrowLeftIcon} />
        Return to Library
      </a>
    </div>
    {#if savedStream}
      <div class="flex items-center gap-3">
        <button
          onclick={() => playStreamFromData(savedStream.stream)}
          class="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-bold"
        >
          <Icon icon={playCircleIcon} class="text-xl" />
          Launch Stream
        </button>
      </div>
    {/if}
  </header>

  {#if !isLoaded}
    <div class="glass-card p-12 text-center border-dashed border-white/10">
      <p class="text-on-surface-variant animate-pulse font-medium uppercase tracking-[0.2em] text-[10px]">Loading configuration...</p>
    </div>
  {:else if !savedStream}
    <div class="glass-card p-12 text-center space-y-6">
      <div class="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/10">
        <Icon icon={closeIcon} class="text-red-400 text-3xl" />
      </div>
      <div class="space-y-1">
        <h3 class="text-xl font-bold text-white">Profile Not Found</h3>
        <p class="text-on-surface-variant text-sm">The requested profile might have been deleted or moved.</p>
      </div>
      <a class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-on-surface-variant font-bold text-xs" href="/library">
        <Icon icon={arrowLeftIcon} />
        Back to Library
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Basics -->
      <section class="glass-card p-8 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-white/5">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
            <Icon icon={tuneIcon} class="text-primary text-xl" />
          </div>
          <h3 class="text-lg font-bold text-white leading-none">General Info</h3>
        </div>
        <div class="grid grid-cols-1 gap-6">
          <div class="space-y-2">
            <span class="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-black ml-1">Stream Manifest URL</span>
            <div class="text-sm font-mono break-all p-4 bg-black/20 rounded-2xl border border-white/5 text-white/80 leading-relaxed shadow-inner">
              {getValue(savedStream.stream.streamUrl)}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <span class="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-black ml-1">Format</span>
              <div class="px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 text-sm font-bold text-primary">
                {getValue(savedStream.stream.streamType === 'auto' ? 'Auto-Detect' : (savedStream.stream.streamType.includes('dash') ? 'DASH' : 'HLS'))}
              </div>
            </div>
            <div class="space-y-2">
              <span class="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-black ml-1">DRM Scheme</span>
              <div class="px-4 py-3 rounded-xl bg-secondary/5 border border-secondary/10 text-sm font-bold text-secondary">
                {getValue(savedStream.stream.drmScheme)}
              </div>
            </div>
          </div>
          <div class="space-y-1 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">Creation Date</span>
            <p class="text-sm text-white font-medium">{formatTimestamp(savedStream.updatedAt ?? savedStream.createdAt)}</p>
          </div>
        </div>
      </section>

      <!-- Network -->
      <section class="glass-card p-8 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-white/5">
          <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/10">
            <Icon icon={webIcon} class="text-secondary text-xl" />
          </div>
          <h3 class="text-lg font-bold text-white leading-none">Network & Auth</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">Origin</span>
            <p class="text-sm text-white font-medium bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 truncate">{getValue(savedStream.stream.origin)}</p>
          </div>
          <div class="space-y-1.5">
            <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">Referer</span>
            <p class="text-sm text-white font-medium bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 truncate">{getValue(savedStream.stream.referer)}</p>
          </div>
          <div class="md:col-span-2 space-y-1.5">
            <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">User-Agent</span>
            <p class="text-sm text-white font-medium bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 truncate">{getValue(savedStream.stream.userAgent)}</p>
          </div>
          <div class="md:col-span-2 space-y-2">
             <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">Custom Request Headers</span>
             <pre class="text-[11px] p-5 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto font-mono text-secondary/70 leading-relaxed min-h-[100px]">{getValue(savedStream.stream.requestHeaders)}</pre>
          </div>
        </div>
      </section>

      <!-- DRM -->
      <section class="glass-card p-8 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-white/5">
          <div class="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/10">
            <Icon icon={shieldIcon} class="text-pink-400 text-xl" />
          </div>
          <h3 class="text-lg font-bold text-white leading-none">DRM Specification</h3>
        </div>
        <div class="space-y-6">
           <div class="grid grid-cols-1 gap-6">
              <div class="space-y-2">
                <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">ClearKey Value</span>
                <p class="text-sm font-mono text-pink-300 bg-pink-500/5 px-4 py-3 rounded-xl border border-pink-500/10 break-all">{getValue(savedStream.stream.clearKey)}</p>
              </div>
              <div class="space-y-2">
                <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">License Server</span>
                <p class="text-sm font-mono text-white/80 bg-black/20 px-4 py-3 rounded-xl border border-white/5 break-all">{getValue(savedStream.stream.licenseUrl)}</p>
              </div>
           </div>
           <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">License Headers</span>
                <pre class="text-[11px] p-4 bg-black/20 rounded-xl border border-white/5 overflow-x-auto font-mono text-on-surface-variant">{getValue(savedStream.stream.licenseHeaders)}</pre>
              </div>
              <div class="space-y-2">
                <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">Certificate Headers</span>
                <pre class="text-[11px] p-4 bg-black/20 rounded-xl border border-white/5 overflow-x-auto font-mono text-on-surface-variant">{getValue(savedStream.stream.certificateHeaders)}</pre>
              </div>
           </div>
        </div>
      </section>

      <!-- Advanced -->
      <section class="glass-card p-8 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-white/5">
          <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Icon icon={codeIcon} class="text-white text-xl" />
          </div>
          <h3 class="text-lg font-bold text-white leading-none">Engine Configuration</h3>
        </div>
        <div class="space-y-3">
           <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-black ml-1">Shaka Config Overlay</span>
           <pre class="text-[11px] p-6 bg-black/50 rounded-3xl border border-white/5 overflow-x-auto font-mono text-primary/70 leading-relaxed shadow-2xl">{getValue(savedStream.stream.shakaConfig)}</pre>
        </div>
      </section>
    </div>
  {/if}
</div>

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
        <button
          class="player-dialog-close"
          onclick={() => (isModalOpen = false)}
          aria-label="Close player"
        >
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

