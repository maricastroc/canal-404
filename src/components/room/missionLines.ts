import type { MascotExpression } from "@/components/mascot/Mascot404";
import { localized } from "@/i18n/copy";
import { ordinal } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { MissionState } from "@/lib/missions/types";

export type MissionMoment = { title: string; game: string; state: MissionState; minutesLeft: number; position: number | null };

export type MissionLine = { text: string; expression: MascotExpression };

export const LAST_HOUR_MINUTES = 60;

const LINES = localized({
  "pt-BR": {
    minutes: (n: number) => (n <= 1 ? "1 minuto" : `${n} minutos`),
    doneSoon: "Missão de hoje cumprida. Daqui a pouco entra missão nova no ar!",
    donePlace: (position: number) => `Missão de hoje cumprida! Você tá em ${position}º no placar do dia.`,
    done: "Missão de hoje cumprida! Amanhã tem outra.",
    hurry: (title: string, left: string) => `Corre! A missão “${title}” sai do ar em ${left}.`,
    started: (title: string) => `A missão “${title}” ainda tá valendo. Mais uma tentativa?`,
    fresh: (title: string, game: string) => `Plantão! A Missão 404 de hoje é “${title}”, no ${game}. Clica na placa NO AR.`,
    signDone: "Essa você já cumpriu! Mas dá pra subir no placar do dia.",
    sign: (title: string) => `No ar: “${title}”. Clica na tela pra jogar!`,
    channelDone: (number: string) => `Canal ${number}: plantão da Missão 404. Essa já tá no seu boletim!`,
    channel: (number: string, title: string) => `Canal ${number}: plantão da Missão 404! Hoje é “${title}”.`,
    newDay: (title: string) => `Virou o dia! Missão nova no ar: “${title}”.`,
  },
  en: {
    minutes: (n: number) => (n <= 1 ? "1 minute" : `${n} minutes`),
    doneSoon: "Today's mission is done. A new mission goes on air soon!",
    donePlace: (position: number) => `Today's mission is done! You're ${ordinal(position, "en")} on today's board.`,
    done: "Today's mission is done! There's another one tomorrow.",
    hurry: (title: string, left: string) => `Hurry! The mission “${title}” goes off the air in ${left}.`,
    started: (title: string) => `The mission “${title}” is still on. One more try?`,
    fresh: (title: string, game: string) => `Breaking news! Today's Mission 404 is “${title}”, in ${game}. Click the ON AIR sign.`,
    signDone: "You already did this one! But you can still climb today's board.",
    sign: (title: string) => `On air: “${title}”. Click the screen to play!`,
    channelDone: (number: string) => `Channel ${number}: Mission 404 bulletin. This one's already on your report card!`,
    channel: (number: string, title: string) => `Channel ${number}: Mission 404 bulletin! Today it's “${title}”.`,
    newDay: (title: string) => `New day! New mission on air: “${title}”.`,
  },
});

export function missionGreeting(m: MissionMoment, locale: Locale): MissionLine {
  const lines = LINES[locale];
  if (m.state === "completed") {
    if (m.minutesLeft <= LAST_HOUR_MINUTES) return { text: lines.doneSoon, expression: "happy" };
    return m.position ? { text: lines.donePlace(m.position), expression: "excited" } : { text: lines.done, expression: "happy" };
  }
  if (m.minutesLeft <= LAST_HOUR_MINUTES) return { text: lines.hurry(m.title, lines.minutes(m.minutesLeft)), expression: "surprised" };
  if (m.state === "started") return { text: lines.started(m.title), expression: "wink" };
  return { text: lines.fresh(m.title, m.game), expression: "excited" };
}

export function missionSignLine(m: MissionMoment, locale: Locale): MissionLine {
  const lines = LINES[locale];
  if (m.state === "completed") return { text: lines.signDone, expression: "wink" };
  return { text: lines.sign(m.title), expression: "excited" };
}

export function missionChannelLine(m: MissionMoment, number: string, locale: Locale) {
  const lines = LINES[locale];
  return m.state === "completed" ? lines.channelDone(number) : lines.channel(number, m.title);
}

export function newMissionLine(m: MissionMoment, locale: Locale): MissionLine {
  return { text: LINES[locale].newDay(m.title), expression: "excited" };
}
