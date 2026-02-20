import React from 'react';
import { SectionHeaderProps } from '../../types/header';
import { colorConfig, maxWidthConfig } from '../../data/header';

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badgeText,
  badgeColor = 'blue',
  showPulse = true,
  title,
  highlightedText,
  gradientColors,
  description,
  maxWidth = '2xl',
  align = 'center'
}) => {
  const colors = colorConfig[badgeColor];
  const gradient = gradientColors || colors.gradient;

  const alignmentClasses = {
    wrapper: align === 'center' ? 'text-center' : 'text-left',
    badge: align === 'center' ? 'justify-center mx-auto' : 'justify-start mr-auto',
    description: align === 'center' ? 'mx-auto' : 'mr-auto',
  };

  return (
    <div className={`${alignmentClasses.wrapper} mb-16`}>
      {/* Badge */}
      <div className={`inline-flex items-center px-4 py-1.5 mb-6 rounded-full ${colors.bg} border ${colors.border} backdrop-blur-sm ${alignmentClasses.badge}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} mr-2.5 ${showPulse ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] font-extrabold tracking-[0.2em] text-primary uppercase">
          {badgeText}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-[1.1]">
        {highlightedText ? (
          <>
            {title}{' '}
            <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
              {highlightedText}
            </span>
          </>
        ) : (
          title
        )}
      </h2>

      {/* Description */}
      <p className={`text-base md:text-lg text-slate-500 ${maxWidthConfig[maxWidth]} ${alignmentClasses.description} leading-relaxed`}>
        {description}
      </p>
    </div>
  );
};

export default SectionHeader;