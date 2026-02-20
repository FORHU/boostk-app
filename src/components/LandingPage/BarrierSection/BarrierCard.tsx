import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CheckCircle, LucideIcon } from 'lucide-react';

interface BarrierCardProps {
  title: string;
  question: React.ReactNode;
  subtitle: string;
  solutionTitle: string;
  solutionText: string;
  icon: LucideIcon;
  videos: string[];
}

export const BarrierCard: React.FC<BarrierCardProps> = React.memo(({
  title,
  question,
  subtitle,
  solutionTitle,
  solutionText,
  icon: Icon,
  videos
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timeoutRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  
  // Track play counts for each video
  const playCounts = useRef<number[]>(new Array(videos.length).fill(0));
  // Track if videos have reached their limit
  const [videosFinished, setVideosFinished] = useState<boolean[]>(new Array(videos.length).fill(false));
  // Track if card is visible
  const [isVisible, setIsVisible] = useState(false);
  // Add a flag to prevent multiple replay attempts
  const isReplaying = useRef<boolean>(false);

  // Handle video end with better error handling and delay
  const handleVideoEnded = useCallback((index: number, videoElement: HTMLVideoElement) => {
    // Prevent multiple replay attempts
    if (isReplaying.current) return;
    
    const newCount = playCounts.current[index] + 1;
    playCounts.current[index] = newCount;
    
    console.log(`Video ${index + 1} played ${newCount} times`);
    
    if (newCount < 10) {
      // Only try to replay if the card is still visible and video not finished
      if (isVisible && !videosFinished[index]) {
        isReplaying.current = true;
        
        // Clear any existing timeout for this video
        if (timeoutRefs.current[index]) {
          clearTimeout(timeoutRefs.current[index]!);
          timeoutRefs.current[index] = null;
        }
        
        // Small delay to ensure any pause() calls have completed
        timeoutRefs.current[index] = setTimeout(() => {
          try {
            if (videoElement && isVisible && !videosFinished[index]) {
              videoElement.play()
                .then(() => {
                  isReplaying.current = false;
                  timeoutRefs.current[index] = null;
                })
                .catch(err => {
                  console.log(`Replay failed for video ${index + 1}:`, err.name);
                  isReplaying.current = false;
                  timeoutRefs.current[index] = null;
                });
            } else {
              isReplaying.current = false;
              timeoutRefs.current[index] = null;
            }
          } catch (err) {
            console.log(`Error replaying video ${index + 1}:`, err);
            isReplaying.current = false;
            timeoutRefs.current[index] = null;
          }
        }, 100);
      }
    } else {
      console.log(`Video ${index + 1} reached 10 plays, stopping`);
      setVideosFinished(prev => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    }
  }, [isVisible, videosFinished]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          
          videoRefs.current.forEach((video, index) => {
            if (!video) return;
            
            if (entry.isIntersecting && !videosFinished[index]) {
              // Clear any pending replay timeouts for this video
              if (timeoutRefs.current[index]) {
                clearTimeout(timeoutRefs.current[index]!);
                timeoutRefs.current[index] = null;
              }
              
              // Card is visible and video hasn't finished -> play
              video.play().catch((err) => {
                if (err.name !== 'AbortError') {
                  console.log(`Play error for video ${index + 1}:`, err.name);
                }
              });
            } else {
              // Card not visible OR video finished -> pause
              video.pause();
            }
          });
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      // Clear all timeouts on unmount
      timeoutRefs.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [videosFinished]);

  return (
    <div
      ref={cardRef}
      className="group relative h-auto md:h-[600px] w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full w-full">
        {/* Floating Icon Box */}
        <div className="absolute -top-6 -left-6 z-20 h-20 w-20 icon-float">
          <div className="h-full w-full rounded-2xl border border-blue-100 bg-white text-primary shadow-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <div className="icon-shake">
              <Icon strokeWidth={1.5} size={36} />
            </div>
          </div>
        </div>

        {/* Card Face */}
        <div className="relative h-full w-full flex flex-col overflow-hidden rounded-xl border-r-[12px] border-r-blue-600 border-b-[12px] border-b-indigo-600 shadow-2xl bg-white transition-transform duration-300 hover:-translate-y-2">
          {/* Main Content */}
          <div
            className="relative z-10 flex h-full flex-col p-10 pt-24 transition-opacity duration-300"
            style={{ opacity: isHovered ? 0.3 : 1 }}
          >
            <h3 className="mb-6 text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>

            <div className="mb-auto space-y-4">
              <p className="text-2xl font-medium leading-tight text-slate-600">
                {question}
                <br />
                <span className="text-slate-400 text-xl font-normal mt-2 block">
                  {subtitle}
                </span>
              </p>
            </div>

            {/* Bottom Video Grid */}
            <div className="mt-8 h-64 w-full rounded-t-lg bg-blue-50/30 p-3">
              <div className="grid h-full w-full grid-cols-1 grid-rows-2 gap-2">
                {videos.map((videoUrl, idx) => (
                  <div key={idx} className="relative overflow-hidden rounded-lg bg-white shadow-sm">
                    {videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm') ? (
                      <>
                        <video
                          ref={(el) => { videoRefs.current[idx] = el; }}
                          src={videoUrl}
                          className="h-full w-full object-cover"
                          loop={false}
                          muted
                          playsInline
                          preload="none"
                          onEnded={(e) => handleVideoEnded(idx, e.currentTarget)}
                        />
                      </>
                    ) : (
                      <img
                        src={videoUrl}
                        alt=""
                        className="h-full w-full object-cover opacity-80 grayscale transition-all duration-500 hover:grayscale-0"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sliding Blue Drawer */}
          <div
            className="absolute bottom-0 left-0 right-0 z-30 flex w-full flex-col justify-center bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 p-10 transition-all duration-300 border-t border-white/20"
            style={{
              height: isHovered ? '40%' : '0%',
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? 'auto' : 'none'
            }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-100">
              <CheckCircle size={20} />
              <span>{solutionTitle}</span>
            </div>
            <p className="text-3xl font-bold leading-tight text-white">
              {solutionText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

BarrierCard.displayName = 'BarrierCard';