"use client";

import { Fragment, useState } from "react";
import { CheckIcon, KeyIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { dateFormat } from "@/i18n/format";
import { useSound } from "@/lib/audio/hooks";
import { createRecoveryCode } from "@/lib/competition/cloud-copy";
import { serverMessage } from "@/lib/competition/errors";

const COPY = localized({
  "pt-BR": {
    title: "Levar para outro aparelho",
    intro: "Crie um código secreto e digite em outro celular ou computador, em Extras → Carteirinha → Já tenho carteirinha. A carteirinha e o progresso vão junto.",
    createdOn: (date: string) => `Você criou um código em ${date}. Se perdeu, crie um novo.`,
    renewWarning: "O código antigo para de funcionar, e os aparelhos que entraram com ele saem da carteirinha até você digitar o código novo.",
    create: "Criar código",
    renew: "Criar código novo",
    working: "Criando…",
    yourCode: "Seu código",
    keep: "Anote num papel ou tire um print agora: ele não aparece de novo. Quem tiver este código vira você no placar, então não mostre para ninguém.",
    copy: "Copiar",
    copied: "Copiado!",
    close: "Fechar",
    failed: "Não deu para criar o código agora. Tente de novo daqui a pouco.",
  },
  en: {
    title: "Take it to another device",
    intro: "Create a secret code and type it on another phone or computer, in Extras → Membership card → I already have a card. Your card and your progress come along.",
    createdOn: (date: string) => `You created a code on ${date}. If you lost it, create a new one.`,
    renewWarning: "The old code stops working, and devices that joined with it leave the card until you type the new code.",
    create: "Create code",
    renew: "Create a new code",
    working: "Creating…",
    yourCode: "Your code",
    keep: "Write it down or take a screenshot now: it won't show again. Whoever has this code becomes you on the board, so don't show it to anyone.",
    copy: "Copy",
    copied: "Copied!",
    close: "Close",
    failed: "Couldn't create the code right now. Try again in a little while.",
  },
});

export function RecoveryCodePanel({ recoveryAt, onClose }: { recoveryAt: string | null; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { play } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();

  const create = async () => {
    setBusy(true);
    setError("");
    const outcome = await createRecoveryCode();
    setBusy(false);
    if (outcome.ok) {
      play("confirm");
      setCode(outcome.code);
      return;
    }
    play("thud");
    setError(serverMessage(outcome.error, copy.failed, locale));
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      play("click");
    } catch {
      setCopied(false);
    }
  };

  const created = recoveryAt ? dateFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(recoveryAt)) : null;

  return (
    <div className="rounded-xl border-[3px] border-ink bg-cream-2 p-3" data-testid="recovery-panel">
      <p className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-ink">
        <KeyIcon className="size-5" /> {copy.title}
      </p>
      {code ? (
        <>
          <p className="mt-2 font-display text-sm uppercase tracking-wider text-ink-soft">{copy.yourCode}</p>
          <p className="mt-1 select-all rounded-lg border-[3px] border-dashed border-ink bg-paper px-3 py-2 text-center font-display text-xl tracking-wider text-ink tabular-nums sm:text-2xl sm:tracking-widest" data-testid="recovery-code">
            {code.split("-").map((group, index) => (
              <Fragment key={index}>
                {index > 0 ? (
                  <>
                    -<wbr />
                  </>
                ) : null}
                <span className="whitespace-nowrap">{group}</span>
              </Fragment>
            ))}
          </p>
          <p className="copy-sm mt-2 text-ink-soft">{copy.keep}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <InkButton tone="sun" size="sm" onClick={copyCode}>
              {copied ? <CheckIcon className="size-5" /> : null} {copied ? copy.copied : copy.copy}
            </InkButton>
            <InkButton tone="cream" size="sm" onClick={onClose}>
              {copy.close}
            </InkButton>
          </div>
        </>
      ) : (
        <>
          <p className="copy-sm mt-1 text-ink-soft">{copy.intro}</p>
          {created ? <p className="copy-sm mt-2 text-ink-soft">{copy.createdOn(created)}</p> : null}
          {created ? <p className="copy-sm mt-1 font-bold text-ink">{copy.renewWarning}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <InkButton tone="sun" size="sm" onClick={create} disabled={busy}>
              {busy ? copy.working : created ? copy.renew : copy.create}
            </InkButton>
            <InkButton tone="cream" size="sm" onClick={onClose}>
              {copy.close}
            </InkButton>
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm font-bold text-tomato-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
