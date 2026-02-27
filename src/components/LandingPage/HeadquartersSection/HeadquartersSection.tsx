import React from 'react';
import { ModuleCard } from './ModuleCard';
import { SectionHeader } from '../SectionHeader';
import { Handshake } from 'lucide-react'; // Import the Lucide icon

export const HeadquartersSection: React.FC = () => {
    return (
        <div className="bg-blue-50/50 pt-18 flex flex-col items-center justify-center overflow-x-hidden relative border-t border-blue-100">
            <main className="w-full relative pt-0 pb-12 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-7xl mx-auto w-full px-4">

                    <div className="relative z-10 mb-12 w-full">
                        <SectionHeader
                            badgeText="Global Headquarters"
                            badgeColor="blue"
                            title="BOOSTK — Your Global"
                            highlightedText="Business Headquarters"
                            description="We're not just another outsourcing company. Our English-proficient professionals in the BOOSTK act as your in-house Global Department, handling all English-driven operations such as marketing, sales, business planning, and client communication. You focus on your product. We'll handle your global communication."
                            align="left"
                        />
                    </div>

                    {/* Grid with vertical centering */}
                    <div className="perspective-2000 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* LEFT COLUMN: Static Module Cards */}
                        <div className="lg:col-span-5 flex flex-col order-1 space-y-4">
                            <ModuleCard
                                title="Marketing & Content Strategy"
                                icon="campaign"
                            />
                            <ModuleCard
                                title="Sales & Lead Generation"
                                icon="shopping_cart"
                            />
                            <ModuleCard
                                title="Global Client Communication"
                                icon="support_agent"
                            />
                            <ModuleCard
                                title="Business Planning Strategy"
                                icon="strategy"
                            />
                        </div>

                        {/* RIGHT COLUMN: Static "Partnership Model" Card (centered) */}
                        <div className="lg:col-span-7 flex flex-col items-center order-2">
                            <div className="relative w-full max-w-2xl">
                                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-10 lg:p-12">
                                    <div className="flex flex-col items-center text-center">
                                        {/* Icon */}
                                        <div className="bg-blue-50 p-4 rounded-full mb-6">
                                            <Handshake size={48} className="text-blue-600" strokeWidth={1.5} />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                            Partnership Model
                                        </h3>

                                        {/* Description */}
                                        <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                                            We're embedded in your business as a remote extension of your team, not a vendor. Your success is our success.
                                        </p>

                                        {/* Optional subtle divider */}
                                        <div className="mt-8 w-16 h-0.5 bg-blue-200 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};