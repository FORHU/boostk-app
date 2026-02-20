import { SectionHeader } from '../SectionHeader';
import { PriceCard } from './PriceCard';

export const Pricing = () => {
    return (
        <section className="relative w-full py-12 overflow-hidden bg-blue-50/50 flex flex-col items-center justify-center border-t border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    badgeText="Our Services"
                    badgeColor='blue'
                    title="See What You"
                    highlightedText="Get"
                    description="Not just services—real deliverables you can see and measure."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
                    <PriceCard
                        title = "Starter"
                        price = "199"
                        subtitle = "Get started with our basic plan"
                        bestFor = "Individuals or small businesses"
                        icons = {['shopping_cart', 'chat_bubble_outline', 'support_agent', 'bolt']}
                        features = {['Live Chat Support', 'Live chat (Korean office hours)']}
                        cta = "Get Started"
                        badge = "Best Value"  
                    />
                    <PriceCard
                        title = "Content & Presence"
                        price = "399"
                        subtitle = "Build your global brand visibility"
                        bestFor = "Brands ready to speak English professionally"
                        icons = {['psychology', 'campaign', 'play_circle', 'edit_document']}
                        features = { [
                            'Social Media Posts',
                            'Content Variety',
                            'Video Production',
                            'Social media content (Facebook, Instagram, TikTok)',
                            'Email marketing campaigns',
                            'Video production & editing',
                            'Catalogue & ad design',
                            'Weekly performance reports'
                        ]}
                        cta = "Start Creating Content"
                    />
                    <PriceCard
                        title = "Sales & Commerce"
                        price =  "999"
                        subtitle = "Sell globally with full support"
                        bestFor = "Companies actively selling in international markets"
                        icons = {['trending_up', 'storefront', 'bar_chart', 'language']}
                        features = {[
                            'Product Listings',
                            'Live Chat Support',
                            'Multi-Platform Management',
                            'Marketplace management (Amazon, Shopee, Lazada)',
                            'Competitor analysis',
                            'Live chat (Korean office hours)',
                            'Product listing optimization',
                            'Social media content (Facebook, Instagram, TikTok)',
                            'Email marketing campaigns',
                            'Video production & editing',
                            'Catalogue & ad design',
                            'Weekly performance reports'
                        ]}
                        cta = "Grow Your Sales"
                    />
                    <PriceCard
                        title = "Startups. Teams. Enterprise. That's it."
                        price = "2599"
                        subtitle = "Full partnership development team"
                        bestFor = "Businesses expanding aggressively into global markets"
                        icons = {['rocket_launch', 'handshake', 'folder_open', 'groups']}
                        features = {[
                            'Partnership Pipeline',
                            'Professional Materials',
                            'Your Dedicated Team',
                            'Active buyer prospecting',
                            '2 dedicated BD specialists',
                            'Partnership negotiation support',
                            'Enterprise priority support',
                            'Marketplace management (Amazon, Shopee, Lazada)',
                            'Market research & competitor analysis',
                            'Live chat (Korean office hours)',
                            'Product listing optimization',
                            'Social media content (Facebook, Instagram, TikTok)',
                            'Email marketing campaigns',
                            'Video production & editing',
                            'Catalogue & ad design',
                            'Weekly performance reports'
                        ]}
                        cta = "Build My Global Team"
                    />
                </div>
            </div>
        </section>
    );
};