import {
  TrophyIcon,
  StarIcon,
  PlayIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  BookOpenIcon,
  PlayCircleIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  DocumentTextIcon,
  UserCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  RocketLaunchIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

// Icon mapping object for easy reference
export const Icons = {
  // Achievement icons
  trophy: TrophyIcon,
  star: StarIcon,
  target: TrophyIcon, // Using trophy as substitute for target
  award: TrophyIcon,
  dumbbell: BoltIcon, // Using bolt as substitute for dumbbell

  // Audio icons
  volume: SpeakerWaveIcon,
  play: PlayIcon,
  playCircle: PlayCircleIcon,

  // Data & Analytics
  chart: ChartBarIcon,
  analytics: ChartBarIcon,

  // Content icons
  book: BookOpenIcon,
  bookOpen: BookOpenIcon,

  // Action icons
  plus: PlusIcon,
  trash: TrashIcon,
  rotate: ArrowPathIcon,
  back: ArrowLeftIcon,

  // Status icons
  check: CheckCircleIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
  loading: ArrowPathIcon, // Using rotate as loading substitute
  sparkles: SparklesIcon,

  // Time icons
  clock: ClockIcon,
  timer: ClockIcon,
  calendar: CalendarIcon,

  // Navigation icons
  home: HomeIcon,
  user: UserIcon,
  userCircle: UserCircleIcon,
  settings: Cog6ToothIcon,
  logout: ArrowRightOnRectangleIcon,
  fileText: DocumentTextIcon,

  // Visibility icons
  eye: EyeIcon,
  eyeOff: EyeSlashIcon,
  search: MagnifyingGlassIcon,

  // Special icons
  rocket: RocketLaunchIcon,
  zap: BoltIcon,
};

// Common icon props interface
export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// Common icon wrapper with default styling
export function Icon({
  icon: IconComponent,
  className = "w-5 h-5",
}: {
  icon: typeof TrophyIcon;
  className?: string;
}) {
  return <IconComponent className={className} />;
}

// Specific icon components with good defaults
export function HeroTrophyIcon({
  className = "w-6 h-6 text-yellow-500",
}: {
  className?: string;
}) {
  return <TrophyIcon className={className} />;
}

export function HeroStarIcon({
  className = "w-6 h-6 text-yellow-400",
}: {
  className?: string;
}) {
  return <StarIcon className={className} />;
}

export function HeroTargetIcon({
  className = "w-6 h-6 text-blue-500",
}: {
  className?: string;
}) {
  return <TrophyIcon className={className} />;
}

export function HeroDumbbellIcon({
  className = "w-6 h-6 text-purple-500",
}: {
  className?: string;
}) {
  return <BoltIcon className={className} />;
}

export function HeroVolumeIcon({
  className = "w-5 h-5 text-blue-600",
}: {
  className?: string;
}) {
  return <SpeakerWaveIcon className={className} />;
}

export function HeroChartIcon({
  className = "w-6 h-6 text-green-500",
}: {
  className?: string;
}) {
  return <ChartBarIcon className={className} />;
}

export function HeroBookIcon({
  className = "w-6 h-6 text-indigo-500",
}: {
  className?: string;
}) {
  return <BookOpenIcon className={className} />;
}

export function HeroCheckIcon({
  className = "w-5 h-5 text-green-500",
}: {
  className?: string;
}) {
  return <CheckCircleIcon className={className} />;
}

export function HeroRocketIcon({
  className = "w-6 h-6 text-orange-500",
}: {
  className?: string;
}) {
  return <RocketLaunchIcon className={className} />;
}

export function HeroPlayIcon({
  className = "w-5 h-5 text-white",
}: {
  className?: string;
}) {
  return <PlayIcon className={className} />;
}

export function HeroTrashIcon({
  className = "w-5 h-5 text-white",
}: {
  className?: string;
}) {
  return <TrashIcon className={className} />;
}

export function HeroSaveIcon({
  className = "w-5 h-5 text-white",
}: {
  className?: string;
}) {
  return <CheckCircleIcon className={className} />;
}

export function HeroSettingsIcon({
  className = "w-5 h-5 text-gray-600",
}: {
  className?: string;
}) {
  return <Cog6ToothIcon className={className} />;
}

// Score-based icon component
export function ScoreIcon({
  score,
  className = "w-12 h-12",
}: {
  score: number;
  className?: string;
}) {
  if (score >= 90) {
    return <HeroTrophyIcon className={`${className} text-yellow-500`} />;
  }
  if (score >= 70) {
    return <HeroStarIcon className={`${className} text-yellow-400`} />;
  }
  return <HeroDumbbellIcon className={`${className} text-purple-500`} />;
}
