export type ModuleId = 'marketing' | 'sales' | 'strategy' | 'comms';

export interface ModuleData {
    id: ModuleId;
    title: string;
    icon: string;
    delay: string; 
}

export interface MetricData {
  value: string;
  label: string;
}

export interface ProgressBarData {
  label: string;
  percentage: number;
  color: string;
}

export interface MilestoneData {
  label: string;
  completed: boolean;
}

export interface TimeZoneData {
  flag: string;
  code: string;
  time: string;
}

export interface ModuleContentData {
  id: ModuleId;
  title: string;
  icon: string;
  metrics?: MetricData[];
  progressBars?: ProgressBarData[];
  description?: string;
  quote?: string;
  milestones?: MilestoneData[];
  timeZones?: TimeZoneData[];
  inboxMessage?: string;
}
