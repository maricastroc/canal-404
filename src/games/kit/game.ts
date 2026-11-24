import * as Phaser from "phaser";

export function destroyGame(game: Phaser.Game) {
  const renderer = game.renderer;
  const gl = renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer ? renderer.gl : null;
  if (gl) game.events.once(Phaser.Core.Events.DESTROY, () => setTimeout(() => gl.getExtension("WEBGL_lose_context")?.loseContext(), 0));
  game.destroy(true);
}
