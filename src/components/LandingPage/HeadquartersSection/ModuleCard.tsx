import React from 'react';

interface ModuleCardProps {
    title: string;
    icon: string;
}

const getIcon = (iconName: string) => {
    if (iconName === 'strategy') return 'flag';
    return iconName;
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, icon }) => {
    return (
        <div className="w-full relative group" style={{ height: '120px', perspective: '1000px' }}>
            <div className="relative w-full h-full preserve-3d transition-all duration-300 ease-out rotate-x-10">

                {/* Floating Icon */}
                <div className="absolute -top-[5px] -left-[5px] z-50 transform translate-z-[40px]">
                    <div className="bg-white p-3 rounded-xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] w-14 h-14 flex items-center justify-center border border-blue-200">
                        <span className="material-symbols-outlined text-3xl text-[#3b82f5]">{getIcon(icon)}</span>
                    </div>
                </div>

                {/* Card Shadow */}
                <div className="absolute top-[20px] left-[5%] w-[90%] h-full bg-slate-900/40 blur-xl transform translate-z-[-30px] rounded-[20px] opacity-40"></div>

                {/* Card Top Face */}
                <div className="absolute inset-0 rounded-xl overflow-hidden translate-z-[10px] border border-slate-200 bg-white">
                    <div className="relative w-full h-full p-6 flex items-center justify-center">
                        <h3 className="text-center text-2xl leading-tight text-slate-700">
                            {title}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};