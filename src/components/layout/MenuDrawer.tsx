"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { useCopy, useLocale } from "@/i18n/client";
import { useSound } from "@/lib/audio/hooks";
import { LanguageSwitch } from "./LanguageSwitch";
import { isActive, NAV_COPY, navItems } from "./nav";
import { NavIcon } from "./NavIcon";
import { NavLink } from "./NavLink";
import { VisitorCounter } from "./VisitorCounter";

type Props = { open: boolean; pathname: string; menuButton: RefObject<HTMLButtonElement | null>; onClose: () => void };

export function MenuDrawer({ open, pathname, menuButton, onClose }: Props) {
  const locale = useLocale();
  const copy = useCopy(NAV_COPY);
  const items = navItems(locale);
  const { play } = useSound();
  const drawer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const first = drawer.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [open, onClose, menuButton]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[4.5rem] z-40 bg-plum-950/70 md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="drawer"
            id="menu-drawer"
            ref={drawer}
            role="dialog"
            aria-modal="true"
            aria-label={copy.menu}
            initial={{ y: -30, opacity: 0, rotate: -2 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="paper fixed inset-x-3 top-[5.2rem] z-50 max-h-[calc(100svh-6rem)] overflow-y-auto border-[3px] border-ink p-4 shadow-[var(--shadow-ink-lg)] wobbly md:hidden"
          >
            <ul className="flex flex-col gap-3">
              {items.map((item, i) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className={i % 2 ? "rotate-1" : "-rotate-1"}>
                    <NavLink
                      item={item}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        play("click");
                        onClose();
                      }}
                      className={`press flex min-h-14 items-center gap-3 border-[3px] border-ink py-1.5 pl-2 pr-4 font-display text-lg uppercase tracking-wide text-ink shadow-[var(--shadow-ink)] wobbly-sm ${
                        active ? item.color : "bg-cream"
                      }`}
                    >
                      <span className={`grid size-11 place-items-center rounded-lg border-[2.5px] border-ink ${active ? "bg-cream" : item.color}`}>
                        <NavIcon icon={item.icon} className="size-8" />
                      </span>
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            <LanguageSwitch variant="drawer" className="mt-3 rotate-1" />
            <div className="mt-5 flex justify-center">
              <VisitorCounter />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
