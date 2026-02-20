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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-3 flex flex-col justify-between h-full space-y-8">
              <div>
                <img src="/images/logo.webp" alt="BOOSTK" className="h-10 w-auto object-contain" />
              </div>
              <div className="space-y-2 text-slate-500">
                <p>System v3.14</p>
                <p>Seoul, Korea</p>
              </div>
            </div>
            <div className="md:col-span-4 grid grid-cols-2 gap-8">
              <div className="flex flex-col space-y-4">
                <h4 className="font-bold text-primary uppercase tracking-wider">Company</h4>
                <FooterLink href="#">About Us</FooterLink>
                <FooterLink href="#">Our Team</FooterLink>
                <FooterLink href='#'>Careers</FooterLink>
              </div>
                <div className="flex flex-col space-y-4">
                  <h4 className="font-bold text-primary uppercase tracking-wider">Company</h4>
                  <FooterLink href='#'>Terms of Service</FooterLink>
                  <FooterLink href='#'>Privacy Policy</FooterLink>
                </div>
            </div>
            <div className="md:col-span-5 flex md:justify-end">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-6 w-full max-w-md">
                <h4 className="font-bold text-primary mb-4 tracking-wide uppercase text-xs">System Status</h4>
                <p className="text-slate-600">All systems operational. Network latency &lt; 20ms.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <button aria-label="Chat Support" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-1 transition-all duration-300 rounded-full group">
        <span className="material-symbols-outlined text-2xl">chat_bubble</span>
      </button>
    </>
  );
};