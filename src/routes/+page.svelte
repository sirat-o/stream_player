<script>
  import { onMount, tick } from "svelte";
  import Icon from "@iconify/svelte";
  import JSON5 from "json5";

  import playCircleIcon from "@iconify-icons/mdi/play-circle";
  import contentSaveIcon from "@iconify-icons/mdi/content-save";
  import closeIcon from "@iconify-icons/mdi/close";
  import refreshIcon from "@iconify-icons/mdi/refresh";
  import libraryIcon from "@iconify-icons/mdi/library-shelves";
  import tuneIcon from "@iconify-icons/mdi/tune-variant";
  import shieldIcon from "@iconify-icons/mdi/shield-key-outline";
  import webIcon from "@iconify-icons/mdi/web";
  import codeIcon from "@iconify-icons/mdi/xml";
  import flashIcon from "@iconify-icons/mdi/flash";

  import VideoPlayer from "$lib/components/VideoPlayer.svelte";
  import Dialog from "$lib/components/Dialog.svelte";
  import { showToast } from "$lib/toast.svelte.js";
  import parseCurl from "parse-curl";

  let isModalOpen = $state(false);
  let playerDimensions = $state({ width: 1280, height: 720 });

  let defaultFormData = {
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

  let formData = $state({ ...defaultFormData });

  let streamTypes = [
    { value: "auto", text: "Auto-Detect" },
    { value: "application/vnd.apple.mpegurl", text: "HLS" },
    { value: "application/dash+xml", text: "DASH" },
  ];

  const drmSchemes = [
    { value: "none", text: "N/A" },
    { value: "clearkey_inline", text: "ClearKey (Inline)" },
    { value: "org.w3.clearkey", text: "ClearKey (Server)" },
    { value: "com.widevine.alpha", text: "Widevine" },
    { value: "com.microsoft.playready", text: "PlayReady" },
  ];

  let errors = $state({});
  let streamHistory = $state([]);
  let savedStreams = $state([]);
  let savedStreamName = $state("");

  const STORAGE_KEYS = {
    history: "msp_stream_history",
    saved: "msp_saved_streams",
  };
  const HISTORY_LIMIT = 12;

  const rules = {
    streamUrl: (value) => {
      if (!value.toString().trim()) return "Stream URL is required";
      try { new URL(value); } catch (e) { return "Must be a valid URL"; }
      return null;
    },
    shakaConfig: (value) => {
      if (!value.toString().trim()) return null;
      try { JSON5.parse(value); } catch (e) { return "Must be valid JSON/JSON5"; }
      return null;
    },
  };

  const createId = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const handleVideoSize = ({ width, height }) => {
    if (!width || !height) return;
    playerDimensions = { width, height };
  };

  const getStreamPayload = (data) => {
    const payload = {};
    Object.keys(defaultFormData).forEach((key) => {
      payload[key] = data[key] ?? defaultFormData[key];
    });
    return payload;
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

  const persistList = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const updateHistory = (stream) => {
    const payload = getStreamPayload(stream);
    const signature = JSON.stringify(payload);
    const newEntry = {
      id: createId(),
      lastPlayed: new Date().toISOString(),
      signature,
      stream: payload,
    };
    streamHistory = [
      newEntry,
      ...streamHistory.filter((item) => item.signature !== signature),
    ].slice(0, HISTORY_LIMIT);
    persistList(STORAGE_KEYS.history, streamHistory);
  };

  const updateSavedStreams = (streams) => {
    savedStreams = streams;
    persistList(STORAGE_KEYS.saved, savedStreams);
  };

  const applyStreamToForm = (stream) => {
    formData = { ...defaultFormData, ...stream };
    errors = {};
  };

  const playStreamFromData = (stream) => {
    const urlError = rules.streamUrl(stream.streamUrl);
    if (urlError) {
      showToast(urlError);
      return;
    }
    applyStreamToForm(stream);
    updateHistory(stream);
    isModalOpen = true;
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

  const validateField = (name) => {
    const value = formData[name];
    const rule = rules[name];
    if (rule) {
      const error = rule(value);
      if (error) {
        errors[name] = error;
      } else {
        delete errors[name];
      }
    }
  };

  const handlePaste = (event) => {
    const pastedText = event.clipboardData.getData("text").trim();
    if (pastedText.startsWith("curl")) {
      event.preventDefault();
      try {
        const parsedData = parseCurl(pastedText);
        if (!parsedData.url) throw new Error("Only cURL bash command is supported.");
        showToast("cURL command detected. Autofilled parameters.");
        formData.streamUrl = parsedData.url;
        let headerText = "";
        for (const key in parsedData.header) {
          const headerName = key.trim().toLowerCase();
          const value = parsedData.header[key];
          if (["cookie", "set-cookie"].includes(headerName)) { formData.cookie = value; continue; }
          if (["origin", "referer"].includes(headerName)) { formData[headerName] = value; continue; }
          if (headerName === "user-agent") { formData.userAgent = value; continue; }
          headerText += headerName + " : " + value + "\n";
        }
        formData.requestHeaders = headerText;
        validateField("streamUrl");
      } catch (error) {
        showToast("Invalid CURL command. " + error);
      }
      return;
    }

    const decodedPaste = decodeURI(pastedText);
    if (decodedPaste.includes("|")) {
      event.preventDefault();
      const [url, search] = decodedPaste.split("|");
      const nsPlayerURL = new URL("https://google.com?" + search.trim());
      formData.streamUrl = url;
      validateField("streamUrl");
      const drmScheme = nsPlayerURL.searchParams.get("drmScheme");
      const drmLicense = nsPlayerURL.searchParams.get("drmLicense");
      let autofilled = false;
      ["origin", "userAgent", "referer", "referrer", "cookie"].forEach((key) => {
        const value = nsPlayerURL.searchParams.get(key);
        if (value) {
          formData[key === "referrer" ? "referer" : key] = value;
          autofilled = true;
        }
      });
      if (drmScheme === "clearkey") {
        if (drmLicense.includes(":")) {
          formData.drmScheme = "clearkey_inline";
          formData.clearKey = drmLicense;
        } else {
          formData.drmScheme = "org.w3.clearkey";
          formData.licenseUrl = drmLicense;
        }
        autofilled = true;
      }
      showToast("NS Player URL detected. " + (autofilled ? "Autofilled parameters." : "No supported parameters found."));
      return;
    }
    setTimeout(() => validateField("streamUrl"), 0);
  };

  const handleSubmit = (event) => {
    if (event) event.preventDefault();
    const ruleKeys = Object.keys(rules);
    for (const name of ruleKeys) {
      validateField(name);
    }
    if (Object.keys(errors).length !== 0) {
      const firstKey = Object.keys(errors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    updateHistory(formData);
    isModalOpen = true;
  };

  const resetFormData = () => {
    formData = { ...defaultFormData };
    errors = {};
  };

  const saveStream = () => {
    const name = savedStreamName.trim();
    if (!name.length) {
      showToast("Provide a name to save this stream.");
      return;
    }
    const urlError = rules.streamUrl(formData.streamUrl);
    if (urlError) {
      showToast(urlError);
      return;
    }
    const payload = getStreamPayload(formData);
    updateSavedStreams([
      { id: createId(), name, createdAt: new Date().toISOString(), stream: payload },
      ...savedStreams,
    ]);
    showToast("Stream saved for later.");
    savedStreamName = "";
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
  <!-- Page Header -->
  <header class="page-header">
    <div class="header-left">
      <div class="page-badge">
        <Icon icon={flashIcon} class="text-[10px]" />
        Stream Workspace
      </div>
      <h1 class="page-title">New Session</h1>
      <p class="page-desc">
        Configure stream parameters — supports <strong>DASH, HLS</strong> and various <strong>DRM schemes</strong>.
      </p>
    </div>
    <div class="header-actions">
      <button onclick={resetFormData} class="app-btn app-btn-ghost">
        <Icon icon={refreshIcon} class="text-[15px]" />
        Clear
      </button>
      <button onclick={handleSubmit} class="app-btn app-btn-primary">
        <Icon icon={playCircleIcon} class="text-[16px]" />
        Launch Player
      </button>
    </div>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-7">
    <!-- Left: Form -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Base Config -->
      <section class="config-section">
        <div class="accent-orb" style="width:180px;height:180px;background:rgba(var(--m3-scheme-primary)/0.1);top:-60px;right:-60px;"></div>
        <div class="section-header">
          <div class="section-icon" style="background:rgba(var(--m3-scheme-primary)/0.12);border-color:rgba(var(--m3-scheme-primary)/0.18);">
            <Icon icon={tuneIcon} class="text-primary text-[18px]" />
          </div>
          <div>
            <h3 class="section-title">Base Configuration</h3>
            <p class="section-subtitle">Core stream details and format</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
          <div class="md:col-span-3 field-group">
            <label for="streamUrl" class="field-label">Stream Manifest URL</label>
            <input
              id="streamUrl"
              type="text"
              autocomplete="off"
              placeholder="https://example.com/manifest.mpd"
              onpaste={handlePaste}
              bind:value={formData.streamUrl}
              oninput={() => validateField('streamUrl')}
              class="field-input {errors.streamUrl ? 'field-error' : ''}"
            />
            {#if errors.streamUrl}
              <p class="field-error-msg">{errors.streamUrl}</p>
            {/if}
          </div>
          <div class="field-group">
            <label for="streamType" class="field-label">Format</label>
            <select id="streamType" bind:value={formData.streamType} class="field-input appearance-none">
              {#each streamTypes as type}
                <option value={type.value}>{type.text}</option>
              {/each}
            </select>
          </div>
        </div>
      </section>

      <!-- Network Headers -->
      <section class="config-section">
        <div class="section-header">
          <div class="section-icon" style="background:rgba(var(--m3-scheme-secondary)/0.1);border-color:rgba(var(--m3-scheme-secondary)/0.18);">
            <Icon icon={webIcon} class="text-secondary text-[18px]" />
          </div>
          <div>
            <h3 class="section-title">Network Headers</h3>
            <p class="section-subtitle">Bypass restrictions and CORS</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="field-group">
            <label for="origin" class="field-label">Origin</label>
            <input id="origin" type="text" bind:value={formData.origin} placeholder="https://site.com" class="field-input" />
          </div>
          <div class="field-group">
            <label for="referer" class="field-label">Referer</label>
            <input id="referer" type="text" bind:value={formData.referer} placeholder="https://site.com/player" class="field-input" />
          </div>
          <div class="field-group">
            <label for="cookie" class="field-label">Cookie</label>
            <input id="cookie" type="text" bind:value={formData.cookie} placeholder="session=..." class="field-input" />
          </div>
          <div class="field-group">
            <label for="userAgent" class="field-label">User-Agent</label>
            <input id="userAgent" type="text" bind:value={formData.userAgent} placeholder="Mozilla/5.0..." class="field-input" />
          </div>
          <div class="md:col-span-2 field-group">
            <label for="requestHeaders" class="field-label">Custom Request Headers</label>
            <textarea id="requestHeaders" placeholder="X-Custom-Header: Value" bind:value={formData.requestHeaders} class="field-input field-textarea font-mono text-xs"></textarea>
          </div>
        </div>
      </section>

      <!-- DRM -->
      <section class="config-section">
        <div class="section-header">
          <div class="section-icon" style="background:rgba(240,80,160,0.1);border-color:rgba(240,80,160,0.18);">
            <Icon icon={shieldIcon} class="text-[18px]" style="color:rgb(240,80,160)" />
          </div>
          <div>
            <h3 class="section-title">Content Protection</h3>
            <p class="section-subtitle">DRM schemes and license servers</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="field-group">
            <label for="drmScheme" class="field-label">DRM Scheme</label>
            <select
              id="drmScheme"
              bind:value={formData.drmScheme}
              onchange={() => formData.drmScheme === "clearkey_inline" && tick().then(() => document.getElementById("clearKey")?.focus())}
              class="field-input appearance-none"
            >
              {#each drmSchemes as scheme}
                <option value={scheme.value}>{scheme.text}</option>
              {/each}
            </select>
          </div>

          {#if formData.drmScheme === "clearkey_inline"}
            <div class="field-group">
              <label for="clearKey" class="field-label">ClearKey (kid:key)</label>
              <input id="clearKey" type="text" bind:value={formData.clearKey} placeholder="deadbeef...:deadbeef..." class="field-input" />
            </div>
          {/if}

          {#if !["none", "clearkey_inline"].includes(formData.drmScheme)}
            <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="field-group">
                <label for="licenseUrl" class="field-label">License Server URL</label>
                <input id="licenseUrl" type="text" bind:value={formData.licenseUrl} class="field-input" />
              </div>
              <div class="field-group">
                <label for="certificateUrl" class="field-label">Certificate URL</label>
                <input id="certificateUrl" type="text" bind:value={formData.certificateUrl} class="field-input" />
              </div>
              <div class="field-group">
                <label for="licenseHeaders" class="field-label">License Headers</label>
                <textarea id="licenseHeaders" bind:value={formData.licenseHeaders} class="field-input field-textarea font-mono text-xs"></textarea>
              </div>
              <div class="field-group">
                <label for="certificateHeaders" class="field-label">Certificate Headers</label>
                <textarea id="certificateHeaders" bind:value={formData.certificateHeaders} class="field-input field-textarea font-mono text-xs"></textarea>
              </div>
            </div>
          {/if}
        </div>
      </section>

      <!-- Advanced -->
      <section class="config-section">
        <div class="section-header">
          <div class="section-icon" style="background:rgba(var(--m3-scheme-surface-container-highest)/0.6);border-color:rgba(var(--m3-scheme-outline-variant)/0.5);">
            <Icon icon={codeIcon} class="text-[18px]" style="color:rgb(var(--m3-scheme-on-surface-variant))" />
          </div>
          <div>
            <h3 class="section-title">Advanced Player Config</h3>
            <p class="section-subtitle">Shaka Player JSON/JSON5 overrides</p>
          </div>
        </div>
        <div class="field-group">
          <textarea
            id="shakaConfig"
            placeholder={'{ "streaming": { "bufferingGoal": 60 } }'}
            bind:value={formData.shakaConfig}
            oninput={() => validateField('shakaConfig')}
            class="field-input field-textarea font-mono text-xs {errors.shakaConfig ? 'field-error' : ''}"
            style="min-height:110px"
          ></textarea>
          {#if errors.shakaConfig}
            <p class="field-error-msg">{errors.shakaConfig}</p>
          {/if}
        </div>
      </section>
    </div>

    <!-- Right Sidebar -->
    <aside class="space-y-6">
      <!-- Save Profile -->
      <div class="save-panel">
        <div class="accent-orb" style="width:120px;height:120px;background:rgba(var(--m3-scheme-primary)/0.12);bottom:-40px;left:-40px;"></div>
        <div class="flex items-center gap-3 relative z-10 mb-5">
          <div class="section-icon" style="background:rgba(var(--m3-scheme-primary)/0.14);border-color:rgba(var(--m3-scheme-primary)/0.2);">
            <Icon icon={contentSaveIcon} class="text-primary text-[17px]" />
          </div>
          <h3 class="font-bold text-[14px]" style="color:rgb(var(--m3-scheme-on-surface))">Save Profile</h3>
        </div>

        <div class="space-y-3 relative z-10">
          <div class="field-group">
            <label for="savedStreamName" class="field-label">Profile Name</label>
            <input
              id="savedStreamName"
              type="text"
              placeholder="E.g. My Live TV"
              bind:value={savedStreamName}
              class="field-input"
            />
          </div>
          <button onclick={saveStream} class="app-btn app-btn-ghost w-full">
            <Icon icon={contentSaveIcon} class="text-[15px]" />
            Save Stream
          </button>
        </div>
      </div>

      <!-- Recent Saved -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <span class="section-label">Recent Saved</span>
          <a href="/library" class="view-all-link">View All →</a>
        </div>

        {#if savedStreams.length}
          <div class="space-y-2.5">
            {#each savedStreams.slice(0, 3) as item}
              <div class="saved-item group">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <span class="saved-item-name truncate">{item.name}</span>
                  <button
                    onclick={() => playStreamFromData(item.stream)}
                    class="app-btn app-btn-primary app-icon-btn opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all flex-shrink-0"
                  >
                    <Icon icon={playCircleIcon} class="text-[14px]" />
                  </button>
                </div>
                <p class="saved-item-url truncate">{item.stream.streamUrl}</p>
                <div class="saved-item-footer">
                  <span class="saved-item-time">{formatTimestamp(item.updatedAt ?? item.createdAt)}</span>
                  <a href={`/saved/${item.id}`} class="saved-item-details">Details</a>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-mini">
            <Icon icon={libraryIcon} class="text-[22px] mb-1.5" style="color:rgba(var(--m3-scheme-on-surface-variant)/0.3)" />
            <p class="empty-mini-text">No profiles yet</p>
          </div>
        {/if}
      </div>
    </aside>
  </div>
</div>

<!-- FAB -->
<button onclick={handleSubmit} class="app-btn app-btn-primary app-fab">
  <Icon icon={playCircleIcon} class="text-[17px]" />
  <span style="font-weight:800;font-size:12px;letter-spacing:0.06em;text-transform:uppercase">Play Now</span>
</button>

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
  textarea { resize: vertical; }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  @media (min-width: 768px) {
    .page-header {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }

  .header-left { display: flex; flex-direction: column; gap: 8px; }

  .page-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(var(--m3-scheme-primary) / 0.1);
    border: 1px solid rgba(var(--m3-scheme-primary) / 0.2);
    color: rgb(var(--m3-scheme-primary));
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    width: fit-content;
  }

  .page-title {
    font-size: clamp(1.7rem, 3.5vw, 2.4rem);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: rgb(var(--m3-scheme-on-surface));
    line-height: 1;
    margin: 0;
  }

  .page-desc {
    font-size: 13px;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.85);
    max-width: 420px;
    line-height: 1.55;
    margin: 0;
  }

  .page-desc strong {
    color: rgb(var(--m3-scheme-on-surface));
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .config-section {
    background: rgba(var(--m3-scheme-surface-container-low) / 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.45);
    border-radius: 1.35rem;
    padding: 1.6rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(0,0,10,0.12), inset 0 1px 0 rgba(255,255,255,0.03);
    transition: border-color 0.2s ease;
  }

  .config-section:hover {
    border-color: rgba(var(--m3-scheme-outline) / 0.35);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.3);
    position: relative;
    z-index: 1;
  }

  .section-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 14.5px;
    font-weight: 800;
    color: rgb(var(--m3-scheme-on-surface));
    letter-spacing: -0.01em;
    line-height: 1;
    margin: 0;
  }

  .section-subtitle {
    font-size: 11px;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.7);
    margin: 3px 0 0;
    line-height: 1;
  }

  .field-group { display: flex; flex-direction: column; gap: 6px; }

  .field-label {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.75);
    padding-left: 2px;
  }

  .field-input {
    width: 100%;
    background: rgba(var(--m3-scheme-surface-container-lowest) / 0.85) !important;
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.5) !important;
    color: rgb(var(--m3-scheme-on-surface)) !important;
    border-radius: 0.75rem;
    padding: 9px 13px;
    font-size: 13px;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }

  .field-input:focus {
    outline: none;
    border-color: rgba(var(--m3-scheme-primary) / 0.55) !important;
    background: rgba(var(--m3-scheme-surface-container-low) / 0.95) !important;
    box-shadow: 0 0 0 3px rgba(var(--m3-scheme-primary) / 0.1);
  }

  .field-input.field-error {
    border-color: rgba(var(--m3-scheme-error) / 0.55) !important;
  }

  .field-textarea { min-height: 90px; }

  .field-error-msg {
    font-size: 10px;
    color: rgb(var(--m3-scheme-error));
    padding-left: 2px;
    margin: 0;
  }

  .save-panel {
    background: rgba(var(--m3-scheme-surface-container-low) / 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.45);
    border-radius: 1.5rem;
    padding: 1.4rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(0,0,10,0.12), inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .view-all-link {
    font-size: 10px;
    font-weight: 800;
    color: rgb(var(--m3-scheme-primary));
    text-decoration: none;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transition: opacity 0.15s ease;
  }
  .view-all-link:hover { opacity: 0.75; }

  .saved-item {
    background: rgba(var(--m3-scheme-surface-container-lowest) / 0.8);
    border: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.4);
    border-radius: 1rem;
    padding: 12px 13px;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .saved-item:hover {
    border-color: rgba(var(--m3-scheme-primary) / 0.25);
    background: rgba(var(--m3-scheme-surface-container-low) / 0.9);
  }

  .saved-item-name {
    font-size: 13px;
    font-weight: 700;
    color: rgb(var(--m3-scheme-on-surface));
    line-height: 1;
  }

  .saved-item-url {
    font-size: 10px;
    font-family: monospace;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.5);
    margin: 0 0 8px;
    line-height: 1.2;
  }

  .saved-item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px solid rgba(var(--m3-scheme-outline-variant) / 0.25);
  }

  .saved-item-time {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(var(--m3-scheme-on-surface) / 0.3);
  }

  .saved-item-details {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgb(var(--m3-scheme-secondary));
    text-decoration: none;
  }
  .saved-item-details:hover { text-decoration: underline; }

  .empty-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    border: 1.5px dashed rgba(var(--m3-scheme-outline-variant) / 0.35);
    border-radius: 1.1rem;
    background: rgba(var(--m3-scheme-surface-container-lowest) / 0.5);
  }

  .empty-mini-text {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(var(--m3-scheme-on-surface-variant) / 0.4);
    margin: 0;
  }
</style>
