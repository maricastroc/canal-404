export type Wave = "sine" | "square" | "triangle" | "sawtooth" | "pulse";

export type ToneLayer = {
  kind: "tone";
  wave: Wave;
  from: number;
  to?: number;
  duration: number;
  delay?: number;
  gain?: number;
  attack?: number;
  glide?: "exp" | "linear";
  vibrato?: { rate: number; depth: number };
  filter?: { type: BiquadFilterType; frequency: number; q?: number };
};

export type NoiseLayer = {
  kind: "noise";
  duration: number;
  delay?: number;
  gain?: number;
  attack?: number;
  filter?: { type: BiquadFilterType; from: number; to?: number; q?: number };
};

export type SoundLayer = ToneLayer | NoiseLayer;

export type SoundRecipe = {
  layers: SoundLayer[];
  volume?: number;
  detune?: number;
};

export type SoundPlayer = {
  play: (recipe: SoundRecipe, options?: { volume?: number; pitch?: number }) => void;
  isEnabled: () => boolean;
};
