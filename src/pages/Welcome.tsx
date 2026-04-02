import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const TextBrand = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 select-none", className)}>
    <div className="flex flex-col items-center justify-center border-r border-zinc-600/40 pr-3 py-0.5">
      <span className="text-[12px] font-black leading-tight text-zinc-200">一</span>
      <span className="text-[12px] font-black leading-tight text-zinc-200">幀</span>
    </div>
    <span className="text-xl font-light tracking-[0.2em] uppercase text-zinc-300">studio</span>
  </div>
);

export default function WelcomeScene() {
  const navigate = useNavigate();
  const [isLightOn, setIsLightOn] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans">
      <div className="absolute top-10 left-12 z-30 pointer-events-none opacity-60">
        <TextBrand />
      </div>

      <img src="/bg-off.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Studio Off" />
      
      <img src="/bg-on.jpg" className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-[1.5s] ease-in-out pointer-events-none", isLightOn ? "opacity-100" : "opacity-0")} alt="Studio On" />
      
      <div className={cn("absolute inset-0 transition-colors duration-[1.5s] pointer-events-none", isLightOn ? "bg-black/20" : "bg-black/60")} />

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="relative cursor-pointer group" onMouseEnter={() => setIsLightOn(true)} onMouseLeave={() => setIsLightOn(false)} onClick={() => navigate('/dashboard')}>
          <div className={cn("px-16 py-6 uppercase font-black transition-all duration-[1.5s] ease-out", isLightOn ? "text-white text-2xl tracking-[1.8em] drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]" : "text-zinc-500 text-lg tracking-[1.5em]")}>
            进入片场
            <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-[1.5s] ease-out", isLightOn ? "w-[250px] opacity-100" : "w-0 opacity-0")} />
          </div>
          <div className={cn("absolute inset-0 px-16 py-6 uppercase font-black text-black/90 blur-[15px] transition-all duration-[1.5s] ease-out pointer-events-none", isLightOn ? "opacity-100 text-2xl tracking-[1.8em] translate-x-[20px] translate-y-[25px] skew-x-[18deg]" : "opacity-0 text-lg tracking-[1.5em] skew-x-[15deg]")}>
            进入片场
          </div>
        </div>
      </div>
    </div>
  );
}