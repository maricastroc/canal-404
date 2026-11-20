"use client";

import { useId, useState, type FormEvent } from "react";
import { DiceIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import type { JoinOutcome } from "@/lib/competition/client";
import { serverMessage } from "@/lib/competition/errors";
import { checkNickname, isNicknameProblem, NICKNAME_MAX, NICKNAME_PROBLEM_TEXT, suggestNickname } from "@/lib/competition/nickname";
import { useSound } from "@/lib/audio/hooks";

const COPY = localized({
  "pt-BR": {
    offline: "O placar está fora do ar agora. Tente de novo daqui a pouco.",
    failed: "Não deu para salvar o apelido.",
    label: "Seu apelido",
    placeholder: "Ex.: Pato Veloz",
    sending: "Enviando…",
    shuffle: "Sortear",
    cancel: "Cancelar",
    hint: "Sem cadastro e sem e-mail. Não use seu nome verdadeiro.",
  },
  en: {
    offline: "The board is off the air right now. Try again in a little while.",
    failed: "Couldn't save the nickname.",
    label: "Your nickname",
    placeholder: "e.g. Speedy Duck",
    sending: "Sending…",
    shuffle: "Random",
    cancel: "Cancel",
    hint: "No sign-up and no email. Don't use your real name.",
  },
});

let draft = "";

export function NicknameForm({
  initial = "",
  submitLabel,
  onSubmit,
  onCancel,
  dark = false,
  autoFocus = false,
}: {
  initial?: string;
  submitLabel: string;
  onSubmit: (nickname: string) => Promise<JoinOutcome>;
  onCancel?: () => void;
  dark?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useState(() => initial || draft);
  const change = (next: string) => {
    setValue(next);
    if (!initial) draft = next;
  };
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { play } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const check = checkNickname(value);
    if (!check.ok) {
      setError(NICKNAME_PROBLEM_TEXT[locale][check.problem]);
      play("thud");
      return;
    }
    setBusy(true);
    setError("");
    const outcome = await onSubmit(check.nickname);
    setBusy(false);
    if (outcome.ok) {
      if (!initial) draft = "";
      play("confirm");
      return;
    }
    play("thud");
    const problem = outcome.error?.problem;
    setError(outcome.offline ? copy.offline : isNicknameProblem(problem) ? NICKNAME_PROBLEM_TEXT[locale][problem] : serverMessage(outcome.error, copy.failed, locale));
  };

  const shuffle = () => {
    play("click");
    change(suggestNickname(Math.random, locale));
    setError("");
  };

  const label = dark ? "text-cream" : "text-ink";
  const soft = dark ? "text-cream/80" : "text-ink-soft";

  return (
    <form onSubmit={submit} noValidate className="mt-2">
      <label htmlFor={`${id}-nickname`} className={`font-display text-sm uppercase tracking-wider ${label}`}>
        {copy.label}
      </label>
      <input
        id={`${id}-nickname`}
        value={value}
        onChange={(e) => {
          change(e.target.value);
          if (error) setError("");
        }}
        maxLength={NICKNAME_MAX}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        placeholder={copy.placeholder}
        className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-ink bg-paper px-3 font-display text-xl tracking-wide text-ink shadow-[inset_0_3px_0_rgb(29_24_48/0.08)] placeholder:text-ink/35"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <InkButton type="submit" tone="sun" size="sm" disabled={busy}>
          {busy ? copy.sending : submitLabel}
        </InkButton>
        <InkButton tone="cream" size="sm" onClick={shuffle}>
          <DiceIcon className="size-5" /> {copy.shuffle}
        </InkButton>
        {onCancel ? (
          <InkButton tone="cream" size="sm" onClick={onCancel}>
            {copy.cancel}
          </InkButton>
        ) : null}
      </div>
      <p id={`${id}-hint`} className={`mt-1.5 text-sm leading-snug ${soft}`}>
        {copy.hint}
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className={`mt-1 text-sm font-bold leading-snug ${dark ? "text-sun" : "text-tomato-deep"}`}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
