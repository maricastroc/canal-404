import * as Phaser from "phaser";

export function reportFailedLoads(scene: Phaser.Scene, onError: (error: unknown) => void) {
  if (scene.load.list.size === 0) return;
  scene.load.once(Phaser.Loader.Events.COMPLETE, (_loader: Phaser.Loader.LoaderPlugin, _loaded: number, failed: number) => {
    if (failed > 0) onError(new Error(`${failed} game files failed to load`));
  });
}
