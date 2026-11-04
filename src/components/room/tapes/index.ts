import type { TapeId } from "../objects/tapes";
import { cartoonTape } from "./CartoonTape";
import { forbiddenTape } from "./ForbiddenTape";
import { karaokeTape } from "./KaraokeTape";
import { resortTape } from "./ResortTape";
import { streetAdTape } from "./StreetAdTape";
import type { TapeProgram } from "./vhs";

export const TAPE_PROGRAMS: Record<TapeId, TapeProgram> = {
  "tape-cartoon": cartoonTape,
  "tape-street": streetAdTape,
  "tape-resort": resortTape,
  "tape-karaoke": karaokeTape,
  tape: forbiddenTape,
};
