"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/art/Logo";
import { useSound } from "@/lib/audio/hooks";
import { isActive, NAV_ITEMS } from "./nav";
import { NavIcon } from "./NavIcon";
import { SoundToggle } from "./SoundToggle";
import { VisitorCounter } from "./VisitorCounter";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-1"];

export function SideNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { play, hover } = useSound();
  return (
    <aside className={`on-dark pointer-events-none flex-col gap-4 ${className}`}>
      <Link
        href="/"
        className="pointer-events-auto block w-full -rotate-3 transition-transform hover:rotate-0 hover:scale-[1.03]"
        onClick={() => play("click")}
      >
        <Logo label="CANAL 404 — Desenhos. Jogos. Bagunça. Página inicial" className="w-full drop-shadow-[0_8px_0_rgba(20,15,38,0.45)]" />
      </Link>
      <nav aria-label="Principal" className="pointer-events-auto mt-1">
        <ul className="flex flex-col gap-3">
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className={tilts[i]}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
                  onClick={() => play("click")}
                  className={`press flex items-center gap-3 border-[3px] border-ink py-1.5 pl-2 pr-4 font-display text-[15px] uppercase tracking-wide text-ink shadow-[var(--shadow-ink)] wobbly-sm ${
                    active ? item.color : "bg-cream hover:bg-cream-2"
                  }`}
                >
                  <span className={`grid size-10 place-items-center rounded-lg border-[2.5px] border-ink ${active ? "bg-cream" : item.color}`}>
                    <NavIcon icon={item.icon} className="size-7" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="pointer-events-auto mt-auto flex items-end justify-between gap-3 pb-1">
        <VisitorCounter />
        <SoundToggle compact />
      </div>
    </aside>
  );
}
