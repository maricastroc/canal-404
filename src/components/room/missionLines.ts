import type { MascotExpression } from "@/components/mascot/Mascot404";
import type { MissionState } from "@/lib/missions/types";

export type MissionMoment = { title: string; game: string; state: MissionState; minutesLeft: number; position: number | null };

export type MissionLine = { text: string; expression: MascotExpression };

export const LAST_HOUR_MINUTES = 60;

function minutes(n: number) {
  return n <= 1 ? "1 minuto" : `${n} minutos`;
}

export function missionGreeting(m: MissionMoment): MissionLine {
  if (m.state === "completed") {
    if (m.minutesLeft <= LAST_HOUR_MINUTES) return { text: "Missão de hoje cumprida. Daqui a pouco entra missão nova no ar!", expression: "happy" };
    return m.position
      ? { text: `Missão de hoje cumprida! Você tá em ${m.position}º no placar do dia.`, expression: "excited" }
      : { text: "Missão de hoje cumprida! Amanhã tem outra.", expression: "happy" };
  }
  if (m.minutesLeft <= LAST_HOUR_MINUTES) return { text: `Corre! A missão “${m.title}” sai do ar em ${minutes(m.minutesLeft)}.`, expression: "surprised" };
  if (m.state === "started") return { text: `A missão “${m.title}” ainda tá valendo. Mais uma tentativa?`, expression: "wink" };
  return { text: `Plantão! A Missão 404 de hoje é “${m.title}”, no ${m.game}. Clica na placa NO AR.`, expression: "excited" };
}

export function missionSignLine(m: MissionMoment): MissionLine {
  if (m.state === "completed") return { text: "Essa você já cumpriu! Mas dá pra subir no placar do dia.", expression: "wink" };
  return { text: `No ar: “${m.title}”. Clica na tela pra jogar!`, expression: "excited" };
}

export function missionChannelLine(m: MissionMoment, number: string) {
  return m.state === "completed" ? `Canal ${number}: plantão da Missão 404. Essa já tá no seu boletim!` : `Canal ${number}: plantão da Missão 404! Hoje é “${m.title}”.`;
}

export function newMissionLine(m: MissionMoment): MissionLine {
  return { text: `Virou o dia! Missão nova no ar: “${m.title}”.`, expression: "excited" };
}
