import * as Phaser from "phaser";
import { CANVAS } from "./scenes/layout";
import { NightScene, type Command, type NightBridge } from "./scenes/NightScene";

export type PrototypeHandle = {
  command: (cmd: Command) => void;
  refresh: () => void;
  destroy: () => void;
};

export function mountPrototype(parent: HTMLElement, bridge: NightBridge): PrototypeHandle {
  const size = CANVAS[bridge.orientation];
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: size.W,
    height: size.H,
    backgroundColor: "#0d0a1c",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    input: { keyboard: false, touch: { capture: true }, activePointers: 2 },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [NightScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("bridge", bridge);
      },
    },
  });
  const scene = () => (game.scene.isActive("night") ? (game.scene.getScene("night") as NightScene) : null);
  return {
    command: (cmd) => scene()?.command(cmd),
    refresh: () => {
      game.scale.getParentBounds();
      game.scale.refresh();
    },
    destroy: () => game.destroy(true),
  };
}
