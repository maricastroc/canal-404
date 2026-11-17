import { Baloo_2, Fredoka, Patrick_Hand } from "next/font/google";
import localFont from "next/font/local";

const luckiest = localFont({
  src: "./fonts/luckiest-guy-latin-400.woff2",
  variable: "--font-luckiest",
  weight: "400",
  display: "swap",
  declarations: [
    { prop: "ascent-override", value: "85%" },
    { prop: "descent-override", value: "15%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const patrick = Patrick_Hand({
  variable: "--font-patrick",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const FONT_CLASSES = `${luckiest.variable} ${baloo.variable} ${patrick.variable} ${fredoka.variable} antialiased`;
