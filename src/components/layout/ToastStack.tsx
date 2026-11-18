"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useLocalPathname } from "@/i18n/client";
import { useToasts } from "@/lib/progress/hooks";

const ToastList = dynamic(() => import("./ToastList").then((m) => m.ToastList), { ssr: false });

export function ToastStack() {
  const toasts = useToasts();
  const inGame = useLocalPathname().startsWith("/play");
  const [shown, setShown] = useState(false);
  if (toasts.length > 0 && !shown) setShown(true);
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className={`pointer-events-none fixed z-[80] ${
        inGame
          ? "left-1/2 top-2.5 w-max max-w-[min(34vw,22rem)] -translate-x-1/2"
          : "inset-x-3 top-20 sm:inset-x-auto sm:right-5 sm:w-96 [@media(max-height:520px)]:top-16 [@media(max-height:520px)]:w-72"
      }`}
    >
      <ul className={`flex flex-col gap-3 ${inGame ? "items-center" : "items-end"}`}>{shown && <ToastList toasts={toasts.slice(inGame ? -1 : -3)} compact={inGame} />}</ul>
    </div>
  );
}
