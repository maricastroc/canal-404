import type { SoundRecipe } from "@/lib/audio/types";

export type GameResult = {
  won: boolean;
  score: number;
  stars: number;
  breakdown: { label: string; value: number }[];
  achievements?: string[];
  level?: { index: number; id: string; title: string; total: number };
  copy?: { title: string; text: string };
  summary?: string;
};

export type StartOptions = { level?: number };

export type GameEvent =
  | { type: "score"; score: number }
  | { type: "announce"; message: string }
  | { type: "pause-request" }
  | { type: "achievement"; id: string }
  | { type: "launch" }
  | { type: "finished"; result: GameResult };

export type LoadStage = "codigo" | "arte" | "cena";

export type GameHostContext = {
  parent: HTMLElement;
  keyboardTarget: HTMLElement;
  fonts: { display: string; body: string; hand: string };
  reducedMotion: boolean;
  highScore: number;
  audio: {
    play: (recipe: SoundRecipe, options?: { volume?: number; pitch?: number }) => void;
  };
  onProgress: (value: number, stage: LoadStage) => void;
  onReady: () => void;
  onEvent: (event: GameEvent) => void;
};

export type GameInstance = {
  start: (options?: StartOptions) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  setHighScore: (value: number) => void;
  destroy: () => void;
};

export type GameModule = {
  mount: (context: GameHostContext) => GameInstance;
};
