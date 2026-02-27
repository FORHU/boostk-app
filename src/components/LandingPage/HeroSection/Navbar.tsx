import { useState, useRef, useEffect } from 'react';
import { Globe, Moon, Sun, ChevronDown } from 'lucide-react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'ko'
  const [themeIcon, setThemeIcon] = useState<'sun' | 'moon'>('sun'); // UI only
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple toggle for theme icon (UI only, no dark mode logic)
  const toggleThemeIcon = () => {
    setThemeIcon(prev => prev === 'sun' ? 'moon' : 'sun');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">
          {/* Logo */}
          <div className="navbar-logo">
            <img 
              src="/images/logo.webp" 
              alt="BOOSTK" 
              width={500} 
              height={300} 
              className="navbar-logo-image"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = '/fallback-logo.png';
              }}
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {['Services', 'Solution', 'Pricing', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="navbar-menu">
                {item}
              </a>
            ))}
          </div>

          {/* Right side group: Theme Toggle + Language Switcher + Consultation Button */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle Button (UI only) */}
            <button
              onClick={toggleThemeIcon}
              className="p-2 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
              aria-label="Toggle theme"
            >
              {themeIcon === 'sun' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language Switcher with Globe icon */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
              >
                <Globe size={18} className="text-slate-500" />
                <span>{language === 'en' ? 'English' : '한국어'}</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => { setLanguage('en'); setIsLangOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${language === 'en' ? 'text-primary font-medium' : 'text-slate-600'}`}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    onClick={() => { setLanguage('ko'); setIsLangOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${language === 'ko' ? 'text-primary font-medium' : 'text-slate-600'}`}
                  >
                    🇰🇷 한국어
                  </button>
                </div>
              )}
            </div>

            {/* Free Consultation Button */}
            <div className="navbar-button">
              <a href="#" className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary hover:bg-primary-hover shadow-sm transition-all">
                Free Consultation
              </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 hover:text-primary p-2"
            >
              <span className="material-symbols-outlined">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-white border-b border-border-light shadow-lg animate-in slide-in-from-top-2 z-50">
          <div className="px-4 py-4 space-y-3 flex flex-col">
            {['Services', 'Solution', 'Pricing', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}

            {/* Theme toggle in mobile menu (UI only) */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-slate-600">Theme</span>
              <button
                onClick={toggleThemeIcon}
                className="p-2 bg-white border border-slate-200 rounded-md text-slate-600"
              >
                {themeIcon === 'sun' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {/* Language switcher in mobile menu */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-slate-600">Language</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setLanguage('en'); setIsMenuOpen(false); }}
                  className={`px-3 py-1 text-sm rounded-full border ${language === 'en' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => { setLanguage('ko'); setIsMenuOpen(false); }}
                  className={`px-3 py-1 text-sm rounded-full border ${language === 'ko' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  KR
                </button>
              </div>
            </div>

            {/* Mobile consultation button */}
            <a
              href="#"
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded text-white bg-primary hover:bg-primary-hover shadow-sm transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Free Consultation
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};