import React from 'react';
import { AccentType, MetricData, } from '../../../types/metrics';
import { ACCENT_ICONS } from '../../../data/metrics';

const AccentDecoration = ({ type }: { type: AccentType }) => {
    const decorations = {
        graph: (
            <svg className="w-full h-full absolute right-[-15%] top-[-5%] transform rotate-6" viewBox="0 0 200 200">
                <path
                    className="animate-draw"
                    style={{ stroke: '#3b82f5' }}
                    d="M10,150 Q50,100 90,140 T190,50"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
            </svg>
        ),
        globe: (
            <div className="absolute -top-12 -right-12 w-[14rem] h-[14rem] opacity-60 pointer-events-none">
                <svg className="w-full h-full animate-spin-slow" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                    <circle cx="100" cy="100" r="90" className="animate-draw text-sky-500" strokeWidth="8" strokeDasharray="600" />
                    <ellipse cx="100" cy="100" rx="90" ry="30" className="animate-draw text-sky-400" strokeWidth="8" strokeDasharray="600" style={{ animationDelay: '1s' }} />
                    <ellipse cx="100" cy="100" rx="90" ry="30" className="animate-draw text-sky-300" strokeWidth="8" strokeDasharray="600" style={{ animationDelay: '2s', transform: 'rotate(60deg)', transformOrigin: 'center' }} />
                    <ellipse cx="100" cy="100" rx="90" ry="30" className="animate-draw text-sky-300" strokeWidth="8" strokeDasharray="600" style={{ animationDelay: '3s', transform: 'rotate(120deg)', transformOrigin: 'center' }} />
                </svg>
            </div>
        ),
        bolt: (
            <div className="absolute top-0 right-0 p-8 w-[12rem] h-[12rem] opacity-60 pointer-events-none">
                <svg className="w-full h-full animate-pulse-glow" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                    <path
                        d="M110 10 L10 110 H90 L80 190 L180 90 H100 L110 10Z"
                        className="animate-draw text-sky-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        )
    };

    return (
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.12] pointer-events-none">
            {decorations[type]}
        </div>
    );
};

const FloatingIcon = ({ icon, delay }: { icon: string; delay?: string }) => (
    <div
        className="absolute -left-4 -top-12 z-40 animate-bob pointer-events-none [transform-style:preserve-3d]"
        style={{ animationDelay: delay }}
    >
        <div className="bg-white p-3 rounded-xl shadow-2xl shadow-blue-500/30 border-2 border-blue-50 w-12 h-12 flex items-center justify-center transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">
            <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
        </div>
    </div>
);

export const MetricCard3D = ({
    icon,
    accent,
    title,
    value,
    subtext,
    delay,
    children,
    className = ''
}: MetricData) => {
    return (
        <div className={`relative group scale-65 ${className}`}>
            <FloatingIcon icon={icon} delay={delay} />

            <div className="relative w-full aspect-[3/2] [transform-style:preserve-3d] [transform:rotateX(35deg)_rotateZ(-5deg)_skewY(2deg)] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:[transform:rotateX(30deg)_rotateZ(-3deg)_skewY(2deg)_translateY(-20px)]">
                {/* Glow Shadow */}
                <div className="absolute top-24 left-8 w-11/12 h-5/6 bg-blue-500/40 filter blur-[60px] rounded-[40%] z-0 opacity-70 transition-all duration-700 group-hover:opacity-100 group-hover:blur-[80px] group-hover:scale-110" />

                {/* Top Surface */}
                <div className="relative w-full h-full bg-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-slate-100 shadow-inner z-10 overflow-hidden [transform:translateZ(20px)]">
                    <AccentDecoration type={accent} />

                    {/* Content */}
                    <div className="relative z-20 mt-2">
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                            {title}
                        </h3>
                        <div className="text-3xl sm:text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                            {value}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-20 border-t-2 border-slate-50 pt-2">
                        <p className="text-sm font-bold text-primary flex items-center">
                            <span className="material-symbols-outlined text-base mr-2">
                                {ACCENT_ICONS[accent]}
                            </span>
                            {subtext}
                        </p>
                    </div>

                    {children}
                </div>

                {/* 3D Side */}
<div className="absolute top-full left-0 w-full h-[40px] bg-gradient-to-b from-blue-600 via-indigo-500 to-blue-400 rounded-b-[1.5rem] z-0 [transform-origin:top] [transform:rotateX(-90deg)] overflow-hidden">
    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
</div>
            </div>
        </div>
    );
};
