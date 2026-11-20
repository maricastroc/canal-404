"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localized } from "@/i18n/copy";
import { useLocale } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import { getGameRecord, recordGameStart, recordLevelResult } from "@/lib/progress/store";
import type { CourseId } from "@/games/downhill-derby/sim/course";
import { CAMERA_SPECS, DEFAULT_CAMERA, DEFAULT_SETTINGS, InputState, type CameraSpec, type ArtSetting, type CameraTuning, type InteractionSetting, type PrototypeSettings, type RivalPace, type RunSummary, type TouchSetting } from "@/games/downhill-derby/input";
import type { PrototypeHandle } from "@/games/downhill-derby/prototype";
import type { SceneBridge } from "@/games/downhill-derby/scenes/RaceScene";
import { DEFAULT_PARAMS, PARAM_SPECS, cloneParams, type ParamGroup, type ParamSpec, type Params } from "@/games/downhill-derby/sim/params";

const SETTINGS_KEY = "canal404:downhill-prototype:settings:v3";
const PANEL_KEY = "canal404:downhill-prototype:panel";
const GAME_SLUG = "downhill-derby";

type ParamText = { label: string; help: string };

const COPY = localized({
  "pt-BR": {
    loading: "Preparando a ladeira…",
    panel: "Calibragem",
    collapse: "Recolher",
    expand: "Abrir calibragem",
    cameraTitle: "Câmera",
    cameraParams: {
      zoomSlow: { label: "Zoom devagar", help: "Aproximação com o carrinho lento" },
      zoomFast: { label: "Zoom em alta velocidade", help: "Afastamento no Sem Freio" },
      lead: { label: "Antecipação", help: "Quanto a câmera olha à frente" },
      roadLine: { label: "Altura da pista na tela", help: "Onde a pista fica na vertical (mais alto mostra mais chão)" },
    } satisfies Record<keyof CameraTuning, ParamText>,
    panelHint: "Mudanças valem na hora. Os rivais continuam com os valores padrão.",
    controls: "Controles",
    controlKeys: "Segure ↓ ou S para agachar e carregar; Espaço pula. ← → giram no ar.",
    shortcuts: "R reinicia · Esc ou P pausa",
    course: "Pista",
    courseOptions: { arlindo: "Ladeira do Seu Arlindo", test: "Pista de teste" } satisfies Record<CourseId, string>,
    art: "Visual",
    artOptions: { current: "Antigo (protótipo)", sample: "Padrão aprovado (só na Rua das Pitangueiras)" } satisfies Record<ArtSetting, string>,
    artHint: "O padrão aprovado cobre por enquanto a largada e a Rua das Pitangueiras. A corrida recomeça ao trocar.",
    view: "Ajudas e corrida",
    indicator: "Indicador de pouso",
    rivals: "Rivais (Lina e Bruno)",
    ghost: "Fantasma do seu melhor tempo",
    touch: "Botões de toque",
    touchOptions: { auto: "Automático", on: "Sempre", off: "Nunca" } satisfies Record<TouchSetting, string>,
    pace: "Ritmo dos rivais",
    paceOptions: { adaptive: "Acompanha seu melhor tempo", fast: "Fixo e rápido" } satisfies Record<RivalPace, string>,
    paceHint: "No ritmo acompanhado, o Bruno corre um pouco mais devagar que o seu melhor tempo e a Lina um pouco mais rápido. Vale a partir da próxima largada.",
    experiment: "Experimentos arquivados",
    experimentHint: "Encerrados e fora da corrida padrão. Ficam aqui só para comparação. Sempre começam desligados.",
    interactionOptions: {
      off: "Desligado",
      dust: "Poeira do pouso: quem pousa logo à frente atrasa quem vem atrás",
      kick: "Caixote chutado: bater rápido num cone ou caixote o arremessa ladeira abaixo",
    } satisfies Record<InteractionSetting, string>,
    restart: "Reiniciar corrida",
    reset: "Restaurar padrão",
    copy: "Copiar valores",
    copied: "Copiado!",
    groups: { physics: "Física", crouch: "Agachar", jump: "Pulo", spin: "Rotação no ar", landing: "Pouso", crash: "Capotada e batidas" } satisfies Record<ParamGroup, string>,
    runs: "Corridas desta sessão",
    noRuns: "Nenhuma corrida terminada ainda.",
    time: "Tempo",
    place: "Pos.",
    landings: "Pousos",
    crashes: "Cap.",
    shortcut: "Atalho",
    bestOf: (time: string, count: number) => `Melhor: ${time} (${count} ${count === 1 ? "corrida" : "corridas"})`,
    replay: (ok: number, total: number) => `Reprodução da corrida pelo registro de comandos: ${ok} de ${total} idênticas`,
    yes: "sim",
    no: "—",
    params: {
      gravity: { label: "Gravidade", help: "Peso no ar e nas descidas" },
      slopeGain: { label: "Aceleração na ladeira", help: "Quanto a inclinação empurra" },
      drag: { label: "Arrasto do ar", help: "Freia mais em alta velocidade" },
      rolling: { label: "Atrito das rodas", help: "Freio constante" },
      minSpeed: { label: "Velocidade mínima", help: "Abaixo disso o piloto rema" },
      cobbleStand: { label: "Paralelepípedo em pé", help: "Freio extra sem agachar" },
      cobbleCrouch: { label: "Paralelepípedo agachado", help: "Freio extra agachado" },
      crouchBoost: { label: "Ganho na descida", help: "Aceleração extra agachado" },
      crouchDrag: { label: "Menos arrasto", help: "Redução do arrasto agachado" },
      crouchStick: { label: "Aderência nas cristas", help: "Agachado decola menos sozinho" },
      popBase: { label: "Pulo base", help: "Toque rápido" },
      popCharge: { label: "Pulo carregado", help: "Força extra com carga cheia" },
      chargeTime: { label: "Tempo de carga", help: "Até a carga encher" },
      lipBonus: { label: "Bônus na beira", help: "Pular na marca de giz" },
      spinMax: { label: "Velocidade de giro", help: "Giro máximo no ar" },
      spinAccel: { label: "Resposta do giro", help: "Quão rápido o giro começa e para" },
      autoAlign: { label: "Alinhamento automático", help: "Ajuda sem apertar nada" },
      perfectTol: { label: "Tolerância perfeita", help: "Ângulo para pouso perfeito" },
      okTol: { label: "Tolerância torta", help: "Acima disso, capota" },
      okLoss: { label: "Perda no pouso torto", help: "Velocidade perdida" },
      perfectKeep: { label: "Impulso mantido no perfeito", help: "Parte da queda que vira velocidade" },
      perfectBonus: { label: "Embalo do pouso perfeito", help: "Velocidade extra" },
      flipBonus: { label: "Embalo por mortal", help: "Extra por volta completa" },
      crashTime: { label: "Duração da capotada", help: "Tempo até voltar" },
      crashKeep: { label: "Velocidade após capotar", help: "Quanto sobra" },
      hitLoss: { label: "Perda ao bater", help: "Cones, caixotes e varal" },
    } satisfies Record<keyof Params, ParamText>,
  },
  en: {
    loading: "Getting the hill ready…",
    panel: "Tuning",
    collapse: "Collapse",
    expand: "Open tuning",
    cameraTitle: "Camera",
    cameraParams: {
      zoomSlow: { label: "Slow zoom", help: "How close it gets when slow" },
      zoomFast: { label: "High-speed zoom", help: "How far it pulls out at No Brakes" },
      lead: { label: "Look-ahead", help: "How far ahead the camera looks" },
      roadLine: { label: "Road height on screen", help: "Where the road sits vertically (higher shows more ground)" },
    } satisfies Record<keyof CameraTuning, ParamText>,
    panelHint: "Changes apply right away. The rivals keep the default values.",
    controls: "Controls",
    controlKeys: "Hold ↓ or S to crouch and charge; Space jumps. ← → spin in the air.",
    shortcuts: "R restarts · Esc or P pauses",
    course: "Track",
    courseOptions: { arlindo: "Mr. Arlindo's Hill", test: "Test track" } satisfies Record<CourseId, string>,
    art: "Visuals",
    artOptions: { current: "Old (prototype)", sample: "Approved style (Pitanga Street only)" } satisfies Record<ArtSetting, string>,
    artHint: "For now the approved style covers the start and Pitanga Street. The race restarts when you switch.",
    view: "Aids and race",
    indicator: "Landing indicator",
    rivals: "Rivals (Lina and Bruno)",
    ghost: "Ghost of your best time",
    touch: "Touch buttons",
    touchOptions: { auto: "Automatic", on: "Always", off: "Never" } satisfies Record<TouchSetting, string>,
    pace: "Rival pace",
    paceOptions: { adaptive: "Follows your best time", fast: "Fixed and fast" } satisfies Record<RivalPace, string>,
    paceHint: "When it follows you, Bruno runs a little slower than your best time and Lina a little faster. It applies from the next start.",
    experiment: "Archived experiments",
    experimentHint: "Closed and out of the standard race. Kept only for comparison. They always start off.",
    interactionOptions: {
      off: "Off",
      dust: "Landing dust: landing just ahead slows whoever is right behind",
      kick: "Kicked crate: hitting a cone or crate fast sends it down the hill",
    } satisfies Record<InteractionSetting, string>,
    restart: "Restart race",
    reset: "Restore defaults",
    copy: "Copy values",
    copied: "Copied!",
    groups: { physics: "Physics", crouch: "Crouch", jump: "Jump", spin: "Air spin", landing: "Landing", crash: "Wipeouts and bumps" } satisfies Record<ParamGroup, string>,
    runs: "Runs this session",
    noRuns: "No finished runs yet.",
    time: "Time",
    place: "Pos.",
    landings: "Landings",
    crashes: "Wipe.",
    shortcut: "Shortcut",
    bestOf: (time: string, count: number) => `Best: ${time} (${count} ${count === 1 ? "run" : "runs"})`,
    replay: (ok: number, total: number) => `Race rebuilt from the input log: ${ok} of ${total} identical`,
    yes: "yes",
    no: "—",
    params: {
      gravity: { label: "Gravity", help: "Weight in the air and downhill" },
      slopeGain: { label: "Slope push", help: "How much the slope pushes" },
      drag: { label: "Air drag", help: "Slows you more at high speed" },
      rolling: { label: "Wheel friction", help: "Constant brake" },
      minSpeed: { label: "Minimum speed", help: "Below it the rider paddles" },
      cobbleStand: { label: "Cobbles standing", help: "Extra brake when not crouching" },
      cobbleCrouch: { label: "Cobbles crouching", help: "Extra brake when crouching" },
      crouchBoost: { label: "Downhill gain", help: "Extra acceleration when crouching" },
      crouchDrag: { label: "Less drag", help: "Drag reduction when crouching" },
      crouchStick: { label: "Grip on crests", help: "Crouching takes off less by itself" },
      popBase: { label: "Base jump", help: "Quick tap" },
      popCharge: { label: "Charged jump", help: "Extra force with a full charge" },
      chargeTime: { label: "Charge time", help: "Until the charge is full" },
      lipBonus: { label: "Edge bonus", help: "Jumping on the chalk mark" },
      spinMax: { label: "Spin speed", help: "Top spin in the air" },
      spinAccel: { label: "Spin response", help: "How fast spinning starts and stops" },
      autoAlign: { label: "Auto alignment", help: "Help without pressing anything" },
      perfectTol: { label: "Perfect tolerance", help: "Angle for a perfect landing" },
      okTol: { label: "Wobbly tolerance", help: "Above it, you wipe out" },
      okLoss: { label: "Wobbly landing loss", help: "Speed lost" },
      perfectKeep: { label: "Momentum kept when perfect", help: "Share of the fall that becomes speed" },
      perfectBonus: { label: "Perfect landing boost", help: "Extra speed" },
      flipBonus: { label: "Boost per flip", help: "Extra per full turn" },
      crashTime: { label: "Wipeout length", help: "Time until you're back" },
      crashKeep: { label: "Speed after a wipeout", help: "How much is left" },
      hitLoss: { label: "Bump loss", help: "Cones, crates and clothesline" },
    } satisfies Record<keyof Params, ParamText>,
  },
});

const GROUPS: ParamGroup[] = ["physics", "crouch", "jump", "spin", "landing", "crash"];

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function loadSettings(): PrototypeSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PrototypeSettings>;
    return {
      course: parsed.course === "test" ? "test" : "arlindo",
      art: parsed.art === "current" ? "current" : "sample",
      indicator: parsed.indicator !== false,
      rivals: parsed.rivals !== false,
      ghost: parsed.ghost === true,
      touch: parsed.touch === "on" || parsed.touch === "off" ? parsed.touch : "auto",
      rivalPace: parsed.rivalPace === "fast" ? "fast" : "adaptive",
      interaction: "off",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: PrototypeSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target.isContentEditable;
}

function displayValue(spec: ParamSpec | CameraSpec, value: number, locale: "pt-BR" | "en") {
  if (spec.unit === "%") return `${formatNumber(Math.round(value * 100), locale)}%`;
  if (spec.unit === "×") return formatNumber(value, locale, { maximumFractionDigits: 2 });
  if (spec.unit === "s") return `${formatNumber(value, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
  return `${formatNumber(value, locale)} ${spec.unit}`;
}

function formatTime(seconds: number, locale: "pt-BR" | "en") {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${formatNumber(s, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, minimumIntegerDigits: 2 })}`;
}

export function DownhillPrototype() {
  const locale = useLocale();
  const copy = COPY[locale];
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PrototypeHandle | null>(null);
  const bridgeRef = useRef<SceneBridge | null>(null);
  const [ready, setReady] = useState(false);
  const [params, setParams] = useState<Params>(() => cloneParams(DEFAULT_PARAMS));
  const [camera, setCamera] = useState<CameraTuning>({ ...DEFAULT_CAMERA });
  const [panelOpen, setPanelOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<PrototypeSettings>({ ...DEFAULT_SETTINGS });
  const [mountKey, setMountKey] = useState(0);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [replays, setReplays] = useState({ ok: 0, total: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const initial = loadSettings();
    setSettings(initial);
    const bridge: SceneBridge = {
      locale,
      fonts: { display: "Arial Black, sans-serif", body: "Trebuchet MS, sans-serif" },
      reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
      params: cloneParams(DEFAULT_PARAMS),
      camera: { ...DEFAULT_CAMERA },
      settings: { ...initial },
      input: new InputState(),
      paramsVersion: 0,
      onRun: (summary) => setRuns((list) => [summary, ...list].slice(0, 30)),
      onReplayCheck: (ok) => setReplays((r) => ({ ok: r.ok + (ok ? 1 : 0), total: r.total + 1 })),
      onRaceStart: () => recordGameStart(GAME_SLUG),
      saveResult: (course, stars) => {
        const before = getGameRecord(GAME_SLUG).levels?.[course]?.stars ?? 0;
        recordLevelResult(GAME_SLUG, course, { score: 0, stars, won: true });
        return { before };
      },
    };
    bridgeRef.current = bridge;
    (async () => {
      await document.fonts.ready;
      try {
        if (!cancelled && window.localStorage.getItem(PANEL_KEY) === "open") setPanelOpen(true);
      } catch {}
      const fonts = { display: cssFont("--font-luckiest", "Arial Black, sans-serif"), body: cssFont("--font-baloo", "Trebuchet MS, sans-serif") };
      await Promise.all([document.fonts.load(`48px ${fonts.display}`), document.fonts.load(`700 24px ${fonts.body}`)]).catch(() => undefined);
      bridge.fonts = fonts;
      const { mountPrototype } = await import("@/games/downhill-derby/prototype");
      if (cancelled) return;
      handleRef.current = mountPrototype(host, bridge);
      setReady(true);
    })();
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (isFormField(e.target)) return;
      const input = bridge.input;
      const code = e.code;
      let handled = true;
      if (down && !e.repeat && (code === "Enter" || code === "NumpadEnter") && handleRef.current?.confirmResults()) handled = true;
      else if (down && code === "Tab" && handleRef.current?.focusResults()) handled = true;
      else if (code === "Space") input.setSpace(down, "key");
      else if (code === "ArrowDown" || code === "KeyS") input.setDown(down, "key");
      else if (code === "ArrowLeft" || code === "KeyA") input.setLeft(down, "key");
      else if (code === "ArrowRight" || code === "KeyD") input.setRight(down, "key");
      else if (code === "ArrowUp" || code === "KeyW") handled = true;
      else if (down && !e.repeat && code === "KeyR") handleRef.current?.restart();
      else if (down && !e.repeat && (code === "Escape" || code === "KeyP")) handleRef.current?.togglePause();
      else handled = false;
      if (handled) e.preventDefault();
    };
    const observer = new ResizeObserver(() => handleRef.current?.refresh());
    if (stageRef.current) observer.observe(stageRef.current);
    const keydown = (e: KeyboardEvent) => onKey(e, true);
    const keyup = (e: KeyboardEvent) => onKey(e, false);
    const blur = () => {
      bridge.input.releaseAll();
      handleRef.current?.togglePause(true);
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [locale, mountKey]);

  const updateParam = useCallback((key: keyof Params, value: number) => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    bridge.params[key] = value;
    bridge.paramsVersion += 1;
    setParams({ ...bridge.params });
  }, []);

  const resetParams = useCallback(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    Object.assign(bridge.params, DEFAULT_PARAMS);
    Object.assign(bridge.camera, DEFAULT_CAMERA);
    bridge.paramsVersion += 1;
    setParams(cloneParams(DEFAULT_PARAMS));
    setCamera({ ...DEFAULT_CAMERA });
  }, []);

  const updateCamera = useCallback((key: keyof CameraTuning, value: number) => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    bridge.camera[key] = value;
    setCamera({ ...bridge.camera });
  }, []);

  const togglePanel = useCallback((open: boolean) => {
    setPanelOpen(open);
    try {
      window.localStorage.setItem(PANEL_KEY, open ? "open" : "closed");
    } catch {}
  }, []);

  const changeSettings = useCallback((patch: Partial<PrototypeSettings>) => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    const artChanged = (patch.art !== undefined && patch.art !== bridge.settings.art) || (patch.course !== undefined && patch.course !== bridge.settings.course);
    Object.assign(bridge.settings, patch);
    const next = { ...bridge.settings };
    setSettings(next);
    saveSettings(next);
    if (artChanged) setMountKey((k) => k + 1);
    else handleRef.current?.applySettings();
  }, []);

  const copyValues = useCallback(async () => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    const changed = Object.fromEntries(Object.entries(bridge.params).filter(([k, v]) => DEFAULT_PARAMS[k as keyof Params] !== v));
    const text = JSON.stringify({ changed, all: bridge.params, camera: bridge.camera }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, []);

  const bestRun = runs.length ? Math.min(...runs.map((r) => r.time)) : null;

  return (
    <div className={`mx-auto flex w-full flex-col gap-4 px-3 pb-10 pt-3 [@media(max-height:520px)]:pt-1 ${panelOpen ? "max-w-[1800px] xl:flex-row xl:items-start" : "max-w-none"}`}>
      <div ref={stageRef} className="mx-auto w-full min-w-0 flex-1 max-w-[calc((100svh-5rem)*16/9)] [@media(max-height:520px)]:max-w-[calc((100svh-1.5rem)*16/9)]">
        <div className="relative w-full overflow-hidden rounded-2xl border-[3px] border-ink bg-[#8fd4f7] shadow-[var(--shadow-ink-lg)]" style={{ aspectRatio: "16 / 9" }}>
          <div ref={hostRef} className="absolute inset-0 flow-root touch-none select-none" />
          {!ready && <p className="absolute inset-0 flex items-center justify-center font-display text-2xl text-ink">{copy.loading}</p>}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <p className="font-body text-sm font-bold text-cream/90">{copy.shortcuts}</p>
          {!panelOpen && (
            <button
              type="button"
              className="rounded-lg border-2 border-cream/40 px-2 py-0.5 font-display text-xs uppercase text-cream/70 hover:bg-cream/10"
              onClick={(e) => {
                togglePanel(true);
                e.currentTarget.blur();
              }}
            >
              {copy.expand}
            </button>
          )}
        </div>
      </div>
      {panelOpen && (
      <aside className="w-full shrink-0 rounded-2xl border-[3px] border-ink bg-cream p-4 text-ink shadow-[var(--shadow-ink)] xl:sticky xl:top-3 xl:max-h-[calc(100svh-6rem)] xl:w-[360px] xl:overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl uppercase">{copy.panel}</h2>
          <button
            type="button"
            className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-0.5 font-display text-xs uppercase"
            onClick={(e) => {
              togglePanel(false);
              e.currentTarget.blur();
            }}
          >
            {copy.collapse}
          </button>
        </div>
        <p className="mt-1 font-body text-sm leading-snug">{copy.panelHint}</p>
        <fieldset className="mt-4">
          <legend className="font-display text-lg uppercase">{copy.course}</legend>
          {(["arlindo", "test"] as const).map((course) => (
            <label key={course} className={`mt-2 flex cursor-pointer items-center gap-2 rounded-xl border-[3px] border-ink p-2 font-body text-sm font-bold ${settings.course === course ? "bg-sun" : "bg-cream-2"}`}>
              <input type="radio" name="dd-course" className="accent-ink" checked={settings.course === course} onChange={() => changeSettings({ course })} />
              {copy.courseOptions[course]}
            </label>
          ))}
        </fieldset>
        {settings.course === "test" && <fieldset className="mt-4">
          <legend className="font-display text-lg uppercase">{copy.art}</legend>
          {(["current", "sample"] as const).map((art) => (
            <label key={art} className={`mt-2 flex cursor-pointer items-center gap-2 rounded-xl border-[3px] border-ink p-2 font-body text-sm font-bold ${settings.art === art ? "bg-sun" : "bg-cream-2"}`}>
              <input type="radio" name="dd-art" className="accent-ink" checked={settings.art === art} onChange={() => changeSettings({ art })} />
              {copy.artOptions[art]}
            </label>
          ))}
          <p className="mt-1 font-body text-xs leading-snug">{copy.artHint}</p>
        </fieldset>}
        <fieldset className="mt-4">
          <legend className="font-display text-lg uppercase">{copy.controls}</legend>
          <p className="mt-2 rounded-xl border-[3px] border-ink bg-cream-2 p-2 font-body text-sm leading-snug">{copy.controlKeys}</p>
        </fieldset>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-xl border-[3px] border-ink bg-sun px-3 py-1.5 font-display text-sm uppercase shadow-[var(--shadow-ink-sm)]" onClick={(e) => {
              handleRef.current?.restart();
              e.currentTarget.blur();
            }}>
            {copy.restart}
          </button>
          <button type="button" className="rounded-xl border-[3px] border-ink bg-cream-2 px-3 py-1.5 font-display text-sm uppercase shadow-[var(--shadow-ink-sm)]" onClick={(e) => {
              resetParams();
              e.currentTarget.blur();
            }}>
            {copy.reset}
          </button>
          <button type="button" className="rounded-xl border-[3px] border-ink bg-cream-2 px-3 py-1.5 font-display text-sm uppercase shadow-[var(--shadow-ink-sm)]" onClick={(e) => {
              void copyValues();
              e.currentTarget.blur();
            }}>
            {copied ? copy.copied : copy.copy}
          </button>
        </div>
        <section className="mt-5">
          <h3 className="font-display text-lg uppercase">{copy.runs}</h3>
          {runs.length === 0 ? (
            <p className="font-body text-sm">{copy.noRuns}</p>
          ) : (
            <>
              {bestRun !== null && <p className="mt-1 font-body text-sm">{copy.bestOf(formatTime(bestRun, locale), runs.length)}</p>}
              <table className="mt-2 w-full border-collapse font-body text-xs">
                <thead>
                  <tr className="border-b-2 border-ink text-left">
                    <th className="py-1">{copy.time}</th>
                    <th>{copy.place}</th>
                    <th>{copy.landings}</th>
                    <th>{copy.crashes}</th>
                    <th>{copy.shortcut}</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r, i) => (
                    <tr key={runs.length - i} className="border-b border-ink/20">
                      <td className="py-1 font-bold">{formatTime(r.time, locale)}</td>
                      <td>{`${r.place}/${r.total}`}</td>
                      <td>{`${r.perfect} + ${r.ok}`}</td>
                      <td>{r.crashes}</td>
                      <td>{r.shortcut ? copy.yes : copy.no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {replays.total > 0 && <p className="mt-2 font-body text-xs">{copy.replay(replays.ok, replays.total)}</p>}
        </section>
        <fieldset className="mt-5">
          <legend className="font-display text-lg uppercase">{copy.view}</legend>
          {(
            [
              ["indicator", copy.indicator],
              ["rivals", copy.rivals],
              ["ghost", copy.ghost],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="mt-1 flex cursor-pointer items-center gap-2 font-body text-sm font-bold">
              <input type="checkbox" className="size-4 accent-ink" checked={settings[key]} onChange={(e) => changeSettings({ [key]: e.target.checked })} />
              {label}
            </label>
          ))}
          <label className="mt-2 flex flex-wrap items-center gap-2 font-body text-sm font-bold">
            {copy.pace}
            <select className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1" value={settings.rivalPace} onChange={(e) => changeSettings({ rivalPace: e.target.value as RivalPace })}>
              {(["adaptive", "fast"] as const).map((t) => (
                <option key={t} value={t}>
                  {copy.paceOptions[t]}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 font-body text-xs leading-tight text-ink-soft">{copy.paceHint}</p>
          <label className="mt-2 flex items-center gap-2 font-body text-sm font-bold">
            {copy.touch}
            <select className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1" value={settings.touch} onChange={(e) => changeSettings({ touch: e.target.value as TouchSetting })}>
              {(["auto", "on", "off"] as const).map((t) => (
                <option key={t} value={t}>
                  {copy.touchOptions[t]}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <details className="mt-5 rounded-xl border-[3px] border-dashed border-ink p-3">
          <summary className="cursor-pointer font-display text-lg uppercase">{copy.experiment}</summary>
          <p className="mt-1 font-body text-xs leading-tight text-ink-soft">{copy.experimentHint}</p>
          {(["off", "dust", "kick"] as const).map((k) => (
            <label key={k} className="mt-2 flex cursor-pointer gap-2 font-body text-sm font-bold leading-snug">
              <input type="radio" name="dd-interaction" className="mt-1 accent-ink" checked={settings.interaction === k} onChange={() => changeSettings({ interaction: k })} />
              {copy.interactionOptions[k]}
            </label>
          ))}
        </details>
        <fieldset className="mt-5">
          <legend className="font-display text-lg uppercase">{copy.cameraTitle}</legend>
          {CAMERA_SPECS.map((spec) => {
            const text = copy.cameraParams[spec.key];
            const value = camera[spec.key];
            const changed = value !== DEFAULT_CAMERA[spec.key];
            return (
              <label key={spec.key} className="mt-2 block">
                <span className="flex items-baseline justify-between gap-2 font-body text-sm font-bold">
                  <span>
                    {text.label}
                    {changed && <span className="ml-1 text-tomato">•</span>}
                  </span>
                  <span className="tabular-nums">{displayValue(spec, value, locale)}</span>
                </span>
                <input type="range" className="w-full accent-ink" min={spec.min} max={spec.max} step={spec.step} value={value} onChange={(e) => updateCamera(spec.key, Number(e.target.value))} />
                <span className="block font-body text-xs leading-tight text-ink-soft">{text.help}</span>
              </label>
            );
          })}
        </fieldset>
        {GROUPS.map((group) => (
          <fieldset key={group} className="mt-5">
            <legend className="font-display text-lg uppercase">{copy.groups[group]}</legend>
            {PARAM_SPECS.filter((s) => s.group === group).map((spec) => {
              const text = copy.params[spec.key];
              const value = params[spec.key];
              const changed = value !== DEFAULT_PARAMS[spec.key];
              return (
                <label key={spec.key} className="mt-2 block">
                  <span className="flex items-baseline justify-between gap-2 font-body text-sm font-bold">
                    <span>
                      {text.label}
                      {changed && <span className="ml-1 text-tomato">•</span>}
                    </span>
                    <span className="tabular-nums">{displayValue(spec, value, locale)}</span>
                  </span>
                  <input
                    type="range"
                    className="w-full accent-ink"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={value}
                    onChange={(e) => updateParam(spec.key, Number(e.target.value))}
                  />
                  <span className="block font-body text-xs leading-tight text-ink-soft">{text.help}</span>
                </label>
              );
            })}
          </fieldset>
        ))}
      </aside>
      )}
    </div>
  );
}
