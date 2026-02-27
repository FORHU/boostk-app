import React from "react";
import { StepsCard } from "./StepsCard";
import { Arrow } from "./Arrow";
import { MessageSquareText, Users, TrendingUp } from "lucide-react";



export const Steps: React.FC = () => {
  return (
    <section className="relative w-full py-12 overflow-hidden bg-blue-50/50 flex flex-col items-center justify-center border-t border-blue-100">

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-widest text-blue-600 uppercase">
                Upward Growth Plan
              </span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl pb-0 font-extrabold text-slate-900 tracking-tight mb-6">
            Simple. Fast.{" "}
            <span className="relative inline-block text-blue-600">
              Effective.
              <svg
                className="absolute w-full h-3 bottom-0 left-0 text-blue-200 -z-10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                />
              </svg>
            </span>
          </h2>

          <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            3 steps to global growth
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative w-full max-w-5xl mx-auto">
          {/* SVG Connector */}
          <Arrow />

          {/* Grid Layout for Staircase Effect */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 min-h-[400px]">
            {/* Step 1: Bottom */}
            <div className="md:self-end md:mb-0">
              <StepsCard
                animationClass="animate-float-slow"
                stepNumber="01"
                title="Chat"
                description="Tell us your story. We analyze your inputs to structure campaign parameters and identify opportunities."
                icon={<MessageSquareText className="text-blue-600" size={24} />}
              />
            </div>

            {/* Step 2: Middle */}
            <div className="md:self-end md:mb-24">
              <StepsCard
                animationClass="animate-float-medium"
                stepNumber="02"
                title="Engage"
                description="We identify and engage with your ideal audience, building authentic connections at scale."
                icon={<Users className="text-blue-600" size={24} />}
              />
            </div>

            {/* Step 3: Top */}
            <div className="md:self-end md:mb-48">
              <StepsCard
                animationClass="animate-float-fast"
                stepNumber="03"
                title="Grow"
                description="Watch it happen. Your campaigns continuously improve as we drive steady, long-term growth."
                icon={<TrendingUp className="text-blue-600" size={24} />}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
