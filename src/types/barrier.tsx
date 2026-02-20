import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface CardData {
  id: string;
  title: string;
  question: React.ReactNode;
  subtitle: string;
  solutionTitle: string;
  solutionText: string;
  icon: LucideIcon;
  iconDelay: string;
  cardDelay: string;
  videos: string[];
}