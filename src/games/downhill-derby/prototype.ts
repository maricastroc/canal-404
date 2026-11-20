import * as Phaser from "phaser";
import { H, W } from "./scenes/hud";
import { RaceScene, type SceneBridge } from "./scenes/RaceScene";

export type PrototypeHandle = {
  restart: () => void;
  togglePause: (force?: boolean) => void;
  applySettings: () => void;
  refresh: () => void;
  isPaused: () => boolean;
  confirmResults: () => boolean;
  focusResults: () => boolean;
  destroy: () => void;
};

export function mountPrototype(parent: HTMLElement, bridge: SceneBridge): PrototypeHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W,
    height: H,
    backgroundColor: "#8fd4f7",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: { keyboard: false, touch: { capture: true }, activePointers: 4 },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [RaceScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("bridge", bridge);
      },
    },
  });
  const scene = () => (game.scene.isActive("race") ? (game.scene.getScene("race") as RaceScene) : null);
  return {
    restart: () => scene()?.restartRace(),
    togglePause: (force) => scene()?.togglePause(force),
    applySettings: () => scene()?.applySettings(),
    refresh: () => {
      game.scale.getParentBounds();
      game.scale.refresh();
    },
    isPaused: () => scene()?.isPaused ?? false,
    confirmResults: () => scene()?.confirmResults() ?? false,
    focusResults: () => scene()?.focusResults() ?? false,
    destroy: () => game.destroy(true),
  };
}
