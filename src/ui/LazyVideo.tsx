'use client';

import React, { useRef, useState, useEffect } from 'react';

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src: string;
    poster?: string;
    className?: string; // Allow passing className
}

export const LazyVideo: React.FC<LazyVideoProps> = ({ src, poster, className, ...props }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect(); // Stop observing once visible
                    }
                });
            },
            {
                rootMargin: '200px', // Load a bit before it enters the viewport
                threshold: 0.1,
            }
        );

        const videoElement = videoRef.current;
        if (videoElement) {
            observer.observe(videoElement);
        }

        return () => {
            if (videoElement) {
                observer.unobserve(videoElement);
            }
        };
    }, []);

    return (
        <video
            ref={videoRef}
            className={className}
            poster={poster}
            muted
            playsInline
            loop // Default to loop if not specified, but props can override
            autoPlay={isVisible} // Only autoplay when visible
            preload="none" // Don't preload until necessary
            {...props}
        >
            {isVisible && <source src={src} type="video/mp4" />}
        </video>
    );
};
