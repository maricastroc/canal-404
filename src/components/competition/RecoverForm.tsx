"use client";

import { useId, useState, type FormEvent } from "react";
import { InkButton } from "@/components/ui/Primitives";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useSound } from "@/lib/audio/hooks";
import { recoverWithCode } from "@/lib/competition/cloud-copy";
import { serverMessage } from "@/lib/competition/errors";
import { normalizeRecoveryCode } from "@/lib/competition/recovery";

const COPY = localized({
  "pt-BR": {
    label: "Código de recuperação",
    hint: "São 16 letras e números, criados em Extras no aparelho onde você já tem a carteirinha.",
    submit: "Usar código",
    sending: "Conferindo…",
    restoring: "Trazendo seu progresso…",
    cancel: "Cancelar",
    invalid: "O código tem 16 letras e números. Confira o que você digitou.",
    notFound: "Esse código não existe ou foi trocado por um novo. Confira as letras e os números.",
    offline: "O placar está fora do ar agora. Tente de novo daqui a pouco.",
    failed: "Não deu para usar o código agora.",
  },
  en: {
    label: "Recovery code",
    hint: "It's 16 letters and numbers, created in Extras on the device where you already have the card.",
    submit: "Use code",
    sending: "Checking…",
    restoring: "Bringing your progress…",
    cancel: "Cancel",
    invalid: "The code has 16 letters and numbers. Check what you typed.",
    notFound: "That code doesn't exist or was replaced by a new one. Check the letters and numbers.",
    offline: "The board is off the air right now. Try again in a little while.",
    failed: "Couldn't use the code right now.",
  },
});

export function RecoverForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "checking" | "restoring">("");
  const { play } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!normalizeRecoveryCode(value)) {
      setError(copy.invalid);
      play("thud");
      return;
    }
    setBusy("checking");
    setError("");
    const outcome = await recoverWithCode(value);
    if (outcome.ok) {
      play("confirm");
      if (outcome.next === "restored") {
        setBusy("restoring");
        window.location.reload();
        return;
      }
      onDone();
      return;
    }
    setBusy("");
    play("thud");
    setError(outcome.offline ? copy.offline : outcome.error?.code === "not_found" ? copy.notFound : serverMessage(outcome.error, copy.failed, locale));
  };

  return (
    <form onSubmit={submit} noValidate className="mt-2" data-testid="recover-form">
      <label htmlFor={`${id}-code`} className="font-display text-sm uppercase tracking-wider text-ink">
        {copy.label}
      </label>
      <input
        id={`${id}-code`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError("");
        }}
        maxLength={24}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-ink bg-paper px-3 font-display text-xl uppercase tracking-widest text-ink shadow-[inset_0_3px_0_rgb(29_24_48/0.08)] placeholder:text-ink/35"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <InkButton type="submit" tone="sun" size="sm" disabled={busy !== ""}>
          {busy === "restoring" ? copy.restoring : busy === "checking" ? copy.sending : copy.submit}
        </InkButton>
        <InkButton tone="cream" size="sm" onClick={onCancel} disabled={busy !== ""}>
          {copy.cancel}
        </InkButton>
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-sm leading-snug text-ink-soft">
        {copy.hint}
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-bold leading-snug text-tomato-deep">
          {error}
        </p>
      ) : null}
    </form>
  );
}
