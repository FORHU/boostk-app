import { ScrollReveal } from '../../ui/ScrollReveal';
import { MetricCard3D } from './MetricCard3D';
import { SectionHeader } from '../SectionHeader';
import type { MetricData } from '../../../types/metrics';

import {
  METRICS_DATA,
  STAGGER_CLASSES,
  ANIMATION_DELAYS
} from '../../../data/metrics';


const MetricCard = ({
  metric,
  delay,
  stagger
}: {
  metric: MetricData;
  delay: string;
  stagger: string;
}) => (
  <MetricCard3D
    icon={metric.icon}
    accent={metric.accent}
    title={metric.title}
    value={metric.value}
    subtext={metric.subtext}
    delay={delay}
    className={stagger}
  />
);

export const Global = () => (
  <section className="bg-blue-50/50 pt-14 pb-6 border-t border-blue-100 relative overflow-hidden">
    <ScrollReveal animation="fade-up" delay={600} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

      <SectionHeader
        badgeText="Global Impact"
        badgeColor='blue'
        title="Elevating Business"
        highlightedText="Into New Dimensions"
        description="Our platform provides the structural foundation for exponential growth, visualized through our core impact metrics."
      />

      <div className="[perspective:2500px] relative w-full pt-2 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-0 gap-y-0 px-2 max-w-4xl mx-auto">
          {METRICS_DATA.map((metric, i) => (
            <MetricCard
              key={metric.title}
              metric={metric}
              delay={ANIMATION_DELAYS[i]}
              stagger={STAGGER_CLASSES[i]}
            />
          ))}
        </div>
      </div>
    </ScrollReveal>
  </section>
);