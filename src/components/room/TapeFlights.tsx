"use client";

import { motion } from "motion/react";
import { P } from "@/lib/palette";
import { SCENE } from "./layout";
import { TAPES, tapeById, type TapeId } from "./objects/tapes";

export type Flight = { id: number; tape: TapeId; to: "vcr" | "shelf"; delay: number };

const VCR_SLOT = { x: 676, y: 718 };
const SIZE = { w: 74, h: 44 };

export function shelfSlot(tape: TapeId) {
  const index = TAPES.filter((t) => !t.torn).findIndex((t) => t.id === tape);
  if (index >= 0) return { x: 856 + 6 + index * 34 + 15, y: 738 };
  return { x: 1019, y: 736 };
}

const x = (value: number) => `${(value / SCENE.w) * 100}%`;
const y = (value: number) => `${(value / SCENE.h) * 100}%`;

function Cassette({ tape }: { tape: TapeId }) {
  const { sticker, label, torn } = tapeById(tape);
  return (
    <svg viewBox="0 0 74 44" className="h-full w-full drop-shadow-[2px_3px_0_rgba(29,24,48,0.55)]" aria-hidden>
      <rect x="2" y="2" width="70" height="40" rx="4" fill={P.inkSoft} stroke={P.ink} strokeWidth="3" />
      <path d={torn ? "M9 7 L48 7 L45 11 L49 15 L44 19 L9 19 Z" : "M9 7 L65 7 L65 19 L9 19 Z"} fill={sticker} stroke={P.ink} strokeWidth="1.5" />
      <text x={torn ? 12 : 37} y="16.5" textAnchor={torn ? "start" : "middle"} fontSize="8" fill={P.ink} style={{ fontFamily: "var(--font-patrick)", fontWeight: 700 }}>
        {torn ? "Não assis" : label}
      </text>
      <rect x="14" y="24" width="46" height="13" rx="3" fill={P.plum950} stroke={P.ink} strokeWidth="1.5" />
      <circle cx="26" cy="30.5" r="4.2" fill="none" stroke={P.cream2} strokeWidth="2" strokeDasharray="2 1.6" />
      <circle cx="48" cy="30.5" r="4.2" fill="none" stroke={P.cream2} strokeWidth="2" strokeDasharray="2 1.6" />
    </svg>
  );
}

export function TapeFlights({ flights, onLand }: { flights: Flight[]; onLand: (flight: Flight) => void }) {
  return flights.map((flight) => {
    const shelf = shelfSlot(flight.tape);
    const inserting = flight.to === "vcr";
    const apexY = Math.min(shelf.y, VCR_SLOT.y) - 150;
    const apexX = (shelf.x + VCR_SLOT.x) / 2;
    const path = inserting
      ? {
          left: [x(shelf.x), x(apexX), x(VCR_SLOT.x), x(VCR_SLOT.x)],
          top: [y(shelf.y - 30), y(apexY), y(VCR_SLOT.y - 34), y(VCR_SLOT.y)],
          rotate: [-90, -30, 0, 0],
          scale: [0.95, 1.3, 1, 0.82],
          scaleY: [1, 1, 1, 0.2],
          opacity: [1, 1, 1, 0],
        }
      : {
          left: [x(VCR_SLOT.x), x(VCR_SLOT.x), x(apexX), x(shelf.x)],
          top: [y(VCR_SLOT.y), y(VCR_SLOT.y - 46), y(apexY), y(shelf.y)],
          rotate: [0, -8, -40, -90],
          scale: [0.82, 1.15, 1.3, 0.95],
          scaleY: [0.2, 1, 1, 1],
          opacity: [0, 1, 1, 1],
        };
    return (
      <motion.div
        key={flight.id}
        data-testid="tape-flight"
        className="pointer-events-none absolute z-[45]"
        style={{ width: x(SIZE.w), height: y(SIZE.h), x: "-50%", y: "-50%" }}
        initial={{ left: path.left[0], top: path.top[0], rotate: path.rotate[0], scale: path.scale[0], scaleY: path.scaleY[0], opacity: path.opacity[0] }}
        animate={path}
        transition={{ duration: 0.5, delay: flight.delay, times: inserting ? [0, 0.5, 0.82, 1] : [0, 0.22, 0.6, 1], ease: "easeInOut" }}
        onAnimationComplete={() => onLand(flight)}
      >
        <Cassette tape={flight.tape} />
      </motion.div>
    );
  });
}
