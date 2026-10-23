import type { Metadata, Viewport } from "next";
import { Baloo_2, Luckiest_Guy, Patrick_Hand } from "next/font/google";
import { AppProviders } from "@/components/layout/AppProviders";
import "./globals.css";

const luckiest = Luckiest_Guy({
  variable: "--font-luckiest",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  display: "swap",
});

const patrick = Patrick_Hand({
  variable: "--font-patrick",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CANAL 404 — Desenhos. Jogos. Bagunça.",
    template: "%s · CANAL 404",
  },
  description:
    "O canal saiu do ar, mas o portal de jogos continua funcionando. Explore a sala de transmissão, descubra segredos e jogue Rua Sem Saída.",
  applicationName: "CANAL 404",
};

export const viewport: Viewport = {
  themeColor: "#1f1839",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${luckiest.variable} ${baloo.variable} ${patrick.variable} antialiased`}
    >
      <body className="min-h-svh">
        <a
          href="#conteudo"
          className="sr-only-focusable left-4 top-4 z-[100] rounded-xl border-[3px] border-ink bg-sun px-4 py-2 font-display text-lg text-ink shadow-[var(--shadow-ink)]"
        >
          Pular para o conteúdo
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
