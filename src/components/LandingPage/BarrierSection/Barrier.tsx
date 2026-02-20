import { SectionHeader } from '../SectionHeader'
import { LucideIcon } from 'lucide-react';
import { BarrierCard } from './BarrierCard';
import { MessageSquare, Megaphone, Zap, Globe } from 'lucide-react';

interface CardData {
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



// --- Main App ---

export default function Barrier() {
  return (
    <div className="relative w-full overflow-x-hidden">

      {/* Simplified Background - Removed heavy gradients */}
      <section className="bg-blue-50/50 pt-14 pb-6 relative overflow-hidden border-t border-blue-100">

        <SectionHeader
          badgeText="Discover Our Solutions"
          badgeColor='blue'
          title="Where Do You Feel"
          highlightedText="English Barrier Most"
          description="Every day, global opportunities are lost to simple language gaps. Hover over the cards to see how we solve your specific challenges."
        />

        {/* Card Grid */}
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-8">
            <BarrierCard
              title="Global Communication"
              question={
                <>
                  Hesitant proposals?<br />Unclear emails?
                </>
              }
              subtitle="Reach global audiences effectively."
              solutionTitle="The Solution"
              solutionText="Professional English communication — handled for you."
              icon={MessageSquare}
              videos={[
                '/videos/hello13.mp4',
                '/videos/frustrated.mp4'
              ]}
            />
            <BarrierCard
              title="Social & Content Strategy"
              question={
                <>
                  Lost content?<br />Disconnected visuals?
                </>
              }
              subtitle="Communicate fluently with global buyers."
              solutionTitle="The Solution"
              solutionText="Engaging, global-ready social content and strategy."
              icon={Megaphone}
              videos={[
                '/videos/socialmedia.mp4',
                '/videos/socialmedia2.mp4'
              ]}
            />
            <BarrierCard
              title="Sales & Market"
              question={
                <>
                  Lost buyers?<br />Unclear pitches?
                </>
              }
              subtitle="Build a high-revenue global pipeline."
              solutionTitle="The Solution"
              solutionText="Turning language into your primary sales advantage."
              icon={Zap}
              videos={[
                '/videos/marketing.mp4',
                '/videos/marketing2.mp4'
              ]}
            />
            <BarrierCard
              title="Global Stratgey"
              question={
                <>
                  Limited insights?<br />Local-only decks?
                </>
              }
              subtitle="Master your international market entry."
              solutionTitle="The Solution"
              solutionText="Data-driven global strategy from research to pitch."
              icon={Globe}
              videos={[
                '/videos/planning.mp4',
                'videos/plan.mp4'
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}