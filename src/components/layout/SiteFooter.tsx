import Link from "next/link";
import { Squiggle } from "@/components/art/Badges";

export function SiteFooter() {
  return (
    <footer className="on-dark mt-16 border-t-[3px] border-ink bg-plum-950 px-4 py-8 text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <Squiggle className="w-32" />
        <p className="max-w-xl font-hand text-lg leading-snug text-cream-2">
          O CANAL 404 é um canal fictício. Nenhum desenho foi cancelado durante a produção deste site — eles só estão
          fora do ar.
        </p>
        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-display text-sm uppercase tracking-wide">
            <li>
              <Link className="underline decoration-sun decoration-2 underline-offset-4 hover:text-sun" href="/">
                Sala de transmissão
              </Link>
            </li>
            <li>
              <Link className="underline decoration-mint decoration-2 underline-offset-4 hover:text-mint" href="/jogos">
                Jogos
              </Link>
            </li>
            <li>
              <Link className="underline decoration-bubblegum decoration-2 underline-offset-4 hover:text-bubblegum" href="/extras">
                Extras
              </Link>
            </li>
            <li>
              <Link className="underline decoration-sky decoration-2 underline-offset-4 hover:text-sky" href="/sobre">
                Sobre o canal
              </Link>
            </li>
          </ul>
        </nav>
        <p className="font-display text-xs tracking-widest text-plum-300">© 2004–SEMPRE · TRANSMITINDO DO PORÃO</p>
      </div>
    </footer>
  );
}
