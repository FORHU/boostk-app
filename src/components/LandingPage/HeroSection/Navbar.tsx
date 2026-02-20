import { useState } from 'react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">
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

          <div className="navbar-button">
            <a href="#" className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary hover:bg-primary-hover shadow-sm transition-all">
              Free Consultation
            </a>
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
        <div className="md:hidden absolute top-14 left-0 w-full bg-white border-b border-border-light shadow-lg animate-in slide-in-from-top-2">
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