import { ChevronDown, Globe, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en"); // 'en' or 'ko'
  const [themeIcon, setThemeIcon] = useState<"sun" | "moon">("sun");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleThemeIcon = () => {
    setThemeIcon((prev) => (prev === "sun" ? "moon" : "sun"));
  };

  return (
    <nav className="relative w-full bg-white border-b border-slate-100 z-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <img
              src="/images/logo.webp"
              alt="BOOSTK"
              className="h-8 w-auto md:h-10"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/150x50?text=BOOSTK";
              }}
            />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {["Services", "Solution", "Pricing", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleThemeIcon}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all"
              aria-label="Toggle theme"
            >
              {themeIcon === "sun" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <Globe size={18} />
                <span>{language === "en" ? "English" : "한국어"}</span>
                <ChevronDown size={14} className={`transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      setIsLangOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-2 text-sm hover:bg-slate-50 ${language === "en" ? "text-blue-600 font-semibold" : "text-slate-600"}`}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("ko");
                      setIsLangOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-2 text-sm hover:bg-slate-50 ${language === "ko" ? "text-blue-600 font-semibold" : "text-slate-600"}`}
                  >
                    🇰🇷 한국어
                  </button>
                </div>
              )}
            </div>

            {/* Consultation Button */}
            <a
              href="#consultation"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Free Consultation
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {["Services", "Solution", "Pricing", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}

            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-slate-500">Language</span>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 text-xs rounded-md ${language === "en" ? "bg-white shadow text-blue-600 font-bold" : "text-slate-500"}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("ko")}
                    className={`px-3 py-1 text-xs rounded-md ${language === "ko" ? "bg-white shadow text-blue-600 font-bold" : "text-slate-500"}`}
                  >
                    KR
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleThemeIcon}
                className="flex w-full items-center justify-between px-3 py-3 text-slate-700"
              >
                <span className="text-sm">Theme</span>
                {themeIcon === "sun" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <a
                href="/"
                className="mt-4 block w-full text-center py-3 bg-blue-600 text-white font-bold rounded-xl"
                onClick={() => setIsMenuOpen(false)}
              >
                Free Consultation
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
