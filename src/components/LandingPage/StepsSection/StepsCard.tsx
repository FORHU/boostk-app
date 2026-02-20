import React from "react";
import { ReactNode } from  'react';
interface StepCardProps {
  animationClass: string;
  stepNumber: string;
  title: string;
  description: string;
  icon: ReactNode;
}


export const StepsCard: React.FC<StepCardProps> = ({ 
  animationClass, 
  stepNumber,
  title,
  description,
  icon
  }) => {
  return (
    <div className={`relative group w-full cursor-pointer ${animationClass}`}>
      {/* 3D Depth Effect Layer */}
      <div className="absolute top-2 left-1 right-[-4px] bottom-[-8px] bg-slate-200 rounded-xl transform skew-x-[-2deg] z-0 transition-transform duration-300"></div>
      
      {/* Floating Icon Container */}
      <div className="absolute -top-6 left-6 z-30 animate-wiggle">
        <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Main Card Face */}
      <div className="relative z-20 bg-white rounded-xl border border-slate-200 p-6 pt-10 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200">
        {/* Step Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 border border-blue-100 text-[10px] font-bold tracking-widest text-blue-500 font-mono">
            STEP {stepNumber}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};