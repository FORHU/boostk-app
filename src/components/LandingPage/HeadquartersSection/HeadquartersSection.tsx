import React, { useState } from 'react';
import { ModuleCard } from './ModuleCard';
import { HeadquartersModule } from './HeadquartersModule';
import { SectionHeader } from '../SectionHeader';

export const HeadquartersSection: React.FC = () => {
    const [activeModule, setActiveModule] = useState<string>('sales');

    return (
        <div className="bg-blue-50/50 pt-18 flex flex-col items-center justify-center overflow-x-hidden relative border-t border-blue-100">
            <main className="w-full relative pt-0 pb-12 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-7xl mx-auto w-full px-4">

                    <div className="relative z-10 mb-12 w-full">
                        <SectionHeader
                            badgeText="Global Headquarters"
                            badgeColor='blue'
                            title="BOOSTK — Your Global"
                            highlightedText="Business Headquarters"
                            description="We're not just another outsourcing company. Our English-proficient professionals in the BOOSTK act as your in-house Global Department, handling all English-driven operations such as marketing, sales, business planning, and client communication. You focus on your product. We'll handle your global communication."
                            align="left"
                        />
                    </div>

                    <div className="perspective-2000 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                        {/* LEFT COLUMN: Module Selector Cards */}
                        <div className="lg:col-span-5 flex flex-col order-1 space-y-4">
                            <ModuleCard
                                id="marketing"
                                title="Marketing & Content Strategy"
                                icon="campaign"
                                isActive={activeModule === 'marketing'}
                                onClick={() => setActiveModule('marketing')}
                            />
                            <ModuleCard
                                id="sales"
                                title="Sales & Lead Generation"
                                icon="shopping_cart"
                                isActive={activeModule === 'sales'}
                                onClick={() => setActiveModule('sales')}
                            />
                            <ModuleCard
                                id="support"
                                title="Global Client Communication"
                                icon="support_agent"
                                isActive={activeModule === 'support'}
                                onClick={() => setActiveModule('support')}
                            />
                            <ModuleCard
                                id="strategy"
                                title="Business Planning Strategy"
                                icon="strategy"
                                isActive={activeModule === 'strategy'}
                                onClick={() => setActiveModule('strategy')}
                            />
                        </div>

                        {/* RIGHT COLUMN: Large Display Card */}
                        <div className="lg:col-span-7 flex flex-col items-center order-2">
                            <div className="relative w-full max-w-2xl animate-float-master">
                                <div className="relative preserve-3d transition-transform duration-500 ease-out cursor-default md:rotate-x-10 h-auto md:h-[600px]">
                                    
                                    {/* Shadow */}
                                    <div className="hidden md:block absolute top-[20px] left-[5%] w-[90%] h-full bg-slate-900/40 blur-2xl transform translate-z-[-40px] rounded-[20px] opacity-50"></div>

                                    {/* Main Face */}
                                    <div className="relative md:absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden translate-z-[10px] p-8 lg:p-10 bg-gradient-to-br from-white to-slate-50">
                                        <div key={activeModule} className="h-full animate-[fadeIn_0.5s_ease-in-out]">
                                            
                                            {activeModule === 'sales' && (
                                                <HeadquartersModule
                                                    id="sales"
                                                    title="Sales & Outreach"
                                                    icon="shopping_cart"
                                                    quote="Your global sales pipeline, handled."
                                                    metrics={[
                                                        { value: '127', label: 'Active Leads' },
                                                        { value: '89%', label: 'Response Rate' }
                                                    ]}
                                                    progressBars={[
                                                        { label: 'Email Translation', percentage: 98, color: 'bg-blue-500' },
                                                        { label: 'Pitch Accuracy', percentage: 95, color: 'bg-indigo-500' }
                                                    ]}
                                                    progressTitle="Translation Fidelity"
                                                />
                                            )}

                                            {activeModule === 'marketing' && (
                                                <HeadquartersModule
                                                    id="marketing"
                                                    title="Marketing & Content"
                                                    icon="campaign"
                                                    quote="Global-ready content, every time."
                                                    metrics={[
                                                        { value: '2.4M', label: 'Reach' },
                                                        { value: '156%', label: 'Engagement' }
                                                    ]}
                                                    progressBars={[
                                                        { label: 'Content Localization', percentage: 92, color: 'bg-purple-500' },
                                                        { label: 'Campaign Performance', percentage: 88, color: 'bg-pink-500' }
                                                    ]}
                                                    progressTitle="Campaign Performance"
                                                />
                                            )}

                                            {activeModule === 'support' && (
                                                <HeadquartersModule
                                                    id="support"
                                                    title="Client Support"
                                                    icon="support_agent"
                                                    timeZones={[
                                                        { flag: '🇺🇸', code: 'PST', time: '09:00' },
                                                        { flag: '🇬🇧', code: 'GMT', time: '17:00' },
                                                        { flag: '🇯🇵', code: 'JST', time: '02:00' }
                                                    ]}
                                                    inboxMessage="Hi, I'm interested in your premium package for enterprise clients. Can we schedule a call?"
                                                />
                                            )}

                                            {activeModule === 'strategy' && (
                                                <HeadquartersModule
                                                    id="strategy"
                                                    title="Business Strategy"
                                                    icon="strategy"
                                                    quote="Strategic insights for global expansion."
                                                    showStrategyIcon={true}
                                                    milestones={[
                                                        { label: 'Market Research Complete', completed: true },
                                                        { label: 'Competitor Analysis', completed: true },
                                                        { label: 'Go-to-Market Strategy', completed: false }
                                                    ]}
                                                    description="We provide data-driven insights to help you enter new markets with confidence."
                                                />
                                            )}

                                        </div>
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