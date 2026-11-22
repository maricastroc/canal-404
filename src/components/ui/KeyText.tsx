import { Fragment } from "react";
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from "@/components/art/Icons";

const ARROWS: Record<string, typeof ArrowLeftIcon> = { "←": ArrowLeftIcon, "→": ArrowRightIcon, "↑": ArrowUpIcon, "↓": ArrowDownIcon };

export function KeyText({ text }: { text: string }) {
  return text.split(/([←→↑↓])/).map((part, i) => {
    const Arrow = ARROWS[part];
    if (!Arrow) return <Fragment key={i}>{part}</Fragment>;
    return (
      <Fragment key={i}>
        <Arrow className="inline-block size-[1.05em] align-[-0.15em]" />
        <span className="sr-only">{part}</span>
      </Fragment>
    );
  });
}
