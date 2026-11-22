"use client";

import { useState } from "react";
import { CardIcon, KeyIcon, OfflineIcon, PencilIcon, TrashIcon, TrophyIcon } from "@/components/art/Icons";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { dateFormat } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { useSound } from "@/lib/audio/hooks";
import { join, leave, rename } from "@/lib/competition/client";
import { scheduleCloudCopy } from "@/lib/competition/cloud-copy";
import { useCloudCopyOnLeave, useCompetition } from "@/lib/competition/hooks";
import { CloudCopyOffer } from "./CloudCopyOffer";
import { NicknameForm } from "./NicknameForm";
import { RecoverForm } from "./RecoverForm";
import { RecoveryCodePanel } from "./RecoveryCodePanel";

const COPY = localized({
  "pt-BR": {
    leaveError: "Não deu para falar com o placar agora. Tente de novo daqui a pouco.",
    header: "Canal 404 · Carteirinha",
    tuning: "Sintonizando…",
    member: "Sócio do fliperama",
    since: (date: string) => `Desde ${date}`,
    soonTitle: "Em breve",
    soon: "O placar do canal ainda não estreou. Seu progresso continua salvo neste navegador.",
    offlineTitle: "Sem sinal",
    offline: "O placar está fora do ar agora. Os jogos funcionam normalmente.",
    noCardTitle: "Sem carteirinha",
    noCard: "Escolha um apelido para aparecer no placar do canal.",
    records: "Ver recordes",
    rename: "Trocar apelido",
    leave: "Sair do placar",
    move: "Levar para outro aparelho",
    haveCard: "Já tenho carteirinha",
    save: "Salvar",
    leaveTitle: "Sair do placar?",
    leaveText: "Seu apelido, seus resultados e a cópia do progresso saem do placar. O progresso neste navegador continua.",
    confirm: "Sim, apagar",
    cancel: "Cancelar",
    getCard: "Tirar carteirinha",
    later: "A carteirinha fica disponível quando o placar estiver no ar.",
    keepsTitle: "O que o placar guarda",
    keeps: [
      "O apelido que você escolher e um número de quatro dígitos para diferenciar apelidos iguais.",
      "Um código secreto guardado neste navegador, que funciona como sua carteirinha. Sem e-mail, sem senha, sem nome.",
      "Os resultados que você enviar para o placar.",
      "Uma cópia do progresso deste navegador (fases, estrelas, conquistas, segredos e aventuras salvas), para você levar a outro aparelho com um código de recuperação.",
    ],
    clear: "Se você limpar os dados do navegador, a carteirinha só volta com o código de recuperação. Ao sair do placar, apagamos tudo o que está no servidor na hora, inclusive a cópia do progresso.",
  },
  en: {
    leaveError: "Couldn't reach the board right now. Try again in a little while.",
    header: "Canal 404 · Membership card",
    tuning: "Tuning in…",
    member: "Arcade member",
    since: (date: string) => `Since ${date}`,
    soonTitle: "Coming soon",
    soon: "The channel's board hasn't premiered yet. Your progress is still saved in this browser.",
    offlineTitle: "No signal",
    offline: "The board is off the air right now. The games work as usual.",
    noCardTitle: "No membership card",
    noCard: "Pick a nickname to show up on the channel's board.",
    records: "See records",
    rename: "Change nickname",
    leave: "Leave the board",
    move: "Take it to another device",
    haveCard: "I already have a card",
    save: "Save",
    leaveTitle: "Leave the board?",
    leaveText: "Your nickname, your results and the copy of your progress come off the board. Your progress in this browser stays.",
    confirm: "Yes, delete",
    cancel: "Cancel",
    getCard: "Get your card",
    later: "The membership card becomes available when the board is on the air.",
    keepsTitle: "What the board keeps",
    keeps: [
      "The nickname you pick and a four-digit number to tell identical nicknames apart.",
      "A secret code saved in this browser that works as your membership card. No email, no password, no name.",
      "The results you send to the board.",
      "A copy of this browser's progress (levels, stars, achievements, secrets and saved adventures), so you can take it to another device with a recovery code.",
    ],
    clear: "If you clear your browser data, the membership card only comes back with the recovery code. When you leave the board, we delete everything on the server right away, including the copy of your progress.",
  },
});

function memberSince(iso: string, locale: Locale) {
  return dateFormat(locale, { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export function PlayerCard() {
  const { status, player } = useCompetition();
  const [mode, setMode] = useState<"view" | "rename" | "leave" | "code" | "recover">("view");
  const [leaveError, setLeaveError] = useState("");
  const { play } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();
  useCloudCopyOnLeave();

  const joinCard = async (nickname: string) => {
    const outcome = await join(nickname);
    if (outcome.ok) scheduleCloudCopy();
    return outcome;
  };

  const confirmLeave = async () => {
    const ok = await leave();
    if (ok) {
      play("back");
      setMode("view");
      setLeaveError("");
      return;
    }
    setLeaveError(copy.leaveError);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="paper relative -rotate-1 overflow-hidden border-[3px] border-ink shadow-[var(--shadow-ink-lg)] wobbly-alt" data-testid="player-card">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-tomato px-4 py-2">
          <p className="font-display text-sm uppercase tracking-wider text-ink">{copy.header}</p>
          <CardIcon className="size-6 text-ink" />
        </div>
        <div className="flex items-center gap-4 p-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-sky">
            <Mascot404 expression={player ? "happy" : status === "offline" ? "static" : "neutral"} className="w-20" />
          </div>
          <div className="min-w-0">
            {status === "checking" ? (
              <p className="font-display text-2xl uppercase text-ink-soft">{copy.tuning}</p>
            ) : player ? (
              <>
                <p className="font-display text-xs uppercase tracking-widest text-ink-soft">{copy.member}</p>
                <p className="break-words font-display text-3xl leading-none text-ink">{player.nickname}</p>
                <p className="mt-1 font-display text-lg tabular-nums text-plum-600">#{player.tag}</p>
                <p className="copy-sm text-ink-soft">{copy.since(memberSince(player.createdAt, locale))}</p>
              </>
            ) : status === "unconfigured" ? (
              <>
                <p className="font-display text-2xl uppercase leading-tight text-ink">{copy.soonTitle}</p>
                <p className="copy-sm mt-1 text-ink-soft">{copy.soon}</p>
              </>
            ) : status === "offline" && !player ? (
              <>
                <p className="flex items-center gap-2 font-display text-2xl uppercase leading-tight text-ink">
                  <OfflineIcon className="size-6" /> {copy.offlineTitle}
                </p>
                <p className="copy-sm mt-1 text-ink-soft">{copy.offline}</p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl uppercase leading-tight text-ink">{copy.noCardTitle}</p>
                <p className="copy-sm mt-1 text-ink-soft">{copy.noCard}</p>
              </>
            )}
          </div>
        </div>
        <div className="border-t-[3px] border-dashed border-ink/30 px-4 pb-4 pt-2">
          {player && mode === "view" ? (
            <div className="flex flex-wrap gap-2">
              <InkLink href="/records" tone="sun" size="sm">
                <TrophyIcon className="size-5" /> {copy.records}
              </InkLink>
              <InkButton tone="mint" size="sm" onClick={() => setMode("rename")} disabled={status !== "online"}>
                <PencilIcon className="size-5" /> {copy.rename}
              </InkButton>
              <InkButton tone="sky" size="sm" onClick={() => setMode("code")} disabled={status !== "online"}>
                <KeyIcon className="size-5" /> {copy.move}
              </InkButton>
              <InkButton tone="cream" size="sm" onClick={() => setMode("leave")} disabled={status !== "online"}>
                <TrashIcon className="size-5" /> {copy.leave}
              </InkButton>
            </div>
          ) : null}
          {player && mode === "rename" ? (
            <NicknameForm
              initial={player.nickname}
              submitLabel={copy.save}
              autoFocus
              onCancel={() => setMode("view")}
              onSubmit={async (nickname) => {
                const outcome = await rename(nickname);
                if (outcome.ok) setMode("view");
                return outcome;
              }}
            />
          ) : null}
          {player && mode === "leave" ? (
            <div role="alertdialog" aria-label={copy.leave} className="rounded-xl border-[3px] border-ink bg-cream-2 p-3">
              <p className="font-display text-lg uppercase tracking-wide text-ink">{copy.leaveTitle}</p>
              <p className="copy-sm mt-1 text-ink-soft">{copy.leaveText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <InkButton tone="tomato" size="sm" onClick={confirmLeave}>
                  {copy.confirm}
                </InkButton>
                <InkButton tone="cream" size="sm" onClick={() => setMode("view")}>
                  {copy.cancel}
                </InkButton>
              </div>
              {leaveError ? (
                <p role="alert" className="mt-2 text-sm font-bold text-tomato-deep">
                  {leaveError}
                </p>
              ) : null}
            </div>
          ) : null}
          {player && mode === "code" ? <RecoveryCodePanel recoveryAt={player.recoveryAt} onClose={() => setMode("view")} /> : null}
          {player && status === "online" && mode === "view" ? <CloudCopyOffer playerId={player.id} /> : null}
          {!player && status === "online" && mode === "recover" ? <RecoverForm onCancel={() => setMode("view")} onDone={() => setMode("view")} /> : null}
          {!player && status === "online" && mode !== "recover" ? (
            <>
              <NicknameForm submitLabel={copy.getCard} onSubmit={joinCard} />
              <button
                type="button"
                onClick={() => setMode("recover")}
                className="mt-3 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wider text-plum-600 underline decoration-2 underline-offset-4"
              >
                <KeyIcon className="size-4" /> {copy.haveCard}
              </button>
            </>
          ) : null}
          {!player && status !== "online" ? <p className="copy-sm text-ink-soft">{copy.later}</p> : null}
        </div>
      </div>
      <div className="paper border-[3px] border-ink p-5 shadow-[var(--shadow-ink)] wobbly">
        <h3 className="font-display text-xl uppercase tracking-wide text-ink">{copy.keepsTitle}</h3>
        <ul className="copy mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
          {copy.keeps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="copy mt-3 text-ink-soft">{copy.clear}</p>
      </div>
    </div>
  );
}
