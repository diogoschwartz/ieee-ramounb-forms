
import React from 'react';
import { SOCIAL_LINKS } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="relative w-full max-w-6xl mx-auto mt-4 overflow-hidden rounded-xl shadow-2xl bg-ieee-gradient border border-white/10">
      {/* Decorative sparkle patterns */}
      <div className="absolute inset-0 star-pattern pointer-events-none"></div>
      
      {/* Top Bar - mimicking the browser UI in the reference */}
      <div className="bg-white/90 backdrop-blur-md mx-6 md:mx-12 mt-6 rounded-full py-2 px-6 flex flex-wrap items-center justify-around gap-4 shadow-lg border border-white/20">
        {SOCIAL_LINKS.map((link, idx) => (
          <a 
            key={idx} 
            href={link.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#004b7a] hover:text-[#00629b] transition-colors text-sm font-medium"
          >
            {link.icon}
            <span className="hidden sm:inline">{link.label}</span>
          </a>
        ))}
      </div>

      {/* Main Branding Section */}
      <div className="px-6 md:px-16 py-10 md:py-14 flex flex-col md:flex-row items-center justify-center gap-8 text-white relative z-10">
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-md shadow-inner">
             {/* Simplified IEEE Logo Shape */}
             <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#00629b]">
               <path fill="currentColor" d="M50 5L15 25V75L50 95L85 75V25L50 5ZM35 30V40H65V30H35ZM35 45V55H65V45H35ZM35 60V70H65V60H35Z" />
             </svg>
          </div>
          <div className="text-4xl md:text-5xl font-black tracking-tighter">IEEE</div>
        </div>

        <div className="h-16 w-px bg-white/30 hidden md:block"></div>

        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
           <div className="bg-white/10 p-2 rounded-lg border border-white/20">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
             </svg>
           </div>
           <div>
             <h1 className="text-xl md:text-2xl font-semibold leading-tight">Universidade de Brasília</h1>
             <p className="text-lg md:text-xl font-light opacity-90">IEEE Student Branch</p>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
