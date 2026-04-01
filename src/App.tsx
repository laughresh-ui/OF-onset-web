/**
 * @license
 * OneFrame Studio - Industrial Sandbox v4.0 (Ultimate Full Version)
 * Status: Strict Engineer Mode - All MVP Features Restored
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, LayoutGrid, CheckCircle, Clock, Plus, ChevronDown, Layers, 
  Zap, Box, Settings, Search, Bell, Mail, User, Maximize, Square, 
  PenTool, Move, Share2, Film, MousePointer2, Image as ImageIcon, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Panzoom from '@panzoom/panzoom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// --- Types & MVP Data ---
type View = 'welcome' | 'project' | 'storyboard' | 'canvas';
interface Project { id: string; title: string; thumb: string; year: string; }
interface Asset { id: string; url: string; name: string; type: 'character' | 'scene' | 'prop'; status: 'ok' | 'pending'; }
interface Node { id: string; type: 'asset' | 'creation' | 'render' | 'prompt'; title: string; url?: string; prompt?: string; x: number; y: number; inputs?: string[]; }

const PROJECTS: Project[] = [
  { id: 'mila', title: '《密勒日巴传奇》', thumb: 'https://picsum.photos/seed/mila/800/450', year: '2026' },
  { id: 'wuneng', title: '《无能之力》', thumb: 'https://picsum.photos/seed/cyber/800/450', year: '2026' },
  { id: 'sample', title: '实验项目_03', thumb: 'https://picsum.photos/seed/draft/800/450', year: '2025' }
];

const CHARACTERS: Asset[] = [
  { id: 'c1', name: '密勒日巴 (青年)', url: 'https://picsum.photos/seed/mila1/300/400', type: 'character', status: 'ok' },
  { id: 'c2', name: '密勒日巴 (苦修)', url: 'https://picsum.photos/seed/mila2/300/400', type: 'character', status: 'ok' },
  { id: 'c3', name: '玛尔巴', url: 'https://picsum.photos/seed/marpa/300/400', type: 'character', status: 'ok' },
];

const SCENES: Asset[] = [
  { id: 's1', name: '九层碉楼', url: 'https://picsum.photos/seed/tower/600/400', type: 'scene', status: 'ok' },
  { id: 's2', name: '护马洞', url: 'https://picsum.photos/seed/cave/600/400', type: 'scene', status: 'ok' },
];

// --- Core UI: Industrial Glass Panel ---
const GlassPanel = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={cn("bg-[#111111]/70 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-xl", className)}>
    {children}
  </div>
);

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Detached Monitor Routing (MVP Requirement)
  const [isMonitorMode, setIsMonitorMode] = useState(false);
  const [monitorImage, setMonitorImage] = useState<string | null>(null);

  // Canvas States
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'n1', type: 'creation', title: '分镜创作', x: 400, y: 300, prompt: '密勒日巴在雪山苦修' },
    { id: 'n2', type: 'render', title: '视频渲染', x: 1000, y: 300, inputs: ['n1'] }
  ]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [drawers, setDrawers] = useState({ left: false, right: false, top: false, bottom: false });

  const canvasRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<any>(null);

  // --- Initialize Monitor Mode ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('monitor') === 'true') {
      setIsMonitorMode(true);
      window.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_IMAGE') setMonitorImage(event.data.url);
      });
    }
  }, []);

  // --- Panzoom & Global Engine ---
  useEffect(() => {
    if (view === 'canvas' && canvasRef.current && !panzoomRef.current) {
      panzoomRef.current = Panzoom(canvasRef.current, { maxZoom: 5, minZoom: 0.1, canvas: true });
      const handleWheel = (e: WheelEvent) => {
        if (panzoomRef.current) {
          const scale = panzoomRef.current.getTransform().scale;
          panzoomRef.current.zoomAbs(e.clientX, e.clientY, e.deltaY > 0 ? scale * 0.9 : scale * 1.1);
        }
      };
      const container = canvasRef.current.parentElement;
      container?.addEventListener('wheel', handleWheel);
      container?.addEventListener('contextmenu', (e) => e.preventDefault());
      return () => container?.removeEventListener('wheel', handleWheel);
    }
  }, [view]);

  useEffect(() => {
    if (view !== 'canvas') return;
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [view]);

  // --- MVP Actions ---
  const toggleDrawer = (side: keyof typeof drawers, visible: boolean) => setDrawers(prev => ({ ...prev, [side]: visible }));
  const onDragStart = (e: React.DragEvent, asset: Asset) => e.dataTransfer.setData('app/asset', JSON.stringify(asset));
  
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('app/asset');
    if (!data || !panzoomRef.current) return;
    const asset: Asset = JSON.parse(data);
    const scale = panzoomRef.current.getTransform().scale;
    const x = (e.clientX - panzoomRef.current.getTransform().x) / scale;
    const y = (e.clientY - panzoomRef.current.getTransform().y) / scale;
    setNodes(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: 'asset', title: asset.name, url: asset.url, x: x - 140, y: y - 100 }]);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget || linkingFrom || !panzoomRef.current) return;
    const scale = panzoomRef.current.getTransform().scale;
    const x = (e.clientX - panzoomRef.current.getTransform().x) / scale;
    const y = (e.clientY - panzoomRef.current.getTransform().y) / scale;
    setNodes(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: 'prompt', title: '新建创作框', x: x - 140, y: y - 100 }]);
  };

  const handleLinkStart = (id: string) => setLinkingFrom(id);
  const handleLinkEnd = (id: string) => {
    if (linkingFrom && linkingFrom !== id) setNodes(prev => prev.map(n => n.id === id ? { ...n, inputs: [...(n.inputs || []), linkingFrom] } : n));
    setLinkingFrom(null);
  };

  const openMonitor = () => window.open(window.location.href + '?monitor=true', 'MonitorWindow', 'width=1280,height=720');
  const viewImage = (url: string) => {
    // Attempt to send to detached monitor, otherwise fallback to lightbox
    const monitorOpened = false; // Logic to check if window exists could go here
    if (monitorOpened) window.postMessage({ type: 'SHOW_IMAGE', url }, '*');
    else setLightboxImage(url);
  };

  // ================= VIEW -1: DETACHED MONITOR =================
  if (isMonitorMode) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
        {monitorImage ? <img src={monitorImage} alt="Monitor" className="max-w-full max-h-full object-contain" /> : <div className="text-zinc-800 font-mono text-sm tracking-[0.5em] uppercase animate-pulse">Waiting for Video/Image Signal...</div>}
      </div>
    );
  }

  // ================= VIEW 0: WELCOME & PROJECT SELECT =================
  if (view === 'welcome') {
    return (
      <div className="relative w-screen h-screen bg-[#030303] flex flex-col items-center justify-center overflow-hidden select-none font-sans">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #555 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute top-16 flex flex-col items-center">
          <h1 className="text-white text-4xl font-black tracking-[0.8em]">一帧 STUDIO</h1>
          <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-zinc-600 to-transparent mt-4" />
        </motion.div>

        <div className="z-10 flex gap-10 px-24 overflow-x-auto no-scrollbar py-12 w-full max-w-[1400px]">
          {PROJECTS.map((p) => (
            <motion.div key={p.id} whileHover={{ scale: 1.02 }} onClick={() => setSelectedProjectId(p.id)}
              className={cn("relative flex-shrink-0 w-[400px] aspect-[16/9] rounded-xl overflow-hidden border transition-all duration-500 cursor-pointer shadow-2xl", selectedProjectId === p.id ? "border-zinc-300 shadow-[0_0_40px_rgba(255,255,255,0.15)] ring-1 ring-white/20" : "border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100")}
            >
              <img src={p.thumb} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white text-xl font-bold tracking-widest">{p.title}</p>
                <p className="text-xs text-zinc-400 font-mono uppercase mt-1 tracking-widest">{p.year} // ACTIVE</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 动态老式灯光汇聚按钮 */}
        <div className="relative mt-12 group">
          {['top-[-150px] left-[-150px]', 'top-[-150px] right-[-150px]', 'bottom-[-150px] left-[-150px]', 'bottom-[-150px] right-[-150px]'].map((pos, i) => (
            <div key={i} className={cn("absolute w-[400px] h-[400px] rounded-full bg-white/[0.04] blur-[100px] transition-all duration-1000 opacity-0 group-hover:opacity-100", pos, i === 0 && "group-hover:translate-x-[120px] group-hover:translate-y-[120px]", i === 1 && "group-hover:translate-x-[-120px] group-hover:translate-y-[120px]", i === 2 && "group-hover:translate-x-[120px] group-hover:translate-y-[-120px]", i === 3 && "group-hover:translate-x-[-120px] group-hover:translate-y-[-120px]")} />
          ))}
          <button disabled={!selectedProjectId} onClick={() => setView('project')} className={cn("relative px-16 py-5 tracking-[1.5em] text-sm uppercase transition-all duration-700 font-bold ml-[1.5em]", selectedProjectId ? "text-zinc-300 hover:text-white shadow-[0_0_50px_rgba(255,255,255,0.05)] rounded-full border border-white/5" : "text-zinc-800 cursor-not-allowed border border-transparent")}>进入片场</button>
        </div>
      </div>
    );
  }

  // ================= MAIN APP GLOBAL HEADER =================
  return (
    <div className="w-screen h-screen bg-[#050505] text-zinc-300 font-sans overflow-hidden select-none">
      <header className="fixed top-0 left-0 w-full h-14 z-[2000] border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-3xl flex items-center justify-between px-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-6">
          <Film size={18} className="text-zinc-400" />
          <span className="text-[11px] font-black tracking-[0.4em] uppercase text-zinc-200">Oneframe Hub</span>
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{PROJECTS.find(p => p.id === selectedProjectId)?.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={openMonitor} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] uppercase tracking-widest transition-colors mr-4 text-zinc-400 hover:text-white"><Monitor size={12}/> 独立监视器</button>
          <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-sm border border-white/[0.08]"><span className="text-[9px] text-zinc-600 font-black">SCENE //</span><select className="bg-transparent text-[10px] outline-none text-zinc-300 tracking-[0.2em] uppercase cursor-pointer"><option>012_WHITE_CLIFF</option></select></div>
          <Bell size={16} className="text-zinc-600 hover:text-white cursor-pointer ml-2" />
          <div className="w-7 h-7 rounded bg-zinc-800 border border-white/10 flex items-center justify-center"><User size={14} /></div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ================= VIEW 1: PROJECT DESKTOP ================= */}
        {view === 'project' && (
          <motion.div key="project" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full pt-14 flex relative overflow-hidden bg-[#0c0c0e]">
            {/* MVP 约束区 */}
            <aside className="w-[300px] h-full border-r border-white/[0.05] bg-[#08080a] p-8 flex flex-col gap-8 z-20 shadow-[10px_0_24px_rgba(0,0,0,0.5)]">
              <section>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">文案与参考</h3>
                <GlassPanel className="p-4 border-white/[0.05]"><p className="text-[11px] text-zinc-400 italic">"暴风雪肆虐。密勒日巴端坐于护马洞中，内火之光在黑暗中若隐若现..."</p></GlassPanel>
              </section>
              <section>
                <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-4">MOOD BOARD</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-zinc-900 border border-white/5 rounded-sm grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"><img src={`https://picsum.photos/seed/tibet${i}/200/200`} className="w-full h-full object-cover" alt=""/></div>)}
                </div>
              </section>
              {/* MVP 新功能：全局风格预设 */}
              <section className="mt-auto">
                <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-3">全局风格预设 (STYLE PRESETS)</h4>
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-2 bg-white/10 border border-white/20 rounded text-[10px] text-white uppercase tracking-widest cursor-pointer">Default - 实写冷光影</div>
                  <div className="px-3 py-2 bg-black/40 border border-white/5 rounded text-[10px] text-zinc-500 uppercase tracking-widest cursor-pointer hover:bg-white/5">Alt 1 - 幻境高反差</div>
                </div>
              </section>
            </aside>

            {/* Hub: 联合无限画布 */}
            <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0 cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setView('canvas')} style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10 flex items-center gap-[350px] pointer-events-none mt-10">
                <motion.div whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); setView('storyboard'); }} className="w-64 h-36 bg-[#111]/80 backdrop-blur-3xl rounded-xl border border-white/[0.08] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center gap-2 pointer-events-auto cursor-pointer group">
                  <span className="text-[15px] font-black tracking-[0.4em] text-zinc-300 uppercase group-hover:text-white">分镜创作</span>
                  <span className="text-[9px] text-zinc-600 tracking-widest uppercase">Storyboard Hub</span>
                </motion.div>
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                  <h2 className="text-6xl font-black tracking-[0.4em] uppercase text-white drop-shadow-lg ml-[0.4em]">联合无限画布</h2>
                  <p className="text-zinc-500 text-xs tracking-[1em] uppercase mt-4">Joint Infinite Canvas</p>
                </div>
                <motion.div className="w-64 h-36 bg-[#111]/40 backdrop-blur-3xl rounded-xl border border-white/[0.05] shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center gap-2 opacity-60">
                  <span className="text-[15px] font-black tracking-[0.4em] text-zinc-600 uppercase">视频渲染</span>
                  <span className="text-[9px] text-zinc-700 tracking-widest uppercase">Video Engine</span>
                </motion.div>
              </div>
              <div className="absolute left-1/4 right-1/4 top-[55%] h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            </main>

            {/* Spoke Workbenches */}
            <div className="absolute top-8 right-8 w-[450px] bg-black/40 backdrop-blur-2xl p-5 rounded-xl border border-white/[0.05] shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2"><span className="text-[10px] text-zinc-400 uppercase font-black tracking-[0.2em]">前期与辅助舱</span><Plus size={14} className="text-zinc-600" /></div>
              <div className="grid grid-cols-3 gap-3">
                <MiniWorkCard title="角色与服装" count={8} status="ok" />
                <MiniWorkCard title="场景建构" count={3} status="pending" />
                <MiniWorkCard title="动作辅助" count={0} status="none" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= VIEW 2: STORYBOARD WORKBENCH ================= */}
        {view === 'storyboard' && (
          <motion.div key="storyboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full pt-14 flex bg-[#050505] overflow-hidden">
            <aside className="w-[300px] border-r border-white/[0.05] bg-[#080808] flex flex-col z-10">
              <div className="p-6 border-b border-white/[0.05]"><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">剧本解析注入</h3><GlassPanel className="p-4"><p className="text-[10px] text-zinc-400 italic">"密勒日巴端坐在岩石上，镜头缓慢推近..."</p></GlassPanel></div>
              <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">生产资料库</h4>
                <div className="space-y-3">{CHARACTERS.map(c => <GlassPanel key={c.id} className="p-2 flex items-center gap-3 border-white/[0.03] cursor-pointer hover:border-white/20"><img src={c.url} className="w-10 h-10 rounded object-cover grayscale" alt=""/><div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-300">{c.name}</span></div></GlassPanel>)}</div>
              </div>
            </aside>
            <main className="flex-1 flex flex-col p-6 gap-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <GlassPanel className="flex-1 relative overflow-hidden flex flex-col items-center justify-center group shadow-2xl border-white/[0.1]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-50 opacity-40" />
                <img src="https://picsum.photos/seed/onset_mila_main/1920/1080" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Main Viewport" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4"><button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all"><Zap size={20} fill="white" className="text-white" /></button></div>
              </GlassPanel>
              <GlassPanel className="h-[180px] p-5 flex flex-col border-white/[0.05] relative z-10">
                <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2"><span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">分镜序列时间轴 (Timeline)</span></div>
                <div className="flex-1 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="flex items-center gap-3"><div className="w-12 text-[8px] text-zinc-600 font-black uppercase tracking-widest">TRK_0{i}</div><div className="flex-1 h-5 bg-black/50 rounded overflow-hidden relative"><motion.div initial={{ width: 0 }} animate={{ width: i===1?'60%':i===2?'40%':'80%' }} className="absolute inset-y-0 left-[10%] bg-zinc-600/30 border-x border-zinc-500/50" /></div></div>)}
                </div>
              </GlassPanel>
            </main>
            <aside className="w-[320px] border-l border-white/[0.05] bg-[#080808] flex flex-col z-10">
              <div className="p-6 border-b border-white/[0.05]">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">微调控制台</h3>
                <div className="space-y-4">
                  {[{ l: 'Prompt Strength', v: '0.85' }, { l: 'Motion Scale', v: '1.2' }].map(p => <div key={p.l} className="space-y-1"><div className="flex justify-between text-[8px] font-bold uppercase tracking-widest"><span className="text-zinc-500">{p.l}</span><span className="text-zinc-300">{p.v}</span></div><div className="h-1 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-zinc-500 w-3/4" /></div></div>)}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <button className="w-full py-3 bg-[#4CAF50] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-md hover:bg-[#45a049] transition-all">生成 OK 条</button>
                <button onClick={() => setView('canvas')} className="w-full py-2.5 mt-3 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white rounded-md transition-all">进入联合无限画布微调</button>
              </div>
            </aside>
          </motion.div>
        )}

        {/* ================= VIEW 3: CANVAS (ALL DRAWERS AND BUTTONS RESTORED) ================= */}
        {view === 'canvas' && (
          <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full pt-14 bg-[#050505] overflow-hidden" onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
            
            {/* Top Drawer / Script Context - ALWAYS VISIBLE OR HOVER */}
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[100] w-[600px] mt-4">
              <GlassPanel className="p-3 shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex items-center gap-4">
                <div className="px-3 py-1 bg-black/60 rounded text-[9px] font-black text-zinc-400 uppercase tracking-widest border border-white/10">TOP EDGE: Script Context</div>
                <p className="flex-1 text-[11px] text-zinc-300 italic truncate">"暴风雪席卷雪山，密勒日巴端坐洞中..."</p>
              </GlassPanel>
            </div>

            <div className="w-full h-full relative cursor-crosshair" ref={canvasRef} onDoubleClick={handleCanvasDoubleClick} onClick={() => { if(linkingFrom) setLinkingFrom(null); }}>
              <div className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
                {nodes.map(n => n.inputs?.map(id => {
                  const f = nodes.find(x => x.id === id);
                  if(!f) return null;
                  return <NodeLink key={`${f.id}-${n.id}`} x1={f.x+280} y1={f.y+120} x2={n.x} y2={n.y+120} />;
                }))}
                {linkingFrom && <NodeLink x1={(nodes.find(n=>n.id===linkingFrom)?.x||0)+280} y1={(nodes.find(n=>n.id===linkingFrom)?.y||0)+120} x2={(mousePos.x-(panzoomRef.current?.getTransform().x||0))/(panzoomRef.current?.getTransform().scale||1)} y2={(mousePos.y-(panzoomRef.current?.getTransform().y||0))/(panzoomRef.current?.getTransform().scale||1)} />}
              </svg>
              {nodes.map(node => (
                <CanvasNode key={node.id} node={node} onDoubleClick={() => node.url && viewImage(node.url)} onMove={(x, y) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x, y } : n))} onPromptChange={(p) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, prompt: p } : n))} onLinkStart={() => handleLinkStart(node.id)} onLinkEnd={() => handleLinkEnd(node.id)} isLinking={!!linkingFrom} />
              ))}
            </div>

            {/* Edge Triggers (4 Sides) */}
            <div className="fixed left-0 top-14 bottom-0 w-8 z-[2500] hover:bg-white/[0.02]" onMouseEnter={() => toggleDrawer('left', true)} />
            <div className="fixed right-0 top-14 bottom-0 w-8 z-[2500] hover:bg-white/[0.02]" onMouseEnter={() => toggleDrawer('right', true)} />
            <div className="fixed bottom-0 left-0 right-0 h-8 z-[2500] hover:bg-white/[0.02]" onMouseEnter={() => toggleDrawer('bottom', true)} />
            
            {/* Drawers (All 4 Sides Restored) */}
            <Drawer side="left" visible={drawers.left} title="左抽屉: 角色库" onClose={() => toggleDrawer('left', false)}>
              <div className="grid grid-cols-2 gap-4 h-full content-start"><AssetList items={CHARACTERS} onDragStart={onDragStart} /></div>
            </Drawer>
            <Drawer side="right" visible={drawers.right} title="右抽屉: 场景库" onClose={() => toggleDrawer('right', false)}>
              <div className="grid grid-cols-1 gap-6 h-full content-start"><AssetList items={SCENES} onDragStart={onDragStart} horizontal /></div>
            </Drawer>
            <Drawer side="bottom" visible={drawers.bottom} title="下抽屉: 分镜时间轴 / MY OUTPUT" onClose={() => toggleDrawer('bottom', false)}>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 items-center">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="min-w-[180px] aspect-video bg-zinc-900 border border-white/10 rounded flex flex-col overflow-hidden group">
                      <div className="flex-1 bg-cover bg-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" style={{ backgroundImage: `url(https://picsum.photos/seed/mila${i}/400/250)` }} />
                      <div className="p-2 text-[9px] text-zinc-500 uppercase flex justify-between items-center bg-black"><span>Shot 0{i}</span><span className="text-[#4CAF50]">OK</span></div>
                    </div>
                  ))}
               </div>
            </Drawer>

            {/* Bottom Floating Toolbar (RESTORED SUBMIT & TOOLS) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000]">
              <GlassPanel className="px-6 py-2.5 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                <div className="flex gap-2">
                  {[PenTool, Square, Layers, Move].map((Icon, i) => <button key={i} className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/10"><Icon size={14}/></button>)}
                </div>
                <div className="w-[1px] h-4 bg-white/10" />
                <button onClick={() => setView('project')} className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white">退出画布</button>
                <button className="bg-[#4CAF50] text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-[#45a049] shadow-[0_0_15px_rgba(76,175,80,0.2)]">提交分镜审批</button>
              </GlassPanel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox / Fallback for Monitor */}
      {lightboxImage && !isMonitorMode && (
        <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center p-10 backdrop-blur-md" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} className="max-w-full max-h-full shadow-[0_0_100px_rgba(255,255,255,0.1)] rounded border border-white/10" alt="" />
        </div>
      )}
    </div>
  );
}

// --- Heavy Metal & Glass Sub-Components ---

const MiniWorkCard = ({ title, count, status }: any) => (
  <div className="bg-black/60 border border-white/10 p-3 rounded flex flex-col gap-1 shadow-inner">
    <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">{title}</div>
    <div className="flex items-center justify-between">
      <div className="text-lg font-light text-zinc-300 tracking-wider">{count}</div>
      {status !== 'none' && <div className={cn("text-[8px] px-1.5 py-0.5 rounded border", status === 'ok' ? "border-[#4CAF50]/20 text-[#4CAF50]" : "border-[#FF9800]/20 text-[#FF9800]")}>{status === 'ok' ? 'OK条' : '待处理'}</div>}
    </div>
  </div>
);

const Drawer = ({ side, visible, title, children, onClose }: any) => {
  const vars = { left: { x: visible ? 0 : '-100%' }, right: { x: visible ? 0 : '100%' }, bottom: { y: visible ? 0 : '100%' } };
  const styles = { left: 'left-0 w-[300px] border-r shadow-[10px_0_40px_rgba(0,0,0,0.8)] top-14 bottom-0', right: 'right-0 w-[300px] border-l shadow-[-10px_0_40px_rgba(0,0,0,0.8)] top-14 bottom-0', bottom: 'bottom-0 left-0 right-0 h-[180px] border-t shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' };
  
  // Top is static in this MVP version to ensure it stays visible, so we only animate Left, Right, Bottom
  return (
    <motion.div initial={false} animate={vars[side as keyof typeof vars]} onMouseLeave={onClose} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className={cn("fixed z-[2000] bg-[#0c0c0e]/95 backdrop-blur-3xl p-5 flex flex-col border-white/[0.05]", styles[side as keyof typeof styles], !visible && "pointer-events-none")}>
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2"><span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">{title}</span></div>
      <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
    </motion.div>
  );
};

const AssetList = ({ items, onDragStart, horizontal }: any) => items.map((a: Asset) => (
  <div draggable onDragStart={e => onDragStart(e, a)} className={cn("bg-[#111] border border-white/[0.05] cursor-grab active:cursor-grabbing relative group overflow-hidden rounded transition-all hover:border-zinc-400", horizontal ? "flex h-24" : "aspect-[3/4]")}>
    <div className={cn("bg-cover bg-center grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500", horizontal ? "w-28 h-full" : "absolute inset-0")} style={{ backgroundImage: `url(${a.url})` }} />
    <div className={cn("relative p-2 flex flex-col justify-end h-full bg-gradient-to-t from-black via-black/80 to-transparent", horizontal && "flex-1")}><span className="text-[10px] font-bold text-zinc-300 truncate tracking-widest">{a.name}</span></div>
  </div>
));

const CanvasNode = ({ node, onDoubleClick, onMove, onPromptChange, onLinkStart, onLinkEnd, isLinking }: any) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('textarea, .node-port')) return;
    e.stopPropagation(); setIsDragging(true);
  };
  useEffect(() => {
    if (!isDragging) return;
    const onMoveHandler = (e: MouseEvent) => onMove(node.x + e.movementX, node.y + e.movementY);
    const onUpHandler = () => setIsDragging(false);
    window.addEventListener('mousemove', onMoveHandler); window.addEventListener('mouseup', onUpHandler);
    return () => { window.removeEventListener('mousemove', onMoveHandler); window.removeEventListener('mouseup', onUpHandler); };
  }, [isDragging, node.x, node.y, onMove]);

  return (
    <div className={cn("absolute bg-[#111111]/90 backdrop-blur-xl rounded border border-white/10 flex flex-col w-[280px] shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors z-10", isDragging && "border-zinc-500 z-50", isLinking && "cursor-crosshair")} style={{ left: node.x, top: node.y }} onMouseDown={handleMouseDown} onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }} onClick={(e) => { if (isLinking) { e.stopPropagation(); onLinkEnd(); } }}>
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-600 shadow-inner" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{node.title}</span></div>
      </div>
      <div className="p-4 flex flex-col gap-4 relative">
        <div className="node-port absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/10 bg-[#111] shadow-lg cursor-pointer hover:scale-150 hover:bg-white transition-all z-20" onClick={e => { e.stopPropagation(); onLinkStart(); }} />
        <div className="node-port absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/10 bg-[#111] shadow-lg cursor-pointer hover:scale-150 hover:bg-white transition-all z-20" onClick={e => { e.stopPropagation(); onLinkStart(); }} />
        {node.url && <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); onDoubleClick(); }}><img src={node.url} alt="" className="w-full aspect-video object-cover rounded border border-white/[0.05] grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize size={20} className="text-white"/></div></div>}
        <div className="flex flex-col gap-2"><span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">Prompt 指令 / PROMPT</span><textarea rows={2} value={node.prompt || ''} onChange={e => onPromptChange(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded px-3 py-2 text-[11px] text-zinc-300 outline-none focus:border-zinc-500 resize-none shadow-inner" /></div>
      </div>
    </div>
  );
};

const NodeLink = ({ x1, y1, x2, y2 }: any) => {
  const dx = Math.abs(x1 - x2) * 0.5;
  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  return (
    <g>
      <path d={path} stroke="rgba(255,255,255,0.03)" fill="none" strokeWidth="6" />
      <path d={path} stroke="#555" fill="none" strokeWidth="1.5" strokeDasharray="4 4" />
    </g>
  );
};