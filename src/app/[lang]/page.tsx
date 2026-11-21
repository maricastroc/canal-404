import { BroadcastRoom } from "@/components/room/BroadcastRoom";
import { RoomPanner } from "@/components/room/RoomPanner";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";

const COPY = localized({
  "pt-BR": {
    title: "CANAL 404 — Sala de transmissão",
    intro:
      "Uma sala ilustrada e interativa. Use Tab para percorrer os objetos: a TV abre na Missão 404 do dia ou num jogo que você ainda não jogou, o fliperama abre o catálogo e o rádio liga a trilha sonora. Quando tem Missão 404 no ar, a placa NO AR acende e leva a missão para a TV. Vários objetos escondem segredos.",
  },
  en: {
    title: "CANAL 404 — Broadcast room",
    intro:
      "An illustrated, interactive room. Press Tab to move between the objects: the TV opens today's Mission 404 or a game you haven't played yet, the arcade cabinet opens the catalog and the radio plays the soundtrack. When a Mission 404 is on, the ON AIR sign lights up and puts the mission on the TV. Several objects hide secrets.",
  },
});

export default async function Home() {
  const copy = COPY[await getLocale()];
  return (
    <div className="room-page relative flex h-svh flex-col overflow-x-clip xl:block xl:overflow-hidden">
      <TopBar className="xl:hidden" />
      <SideNav className="absolute inset-y-0 left-0 z-50 hidden w-[17rem] px-5 py-5 xl:flex" />
      <main id="content" className="relative flex min-h-[18rem] flex-1 flex-col xl:ml-[17rem] xl:h-svh xl:flex-row xl:items-center xl:justify-center">
        <h1 className="sr-only">{copy.title}</h1>
        <p className="sr-only">{copy.intro}</p>
        <RoomPanner>
          <BroadcastRoom />
        </RoomPanner>
      </main>
    </div>
  );
}
