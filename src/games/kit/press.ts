import { getAudio } from "@/lib/audio/engine";
import { SFX } from "@/lib/audio/sfx";
import type { SoundRecipe } from "@/lib/audio/types";

export function pressed(action: () => void, recipe: SoundRecipe = SFX.click) {
  const audio = getAudio();
  const before = audio.playRequests;
  action();
  if (audio.playRequests === before) audio.play(recipe);
}
