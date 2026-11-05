"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/art/Logo";
import { useSound } from "@/lib/audio/hooks";
import { isActive } from "./nav";
import { useNavItems } from "./useNavItems";
import { NavIcon } from "./NavIcon";
import { SoundToggle } from "./SoundToggle";
import { VisitorCounter } from "./VisitorCounter";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function SideNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { play, hover } = useSound();
  const navItems = useNavItems();
  return (
    <aside className={`on-dark pointer-events-none flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-color:var(--color-plum-500)_transparent] [scrollbar-width:thin] short:gap-3 short:py-4 shorter:gap-2 shorter:py-3 ${className}`}>
      <Link
        href="/"
        className="pointer-events-auto block w-full shrink-0 -rotate-3 transition-transform hover:rotate-0 hover:scale-[1.03]"
        onClick={() => play("click")}
      >
        <Logo label="CANAL 404 — Desenhos. Jogos. Bagunça. Página inicial" className="w-full drop-shadow-[0_8px_0_rgba(20,15,38,0.45)] short:mx-auto short:h-[118px] short:w-auto shorter:h-[76px]" />
      </Link>
      <nav aria-label="Principal" className="pointer-events-auto mt-1">
        <ul className="flex flex-col gap-3 short:gap-2 shorter:gap-1.5">
          {navItems.map((item, i) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className={tilts[i]}>
                <Link
                  href={item.href}
                  prefetch={item.prefetch}
                  aria-current={active ? "page" : undefined}
                  onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
                  onClick={() => play("click")}
                  className={`press flex items-center gap-3 border-[3px] border-ink py-1.5 pl-2 pr-4 font-display text-[15px] uppercase leading-[1.1] tracking-wide text-ink shadow-[var(--shadow-ink)] wobbly-sm short:py-1 short:text-[14px] shorter:gap-2 shorter:py-0.5 shorter:text-[13px] ${
                    active ? item.color : "bg-cream hover:bg-cream-2"
                  }`}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg border-[2.5px] border-ink short:size-9 shorter:size-8 ${active ? "bg-cream" : item.color}`}>
                    <NavIcon icon={item.icon} className="size-7 short:size-6 shorter:size-5" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="pointer-events-auto mt-auto flex shrink-0 items-end justify-between gap-3 pb-1">
        <VisitorCounter className="short:py-1.5 shorter:py-1" />
        <SoundToggle compact />
      </div>
    </aside>
  );
}
