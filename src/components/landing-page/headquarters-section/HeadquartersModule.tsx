// TODO: FIX THIS

import { CheckCircle, Circle, Flag, Headset, Languages, type LucideIcon, Megaphone, ShoppingCart } from "lucide-react";
import type React from "react";

// --- Props Interfaces ---

interface Metric {
  value: string;
  label: string;
}

interface TimeZone {
  flag: string;
  code: string;
  time: string;
}

interface ProgressBar {
  label: string;
  percentage: number;
  color: string;
}

interface Milestone {
  label: string;
  completed: boolean;
}

interface HeadquartersModuleProps {
  id?: string;
  title: string;
  icon: string;
  quote?: string;
  metrics?: Metric[];
  timeZones?: TimeZone[];
  progressBars?: ProgressBar[];
  progressTitle?: string;
  milestones?: Milestone[];
  inboxMessage?: string;
  description?: string;
  showStrategyIcon?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  marketing: Megaphone,
  campaign: Megaphone,
  sales: ShoppingCart,
  shopping_cart: ShoppingCart,
  communication: Headset,
  support_agent: Headset,
  strategy: Flag,
  flag: Flag,
};

// --- Component ---

export const HeadquartersModule: React.FC<HeadquartersModuleProps> = ({
  title,
  icon,
  quote,
  metrics,
  timeZones,
  progressBars,
  progressTitle,
  milestones,
  inboxMessage,
  description,
  showStrategyIcon = false,
}) => {
  const IconComponent = ICON_MAP[icon] || Flag;

  return (
    <div className="flex flex-col h-full justify-between animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-100 pb-6">
        <div>
          <div className="text-xs text-blue-500 uppercase tracking-widest mb-2">{title}</div>
          {quote && <p className="text-slate-600 mb-6">&quot;{quote}&quot;</p>}
        </div>
        <div className="bg-blue-50 p-3 rounded-xl">
          <IconComponent className="text-blue-600" size={32} strokeWidth={1.5} />
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{metric.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">{metric.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy Icon Display */}
      {showStrategyIcon && (
        <div className="mt-8 relative h-40 w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-[length:20px_20px]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 animate-ping"></div>
          </div>
          <Flag className="text-blue-600 relative z-10 drop-shadow-xl" size={48} strokeWidth={1.5} />
        </div>
      )}

      {/* Time Zones */}
      {timeZones && (
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {timeZones.map((tz) => (
            <div key={tz.code} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold mb-1">{tz.flag}</div>
              <div className="text-xs uppercase font-bold text-slate-500">{tz.code}</div>
              <div className="text-[10px] text-blue-500 font-mono mt-1">{tz.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bars or Milestones */}
      <div className="mt-8 flex-grow">
        {progressBars && (
          <>
            <h4 className="font-bold text-slate-700 mb-3">{progressTitle || "Performance"}</h4>
            <div className="space-y-4">
              {progressBars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>{bar.label}</span>
                    <span>{bar.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {milestones && (
          <>
            <h4 className="font-bold text-slate-700 mb-3">Key Milestones</h4>
            <ul className="space-y-4">
              {milestones.map((milestone) => (
                <li key={milestone.label} className="flex items-center p-3 rounded-lg bg-slate-50">
                  <span className="mr-3 flex items-center">
                    {milestone.completed ? (
                      <CheckCircle className="text-blue-500" size={20} />
                    ) : (
                      <Circle className="text-slate-400" size={20} />
                    )}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{milestone.label}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {inboxMessage && (
          <>
            <h4 className="font-bold text-slate-700 mb-4">Latest Inquiries</h4>
            <div className="flex items-start space-x-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-indigo-500/30">
                AI
              </div>
              <div className="bg-blue-50 p-4 rounded-r-2xl rounded-bl-2xl text-sm text-slate-700 shadow-sm border border-slate-100">
                <div className="flex items-center space-x-2 mb-1">
                  <Languages className="text-blue-500" size={14} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Translated from Japanese</span>
                </div>
                &quot;{inboxMessage}&quot;
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 italic">
                Unified inbox for all client communications across timezones.
              </p>
            </div>
          </>
        )}

        {description && <p className="text-sm text-slate-600 leading-relaxed mt-6">{description}</p>}
      </div>
    </div>
  );
};
