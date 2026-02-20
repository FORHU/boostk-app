import React from 'react';

interface ModuleCardProps {
    id: string;
    title: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}

const getIcon = (iconName: string) => {
    if (iconName === 'strategy') return 'flag';
    return iconName;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
    title,
    icon,
    isActive,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className="w-full relative group cursor-pointer"
            style={{
                height: '120px',
                perspective: '1000px',
            }}
        >
            <div className={`relative w-full h-full preserve-3d transition-all duration-300 ease-out rotate-x-10 ${isActive ? 'translate-y-[-5px]' : 'hover:translate-y-[-5px]'}`}>

                {/* Floating Icon Bob */}
                <div className={`absolute -top-[30px] -left-[10px] z-50 transform translate-z-[40px] transition-transform duration-500 ${!isActive ? 'animate-bob' : ''}`}>
                    <div className="bg-white p-3 rounded-xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] w-14 h-14 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-[#3b82f5]">{getIcon(icon)}</span>
                    </div>
                </div>

                {/* Card Shadow */}
                <div className={`absolute top-[20px] left-[5%] w-[90%] h-full bg-slate-900/40 blur-xl transform translate-z-[-30px] rounded-[20px] transition-all duration-500 ${isActive ? 'opacity-70 scale-105' : 'opacity-40 group-hover:opacity-60'}`}></div>

                {/* Card Top Face */}
                <div className={`
                    absolute inset-0 rounded-xl overflow-hidden translate-z-[10px] 
                    transition-all duration-300 bg-white
                    ${isActive
                        ? 'border border-slate-300 shadow-2xl'
                        : 'border border-slate-200 group-hover:border-blue-300'
                    }
                `}>
                    <div className="relative w-full h-full p-6 flex items-center justify-center z-10">
                        <div className={`w-full flex items-center justify-center h-full transition-transform duration-500 ${isActive || 'group-hover:translate-x-1'}`}>
                            <h3 className={`text-center text-2xl leading-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-blue-600'}`}>
                                {title}
                            </h3>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};