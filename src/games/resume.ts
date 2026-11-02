import { loadState as loadVacation } from "./off-air-vacation/save";

const CHECKS: Record<string, () => boolean> = {
  "off-air-vacation": () => loadVacation() !== null,
};

export function canResume(slug: string, key: string) {
  try {
    const check = CHECKS[slug];
    if (check) return check();
    return Boolean(window.localStorage.getItem(key));
  } catch {
    return false;
  }
}
