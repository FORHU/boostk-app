export interface SectionHeaderProps {
  // Badge props
  badgeText: string;
  badgeColor?: "blue" | "purple" | "green" | "red" | "orange";
  showPulse?: boolean;

  // Heading props
  title: string;
  highlightedText?: string;
  gradientColors?: string;

  // Description props
  description: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  align?: "center" | "left";
}

export type AccentType = "graph" | "globe" | "bolt";

export interface MetricData {
  icon: string;
  accent: AccentType;
  title: string;
  value: string;
  subtext: string;
  delay?: string;
  className?: string;
  children?: React.ReactNode;
}

export const METRICS_DATA: MetricData[] = [
  {
    title: "Lead Growth",
    value: "180%",
    subtext: "Year over year",
    icon: "trending_up",
    accent: "graph",
  },
  {
    title: "Global Partners",
    value: "94+",
    subtext: "New Partners",
    icon: "public",
    accent: "globe",
  },
  {
    title: "Deal Velocity",
    value: "3x",
    subtext: "Faster Sales",
    icon: "bolt",
    accent: "bolt",
  },
];

export const STAGGER_CLASSES = ["md:mt-0", "md:mt-6", "md:mt-12"] as const;

export const ANIMATION_DELAYS = ["0s", "1.5s", "0.7s"] as const;

export const ACCENT_ICONS = {
  graph: "arrow_upward",
  globe: "add_circle",
  bolt: "speed",
} as const;

export const colorConfig = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    dot: "bg-blue-500",
    text: "text-blue-600",
    gradient: "from-blue-600 via-indigo-500 to-blue-400",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-100",
    dot: "bg-purple-500",
    text: "text-purple-600",
    gradient: "from-purple-600 via-indigo-500 to-purple-400",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-100",
    dot: "bg-green-500",
    text: "text-green-600",
    gradient: "from-green-600 via-emerald-500 to-green-400",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-100",
    dot: "bg-red-500",
    text: "text-red-600",
    gradient: "from-red-600 via-rose-500 to-red-400",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-100",
    dot: "bg-orange-500",
    text: "text-orange-600",
    gradient: "from-orange-600 via-amber-500 to-orange-400",
  },
};

export const maxWidthConfig = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};
