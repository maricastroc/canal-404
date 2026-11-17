import type { Metadata } from "next";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { FONT_CLASSES } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · CANAL 404",
  robots: { index: false, follow: true },
};

const PICK_LANGUAGE = `if(/^\\/en(\\/|$)/.test(location.pathname)){document.documentElement.lang="en";document.documentElement.dataset.locale="en"}`;

const HIDE_OTHER = `html:not([data-locale="en"]) [data-copy="en"],html[data-locale="en"] [data-copy="pt-BR"]{display:none}`;

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className={FONT_CLASSES}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PICK_LANGUAGE }} />
        <style dangerouslySetInnerHTML={{ __html: HIDE_OTHER }} />
      </head>
      <body className="min-h-svh">
        <div data-copy="pt-BR">
          <NotFoundView locale="pt-BR" />
        </div>
        <div data-copy="en" lang="en">
          <NotFoundView locale="en" />
        </div>
      </body>
    </html>
  );
}
