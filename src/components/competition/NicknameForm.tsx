"use client";

import { useId, useState, type FormEvent } from "react";
import { DiceIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import type { JoinOutcome } from "@/lib/competition/client";
import { checkNickname, NICKNAME_MAX, NICKNAME_PROBLEMS, suggestNickname } from "@/lib/competition/nickname";
import { useSound } from "@/lib/audio/hooks";

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
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { play } = useSound();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const check = checkNickname(value);
    if (!check.ok) {
      setError(NICKNAME_PROBLEMS[check.problem]);
      play("thud");
      return;
    }
    setBusy(true);
    setError("");
    const outcome = await onSubmit(check.nickname);
    setBusy(false);
    if (outcome.ok) {
      play("confirm");
      return;
    }
    play("thud");
    setError(outcome.message);
  };

  const shuffle = () => {
    play("click");
    setValue(suggestNickname());
    setError("");
  };

  const label = dark ? "text-cream" : "text-ink";
  const soft = dark ? "text-cream/80" : "text-ink-soft";

  return (
    <form onSubmit={submit} noValidate className="mt-2">
      <label htmlFor={`${id}-nickname`} className={`font-display text-sm uppercase tracking-wider ${label}`}>
        Seu apelido
      </label>
      <input
        id={`${id}-nickname`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError("");
        }}
        maxLength={NICKNAME_MAX}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        placeholder="Ex.: Pato Veloz"
        className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-ink bg-paper px-3 font-display text-xl tracking-wide text-ink shadow-[inset_0_3px_0_rgb(29_24_48/0.08)] placeholder:text-ink/35"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <InkButton type="submit" tone="sun" size="sm" disabled={busy}>
          {busy ? "Enviando…" : submitLabel}
        </InkButton>
        <InkButton tone="cream" size="sm" onClick={shuffle}>
          <DiceIcon className="size-5" /> Sortear
        </InkButton>
        {onCancel ? (
          <InkButton tone="cream" size="sm" onClick={onCancel}>
            Cancelar
          </InkButton>
        ) : null}
      </div>
      <p id={`${id}-hint`} className={`mt-1.5 text-sm leading-snug ${soft}`}>
        Sem cadastro e sem e-mail. Não use seu nome verdadeiro.
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className={`mt-1 text-sm font-bold leading-snug ${dark ? "text-sun" : "text-tomato-deep"}`}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
