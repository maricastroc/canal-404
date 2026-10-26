import { SAVE_KEY, type AreaId, type Dir } from "./config";

export type Item = "net" | "whistle" | "remote" | "order" | "key" | "cartridge";
export type PosterId = "club" | "summer" | "tilt" | "surf" | "ghost";
export type TokenId = "lounge" | "shell" | "log";
export type SecretId = "room404" | "machine" | "lento";
export type FolkKey = "bigodes" | "marola" | "tilt" | "marisa" | "psiu" | "lento" | "mascot" | "capi" | "clique" | "cavuca" | "chiado" | "placar";

export type State = {
  v: 1;
  area: AreaId;
  x: number;
  y: number;
  dir: Dir;
  facing: number;
  flags: Record<string, boolean>;
  items: Item[];
  posters: PosterId[];
  tokens: TokenId[];
  secrets: SecretId[];
  met: FolkKey[];
  found: string[];
  visited: AreaId[];
  time: number;
  ending: "off" | "on" | null;
};

export const ALL_POSTERS: PosterId[] = ["club", "summer", "tilt", "surf", "ghost"];
export const ALL_TOKENS: TokenId[] = ["lounge", "shell", "log"];
export const ALL_SECRETS: SecretId[] = ["room404", "machine", "lento"];

export function freshState(): State {
  return {
    v: 1,
    area: "lobby",
    x: 1200,
    y: 1120,
    dir: "k",
    facing: 1,
    flags: {},
    items: [],
    posters: [],
    tokens: [],
    secrets: [],
    met: [],
    found: [],
    visited: [],
    time: 0,
    ending: null,
  };
}

export function loadState(): State | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<State>;
    if (data.v !== 1) return null;
    return { ...freshState(), ...data } as State;
  } catch {
    return null;
  }
}

export function saveState(s: State) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    return;
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    return;
  }
}
