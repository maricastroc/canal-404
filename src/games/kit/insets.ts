export type Insets = { top: number; right: number; bottom: number; left: number };

let probe: HTMLDivElement | null = null;

function envInsets(): Insets {
  if (typeof document === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  if (!probe || !probe.isConnected) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;inset:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
    document.body.appendChild(probe);
  }
  const style = getComputedStyle(probe);
  return { top: parseFloat(style.paddingTop) || 0, right: parseFloat(style.paddingRight) || 0, bottom: parseFloat(style.paddingBottom) || 0, left: parseFloat(style.paddingLeft) || 0 };
}

export function insetsOf(parent: HTMLElement): Insets {
  const env = envInsets();
  const r = parent.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    top: Math.round(Math.max(0, env.top - r.top)),
    right: Math.round(Math.max(0, env.right - (vw - r.right))),
    bottom: Math.round(Math.max(0, env.bottom - (vh - r.bottom))),
    left: Math.round(Math.max(0, env.left - r.left)),
  };
}
