import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  CassetteTape,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheckBig,
  CircleHelp,
  Dices,
  Download,
  Eject,
  Ellipsis,
  IdCard,
  Gamepad2,
  Gift,
  Heart,
  House,
  Images,
  KeyRound,
  Languages,
  LayoutGrid,
  Lock,
  Menu,
  Music,
  Music2,
  Pause,
  PencilLine,
  Play,
  Radio,
  RadioTower,
  Rewind,
  RotateCcw,
  Share2,
  Smartphone,
  Smile,
  Star,
  Target,
  Sticker,
  Timer,
  Trash2,
  Trophy,
  Users,
  WifiOff,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
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
export const SmileyIcon = make(Smile);
export const PhoneIcon = make(Smartphone);
export const GiftIcon = make(Gift);
export const TowerIcon = make(RadioTower);
export const ArrowLeftIcon = make(ArrowLeft);
export const ArrowRightIcon = make(ArrowRight);
export const ArrowUpIcon = make(ArrowUp);
export const ArrowDownIcon = make(ArrowDown);
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
export const DiceIcon = make(Dices);
export const CardIcon = make(IdCard);
export const TrashIcon = make(Trash2);
export const OfflineIcon = make(WifiOff);
export const PencilIcon = make(PencilLine);
export const VerifiedIcon = make(BadgeCheck);
export const EjectIcon = make(Eject);
export const CloseIcon = make(X);
export const ZoomIcon = make(ZoomIn);
export const RewindIcon = make(Rewind, true);
export const LanguageIcon = make(Languages);
export const MissionIcon = make(Target);
export const StickerIcon = make(Sticker);
export const TimerIcon = make(Timer);
export const TapeIcon = make(CassetteTape);
export const DoneIcon = make(CircleCheckBig);
export const CheckIcon = make(Check);
export const ShareIcon = make(Share2);
export const LevelsIcon = make(LayoutGrid);
export const ChevronLeftIcon = make(ChevronLeft);
export const ChevronRightIcon = make(ChevronRight);
export const ChevronUpIcon = make(ChevronUp);
export const EllipsisIcon = make(Ellipsis);
export const MusicIcon = make(Music);
export const Music2Icon = make(Music2);
export const HeartIcon = make(Heart, true);
export const SolidStarIcon = make(Star, true);

export function RatingStar({ className, on = true }: IconProps & { on?: boolean }) {
  return (
    <Star
      aria-hidden
      focusable={false}
      className={`shrink-0 drop-shadow-[1.5px_2px_0_#1d1830] ${className ?? ""}`}
      strokeWidth={2.25}
      stroke="var(--color-ink)"
      fill={on ? "var(--color-sun)" : "var(--color-cream-3)"}
    />
  );
}

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
