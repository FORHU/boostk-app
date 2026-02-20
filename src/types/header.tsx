export interface SectionHeaderProps {
  // Badge props
  badgeText: string;
  badgeColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  showPulse?: boolean;

  // Heading props
  title: string;
  highlightedText?: string;
  gradientColors?: string;

  // Description props
  description: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  align?: 'center' | 'left';
}