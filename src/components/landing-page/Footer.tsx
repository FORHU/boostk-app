"use client";

import type React from "react";
import { useEffect, useState } from "react";

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-slate-500 hover:text-primary transition-colors">
    {children}
  </a>
);

export const Footer = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  useEffect(() => {
    // Listen for "close-chat" message from the React Iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "close-chat") {
        setIsChatOpen(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

      {/* Chat Widget Wrapper */}
      <div id="chat-widget-wrapper" className="antialiased">
        <div
          id="chat-iframe-container"
          className={`fixed bottom-24 right-5 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] z-[999999] transition-all duration-300 ease-out origin-bottom-right ${
            isChatOpen ? "scale-100 opacity-100 visible" : "scale-75 opacity-0 invisible pointer-events-none"
          }`}
        >
          <iframe
            src="http://localhost:3000/support/cmnniwojo0006z8sba724kar3/chat-widget"
            className="w-full h-full border-none rounded-2xl shadow-2xl ring-1 ring-black/5"
            title="Chat Support"
          ></iframe>
        </div>

        <button
          id="chat-bubble"
          type="button"
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-1 transition-all duration-300 z-[999999] flex items-center justify-center group"
          aria-label="Toggle Chat"
        >
          {isChatOpen ? (
            <svg
              id="icon-close"
              className="w-7 h-7 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ) : (
            <svg
              id="icon-chat"
              className="w-7 h-7 transition-all duration-300 group-hover:rotate-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              ></path>
            </svg>
          )}
        </button>
      </div>
    </>
  );
};
