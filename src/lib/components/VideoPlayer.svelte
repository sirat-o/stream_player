<script>
  import { onMount, onDestroy } from "svelte";

  // @ts-ignore
  import shaka from "shaka-player/dist/shaka-player.ui.js";
  import { parseHeaders } from "$lib";
  import JSON5 from "json5";
  import { TauriFetchLoader } from "$lib/TauriFetchLoader.js";
  import { getSettings } from "$lib/settingsStore.js";
  import { SkipToLiveButtonFactory } from "$lib/ShakaLiveButton.js";
  import data from "@iconify-icons/mdi/play-circle";

  // Register the button with Shaka UI
  shaka.ui.Controls.registerElement(
    "skip_to_live", // Reference name for UI config
    new SkipToLiveButtonFactory()
  );

  /**
   * @type {StreamFormData}
   */
  export let stream;
  /** @type {(dimensions: { width: number, height: number }) => void} */
  export let onVideoSize = () => {};

  let player, ui, video, container;

  /**
   *
   * @param {Object} err
   */
  function onErrorEvent(err) {
    console.error(err);

    /**
     * @param {Number} code
     */
    const getErrorName = (code) => {
      return Object.keys(shaka.util.Error.Code).find(
        (name) => shaka.util.Error.Code[name] === code
      );
    };

    const errName = getErrorName(err.code);
    let heading = `${errName} (${err.message})`;

    let message = "";

    if (shaka.util.Error.Code.BAD_HTTP_STATUS === err.code) {
      message = `Request failed. HTTP Status Code ${err.data[1]}.`;
    }

    if (shaka.util.Error.Code.NO_LICENSE_SERVER_GIVEN === err.code) {
      message = `No license server was given for the key system: ${err.data[0]}`;
    }

    const spinner = container.querySelector(".shaka-spinner-container");
    spinner.innerHTML = `
    <div class="flex justify-center items-center text-center flex-col gap-2 px-4" style="max-width:65%">
    <div class="mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m-1-4h2V7h-2zm1 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg></div>
    <h3 class="text-base font-bold">${heading}</h3>
    <p class="text-sm">${message}</p>
    </div>
    `;
  }

  onMount(async () => {
    shaka.net.NetworkingEngine.registerScheme(
      "http",
      TauriFetchLoader.parse,
      shaka.net.NetworkingEngine.PluginPriority.PREFERRED,
      false
    );
    shaka.net.NetworkingEngine.registerScheme(
      "https",
      TauriFetchLoader.parse,
      shaka.net.NetworkingEngine.PluginPriority.PREFERRED,
      false
    );
    shaka.net.NetworkingEngine.registerScheme(
      "blob",
      TauriFetchLoader.parse,
      shaka.net.NetworkingEngine.PluginPriority.PREFERRED,
      false
    );

    player = new shaka.Player();

    player.addEventListener(
      "shaka.Player.MediaQualityChangedEvent",
      (event) => {
        console.log(event);
      },
      true
    );

    ui = new shaka.ui.Overlay(player, container, video);

    const config = {
      preferDocumentPictureInPicture: false,
      singleClickForPlayAndPause: false,
      addSeekBar: true,
      addBigPlayButton: false,

      seekBarColors: {
        base: "rgba(255,255,255,.2)",
        buffered: "rgba(255,255,255,.4)",
        played: "rgb(255,0,0)",
      },

      volumeBarColors: {
        base: "rgba(255, 255, 255, 0.54)",
        level: "rgb(255, 255, 255)",
      },

      controlPanelElements: [
        "play_pause",

        //"skip_to_live",

        "time_and_duration",

        "mute",
        "volume",

        "spacer",

        "captions",

        "overflow_menu",

        "picture_in_picture",

        "fullscreen",
      ],
    };
    ui.configure(config);

    player.configure({
      manifest: {
        dash: {
          autoCorrectDrift: true,

          //ignoreMinBufferTime: true,
          ignoreSuggestedPresentationDelay: true,
          //updatePeriod: 10,
        },

        hls: {
          liveSegmentsDelay: 3,
        },
      },
      abr: {
        enabled: false,
        preferNetworkInformationBandwidth: true,
      },
      streaming: {
        observeQualityChanges: true,
        preferNativeDash: true,
        inaccurateManifestTolerance: 0,
        rebufferingGoal: 5,
        bufferingGoal: 15,
        //lowLatencyMode: true,
        segmentPrefetchLimit: 3,
      },
    });

    player.attach(video);

    const settings = getSettings();
    video.muted = settings.playMuted;

    const volume = localStorage.getItem("player_volume");

    if (volume) {
      video.volume = volume;
      video.dispatchEvent(new CustomEvent("volumechange"));
    }

    loadStream();
  });

  const loadStream = () => {
    const spinner = container.querySelector(".shaka-spinner-container");

    if (spinner) {
      spinner.setAttribute("style", "display:flex!important");
    }

    let mimeType = null;

    let streamType = "progressive";

    const streamUrlObj = new URL(stream.streamUrl);

    if (stream.streamType === "auto") {
      if (streamUrlObj.pathname.includes(".m3u")) {
        streamType = "hls";
      } else if (streamUrlObj.pathname.includes(".mpd")) {
        streamType = "dash";
      }
    } else {
      streamType =
        stream.streamType === "application/dash+xml" ? "dash" : "hls";
      mimeType = stream.streamType;
    }

    if (streamType === "dash") {
      player.configure("streaming.lowLatencyMode", false);
    }

    const additionalHeaders = parseHeaders(stream.requestHeaders);
    const licenseHeaders = parseHeaders(stream.licenseHeaders);
    const certificateHeaders = parseHeaders(stream.certificateHeaders);

    // Make an headers object with the necessary headers
    // Accurate referer and origin must be set otherwise some servers will reject the request
    const headers = {
      referer:
        stream.referer.trim().length > 0
          ? stream.referer.trim()
          : streamUrlObj.origin + "/",
      origin:
        stream.origin.trim().length > 0
          ? stream.origin.trim()
          : streamUrlObj.origin,
      ...additionalHeaders,
    };

    if (stream.userAgent.trim().length) {
      headers["user-agent"] = stream.userAgent.trim();
    } else {
      // Force an Android user-agent by default as most dash streams expect them for some reason
      headers["user-agent"] =
        "Dalvik/2.1.0 (Linux; U; Android 11; MI 6X Build/RQ3A.211001.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36";
    }

    if (stream.cookie.trim().length) {
      headers["cookie"] = stream.cookie.trim();
    }

    // Handle inline clearkey DRM
    if (
      stream.drmScheme === "clearkey_inline" &&
      stream.clearKey.trim().length > 0
    ) {
      const parts = stream.clearKey.split(":");

      if (parts.length === 2) {
        const kid = parts[0].trim();
        const kvalue = parts[1].trim();

        const clearkeyDRM = {
          clearKeys: {},
        };

        clearkeyDRM.clearKeys[kid] = kvalue;

        player.configure("drm", clearkeyDRM);
      }
    }

    if (
      stream.drmScheme === "com.widevine.alpha" ||
      stream.drmScheme === "com.microsoft.playready"
    ) {
      const widevineConfig = {
        servers: {
          [stream.drmScheme]: stream.licenseUrl.trim(),
        },
      };

      if (stream.certificateUrl.trim().length) {
        widevineConfig.advanced = {
          [stream.drmScheme]: {
            serverCertificate: stream.certificateUrl.trim(),
          },
        };
      }

      player.configure("drm", widevineConfig);
    }

    if (stream.drmScheme === "org.w3.clearkey") {
      const clearKeyConfig = {
        servers: {
          "org.w3.clearkey": stream.licenseUrl.trim(),
        },
      };

      player.configure("drm", clearKeyConfig);
    }

    const networkingEngine = player.getNetworkingEngine();

    // Register a request filter to set headers for specific requests
    // @ts-ignore
    networkingEngine.registerRequestFilter((type, request) => {
      // By default all requests will have the custom request headers set
      request.headers = {
        ...request.headers,
        ...headers,
      };

      // Can be overridden for license and certificate requests
      if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
        request.headers = {
          ...request.headers,
          ...licenseHeaders,
        };

        // If content type is missing for clearkey server license request use json as default
        // as many servers expect that
        if (
          stream.drmScheme === "org.w3.clearkey" &&
          !request.headers["content-type"]
        ) {
          request.headers["content-type"] = "application/json";
        }
      }

      if (type == shaka.net.NetworkingEngine.RequestType.SERVER_CERTIFICATE) {
        request.headers = {
          ...request.headers,
          ...certificateHeaders,
        };
      }
    });

    if (stream.shakaConfig.trim().length) {
      try {
        const additionalConfig = JSON5.parse(stream.shakaConfig);
        player.configure(additionalConfig);
      } catch (err) {
        console.error(err);
      }
    }

    player
      .load(stream.streamUrl, null, mimeType)
      .then(() => {
        if (spinner) {
          spinner.removeAttribute("style");
        }
      })
      .catch(onErrorEvent);
  };

  onDestroy(() => {
    if (ui) {
      ui.destroy();
    }

    if (player) {
      player.destroy();
    }
  });

  /**
   *
   * @param event {Event}
   */
  function handleVolumeChange(event) {
    const target = /** @type {HTMLVideoElement} */ (event.target);
    localStorage.setItem("player_volume", target.volume.toString());
  }

  /**
   *
   * @param event {WheelEvent}
   */
  function handleVolumeControl(event) {
    const target = /** @type {Element} */ (event.target);
    if (!target.closest(".shaka-mute-button, .shaka-volume-bar-container")) {
      return;
    }
    const volumeChange = 0.06;

    if (event.deltaY < 0) {
      // Scrolling up increases volume
      video.volume = Math.min(1, video.volume + volumeChange);
    } else {
      // Scrolling down decreases volume
      video.volume = Math.max(0, video.volume - volumeChange);
    }
  }

  function notifyVideoSize() {
    if (!video?.videoWidth || !video?.videoHeight) {
      return;
    }

    onVideoSize({
      width: video.videoWidth,
      height: video.videoHeight,
    });
  }
</script>

<div
  class="!m-0 w-full h-full liv-theme youtube-theme bg-black"
  bind:this={container}
  on:wheel={handleVolumeControl}
>
  <!-- svelte-ignore a11y-media-has-caption -->
  <video
    on:volumechange={handleVolumeChange}
    on:loadedmetadata={notifyVideoSize}
    on:resize={notifyVideoSize}
    bind:this={video}
    {...$$restProps}
    autoplay
    style="object-fit:contain; background:#000;"
    class="w-full h-full block"
  ></video>
</div>
