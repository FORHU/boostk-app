'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // Delay in ms
    animation?: 'fade-up' | 'fade-in' | 'slide-in-right' | 'slide-in-left';
}

export const ScrollReveal = ({
    children,
    className = '',
    delay = 0,
    animation = 'fade-up'
}: ScrollRevealProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: '0px 0px -50px 0px', // Trigger slightly before full view
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const getAnimationClasses = () => {
        switch (animation) {
            case 'fade-up':
                return isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10';
            case 'fade-in':
                return isVisible
                    ? 'opacity-100'
                    : 'opacity-0';
            case 'slide-in-right':
                return isVisible
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-10';
            case 'slide-in-left':
                return isVisible
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-10';
            default:
                return isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10';
        }
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${getAnimationClasses()} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};
