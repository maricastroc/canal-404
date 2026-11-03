"use client";

import { useState } from "react";
import { CardIcon, OfflineIcon, PencilIcon, TrashIcon } from "@/components/art/Icons";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton } from "@/components/ui/Primitives";
import { useSound } from "@/lib/audio/hooks";
import { join, leave, rename } from "@/lib/competition/client";
import { useCompetition } from "@/lib/competition/hooks";
import { NicknameForm } from "./NicknameForm";

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}

export function PlayerCard() {
  const { status, player } = useCompetition();
  const [mode, setMode] = useState<"view" | "rename" | "leave">("view");
  const [leaveError, setLeaveError] = useState("");
  const { play } = useSound();

  const confirmLeave = async () => {
    const ok = await leave();
    if (ok) {
      play("back");
      setMode("view");
      setLeaveError("");
      return;
    }
    setLeaveError("Não deu para falar com o placar agora. Tente de novo daqui a pouco.");
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="paper relative -rotate-1 overflow-hidden border-[3px] border-ink shadow-[var(--shadow-ink-lg)] wobbly-alt" data-testid="player-card">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-tomato px-4 py-2">
          <p className="font-display text-sm uppercase tracking-wider text-ink">Canal 404 · Carteirinha</p>
          <CardIcon className="size-6 text-ink" />
        </div>
        <div className="flex items-center gap-4 p-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-sky">
            <Mascot404 expression={player ? "happy" : status === "offline" ? "static" : "neutral"} className="w-20" />
          </div>
          <div className="min-w-0">
            {status === "checking" ? (
              <p className="font-display text-2xl uppercase text-ink-soft">Sintonizando…</p>
            ) : player ? (
              <>
                <p className="font-display text-xs uppercase tracking-widest text-ink-soft">Sócio do fliperama</p>
                <p className="break-words font-display text-3xl leading-none text-ink">{player.nickname}</p>
                <p className="mt-1 font-display text-lg tabular-nums text-plum-600">#{player.tag}</p>
                <p className="text-sm text-ink-soft">Desde {memberSince(player.createdAt)}</p>
              </>
            ) : status === "unconfigured" ? (
              <>
                <p className="font-display text-2xl uppercase leading-tight text-ink">Em breve</p>
                <p className="text-sm leading-snug text-ink-soft">O placar do canal ainda não estreou. Seu progresso continua salvo neste computador.</p>
              </>
            ) : status === "offline" && !player ? (
              <>
                <p className="flex items-center gap-2 font-display text-2xl uppercase leading-tight text-ink">
                  <OfflineIcon className="size-6" /> Sem sinal
                </p>
                <p className="text-sm leading-snug text-ink-soft">O placar está fora do ar agora. Os jogos funcionam normalmente.</p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl uppercase leading-tight text-ink">Sem carteirinha</p>
                <p className="text-sm leading-snug text-ink-soft">Escolha um apelido para aparecer no placar do canal.</p>
              </>
            )}
          </div>
        </div>
        <div className="border-t-[3px] border-dashed border-ink/30 px-4 pb-4 pt-2">
          {player && mode === "view" ? (
            <div className="flex flex-wrap gap-2">
              <InkButton tone="mint" size="sm" onClick={() => setMode("rename")} disabled={status !== "online"}>
                <PencilIcon className="size-5" /> Trocar apelido
              </InkButton>
              <InkButton tone="cream" size="sm" onClick={() => setMode("leave")} disabled={status !== "online"}>
                <TrashIcon className="size-5" /> Sair do placar
              </InkButton>
            </div>
          ) : null}
          {player && mode === "rename" ? (
            <NicknameForm
              initial={player.nickname}
              submitLabel="Salvar"
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
            <div role="alertdialog" aria-label="Sair do placar" className="rounded-xl border-[3px] border-ink bg-cream-2 p-3">
              <p className="font-display text-lg uppercase tracking-wide text-ink">Sair do placar?</p>
              <p className="mt-1 text-sm leading-snug text-ink-soft">Apagamos seu apelido e seus resultados do placar. O progresso neste computador continua.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <InkButton tone="tomato" size="sm" onClick={confirmLeave}>
                  Sim, apagar
                </InkButton>
                <InkButton tone="cream" size="sm" onClick={() => setMode("view")}>
                  Cancelar
                </InkButton>
              </div>
              {leaveError ? (
                <p role="alert" className="mt-2 text-sm font-bold text-tomato-deep">
                  {leaveError}
                </p>
              ) : null}
            </div>
          ) : null}
          {!player && status === "online" ? <NicknameForm submitLabel="Tirar carteirinha" onSubmit={join} /> : null}
          {!player && status !== "online" ? <p className="font-hand text-lg leading-snug text-ink-soft">A carteirinha fica disponível quando o placar estiver no ar.</p> : null}
        </div>
      </div>
      <div className="paper border-[3px] border-ink p-5 shadow-[var(--shadow-ink)] wobbly">
        <h3 className="font-display text-xl uppercase tracking-wide text-ink">O que o placar guarda</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 leading-snug text-ink-soft">
          <li>O apelido que você escolher e um número de quatro dígitos para diferenciar apelidos iguais.</li>
          <li>Um código secreto guardado neste navegador, que funciona como sua carteirinha. Sem e-mail, sem senha, sem nome.</li>
          <li>Os resultados que você enviar para o placar.</li>
        </ul>
        <p className="mt-3 leading-snug text-ink-soft">
          Se você limpar os dados do navegador, a carteirinha se perde. Ao sair do placar, apagamos tudo o que está no servidor na hora.
        </p>
      </div>
    </div>
  );
}
