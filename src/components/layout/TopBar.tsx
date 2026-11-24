"use client";

import dynamic from "next/dynamic";
import { IntentLink } from "@/components/ui/IntentLink";
import { useCallback, useRef, useState } from "react";
import { MenuIcon } from "@/components/art/Icons";
import { Logo } from "@/components/art/Logo";
import { useCopy, useLocalPathname, useLocale } from "@/i18n/client";
import { useSound } from "@/lib/audio/hooks";
import { LanguageSwitch } from "./LanguageSwitch";
import { isActive, NAV_COPY, navItems } from "./nav";
import { NavLink } from "./NavLink";
import { SoundToggle } from "./SoundToggle";

const MenuDrawer = dynamic(() => import("./MenuDrawer").then((m) => m.MenuDrawer), { ssr: false });

export function TopBar({ className = "" }: { className?: string }) {
  const pathname = useLocalPathname();
  const locale = useLocale();
  const copy = useCopy(NAV_COPY);
  const items = navItems(locale);
  const { play, hover } = useSound();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }


  return (
    <header className={`on-dark relative z-50 border-b-[3px] border-ink bg-plum-800 ${className}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 safe-inline [--pad-inline:0.75rem] sm:[--pad-inline:1.25rem]">
        <IntentLink href="/" className="shrink-0 -rotate-2 transition-transform hover:rotate-0" onClick={() => play("click")}>
          <Logo slogan={false} label={copy.home} className="h-14 w-auto drop-shadow-[0_4px_0_rgba(20,15,38,0.5)]" />
        </IntentLink>
        <nav aria-label={copy.main} className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1.5 lg:gap-2">
            {items.map((item) => {
              const active = isActive(pathname, item.href) || (item.href === "/games" && pathname.startsWith("/games"));
              return (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
                    onClick={() => play("click")}
                    className={`press block rounded-lg border-[3px] border-ink px-2 py-1.5 font-display text-[13px] uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)] lg:px-3 lg:text-sm ${
                      active ? item.color : "bg-cream hover:bg-cream-2"
                    }`}
                  >
                    {item.short}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <LanguageSwitch className="ml-2 hidden md:flex" />
        <SoundToggle compact className="ml-auto md:ml-2" />
        <button
          ref={menuButton}
          type="button"
          onClick={() => {
            play(open ? "back" : "click");
            setOpened(true);
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-controls="menu-drawer"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          className="press grid size-12 place-items-center rounded-xl border-[3px] border-ink bg-sun shadow-[var(--shadow-ink-sm)] md:hidden"
        >
          <MenuIcon open={open} className="size-7" />
        </button>
      </div>
      {opened && <MenuDrawer open={open} pathname={pathname} menuButton={menuButton} onClose={close} />}
    </header>
  );
}
