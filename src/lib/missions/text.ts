import type { Locale } from "@/i18n/locales";
import { CATALOG } from "./catalog";

type MissionText = { title: string; objective: string };

const EN: Record<string, MissionText> = {
  "lab-finale-every-part": {
    title: "The full machine",
    objective: "In “The worst idea of all”, use all 5 parts in the box. The ball has to go through every one of them before it rings the bell.",
  },
  "lab-finale-two-parts": {
    title: "Less is more",
    objective: "Ring the bell in “The worst idea of all” using no more than 2 parts.",
  },
  "lab-pixel-two-ramps": {
    title: "Double ramp",
    objective: "Wake Pixel up using both ramps. The ball has to go through both of them.",
  },
  "lab-pixel-fast": {
    title: "Speedy alarm clock",
    objective: "Wake Pixel up fast: the ball has to ring the bell in 4.20 seconds or less.",
  },
  "lab-juice-fast": {
    title: "Express juice",
    objective: "Get the orange to the juicer in 1.80 seconds or less.",
  },
  "lab-juice-fan-and-ramp": {
    title: "Wind and slope",
    objective: "Make the juice using the fan and the ramp. The orange has to go through both of them.",
  },
  "lab-remote-three-parts": {
    title: "Full loop",
    objective: "Press the button on the remote using both conveyor belts and the ramp. The ball has to go through all three.",
  },
  "food-streak-eight": {
    title: "Eight in a row",
    objective: "Hit 8 classmates in a row. Missing, hitting a tray or getting hit by a pudding resets the streak.",
  },
  "food-spotless": {
    title: "Not a single stain",
    objective: "Make it to the bell without getting hit by a single pudding.",
  },
  "food-two-stars": {
    title: "Two-star recess",
    objective: "Make it to the bell with at least 7,500 points.",
  },
  "food-lunch-lady": {
    title: "Lunch lady never saw it",
    objective: "Make it to the bell without hitting the lunch lady.",
  },
  "food-right-on-time": {
    title: "Just in time",
    objective: "Hit 5 classmates just in time, right as they raise their pudding.",
  },
  "street-five-launches": {
    title: "Thrifty aim",
    objective: "Win all three rounds of Dead End Street using no more than 5 of the 7 objects.",
  },
  "street-two-at-once": {
    title: "Two at once",
    objective: "Knock down both targets in a round with a single launch.",
  },
  "street-three-stars": {
    title: "Three stars on the street",
    objective: "Win Dead End Street with at least 2,050 points. Every object left over is worth 250.",
  },
  "street-yard-chaos": {
    title: "Yard turned upside down",
    objective: "Move at least 7 of the 10 things in Mr. Arlindo's yard: tires, cans, the plank and the boxes.",
  },
  "street-domino-one-launch": {
    title: "One brick does it",
    objective: "In “Domino effect”, knock down the flamingo and the garage gnome with a single launch.",
  },
  "street-bath-plumber": {
    title: "Plumber on duty",
    objective: "In “Surprise shower”, soak all three gnomes using the rope, the bucket and the faucet.",
  },
  "street-path-three": {
    title: "Path cleared",
    objective: "In “Blocked path”, get the bowling ball to the golden gnome in no more than 3 launches.",
  },
  "street-giant-two": {
    title: "Giant Gnome down",
    objective: "In “The big mess”, knock down the Giant Gnome and the other two gnomes in no more than 2 launches.",
  },
  "recess-corridor-spotless": {
    title: "Scratch-free hallway",
    objective: "Get through the Forbidden hallway without taking a single hit from the monitors.",
  },
  "recess-yard-stickers": {
    title: "Complete album",
    objective: "Grab all 4 stickers in the Occupied schoolyard and reach the door to the principal's office. Some of them are way up high.",
  },
  "recess-yard-monitors": {
    title: "Schoolyard cleared",
    objective: "Take down all 9 monitors in the Occupied schoolyard, including the ones with whistles, before you reach the door.",
  },
  "recess-office-boss": {
    title: "No chance, Inspector",
    objective: "Beat the Silence Inspector taking no more than 3 hits on the whole Road to the office.",
  },
  "pajama-bedroom-few-pillows": {
    title: "Barely a mark",
    objective: "Win the war in the Bedroom taking no more than 4 pillow hits. Keep an eye on the “!”.",
  },
  "pajama-living-double-ko": {
    title: "Double knockout",
    objective: "In the Living room, land the final knockout on both opponents and finish standing.",
  },
  "pajama-living-full-energy": {
    title: "Energy to spare",
    objective: "Win in the Living room finishing with at least 7 energy points.",
  },
  "pajama-yard-lia": {
    title: "The fast one in the Backyard",
    objective: "Win in the Backyard playing as Lia. She runs fast, but takes a while to grab another pillow.",
  },
  "pajama-attic-nico": {
    title: "The thrower in the Attic",
    objective: "Win in the Attic playing as Nico. He throws fast, but he's the slowest runner between the blanket forts.",
  },
};

export function missionText(mission: { key: string; version: number; title: string; objective: string }, locale: Locale): MissionText {
  if (locale === "pt-BR") return { title: mission.title, objective: mission.objective };
  const def = CATALOG.find((m) => m.key === mission.key);
  const text = EN[mission.key];
  if (!def || !text || def.version !== mission.version) return { title: mission.title, objective: mission.objective };
  return text;
}
