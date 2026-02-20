import { Globe } from './Globe';
import { Navbar } from './Navbar';
import { useRef } from "react"
import { SilentBarrierCard } from './SilentBarrierCard';
import { Mail, MessageSquare, TrendingDown } from 'lucide-react';

export const Hero = () => {
  // Add ref to track video play count
  const heroVideoPlayCount = useRef(0);

  return (
    <>
      <Navbar />
      <header className="pt-20 pb-8 lg:pt-24 lg:pb-12 overflow-hidden relative bg-gradient-to-b from-blue-200 via-blue-100 via-80% ">
        <Globe />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start mb-8">
            <div className="lg:col-span-5 pt-4">
              <div className="inline-flex items-center space-x-2 bg-sky-50 rounded-full px-3 py-1 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                <span className="text-sky-600 text-xs font-bold tracking-wide uppercase">Global Access Live</span>
              </div>

               <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                Speak Local.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-800">Sell Global.</span>
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                Don&apos;t let the language barrier act as a glass ceiling. We act as your
                in-house global department for sales, marketing, and strategy.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/25 text-lg">
                  Request Free Consultation
                </button>
              </div>
            </div>

            <div className="lg:col-span-1"></div>

            <div className="lg:col-span-6 relative mt-8 lg:mt-0">

              <div className="lg:col-span-7 mt-8 lg:mt-0 relative flex flex-col gap-0">
                <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl">
                  <div className="aspect-[20/9] bg-slate-100 relative group overflow-hidden">
                    <video 
                      className="w-full h-full object-cover"
                      controls={false} // Remove controls to prevent user from replaying manually
                      preload="metadata"
                      autoPlay 
                      muted 
                      playsInline
                      onEnded={(e) => {
                        // Increment count and replay until 10 total plays
                        const next = heroVideoPlayCount.current + 1;
                        heroVideoPlayCount.current = next;
                        
                        console.log(`Hero video played ${next} times`); //for debugging
                        
                        if (next < 10) {
                          try { 
                            e.currentTarget.play(); 
                          } catch (err) {
                            console.log('Video replay failed:', err);
                          }
                        } else {
                          console.log('Hero video reached 10 plays, stopping');
                        }
                      }}
                    >
                      <source src="/videos/herovideo1.mp4" type="video/mp4"/>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              </div>

              <div className="relative w-full px-0 py-6 font-sans grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SilentBarrierCard
                  icon={Mail}
                  title="Unanswered Emails"
                  subtitle="Average 40% drop-off"
                />
                <SilentBarrierCard
                  icon={MessageSquare}
                  title="Lost Conversations"
                  subtitle="Misunderstood intent"
                />
                <SilentBarrierCard
                  icon={TrendingDown}
                  title="Missed Deals"
                  subtitle="Delayed response"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};