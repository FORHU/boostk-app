import React from 'react';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-slate-500 hover:text-primary transition-colors">
    {children}
  </a>
);

export const Footer = () => {
  return (
    <>
      <footer className="bg-white border-t border-slate-200 py-10 md:py-16 font-mono text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Links section – centered */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-8 md:gap-80">
              {/* COMPANY column */}
              <div className="flex flex-col space-y-4">
                <h4 className="font-bold text-primary uppercase tracking-wider">COMPANY</h4>
                <FooterLink href="#">About Us</FooterLink>
                <FooterLink href="#">Our Team</FooterLink>
                <FooterLink href="#">Careers</FooterLink>
              </div>
              {/* LEGAL column */}
              <div className="flex flex-col space-y-4">
                <h4 className="font-bold text-primary uppercase tracking-wider">LEGAL</h4>
                <FooterLink href="#">Terms of Service</FooterLink>
                <FooterLink href="#">Privacy Policy</FooterLink>
              </div>
            </div>
          </div>

          {/* Bottom row – BOOSTK (bold) on left, copyright on right */}
          <div className="flex justify-between items-center mt-12 pt-4 border-t border-slate-100">
            <p className="text-slate-500 text-sm font-bold">BOOSTK</p>
            <p className="text-slate-500 text-sm text-right">
              © 2025 BOOSTK. Connecting Asian Innovation with Global Markets.
            </p>
          </div>
        </div>
      </footer>

      {/* Optional floating chat button */}
      <button
        aria-label="Chat Support"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-1 transition-all duration-300 rounded-full group"
      >
        <span className="material-symbols-outlined text-2xl">chat_bubble</span>
      </button>
    </>
  );
};