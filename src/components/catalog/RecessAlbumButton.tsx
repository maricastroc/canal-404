"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { StickerIcon } from "@/components/art/Icons";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { ALBUM_EVENT, STICKER_IDS } from "@/games/operation-recess/album";
import { parseSave, SAVE_KEY } from "@/games/operation-recess/save";

const COPY = localized({
  "pt-BR": { open: (n: number, total: number) => `Álbum de figurinhas: ${n} de ${total}` },
  en: { open: (n: number, total: number) => `Sticker album: ${n} of ${total}` },
});

export function subscribeAlbum(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(ALBUM_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ALBUM_EVENT, onChange);
  };
}

export function readAlbum() {
  try {
    return window.localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

export function RecessAlbumButton({ onOpen, disabled, className = "" }: { onOpen: () => void; disabled: boolean; className?: string }) {
  const copy = useCopy(COPY);
  const reduced = useReducedMotion();
  const raw = useSyncExternalStore(subscribeAlbum, readAlbum, () => null);
  const count = parseSave(raw).stickers.length;
  const seen = useRef<number | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (seen.current !== null && count > seen.current) setBump((b) => b + 1);
    seen.current = count;
  }, [count]);
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      aria-label={copy.open(count, STICKER_IDS.length)}
      className={`press flex h-10 shrink-0 items-center gap-1 rounded-lg border-[3px] border-ink bg-bubblegum px-2 font-display text-sm tabular-nums text-ink shadow-[var(--shadow-ink-sm)] disabled:opacity-40 ${className}`}
    >
      <motion.span key={bump} aria-hidden className="grid place-items-center" initial={bump && !reduced ? { scale: 1.7, rotate: -18 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 12 }}>
        <StickerIcon className="size-6" />
      </motion.span>
      <span aria-hidden className="max-[399px]:hidden">
        {count}/{STICKER_IDS.length}
      </span>
    </button>
  );
}
