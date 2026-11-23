"use client";

import { useEffect, useState } from "react";
import { InkButton } from "@/components/ui/Primitives";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { dateFormat } from "@/i18n/format";
import { useSound } from "@/lib/audio/hooks";
import { checkCloudCopy, keepThisBrowser, restoreCloudCopy } from "@/lib/competition/cloud-copy";
import type { CloudCopy } from "@/lib/competition/recovery";

const COPY = localized({
  "pt-BR": {
    title: "Achamos uma cópia do seu progresso",
    text: (date: string) => `O placar guardou uma cópia de ${date}, diferente do progresso deste navegador. Trazer a cópia substitui o progresso daqui; manter faz o placar guardar o daqui no lugar.`,
    bring: "Trazer a cópia",
    keep: "Manter o deste navegador",
    working: "Um instante…",
    failed: "Não deu agora. Tente de novo daqui a pouco.",
  },
  en: {
    title: "We found a copy of your progress",
    text: (date: string) => `The board kept a copy from ${date} that's different from this browser's progress. Bringing the copy replaces the progress here; keeping makes the board store this one instead.`,
    bring: "Bring the copy",
    keep: "Keep this browser's",
    working: "One moment…",
    failed: "That didn't work right now. Try again in a little while.",
  },
});

export function CloudCopyOffer({ playerId }: { playerId: string }) {
  const [offer, setOffer] = useState<CloudCopy | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { play } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();

  useEffect(() => {
    let alive = true;
    void checkCloudCopy().then((check) => {
      if (alive) setOffer(check.kind === "offer" ? check.copy : null);
    });
    return () => {
      alive = false;
    };
  }, [playerId]);

  if (!offer) return null;

  const bring = () => {
    setBusy(true);
    if (restoreCloudCopy(offer)) {
      play("confirm");
      window.location.reload();
      return;
    }
    setBusy(false);
    setError(copy.failed);
  };

  const keep = async () => {
    setBusy(true);
    const ok = await keepThisBrowser();
    setBusy(false);
    if (ok) {
      play("click");
      setOffer(null);
      return;
    }
    setError(copy.failed);
  };

  const date = dateFormat(locale, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(offer.savedAt));

  return (
    <div role="alertdialog" aria-label={copy.title} className="mt-3 rounded-xl border-[3px] border-ink bg-sun p-3" data-testid="cloud-copy-offer">
      <p className="font-display text-lg uppercase tracking-wide text-ink">{copy.title}</p>
      <p className="copy-sm mt-1 text-ink">{copy.text(date)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <InkButton tone="mint" size="sm" onClick={bring} disabled={busy}>
          {busy ? copy.working : copy.bring}
        </InkButton>
        <InkButton tone="cream" size="sm" onClick={keep} disabled={busy}>
          {copy.keep}
        </InkButton>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-bold text-tomato-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
