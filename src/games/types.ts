import type { Locale } from "@/i18n/locales";
import type { SoundRecipe } from "@/lib/audio/types";

export type GameStats = Record<string, number>;

export type PlacedPartReplay = { type: string; x: number; y: number; rot: number };

export type LaunchReplay = { at: number; angle: number; power: number; ammo: string };

export type DownhillReplay = { kind: "downhill-run"; version: 1; cart: string; tape: string; rivals: number[] };

export type BedtimeReplay = { kind: "bedtime-moves"; version: 1; moves: string };

export type GameReplay = { kind: "lab-placements"; version: 1; parts: PlacedPartReplay[] } | { kind: "street-launches"; version: 2; launches: LaunchReplay[] } | DownhillReplay | BedtimeReplay;

export type ResultStanding = { name: string; value: string; detail?: string; you?: boolean; avatar?: string; color?: string };

export type ResultFact = { label: string; value: string };

export type GameResult = {
  won: boolean;
  score: number;
  stars: number;
  breakdown: { label: string; value: number }[];
  stats?: GameStats;
  replay?: GameReplay;
  achievements?: string[];
  level?: { index: number; id: string; title: string; total: number };
  copy?: { title: string; text: string };
  summary?: string;
  starHint?: string;
  alt?: string;
  featured?: string;
  restartLabel?: string;
  standings?: ResultStanding[];
  facts?: ResultFact[];
};

export type MatchSetup = { character?: string };

export type LevelRecord = { stars: number; score: number };

export type StartOptions = { level?: number; next?: boolean; fresh?: boolean; setup?: MatchSetup; checkpoints?: boolean; records?: LevelRecord[] };

export type GameEvent =
  | { type: "score"; score: number }
  | { type: "announce"; message: string; transient?: boolean; fresh?: boolean }
  | { type: "pause-request" }
  | { type: "achievement"; id: string }
  | { type: "launch" }
  | { type: "finished"; result: GameResult };

export type LoadStage = "code" | "art" | "scene";

export type GameHostContext = {
  locale: Locale;
  parent: HTMLElement;
  keyboardTarget: HTMLElement;
  fonts: { display: string; body: string; hand: string; round?: string };
  reducedMotion: boolean;
  highScore: number;
  audio: {
    play: (recipe: SoundRecipe, options?: { volume?: number; pitch?: number }) => void;
  };
  onProgress: (value: number, stage: LoadStage) => void;
  onReady: () => void;
  onEvent: (event: GameEvent) => void;
};

export type IntroProgress = { title: string; text: string; stats: { label: string; value: string }[] };

export type GameInstance = {
  start: (options?: StartOptions) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  alt?: () => void;
  progress?: () => IntroProgress | null;
  setHighScore: (value: number) => void;
  destroy: () => void;
};

export type GameModule = {
  mount: (context: GameHostContext) => GameInstance;
};
