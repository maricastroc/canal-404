import type { TestHill } from "../sim/testHill";
import { INK } from "./cart";
import type { Builder, Zone, ZoneKey } from "./terrain";

export const PROP_FILES: [string, string][] = [
  ["p-tree-a", "off-air-vacation/tree-a"],
  ["p-tree-b", "off-air-vacation/tree-b"],
  ["p-tree-c", "off-air-vacation/tree-c"],
  ["p-umbrella-a", "off-air-vacation/umbrella-a"],
  ["p-umbrella-b", "off-air-vacation/umbrella-b"],
  ["p-trash", "dead-end-street/trash-can"],
  ["p-flamingo", "dead-end-street/flamingo"],
  ["p-gnome-gold", "dead-end-street/gnome-gold"],
  ["p-birdhouse", "dead-end-street/birdhouse"],
  ["p-bird", "dead-end-street/bird"],
  ["p-tire", "dead-end-street/tire"],
  ["p-crate", "dead-end-street/crate"],
  ["p-balloon", "dead-end-street/balloon"],
  ["p-duck", "dead-end-street/duck"],
  ["p-bin", "operation-recess/bin"],
  ["p-bench", "operation-recess/bench"],
  ["p-plant", "operation-recess/plant-big"],
  ["p-pennants", "operation-recess/pennants"],
  ["p-lamp", "operation-recess/lamp-post"],
  ["p-picnic", "operation-recess/picnic-table"],
  ["p-fence", "pajama-war/fence"],
  ["p-bush", "pajama-war/bush"],
  ["p-cooler", "pajama-war/cooler"],
  ["p-grill", "pajama-war/grill"],
  ["p-boombox", "pajama-war/boombox"],
];

type Kit = { w: number; place: (x: number) => void };

export function dressGaps(b: Builder, zones: Zone[], track: TestHill): { x: number; depth: number }[] {
  const deck = track.surfaces[1];
  const spans = b.taken.slice().sort((p, q) => p[0] - q[0]);
  for (const rp of track.ramps) spans.push([rp.x0 - 220, rp.x1 + 260]);
  const blocked = (x0: number, x1: number) => (deck && x1 + 300 > deck.x0 && x0 - 300 < deck.x1) || spans.some(([a, c]) => x1 > a && x0 < c);
  let seed = 4040;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const image = (key: string, x: number, h: number, depth: number, sink = 4, flip = false) => {
    const tex = b.scene.textures.get(key).getSourceImage();
    const scale = h / (tex.height || h);
    const w = (tex.width || h) * scale;
    const y = b.floorY(x - w / 2, x + w / 2) + sink;
    const img = b.add(b.chunkFor(x), b.scene.add.image(x, y, key).setOrigin(0.5, 1));
    img.setScale(scale).setDepth(depth).setFlipX(flip);
    return img;
  };
  const graphics = (x: number, depth: number) => {
    const g = b.add(b.chunkFor(x), b.scene.add.graphics());
    g.setDepth(depth);
    return g;
  };

  const kits: Record<ZoneKey, Kit[]> = {
    neighborhood: [],
    street: [
      { w: 300, place: (x) => image(["p-tree-a", "p-tree-b", "p-tree-c"][Math.floor(rnd() * 3)], x, 330, -19.5, 8, rnd() < 0.5) },
      { w: 150, place: (x) => {
        image("p-trash", x - 36, 84, -7);
        image("p-bin", x + 38, 74, -7.1);
      } },
      { w: 150, place: (x) => {
        image("p-flamingo", x - 30, 116, -7);
        image("p-gnome-gold", x + 40, 66, -6.9);
      } },
      { w: 90, place: (x) => {
        const y = b.backY(x) + 4;
        const g = graphics(x, -7.2);
        g.fillStyle(INK, 1);
        g.fillRect(x - 6, y - 170, 12, 170);
        const house = b.add(b.chunkFor(x), b.scene.add.image(x, y - 166, "p-birdhouse").setOrigin(0.5, 1));
        house.setScale(78 / 90).setDepth(-7.1);
        const bird = b.add(b.chunkFor(x), b.scene.add.image(x + 16, y - 236, "p-bird").setOrigin(0.5, 1));
        bird.setScale(34 / 44).setDepth(-7);
      } },
      { w: 230, place: (x) => {
        image("p-fence", x - 56, 96, -8);
        image("p-fence", x + 56, 96, -8.01);
      } },
      { w: 200, place: (x) => {
        image("p-bench", x, 74, -7);
        const bird = image("p-bird", x + 40, 30, -6.9, -66);
        bird.setFlipX(true);
      } },
      { w: 170, place: (x) => image("p-bush", x, 104, -8, 10) },
      { w: 90, place: (x) => image("p-plant", x, 126, -7) },
    ],
    market: [
      { w: 240, place: (x) => {
        image(rnd() < 0.5 ? "p-umbrella-a" : "p-umbrella-b", x, 270, -11);
        image("p-crate", x - 40, 62, -10.9);
        image("p-crate", x + 26, 62, -10.8);
        image("p-crate", x - 8, 62, -10.7, -56);
      } },
      { w: 170, place: (x) => {
        image("p-cooler", x, 72, -10);
        image("p-boombox", x + 4, 52, -9.9, -66);
      } },
      { w: 150, place: (x) => {
        image("p-grill", x, 116, -10);
        const g = graphics(x, -9.9);
        const y = b.backY(x) - 130;
        g.fillStyle(0xffffff, 0.55);
        for (const [dx, dy, r] of [[-6, 0, 18], [10, -34, 22], [-4, -74, 26]]) g.fillCircle(x + dx, y + dy, r);
      } },
      { w: 130, place: (x) => {
        const y = b.backY(x) + 4;
        const g = graphics(x, -10.2);
        g.fillStyle(INK, 1);
        g.fillRect(x - 5, y - 200, 10, 200);
        g.lineStyle(2, INK, 0.8);
        const tops: [number, number][] = [[-44, -330], [0, -360], [44, -326]];
        for (const [dx, dy] of tops) {
          g.beginPath();
          g.moveTo(x, y - 196);
          g.lineTo(x + dx, y + dy + 70);
          g.strokePath();
        }
        tops.forEach(([dx, dy], i) => {
          const balloon = b.add(b.chunkFor(x), b.scene.add.image(x + dx, y + dy + 72, "p-balloon").setOrigin(0.5, 1));
          balloon.setScale(70 / 80).setDepth(-10.1).setTint([0xffffff, 0xffb3c7, 0xfff1a8][i]);
        });
      } },
      { w: 150, place: (x) => {
        image("p-crate", x - 36, 64, -10);
        image("p-crate", x + 32, 64, -10.1);
        image("p-crate", x - 2, 64, -9.9, -58);
      } },
    ],
    works: [
      { w: 140, place: (x) => {
        image("p-tire", x, 56, -9);
        image("p-tire", x + 6, 56, -8.9, -48);
        image("p-tire", x - 4, 56, -8.8, -96);
      } },
      { w: 210, place: (x) => {
        const y = b.floorY(x - 100, x + 100) + 4;
        const g = graphics(x, -9.5);
        for (const [dx, dy] of [[-56, 0], [56, 0], [0, -86]]) {
          g.fillStyle(INK, 1);
          g.fillCircle(x + dx, y + dy - 50, 52);
          g.fillStyle(0xb9b2c8, 1);
          g.fillCircle(x + dx, y + dy - 50, 46);
          g.fillStyle(0x6f6788, 1);
          g.fillCircle(x + dx, y + dy - 50, 26);
        }
      } },
      { w: 120, place: (x) => {
        const y = b.backY(x) + 4;
        const g = graphics(x, -9.4);
        g.fillStyle(INK, 1);
        g.fillRoundedRect(x - 48, y - 230, 96, 230, 10);
        g.fillStyle(0x3d8fd6, 1);
        g.fillRoundedRect(x - 42, y - 224, 84, 220, 8);
        g.fillStyle(0x2d6fb0, 1);
        g.fillRect(x - 42, y - 224, 84, 26);
        g.fillStyle(INK, 1);
        g.fillRect(x - 32, y - 186, 64, 180);
        g.fillStyle(0x58a6e6, 1);
        g.fillRect(x - 27, y - 181, 54, 170);
        g.fillStyle(INK, 1);
        g.fillCircle(x + 16, y - 98, 5);
        g.fillStyle(0xfff1a8, 1);
        g.fillCircle(x, y - 160, 9);
        g.fillStyle(0x58a6e6, 1);
        g.fillCircle(x + 5, y - 163, 8);
      } },
      { w: 150, place: (x) => {
        image("p-crate", x - 36, 64, -9);
        image("p-crate", x + 32, 64, -9.1);
        image("p-bin", x + 70, 74, -9.2);
      } },
    ],
    final: [
      { w: 470, place: (x) => {
        const y0 = b.backY(x - 210);
        const y1 = b.backY(x + 210);
        const g = graphics(x, -15.6);
        g.fillStyle(INK, 1);
        g.fillRect(x - 216, y0 - 300, 12, 304);
        g.fillRect(x + 204, y1 - 300, 12, 304);
        const flags = b.add(b.chunkFor(x), b.scene.add.image(x, (y0 + y1) / 2 - 296, "p-pennants").setOrigin(0.5, 0));
        flags.setScale(420 / 420, 0.9).setDepth(-15.5).setRotation(Math.atan2(y1 - y0, 420));
      } },
      { w: 300, place: (x) => {
        image("p-umbrella-b", x - 40, 270, -12);
        image("p-cooler", x + 60, 70, -11.9);
        image("p-grill", x - 80, 110, -11.8);
      } },
      { w: 260, place: (x) => {
        image("p-picnic", x, 92, -12);
        image("p-boombox", x - 40, 46, -11.9, -60);
      } },
      { w: 130, place: (x) => image("p-lamp", x, 300, -12) },
    ],
  };

  const waiting: { x: number; depth: number }[] = [];
  const street = zones.find((z) => z.key === "street") ?? { x0: 0, x1: 0 };
  const landmark = (from: number, w: number, place: (x: number) => void) => {
    if (b.sample) return;
    for (let x = from; x < street.x1 - w; x += 40) {
      if (blocked(x - 30, x + w + 30)) continue;
      place(x + w / 2);
      b.taken.push([x - 30, x + w + 30]);
      return;
    }
  };
  landmark(street.x0 + 2600, 330, (x) => {
    const y = b.floorY(x - 160, x + 160) + 4;
    const g = graphics(x, -7.4);
    g.fillStyle(INK, 1);
    g.fillRect(x - 150, y - 250, 12, 250);
    g.fillRect(x + 138, y - 250, 12, 250);
    g.fillRoundedRect(x - 170, y - 268, 340, 30, 8);
    g.fillStyle(0x2f86c9, 1);
    g.fillRoundedRect(x - 164, y - 262, 328, 18, 6);
    g.fillStyle(0xbfe6f7, 0.55);
    g.fillRect(x - 138, y - 236, 276, 150);
    g.lineStyle(4, INK, 0.6);
    g.strokeRect(x - 138, y - 236, 276, 150);
    const bench = b.add(b.chunkFor(x), b.scene.add.image(x + 20, y, "p-bench").setOrigin(0.5, 1));
    bench.setScale(150 / 250).setDepth(-7.3);
    const sign = graphics(x + 200, -7.2);
    sign.fillStyle(INK, 1);
    sign.fillRect(x + 196, y - 230, 10, 234);
    sign.fillCircle(x + 201, y - 250, 38);
    sign.fillStyle(0xffc83d, 1);
    sign.fillCircle(x + 201, y - 250, 32);
    sign.fillStyle(INK, 1);
    sign.fillRoundedRect(x + 181, y - 266, 40, 26, 5);
    sign.fillCircle(x + 189, y - 238, 5);
    sign.fillCircle(x + 213, y - 238, 5);
    sign.fillStyle(0xbfe6f7, 1);
    sign.fillRect(x + 185, y - 262, 14, 9);
    sign.fillRect(x + 203, y - 262, 14, 9);
    waiting.push({ x: x - 80, depth: -7.35 });
  });
  landmark(street.x0 + 10500, 120, (x) => {
    const y = b.backY(x) + 4;
    const g = graphics(x, -7.2);
    g.fillStyle(INK, 1);
    g.fillRect(x - 7, y - 150, 14, 150);
    g.fillEllipse(x, y - 214, 124, 160);
    g.fillStyle(0xff8a3d, 1);
    g.fillEllipse(x, y - 214, 112, 148);
    g.fillStyle(0xc4612a, 1);
    g.fillEllipse(x + 6, y - 198, 78, 104);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x - 10, y - 232, 32, 50, 6);
    g.fillStyle(0xd8d3e6, 1);
    g.fillRoundedRect(x - 6, y - 228, 24, 42, 4);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x - 22, y - 236, 12, 40, 5);
  });

  for (const zone of zones) {
    if (b.sample && zone.key === "street") continue;
    const list = kits[zone.key];
    const lastAt = list.map(() => -Infinity);
    let x = zone.x0 + 200;
    while (x < zone.x1 - 200) {
      const start = Math.floor(rnd() * list.length);
      let k = -1;
      for (let i = 0; i < list.length; i += 1) {
        const c = (start + i) % list.length;
        if (x - lastAt[c] > 3200) {
          k = c;
          break;
        }
      }
      if (k < 0) {
        x += 200;
        continue;
      }
      const kit = list[k];
      const x0 = x;
      const x1 = x + kit.w;
      if (!blocked(x0 - 30, x1 + 30)) {
        kit.place(x + kit.w / 2);
        b.taken.push([x0 - 30, x1 + 30]);
        lastAt[k] = x;
        x = x1 + 160 + rnd() * 420;
      } else x += 60;
    }
  }
  return waiting;
}
