import * as Phaser from "phaser";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide";
import { loadIcons } from "./icons";

const ARROWS = { "←": ArrowLeft, "→": ArrowRight, "↑": ArrowUp, "↓": ArrowDown } as const;

type Glyph = keyof typeof ARROWS;

const KEYS: Record<Glyph, string> = { "←": "kit-key-left", "→": "kit-key-right", "↑": "kit-key-up", "↓": "kit-key-down" };
const PATTERN = /[←→↑↓]/g;
const SLOT = " ";
const TEXTURE = 96;
const ICON_EM = 1.15;

export function loadKeyArrows(scene: Phaser.Scene) {
  const glyphs = (Object.keys(ARROWS) as Glyph[]).filter((glyph) => !scene.textures.exists(KEYS[glyph]));
  if (glyphs.length) loadIcons(scene, glyphs.map((glyph) => ({ key: KEYS[glyph], icon: ARROWS[glyph], size: TEXTURE, color: "#ffffff", strokeWidth: 2.8 })));
}

export function keyArrows(text: Phaser.GameObjects.Text) {
  const scene = text.scene;
  const images: Phaser.GameObjects.Image[] = [];
  let glyphs: Glyph[] = [];
  const setText = text.setText.bind(text);
  text.setText = ((value: string | string[]) => {
    const raw = Array.isArray(value) ? value.join("\n") : String(value ?? "");
    glyphs = [];
    return setText(
      raw.replace(PATTERN, (glyph) => {
        glyphs.push(glyph as Glyph);
        return SLOT;
      }),
    );
  }) as typeof text.setText;
  text.setText(text.text);

  const place = () => {
    while (images.length < glyphs.length) images.push(scene.add.image(0, 0, KEYS["→"]).setVisible(false));
    images.forEach((image, i) => {
      if (i >= glyphs.length) image.setVisible(false);
    });
    if (!glyphs.length) return;
    const style = text.style;
    const context = text.context;
    style.syncFont(text.canvas, context);
    const metrics = text.getTextMetrics();
    const lines = text.getWrappedText(text.text);
    const stroke = style.strokeThickness;
    const lineHeight = metrics.fontSize + stroke + text.lineSpacing;
    const widths = lines.map((line) => context.measureText(line).width + stroke);
    const textWidth = Math.max(...widths);
    const slot = context.measureText(SLOT).width;
    const cap = context.measureText("H").actualBoundingBoxAscent;
    const tint = typeof style.color === "string" ? Phaser.Display.Color.ValueToColor(style.color).color : 0xffffff;
    const size = metrics.fontSize * ICON_EM * text.scaleX;
    const left = text.x - text.displayOriginX * text.scaleX;
    const top = text.y - text.displayOriginY * text.scaleY;
    const container = text.parentContainer;
    let n = 0;
    lines.forEach((line, row) => {
      const shift = style.align === "center" ? (textWidth - widths[row]) / 2 : style.align === "right" ? textWidth - widths[row] : 0;
      for (let col = line.indexOf(SLOT); col !== -1 && n < glyphs.length; col = line.indexOf(SLOT, col + 1)) {
        const image = images[n];
        const lx = (text.padding.left ?? 0) + stroke / 2 + shift + context.measureText(line.slice(0, col)).width + slot / 2;
        const ly = (text.padding.top ?? 0) + stroke / 2 + row * lineHeight + metrics.ascent - cap / 2;
        if (container && image.parentContainer !== container) container.addAt(image, container.getIndex(text) + 1);
        image
          .setTexture(KEYS[glyphs[n]])
          .setDisplaySize(size, size)
          .setPosition(left + lx * text.scaleX, top + ly * text.scaleY)
          .setTint(tint)
          .setAlpha(text.alpha)
          .setVisible(text.visible)
          .setScrollFactor(text.scrollFactorX, text.scrollFactorY)
          .setDepth(text.depth);
        image.cameraFilter = text.cameraFilter;
        n += 1;
      }
    });
  };

  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, place);
  text.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, place);
    images.forEach((image) => image.destroy());
  });
  return text;
}
