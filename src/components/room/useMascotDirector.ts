"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MascotExpression } from "@/components/mascot/Mascot404";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";

const COPY = localized({
  "pt-BR": {
    wake: "Hã?! Eu não tava dormindo. Tava... economizando tela.",
    sleep: "Zzz... (o 404 entrou em modo de descanso de tela)",
  },
  en: {
    wake: "Huh?! I wasn't sleeping. I was... saving my screen.",
    sleep: "Zzz... (404 went into screensaver mode)",
  },
});

export type MascotLine = {
  text: string;
  expression?: MascotExpression;
  duration?: number;
  announce?: boolean;
};

export function useMascotDirector(idleAfter = 26000) {
  const copy = useCopy(COPY);
  const [line, setLine] = useState<MascotLine | null>(null);
  const [expression, setExpression] = useState<MascotExpression>("neutral");
  const [hint, setHintState] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [lineKey, setLineKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speaking = useRef<MascotExpression | null>(null);
  const sleeping = useRef(false);

  const say = useCallback((next: MascotLine) => {
    if (timer.current) clearTimeout(timer.current);
    if (emoteTimer.current) clearTimeout(emoteTimer.current);
    sleeping.current = next.expression === "sleepy";
    speaking.current = next.expression ?? "happy";
    setLine(next);
    setLineKey((k) => k + 1);
    setExpression(next.expression ?? "happy");
    if (next.announce !== false) setAnnouncement(next.text);
    const duration = next.duration ?? 5200;
    if (duration > 0) {
      timer.current = setTimeout(() => {
        speaking.current = null;
        setLine(null);
        setExpression(sleeping.current ? "sleepy" : "neutral");
      }, duration);
    }
  }, []);

  const emote = useCallback((next: MascotExpression, duration = 2600) => {
    if (emoteTimer.current) clearTimeout(emoteTimer.current);
    sleeping.current = false;
    setExpression(next);
    emoteTimer.current = setTimeout(() => setExpression(speaking.current ?? "neutral"), duration);
  }, []);

  const setHint = useCallback((text: string | null) => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (text) {
      setHintState(text);
    } else {
      hintTimer.current = setTimeout(() => setHintState(null), 450);
    }
  }, []);

  const poke = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (sleeping.current) {
      sleeping.current = false;
      say({ text: copy.wake, expression: "surprised", duration: 3600 });
    }
    idleTimer.current = setTimeout(() => {
      say({ text: copy.sleep, expression: "sleepy", duration: 0, announce: false });
    }, idleAfter);
  }, [copy, idleAfter, say]);

  useEffect(() => {
    return () => {
      [timer, idleTimer, hintTimer, emoteTimer].forEach((t) => t.current && clearTimeout(t.current));
    };
  }, []);

  return { line, lineKey, expression, hint, announcement, say, emote, setHint, poke };
}
