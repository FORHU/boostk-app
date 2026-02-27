import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CheckCircle, LucideIcon } from 'lucide-react';

interface BarrierCardProps {
  title: string;
  question: React.ReactNode;
  solutionTitle: string;
  solutionText: string;
  icon: LucideIcon;
  videos: string[];
}

export const BarrierCard: React.FC<BarrierCardProps> = React.memo(({
  title,
  question,
  solutionTitle,
  solutionText,
  icon: Icon,
  videos
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timeoutRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([]);
  
  const playCounts = useRef<number[]>(new Array(videos.length).fill(0));
  const [videosFinished, setVideosFinished] = useState<boolean[]>(new Array(videos.length).fill(false));
  const isVisible = useRef(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const isReplaying = useRef<boolean>(false);

  const handleVideoEnded = useCallback((index: number, videoElement: HTMLVideoElement) => {
    if (isReplaying.current) return;
    
    const newCount = playCounts.current[index] + 1;
    playCounts.current[index] = newCount;
    
    if (newCount < 10) {
      if (isVideoActive && isVisible.current && !videosFinished[index]) {
        isReplaying.current = true;
        
        if (timeoutRefs.current[index]) {
          clearTimeout(timeoutRefs.current[index]!);
          timeoutRefs.current[index] = null;
        }
        
        timeoutRefs.current[index] = setTimeout(() => {
          try {
            if (videoElement && isVideoActive && isVisible.current && !videosFinished[index]) {
              videoElement.play()
                .then(() => {
                  isReplaying.current = false;
                  timeoutRefs.current[index] = null;
                })
                .catch(() => {
                  isReplaying.current = false;
                  timeoutRefs.current[index] = null;
                });
            } else {
              isReplaying.current = false;
              timeoutRefs.current[index] = null;
            }
          } catch {
            isReplaying.current = false;
            timeoutRefs.current[index] = null;
          }
        }, 100);
      }
    } else {
      setVideosFinished(prev => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    }
  }, [isVideoActive, videosFinished]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Intersection observer – track visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible.current = entry.isIntersecting;
          if (!entry.isIntersecting) {
            videoRefs.current.forEach(video => video?.pause());
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Control playback based on isVideoActive + visibility
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      
      const shouldPlay = isVideoActive && isVisible.current && !videosFinished[index];
      
      if (shouldPlay) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [isVideoActive, isVisible.current, videosFinished]);

  // Toggle video playback on click
  const handleCardClick = () => {
    setIsVideoActive(prev => !prev);
  };

  return (
    <div
      ref={cardRef}
      className="group relative h-auto md:h-[600px] w-full cursor-pointer"
      onClick={handleCardClick}
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
          <div className="relative z-10 flex h-full flex-col p-10 pt-16">
            <h3 className="mb-6 text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>

            <div className="mb-auto space-y-4">
              <p className="text-2xl font-medium leading-tight text-slate-400">
                {question}
              </p>
            </div>

            {/* Bottom Video Grid */}
            <div className="mt-4 h-70 w-full rounded-t-lg bg-blue-50/30 p-3">
              <div className="grid h-full w-full grid-cols-1 grid-rows-2 gap-2">
                {videos.map((videoUrl, idx) => (
                  <div key={idx} className="relative overflow-hidden rounded-lg bg-white shadow-sm">
                    {videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm') ? (
                      <video
                        ref={(el) => { videoRefs.current[idx] = el; }}
                        src={videoUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="none"
                        poster={videoUrl.replace(/\.(mp4|webm)$/, '.jpg')}
                        onError={(e) => {
                          // Fallback poster if custom one fails
                          e.currentTarget.poster = '/images/video-placeholder.jpg';
                        }}
                        onEnded={(e) => handleVideoEnded(idx, e.currentTarget)}
                      />
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

          {/* Solution Drawer – slides from bottom on hover (group-hover) */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 p-6 transition-transform duration-300 border-t border-white/20 translate-y-full group-hover:translate-y-0"
          >
            <div className="flex flex-col">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-100">
                <CheckCircle size={20} />
                <span>{solutionTitle}</span>
              </div>
              <p className="text-xl font-bold leading-tight text-white">
                {solutionText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BarrierCard.displayName = 'BarrierCard';