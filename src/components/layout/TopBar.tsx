"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MenuIcon } from "@/components/art/Icons";
import { Logo } from "@/components/art/Logo";
import { useSound } from "@/lib/audio/hooks";
import { isActive, NAV_ITEMS } from "./nav";
import { NavIcon } from "./NavIcon";
import { SoundToggle } from "./SoundToggle";
import { VisitorCounter } from "./VisitorCounter";

export function TopBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { play, hover } = useSound();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const first = drawer.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (event.key === "Tab" && drawer.current) {
        const items = Array.from(drawer.current.querySelectorAll<HTMLElement>("a, button"));
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const navItems = NAV_ITEMS.filter((item) => item.href !== "/games/rua-sem-saida");

  return (
    <header className={`on-dark relative z-50 border-b-[3px] border-ink bg-plum-800 ${className}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 px-3 sm:px-5">
        <Link href="/" className="shrink-0 -rotate-2 transition-transform hover:rotate-0" onClick={() => play("click")}>
          <Logo slogan={false} label="CANAL 404 — página inicial" className="h-14 w-auto drop-shadow-[0_4px_0_rgba(20,15,38,0.5)]" />
        </Link>
        <nav aria-label="Principal" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href) || (item.href === "/games" && pathname.startsWith("/games"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
                    onClick={() => play("click")}
                    className={`press block rounded-lg border-[3px] border-ink px-3 py-1.5 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)] ${
                      active ? item.color : "bg-cream hover:bg-cream-2"
                    }`}
                  >
                    {item.short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <SoundToggle compact className="ml-auto md:ml-2" />
        <button
          ref={menuButton}
          type="button"
          onClick={() => {
            play(open ? "back" : "click");
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-controls="menu-drawer"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="press grid size-12 place-items-center rounded-xl border-[3px] border-ink bg-sun shadow-[var(--shadow-ink-sm)] md:hidden"
        >
          <MenuIcon open={open} className="size-7" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[4.5rem] z-40 bg-plum-950/70 md:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              key="drawer"
              id="menu-drawer"
              ref={drawer}
              role="dialog"
              aria-modal="true"
              aria-label="Menu do canal"
              initial={{ y: -30, opacity: 0, rotate: -2 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="paper fixed inset-x-3 top-[5.2rem] z-50 max-h-[calc(100svh-6rem)] overflow-y-auto border-[3px] border-ink p-4 shadow-[var(--shadow-ink-lg)] wobbly md:hidden"
            >
              <ul className="flex flex-col gap-3">
                {NAV_ITEMS.map((item, i) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href} className={i % 2 ? "rotate-1" : "-rotate-1"}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          play("click");
                          setOpen(false);
                        }}
                        className={`press flex min-h-14 items-center gap-3 border-[3px] border-ink py-1.5 pl-2 pr-4 font-display text-lg uppercase tracking-wide text-ink shadow-[var(--shadow-ink)] wobbly-sm ${
                          active ? item.color : "bg-cream"
                        }`}
                      >
                        <span className={`grid size-11 place-items-center rounded-lg border-[2.5px] border-ink ${active ? "bg-cream" : item.color}`}>
                          <NavIcon icon={item.icon} className="size-8" />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 flex justify-center">
                <VisitorCounter />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
