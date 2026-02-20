export type AccentType = 'graph' | 'globe' | 'bolt';

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

