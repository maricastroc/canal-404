"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, LockIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { useSound } from "@/lib/audio/hooks";
import { P } from "@/lib/palette";
import type { PosterDef } from "./posters";

function family(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

async function drawPoster(canvas: HTMLCanvasElement, svg: SVGSVGElement, def: PosterDef) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const display = family("--font-luckiest", "Arial Black, sans-serif");
  const hand = family("--font-patrick", "Comic Sans MS, sans-serif");
  await Promise.all([document.fonts.load(`80px ${display}`), document.fonts.load(`40px ${hand}`)]).catch(() => undefined);
  const xml = new XMLSerializer().serializeToString(svg).replace(/<text[^>]*>\?\?<\/text>/g, "");
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
      ctx.fillText(t.text, 6, 8);
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
    <figure className={`paper-light flex flex-col border-[3px] border-ink p-3 shadow-[var(--shadow-ink)] wobbly-sm ${tilt}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border-[3px] border-ink bg-plum-800">
        {unlocked ? (
          <>
            <svg ref={svgRef} viewBox="0 0 600 800" width="600" height="800" className="hidden" aria-hidden>
              {def.art}
            </svg>
            <canvas ref={canvasRef} width={600} height={800} className="h-full w-full" aria-hidden />
            {!ready && <div className="absolute inset-0 grid place-items-center font-display text-cream">sintonizando...</div>}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <LockIcon className="w-14" />
            <p className="font-display text-sm uppercase tracking-wider text-plum-300">Bloqueado</p>
          </div>
        )}
      </div>
      <figcaption className="flex flex-1 flex-col gap-2 px-1 pt-3">
        <p className="font-display text-lg uppercase leading-tight text-ink">{unlocked ? def.title : "Pôster misterioso"}</p>
        {unlocked ? (
          <InkButton size="sm" tone="mint" onClick={download} disabled={!ready || saving} className="mt-auto self-start">
            <DownloadIcon className="size-5" /> {saving ? "Salvando..." : "Baixar PNG"}
            <span className="sr-only">: pôster {def.title}</span>
          </InkButton>
        ) : (
          <p className="mt-auto rounded-lg border-2 border-dashed border-ink/40 px-2 py-1 font-hand text-lg leading-snug text-ink-soft">
            Como liberar: {def.unlock.label}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
