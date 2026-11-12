"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, LockIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { useSound } from "@/lib/audio/hooks";
import { P } from "@/lib/palette";
import { POSTER_SHADOW } from "./posterArt";
import type { PosterDef } from "./posters";

function family(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function embeddedFonts(variables: string[]) {
  const names = new Map<string, string>();
  for (const variable of variables) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    if (value) names.set(value.split(",")[0].trim().replace(/['"]/g, ""), `${variable}:${value}`);
  }
  const faces: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      if (!names.has(rule.style.getPropertyValue("font-family").trim().replace(/['"]/g, ""))) continue;
      const match = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue("src"));
      if (!match) continue;
      const url = new URL(match[1], sheet.href ?? document.baseURI).href;
      const data = await fetch(url)
        .then((r) => r.blob())
        .then(blobToDataUrl)
        .catch(() => null);
      if (data) faces.push(rule.cssText.replace(match[0], `url("${data}")`));
    }
  }
  return `<style>svg{${[...names.values()].join(";")}}${faces.join("")}</style>`;
}

async function drawPoster(canvas: HTMLCanvasElement, svg: SVGSVGElement, def: PosterDef) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const display = family("--font-luckiest", "Arial Black, sans-serif");
  const hand = family("--font-patrick", "Comic Sans MS, sans-serif");
  await Promise.all([document.fonts.load(`80px ${display}`), document.fonts.load(`40px ${hand}`)]).catch(() => undefined);
  const fonts = await embeddedFonts(["--font-luckiest"]);
  const xml = new XMLSerializer()
    .serializeToString(svg)
    .replace(/^(<svg[^>]*>)/, `$1${fonts}`);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const t of def.texts) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(((t.rotate ?? 0) * Math.PI) / 180);
    ctx.font = `${t.size}px ${t.font === "hand" ? hand : display}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.lineJoin = "round";
    if (t.stroke) {
      ctx.fillStyle = P.ink;
      ctx.fillText(t.text, POSTER_SHADOW.x, POSTER_SHADOW.y);
      ctx.lineWidth = t.stroke;
      ctx.strokeStyle = P.ink;
      ctx.strokeText(t.text, 0, 0);
    }
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

export function PosterCard({ def, unlocked, index }: { def: PosterDef; unlocked: boolean; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const { play } = useSound();

  useEffect(() => {
    if (!unlocked || !svgRef.current || !canvasRef.current) return;
    let cancelled = false;
    drawPoster(canvasRef.current, svgRef.current, def)
      .then(() => !cancelled && setReady(true))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [def, unlocked]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    play("confirm");
    canvas.toBlob((blob) => {
      setSaving(false);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = def.file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");
  };

  const tilt = index % 2 ? "rotate-1" : "-rotate-1";

  return (
    <figure className={`paper-light flex h-full flex-col border-[3px] border-ink p-3 shadow-[var(--shadow-ink)] wobbly-sm ${tilt}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border-[3px] border-ink bg-plum-800">
        {unlocked ? (
          <>
            <svg ref={svgRef} viewBox="0 0 600 800" width="600" height="800" className="hidden" aria-hidden>
              {def.art}
            </svg>
            <canvas ref={canvasRef} width={600} height={800} className="h-full w-full" aria-hidden />
            {!ready && <div className="tag-label absolute inset-0 grid place-items-center text-sm text-cream">Sintonizando…</div>}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(-45deg,transparent_0_14px,rgb(255_255_255/0.04)_14px_28px)] p-4 text-center text-plum-300">
            <span className="grid size-20 place-items-center rounded-full border-[3px] border-dashed border-plum-500 bg-plum-700">
              <LockIcon className="size-9" />
            </span>
            <p className="tag-label text-sm">Bloqueado</p>
          </div>
        )}
      </div>
      <figcaption className="flex flex-1 flex-col gap-3 px-1 pt-3">
        <p className="card-title text-ink">
          {unlocked ? (
            def.title
          ) : (
            <>
              Pôster {String(index + 1).padStart(2, "0")} <span className="text-plum-600">· ???</span>
            </>
          )}
        </p>
        {unlocked ? (
          <InkButton size="sm" tone="mint" onClick={download} disabled={!ready || saving} className="mt-auto self-start">
            <DownloadIcon className="size-5" /> {saving ? "Salvando..." : "Baixar imagem"}
            <span className="sr-only">: pôster {def.title}</span>
          </InkButton>
        ) : (
          <p className="copy-sm mt-auto rounded-lg border-2 border-dashed border-ink/40 px-2.5 py-1.5 text-ink-soft">{def.unlock.label}</p>
        )}
      </figcaption>
    </figure>
  );
}
