import React from 'react';

export const Calling  = () => {
    return(
        <>
            <section className="py-12 md:py-24 bg-white overflow-hidden">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-[#3b82f5] rounded-2xl md:rounded-3xl p-8 sm:p-12 md:p-16 border border-blue-600 max-w-4xl mx-auto shadow-xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                        <div className="relative z-10 flex flex-col items-center">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-white/20">
                            <span className="material-symbols-outlined text-[#ec4899] text-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">favorite</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-6 tracking-tight leading-tight ">
                            We Believe In You
                        </h2>
                        <p className="text-lg text-blue-100 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                            We’ll take the first small step toward the world together.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-8">
                            <button className="px-8 py-3.5 bg-white text-[#3b82f5] font-bold text-base rounded-lg 
                                hover:bg-blue-700 hover:text-white hover:shadow-lg hover:-translate-y-0.5
                                active:bg-blue-600 active:translate-y-0
                                transition-all duration-200">
                                Get Started Now
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}