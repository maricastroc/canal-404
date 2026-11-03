export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 16;

export type NicknameProblem = "short" | "long" | "chars" | "digits" | "blocked" | "reserved";

export type NicknameCheck = { ok: true; nickname: string; key: string } | { ok: false; problem: NicknameProblem };

export const NICKNAME_PROBLEMS: Record<NicknameProblem, string> = {
  short: `Use pelo menos ${NICKNAME_MIN} letras.`,
  long: `Use no máximo ${NICKNAME_MAX} caracteres.`,
  chars: "Use letras, números, espaço, hífen ou sublinhado.",
  digits: "Esse apelido parece um número de telefone ou documento. Escolha outro.",
  blocked: "Esse apelido não passa na censura do canal. Escolha outro.",
  reserved: "Esse apelido é da equipe do canal. Escolha outro.",
};

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

const FIRST = ["Pato", "Gnomo", "Pudim", "Chiado", "Rolimã", "Pixel", "Sinal", "Controle", "Travesseiro", "Cartucho", "Fita", "Antena", "Apito", "Lanche", "Bolinha", "Mola"];
const SECOND = ["Veloz", "Dourado", "Maluco", "Turbo", "Noturno", "Fora do Ar", "Saltitante", "Zapeador", "Teimoso", "Elétrico", "Sem Sinal", "Furioso", "Distraído", "Valente"];

export function suggestNickname(random: () => number = Math.random) {
  for (let i = 0; i < 20; i += 1) {
    const a = FIRST[Math.floor(random() * FIRST.length)];
    const b = SECOND[Math.floor(random() * SECOND.length)];
    const candidate = `${a} ${b}`;
    if (candidate.length <= NICKNAME_MAX) return candidate;
  }
  return "Pato Veloz";
}
