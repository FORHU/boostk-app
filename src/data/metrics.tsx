import type { MetricData } from '../types/metrics';

export const METRICS_DATA: MetricData[] = [
  {
    title: 'Lead Growth',
    value: '180%',
    subtext: 'Year over year',
    icon: 'trending_up',
    accent: 'graph'
  },
  {
    title: 'Global Partners',
    value: '94+',
    subtext: 'New Partners',
    icon: 'public',
    accent: 'globe'
  },
  {
    title: 'Deal Velocity',
    value: '3x',
    subtext: 'Faster Sales',
    icon: 'bolt',
    accent: 'bolt'
  },
];

export const STAGGER_CLASSES = ['md:mt-0', 'md:mt-6', 'md:mt-12'] as const;

export const ANIMATION_DELAYS = ['0s', '1.5s', '0.7s'] as const;

export const ACCENT_ICONS = {
  graph: 'arrow_upward',
  globe: 'add_circle',
  bolt: 'speed'
} as const;