import {
  ArrowLeft,
  CircleHelp,
  Download,
  Gamepad2,
  Gift,
  House,
  Images,
  KeyRound,
  Lock,
  Menu,
  Pause,
  Play,
  Radio,
  RadioTower,
  RotateCcw,
  Smile,
  Star,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";

type IconProps = { className?: string };

const STROKE = 2.75;

function make(Icon: LucideIcon, filled = false) {
  function Wrapped({ className }: IconProps) {
    return <Icon aria-hidden focusable={false} className={`shrink-0 ${className ?? ""}`} strokeWidth={STROKE} fill={filled ? "currentColor" : "none"} />;
  }
  return Wrapped;
}

export const HouseIcon = make(House);
export const ControllerIcon = make(Gamepad2);
export const StarIcon = make(Star);
export const SmileyIcon = make(Smile);
export const GiftIcon = make(Gift);
export const TowerIcon = make(RadioTower);
export const ArrowLeftIcon = make(ArrowLeft);
export const PlayIcon = make(Play, true);
export const LockIcon = make(Lock);
export const PauseIcon = make(Pause, true);
export const RestartIcon = make(RotateCcw);
export const QuestionIcon = make(CircleHelp);
export const DownloadIcon = make(Download);
export const ImagesIcon = make(Images);
export const RadioIcon = make(Radio);
export const TrophyIcon = make(Trophy);
export const KeyIcon = make(KeyRound);
export const UsersIcon = make(Users);

const MenuOpen = make(X);
const MenuClosed = make(Menu);
const SpeakerOn = make(Volume2);
const SpeakerOff = make(VolumeX);

export function MenuIcon({ className, open }: IconProps & { open?: boolean }) {
  return open ? <MenuOpen className={className} /> : <MenuClosed className={className} />;
}

export function SpeakerIcon({ className, muted }: IconProps & { muted?: boolean }) {
  return muted ? <SpeakerOff className={className} /> : <SpeakerOn className={className} />;
}
