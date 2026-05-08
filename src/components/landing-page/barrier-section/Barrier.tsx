import { Globe, Megaphone, MessageSquare, Zap } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { BarrierCard } from "./BarrierCard";

export default function Barrier() {
  return (
    <div className="relative w-full overflow-x-hidden">
      <section className="bg-blue-50/50 pt-14 pb-6 relative overflow-hidden border-t border-blue-100">
        <SectionHeader
          badgeText="Discover Our Solutions"
          badgeColor="blue"
          title="Where Do You Feel"
          highlightedText="English Barrier Most"
          description="Every day, global opportunities are lost to simple language gaps. Hover over the cards to see how we solve your specific challenges."
        />

        <div className="mx-auto max-w-7xl px-6 md:px-9 lg:px-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-8">
            <BarrierCard
              title="Global Communication"
              question={
                <ul className="list-disc pl-5 space-y-1 text-[13px] leading-snug text-slate-600">
                  <li>When you receive an English email, do you hesitate before replying?</li>
                  <li>Are your proposals written in clear, confident English that impresses buyers?</li>
                  <li>What if every message you send spoke perfectly to global clients?</li>
                </ul>
              }
              solutionTitle="The Solution"
              solutionText="Professional English communication — handled for you."
              icon={MessageSquare}
              videos={["/videos/global-communication-1.mp4", "/videos/global-communication-2.mp4"]}
            />
            <BarrierCard
              title="Social & Content Strategy"
              question={
                <ul className="list-disc pl-5 space-y-1 text-[13px] leading-snug text-slate-600">
                  <li>Do your social posts speak only to local audiences?</li>
                  <li>Are global buyers even seeing your content?</li>
                  <li>What if posts and visuals were written by an English-speaking team that knows your brand?</li>
                </ul>
              }
              solutionTitle="The Solution"
              solutionText="Engaging, global-ready social content and strategy."
              icon={Megaphone}
              videos={["/videos/social-media-1.mp4", "/videos/social-media-2.mp4"]}
            />
            <BarrierCard
              title="Sales & Market Development"
              question={
                <ul className="list-disc pl-5 space-y-1 text-[13px] leading-snug text-slate-600">
                  <li>How many potential buyers have you lost because of unclear English?</li>
                  <li>Do you have someone who can meet international clients confidently?</li>
                  <li>What if your sales pipeline ran in English - generating revenue every month?</li>
                </ul>
              }
              solutionTitle="The Solution"
              solutionText="Turning language into your primary sales advantage."
              icon={Zap}
              videos={["/videos/marketing-1.mp4", "/videos/marketing-2.mp4"]}
            />
            <BarrierCard
              title="Global Strategy & Planning"
              question={
                <ul className="list-disc pl-5 space-y-1 text-[13px] leading-snug text-slate-600">
                  <li>Do you know how your competitors market in the U.S. or Europe?</li>
                  <li>Are your investor decks and proposals ready for international partners?</li>
                  <li>What if every document made investors and buyers say, 'This looks global'?</li>
                </ul>
              }
              solutionTitle="The Solution"
              solutionText="Data-driven global strategy from research to pitch."
              icon={Globe}
              videos={["/videos/planning-1.mp4", "/videos/planning-2.mp4"]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
