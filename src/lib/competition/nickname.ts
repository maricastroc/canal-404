import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 16;

export type NicknameProblem = "short" | "long" | "chars" | "digits" | "blocked" | "reserved" | "full";

export type NicknameCheck = { ok: true; nickname: string; key: string } | { ok: false; problem: NicknameProblem };

export const NICKNAME_PROBLEM_TEXT = localized<Record<NicknameProblem, string>>({
  "pt-BR": {
    short: `Use pelo menos ${NICKNAME_MIN} letras.`,
    long: `Use no máximo ${NICKNAME_MAX} caracteres.`,
    chars: "Use letras, números, espaço, hífen ou sublinhado.",
    digits: "Esse apelido parece um número de telefone ou documento. Escolha outro.",
    blocked: "Esse apelido não passa na censura do canal. Escolha outro.",
    reserved: "Esse apelido é da equipe do canal. Escolha outro.",
    full: "Esse apelido já está lotado no placar. Escolha outro.",
  },
  en: {
    short: `Use at least ${NICKNAME_MIN} letters.`,
    long: `Use ${NICKNAME_MAX} characters at most.`,
    chars: "Use letters, numbers, spaces, hyphens or underscores.",
    digits: "That nickname looks like a phone or ID number. Pick another one.",
    blocked: "That nickname doesn't get past the channel's censors. Pick another one.",
    reserved: "That nickname belongs to the channel staff. Pick another one.",
    full: "That nickname is full on the board. Pick another one.",
  },
});

export const NICKNAME_PROBLEMS: Record<NicknameProblem, string> = NICKNAME_PROBLEM_TEXT["pt-BR"];

export function isNicknameProblem(value: unknown): value is NicknameProblem {
  return typeof value === "string" && Object.keys(NICKNAME_PROBLEM_TEXT["pt-BR"]).includes(value);
}

const ALLOWED = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]+$/;
const HAS_LETTER = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
const LONG_NUMBER = /[0-9]{6,}/;

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g" };

const BLOCKED_PARTS = [
  "caralh",
  "buceta",
  "boceta",
  "xoxota",
  "xereca",
  "punheta",
  "arrombad",
  "filhodaput",
  "putaria",
  "putinha",
  "viadinh",
  "cuzao",
  "cuzinh",
  "bosta",
  "merda",
  "foder",
  "fodase",
  "fodido",
  "porra",
  "vagabund",
  "retardad",
  "estupr",
  "pedofil",
  "nazis",
  "hitler",
  "nigger",
  "nigga",
  "faggot",
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "whore",
  "porn",
  "xvideo",
  "pornhub",
  "penis",
  "vagina",
  "transa",
  "sexo",
  "safad",
  "piroca",
  "pirocud",
  "rapariga",
];

const BLOCKED_WORDS = new Set(["puta", "puto", "putas", "viado", "viados", "bicha", "cu", "cus", "pau", "rola", "pica", "anus", "nazi", "sex", "fdp", "vsf", "tnc", "pqp", "krl", "crl", "foda", "corno"]);

const RESERVED_PARTS = ["admin", "moderador", "moderacao", "canal404", "oficial", "suporte", "staff", "equipe404"];

const RESERVED_WHOLE = new Set(["404", "mod", "canal", "sistema", "mascote"]);

function strip(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function deleet(value: string) {
  return value.replace(/[0-9]/g, (d) => LEET[d] ?? d);
}

export function boardNickname(nickname: string) {
  return nickname.toUpperCase();
}

export function nicknameKey(nickname: string) {
  return strip(nickname).replace(/[\s_-]+/g, "");
}

export function checkNickname(raw: unknown): NicknameCheck {
  if (typeof raw !== "string") return { ok: false, problem: "chars" };
  const nickname = raw.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (nickname.length < NICKNAME_MIN) return { ok: false, problem: "short" };
  if (nickname.length > NICKNAME_MAX) return { ok: false, problem: "long" };
  if (!ALLOWED.test(nickname) || !HAS_LETTER.test(nickname)) return { ok: false, problem: "chars" };
  if (LONG_NUMBER.test(nickname)) return { ok: false, problem: "digits" };
  const plain = strip(nickname);
  const words = plain.split(/[\s_-]+/).filter(Boolean);
  const joined = words.join("");
  const skeletons = [joined, deleet(joined)].map((s) => s.replace(/(.)\1+/g, "$1"));
  const variants = new Set([joined, deleet(joined), ...skeletons]);
  const wordVariants = new Set(words.flatMap((w) => [w, deleet(w), deleet(w).replace(/(.)\1+/g, "$1")]));
  if ([...variants].some((v) => RESERVED_WHOLE.has(v))) return { ok: false, problem: "reserved" };
  if ([...variants].some((v) => RESERVED_PARTS.some((part) => v.includes(part)))) return { ok: false, problem: "reserved" };
  if ([...wordVariants].some((w) => BLOCKED_WORDS.has(w))) return { ok: false, problem: "blocked" };
  if ([...variants].some((v) => BLOCKED_PARTS.some((part) => v.includes(part)))) return { ok: false, problem: "blocked" };
  return { ok: true, nickname, key: nicknameKey(nickname) };
}

const SUGGESTIONS = localized<{ first: string[]; second: string[]; join: (a: string, b: string) => string; fallback: string }>({
  "pt-BR": {
    first: ["Pato", "Gnomo", "Pudim", "Chiado", "Rolimã", "Pixel", "Sinal", "Controle", "Travesseiro", "Cartucho", "Fita", "Antena", "Apito", "Lanche", "Bolinha", "Mola"],
    second: ["Veloz", "Dourado", "Maluco", "Turbo", "Noturno", "Fora do Ar", "Saltitante", "Zapeador", "Teimoso", "Elétrico", "Sem Sinal", "Furioso", "Distraído", "Valente"],
    join: (a, b) => `${a} ${b}`,
    fallback: "Pato Veloz",
  },
  en: {
    first: ["Duck", "Gnome", "Pudding", "Joystick", "Soapbox", "Pixel", "Signal", "Remote", "Pillow", "Cartridge", "Tape", "Antenna", "Whistle", "Snack", "Ball", "Spring"],
    second: ["Speedy", "Golden", "Wacky", "Turbo", "Midnight", "Off-Air", "Bouncy", "Zappy", "Stubborn", "Electric", "Fuzzy", "Furious", "Spacey", "Brave"],
    join: (a, b) => `${b} ${a}`,
    fallback: "Speedy Duck",
  },
});

export function suggestNickname(random: () => number, locale: Locale) {
  const { first, second, join, fallback } = SUGGESTIONS[locale];
  for (let i = 0; i < 20; i += 1) {
    const a = first[Math.floor(random() * first.length)];
    const b = second[Math.floor(random() * second.length)];
    const candidate = join(a, b);
    if (candidate.length <= NICKNAME_MAX) return candidate;
  }
  return fallback;
}
