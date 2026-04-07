import { Flag, Headset, Megaphone, ShoppingCart } from "lucide-react";
import type React from "react";

interface ModuleCardProps {
  title: string;
  icon: string;
}

const ICON_MAP: Record<string, typeof Megaphone> = {
  campaign: Megaphone,
  shopping_cart: ShoppingCart,
  support_agent: Headset,
  strategy: Flag,
  flag: Flag,
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, icon }) => {
  const Icon = ICON_MAP[icon] || Flag;

  return (
    <div className="w-full relative group" style={{ height: "120px", perspective: "1000px" }}>
      <div className="relative w-full h-full preserve-3d transition-all duration-300 ease-out rotate-x-10">
        {/* Floating Icon */}
        <div className="absolute -top-[5px] -left-[5px] z-50 transform translate-z-[40px]">
          <div className="bg-white p-3 rounded-xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] w-14 h-14 flex items-center justify-center border border-blue-200">
            <Icon className="text-[#3b82f5]" size={28} strokeWidth={1.5} />
          </div>
        </div>

        {/* Card Shadow */}
        <div className="absolute top-[20px] left-[5%] w-[90%] h-full bg-slate-900/40 blur-xl transform translate-z-[-30px] rounded-[20px] opacity-40"></div>

        {/* Card Top Face */}
        <div className="absolute inset-0 rounded-xl overflow-hidden translate-z-[10px] border border-slate-200 bg-white">
          <div className="relative w-full h-full p-6 flex items-center justify-center">
            <h3 className="text-center text-2xl leading-tight text-slate-700">{title}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
