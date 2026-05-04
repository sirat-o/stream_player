import shaka from "shaka-player/dist/shaka-player.ui.js";

/**
 * A Shaka UI custom button to skip to the live edge.
 */
export class SkipToLiveButton extends shaka.ui.Element {
  constructor(parent, controls) {
    super(parent, controls);

    // Create the button element
    this.button_ = document.createElement("button");
    this.button_.title = "Skip to Live";
    this.button_.textContent = "LIVE";
    this.button_.classList.add("shaka-skip-live-button");
    this.parent.appendChild(this.button_);

    // Handle clicks
    this.eventManager.listen(this.button_, "click", () => {
      const player = this.player;
      const video = this.controls.getVideo();

      console.log(player);

      player.goToLive();

      return;

      // Seek to live edge
      const liveEdge = player.seekRange().end;
      video.currentTime = liveEdge;
      video.play();
    });
  }
}

/**
 * Factory to create instances at runtime
 */
export class SkipToLiveButtonFactory {
  create(rootElement, controls) {
    return new SkipToLiveButton(rootElement, controls);
  }
}
