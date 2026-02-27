import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SilentBarrierCardProps {
    icon: LucideIcon;
    title: string;
    delay?: string;
}

export const SilentBarrierCard: React.FC<SilentBarrierCardProps> = ({ 
    icon: Icon, 
    title, 
    delay = "0s" 
}) => {
    return (
        <div className="group card-wrapper relative rounded-xl overflow-visible transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="card-content relative h-full bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ease-out z-10 border border-slate-200">
                <div
                    className="mb-3 icon-float"
                    style={{ animationDelay: delay }}
                >
                    <div className="p-2.5 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 icon-shake">
                        <Icon size={20} strokeWidth={1.5} className="w-5 h-5 transition-transform duration-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-xs md:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                        {title}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-medium group-hover:text-slate-600 transition-colors duration-300 leading-tight">
                    </p>
                </div>
            </div>
        </div>
    );
};