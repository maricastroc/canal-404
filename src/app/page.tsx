import { BroadcastRoom } from "@/components/room/BroadcastRoom";
import { RoomPanner } from "@/components/room/RoomPanner";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";

export default function Home() {
  return (
    <div className="room-page relative min-h-svh overflow-x-clip xl:h-svh xl:overflow-hidden">
      <TopBar className="xl:hidden" />
      <SideNav className="absolute inset-y-0 left-0 z-50 hidden w-[17rem] px-5 py-5 xl:flex" />
      <main id="conteudo" className="relative xl:ml-[17rem] xl:flex xl:h-svh xl:items-center xl:justify-center">
        <h1 className="sr-only">CANAL 404 — Sala de transmissão</h1>
        <p className="sr-only">
          Uma sala ilustrada e interativa. Use Tab para percorrer os objetos: a TV mostra o jogo da semana, o fliperama abre
          o catálogo e o rádio liga a trilha sonora. Vários objetos escondem segredos.
        </p>
        <RoomPanner>
          <BroadcastRoom />
        </RoomPanner>
        <div id="mascot-dock" className="sticky bottom-0 z-[75] px-3 pb-3 pt-2 xl:hidden" />
      </main>
    </div>
  );
}
