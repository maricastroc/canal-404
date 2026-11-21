export type Dir = 0 | 1 | 2 | 3;

export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

export type Action = Dir | "wait";

export type Point = { x: number; y: number };

export type PatrolStep = { x: number; y: number; f?: Dir; peek?: boolean };

export type ConeShape = "wide" | "narrow";

export type TossDef = { period: number; offset: number; facing: Dir };

export type SleeperDef = { kind: "sleeper"; id: string; x: number; y: number; wake: number; range: number; cone: ConeShape; hear: number; toss?: TossDef };

export type PatrolDef = { kind: "patrol"; id: string; path: PatrolStep[]; start: number; range: number; cone: ConeShape; hear: number; alert: number };

export type DogDef = { kind: "dog"; id: string; x: number; y: number; hear: number; sniff: number };

export type CatDef = { kind: "cat"; id: string; x: number; y: number; sx: number; sy: number; period: number; offset: number; loud: number; hear: number };

export type AgentDef = SleeperDef | PatrolDef | DogDef | CatDef;

export type ClockDef = { period: number; x: number; y: number };

export type PropKind = "bed" | "nightstand" | "sofa" | "armchair" | "table" | "chair" | "fridge" | "counter" | "counterLow" | "stove" | "sink" | "pantry" | "washer" | "cabinet" | "sideboard" | "shelf" | "plant" | "tv" | "vcr" | "dogbed" | "stairs" | "door" | "rug" | "window" | "toybox" | "laundry" | "sewing" | "aquarium";

export type PropDef = { kind: PropKind; x: number; y: number; w?: number; h?: number; f?: Dir };

export type LevelDef = {
  id: string;
  map: readonly string[];
  loud: number;
  clock?: ClockDef;
  agents: readonly AgentDef[];
  props: readonly PropDef[];
  par: number;
};

export type SleeperState = { kind: "sleeper"; awake: number; facing: Dir; stir: number };

export type PatrolState = { kind: "patrol"; idx: number; x: number; y: number; facing: Dir; alert: number };

export type DogMode = "sleep" | "go" | "sniff" | "back";

export type DogState = { kind: "dog"; x: number; y: number; mode: DogMode; tx: number; ty: number; timer: number; facing: Dir; stir: number };

export type CatState = { kind: "cat" };

export type AgentState = SleeperState | PatrolState | DogState | CatState;

export type Status = "playing" | "caught" | "won";

export type CatchReason = "light" | "walked" | "dog";

export type State = {
  turn: number;
  x: number;
  y: number;
  facing: Dir;
  agents: readonly AgentState[];
  status: Status;
  caughtBy: number;
  reason: CatchReason | null;
  creaks: number;
  masked: number;
  wakes: number;
};

export type SimEvent =
  | { type: "move"; from: Point; to: Point; dir: Dir }
  | { type: "wait" }
  | { type: "creak"; x: number; y: number; masked: boolean }
  | { type: "knock"; agent: number; x: number; y: number }
  | { type: "cuckoo" }
  | { type: "heard"; agent: number; x: number; y: number; source: number }
  | { type: "wake"; agent: number; facing: Dir }
  | { type: "stir"; agent: number; level: number }
  | { type: "toss"; agent: number; facing: Dir }
  | { type: "sleep"; agent: number }
  | { type: "alert"; agent: number; facing: Dir }
  | { type: "resume"; agent: number }
  | { type: "agentMove"; agent: number; from: Point; to: Point; facing: Dir }
  | { type: "turnAround"; agent: number; facing: Dir }
  | { type: "dogArrive"; agent: number }
  | { type: "dogHome"; agent: number }
  | { type: "caught"; agent: number; reason: CatchReason }
  | { type: "won" };
