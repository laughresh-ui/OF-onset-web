/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  LayoutGrid, 
  CheckCircle, 
  Clock, 
  Plus,
  ChevronDown,
  Layers,
  Zap,
  Box,
  Settings,
  Search,
  Bell,
  Mail,
  User,
  Maximize,
  MousePointer2,
  Square,
  PenTool,
  Move,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Panzoom from '@panzoom/panzoom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type View = 'project' | 'storyboard' | 'canvas';

interface Asset {
  id: string;
  url: string;
  name: string;
  type: 'character' | 'scene' | 'prop';
  status: 'ok' | 'pending';
}

interface Node {
  id: string;
  type: 'asset' | 'creation' | 'render' | 'prompt';
  title: string;
  url?: string;
  prompt?: string;
  x: number;
  y: number;
  inputs?: string[]; // IDs of connected nodes
}

// --- Constants ---
const CHARACTERS: Asset[] = [
  { id: 'c1', name: '莫十一 (标准服装)', url: 'https://picsum.photos/seed/char1/300/400', type: 'character', status: 'ok' },
  { id: 'c2', name: '莫十一 (战斗装束)', url: 'https://picsum.photos/seed/char2/300/400', type: 'character', status: 'ok' },
  { id: 'c3', name: '林清雪', url: 'https://picsum.photos/seed/char3/300/400', type: 'character', status: 'ok' },
  { id: 'c4', name: '实验体09', url: 'https://picsum.photos/seed/char4/300/400', type: 'character', status: 'pending' },
];

const SCENES: Asset[] = [
  { id: 's1', name: '赛博修仙实验室 (主视角)', url: 'https://picsum.photos/seed/scene1/600/400', type: 'scene', status: 'ok' },
  { id: 's2', name: '地下数据中心 (废弃)', url: 'https://picsum.photos/seed/scene2/600/400', type: 'scene', status: 'ok' },
  { id: 's3', name: '机械飞剑 (实地道具)', url: 'https://picsum.photos/seed/scene3/600/400', type: 'prop', status: 'ok' },
];

export default function App() {
  const [view, setView] = useState<View>('project');
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'n1', type: 'creation', title: '分镜创作 (Storyboard)', x: 400, y: 300, prompt: '莫十一在实验室中拔出飞剑' },
    { id: 'n2', type: 'render', title: '视频渲染 (Video AI)', x: 1000, y: 300, inputs: ['n1'] }
  ]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isMonitorMode, setIsMonitorMode] = useState(false);
  const [monitorImage, setMonitorImage] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState('第十二场：赛博修仙实验室');
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Drawer visibility states
  const [drawers, setDrawers] = useState({ left: false, right: false, top: false, bottom: false });

  const toggleDrawer = (side: keyof typeof drawers, visible: boolean) => {
    setDrawers(prev => ({ ...prev, [side]: visible }));
  };

  const canvasRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<any>(null);

  // --- Initialize Monitor Mode ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('monitor') === 'true') {
      setIsMonitorMode(true);
      window.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_IMAGE') {
          setMonitorImage(event.data.url);
        }
      });
    }
  }, []);

  // --- Initialize Panzoom ---
  useEffect(() => {
    if (view === 'canvas' && canvasRef.current && !panzoomRef.current) {
      panzoomRef.current = Panzoom(canvasRef.current, {
        maxZoom: 5,
        minZoom: 0.1,
        canvas: true,
      });

      const handleWheel = (e: WheelEvent) => {
        if (panzoomRef.current) {
          const delta = e.deltaY;
          const scale = panzoomRef.current.getTransform().scale;
          const newScale = delta > 0 ? scale * 0.9 : scale * 1.1;
          panzoomRef.current.zoomAbs(e.clientX, e.clientY, newScale);
        }
      };

      const container = canvasRef.current.parentElement;
      container?.addEventListener('wheel', handleWheel);
      container?.addEventListener('contextmenu', (e) => e.preventDefault());

      return () => {
        container?.removeEventListener('wheel', handleWheel);
      };
    }
  }, [view]);

  // --- Edge Drawer Detection ---
  useEffect(() => {
    if (view !== 'canvas') return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [view]);

  // --- Drag & Drop ---
  const onDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/of-asset', JSON.stringify(asset));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/of-asset');
    if (!data || !panzoomRef.current) return;

    const asset: Asset = JSON.parse(data);
    const transform = panzoomRef.current.getTransform();
    const scale = transform.scale;
    const x = (e.clientX - transform.x) / scale;
    const y = (e.clientY - transform.y) / scale;

    setNodes(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      type: 'asset', 
      title: asset.name, 
      url: asset.url, 
      x: x - 150, 
      y: y - 100,
      prompt: ''
    }]);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    
    if (linkingFrom) {
      setLinkingFrom(null);
      return;
    }

    if (!panzoomRef.current) return;
    const transform = panzoomRef.current.getTransform();
    const scale = transform.scale;
    const x = (e.clientX - transform.x) / scale;
    const y = (e.clientY - transform.y) / scale;

    setNodes(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type: 'prompt',
      title: '新创作框',
      x: x - 120,
      y: y - 80,
      prompt: ''
    }]);
  };

  const handleNodePromptChange = (id: string, prompt: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, prompt } : n));
  };

  const handleLinkStart = (id: string) => {
    setLinkingFrom(id);
  };

  const handleLinkEnd = (id: string) => {
    if (linkingFrom && linkingFrom !== id) {
      setNodes(prev => prev.map(n => n.id === id ? { 
        ...n, 
        inputs: [...(n.inputs || []), linkingFrom] 
      } : n));
    }
    setLinkingFrom(null);
  };

  // --- Render Monitor Mode ---
  if (isMonitorMode) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        {monitorImage ? (
          <img src={monitorImage} alt="Monitor" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-zinc-800 font-mono text-xs tracking-[4px] uppercase animate-pulse">
            Signal Lost / Waiting for High-Def Stream
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#09090b] text-[#e4e4e7] font-sans overflow-hidden select-none">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-[60px] flex items-center justify-between px-6 z-[1000] border-b border-white/5 bg-[#09090b]/90 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1.5 text-lg tracking-wider cursor-pointer" onClick={() => setView('project')}>
            <Layers className="text-[#4CAF50]" size={20} />
            <b className="font-black text-white uppercase tracking-tighter">Project Sandtable</b>
            <span className="text-zinc-600 mx-2">|</span>
            <span className="font-light text-zinc-400 text-sm">PROJECT: Wuneng Zhili (无能之力)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/5 rounded-full">
            <Search size={14} className="text-zinc-500" />
            <input type="text" placeholder="Search" className="bg-transparent outline-none text-xs w-32" />
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Bell size={18} className="hover:text-white cursor-pointer" />
            <Mail size={18} className="hover:text-white cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* View 1: Project Desktop */}
      <AnimatePresence mode="wait">
        {view === 'project' && (
          <motion.div 
            key="project"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full pt-[60px] flex relative overflow-hidden"
          >
            {/* Left Sidebar: Script & Reference */}
            <aside className="w-[280px] h-full border-r border-white/5 bg-[#0c0c0e] p-6 flex flex-col gap-8 z-20">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white">文案与参考</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Script & Reference</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">剧本片段</span>
                  <div className="glass px-3 py-2 rounded-sm border-white/10 flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-zinc-300">第十二场：赛博修仙实验室</span>
                    <ChevronDown size={14} className="text-zinc-500" />
                  </div>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                  <p className="text-xs text-zinc-400 leading-relaxed italic">
                    莫十一站在矩阵中央，眼神坚定。全息符文的光芒倒映在他瞳孔中。他缓缓抬起手，指尖触碰虚空...
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">情绪板参考</span>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square glass border-white/5 rounded-sm overflow-hidden">
                      <img src={`https://picsum.photos/seed/mood${i}/200/200`} alt="mood" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                    </div>
                  ))}
                </div>
                <button className="w-full py-2 glass border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">展开全局参考</button>
              </div>
            </aside>

            {/* Central Area: Joint Infinite Canvas Gateway */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {/* Clickable Desktop Area - "Zhuomo" */}
              <div 
                className="absolute inset-0 canvas-dot-bg opacity-10 cursor-pointer z-0" 
                onClick={() => setView('canvas')}
              />
              
              <div className="relative flex items-center gap-12 z-10 pointer-events-none">
                {/* Storyboard Node */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => { e.stopPropagation(); setView('storyboard'); }}
                  className="w-56 h-32 glass rounded-xl border-white/10 flex flex-col items-center justify-center gap-2 hover:border-[#4CAF50]/40 transition-all shadow-2xl pointer-events-auto"
                >
                  <div className="text-xl font-bold tracking-widest">【分镜创作】</div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Storyboard Creation - Animatics</div>
                  <div className="flex items-center gap-1.5 mt-2 text-[#4CAF50] text-[10px] font-bold">
                    <CheckCircle size={12} /> OK
                  </div>
                </motion.div>

                {/* Central Text - Background Element (Non-interactive) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[-1]">
                  <div className="text-center opacity-10">
                    <h2 className="text-8xl font-black tracking-[40px] uppercase text-white select-none">
                      联合无限画布
                    </h2>
                    <div className="flex items-center justify-center gap-12 mt-12">
                      <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-white/40" />
                      <p className="text-white text-lg tracking-[20px] uppercase font-bold">
                        Joint Infinite Canvas
                      </p>
                      <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-white/40" />
                    </div>
                  </div>
                </div>

                {/* Video Render Node */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-56 h-32 glass rounded-xl border-white/10 flex flex-col items-center justify-center gap-2 hover:border-[#4CAF50]/40 transition-all shadow-2xl pointer-events-auto"
                >
                  <div className="text-xl font-bold tracking-widest">【视频渲染】</div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Video AI Rendering</div>
                  <div className="flex items-center gap-1.5 mt-2 text-[#4CAF50] text-[10px] font-bold">
                    <CheckCircle size={12} /> OK
                  </div>
                </motion.div>
              </div>

                {/* Connection Lines (Visual only) */}
                <div className="absolute left-[-40px] top-1/2 w-10 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
                <div className="absolute right-[-40px] top-1/2 w-10 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
              </div>

            {/* Top Right Panel: Pre-visualization */}
              <div className="absolute top-8 right-8 w-[420px] glass p-4 rounded-xl border-white/10 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">预想创作区</span>
                  <Plus size={14} className="text-zinc-600" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MiniWorkCard title="角色与服装设计" count={12} status="ok" />
                  <MiniWorkCard title="场景建构" count={4} status="pending" />
                  <MiniWorkCard title="道具设定" count={0} status="none" />
                </div>
              </div>

              {/* Bottom Right Panel: Auxiliary Tools */}
              <div className="absolute bottom-8 right-8 flex flex-col gap-4 items-end">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">辅助工具</span>
                <div className="glass p-2 rounded-xl flex flex-col gap-4 border-white/10">
                  <ToolbarBtn icon={<Monitor size={18} />} />
                  <ToolbarBtn icon={<Share2 size={18} />} />
                  <ToolbarBtn icon={<Box size={18} />} />
                </div>
              </div>
          </motion.div>
        )}

        {/* View 2: Storyboard Workbench - Redesigned for Industrial Aesthetic */}
        {view === 'storyboard' && (
          <motion.div 
            key="storyboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full pt-[60px] flex flex-col bg-[#09090b] overflow-hidden"
          >
            {/* Workbench Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0c0c0e]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-zinc-400">
                  <LayoutGrid size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[2px]">Storyboard Workbench</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Scene:</span>
                  <div className="glass px-3 py-1 rounded border-white/10 flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-white font-bold">SCENE_012_LAB</span>
                    <ChevronDown size={10} className="text-zinc-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('canvas')}
                  className="flex items-center gap-2 px-4 py-1.5 glass border-white/10 rounded-lg text-[10px] font-black uppercase tracking-[2px] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                >
                  <Maximize size={12} />
                  进入联合画布
                </button>
                <button 
                  onClick={() => setView('project')}
                  className="px-4 py-1.5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-[2px] text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  返回项目
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Script & Constraints */}
              <aside className="w-[320px] border-r border-white/5 flex flex-col bg-[#09090b]">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px]">剧本约束区 / SCRIPT</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                      "内景-夜。莫十一站在矩阵阵法中央。全息符文的光芒倒映在他坚定的眼神中。他缓缓抬起手，指尖触碰虚空，仿佛在拨动命运的琴弦..."
                    </p>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
                  <div>
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[2px] mb-4">全局风格预设 / STYLE</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <StyleTag label="DEFAULT - 实写质感" active />
                      <StyleTag label="CINEMATIC - 电影感" />
                      <StyleTag label="CYBERPUNK - 赛博" />
                      <StyleTag label="ANIME - 动画" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[2px] mb-4">关键资产 / ASSETS</h4>
                    <div className="space-y-2">
                      {CHARACTERS.slice(0, 2).map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-2 glass border-white/5 rounded-lg">
                          <img src={c.url} className="w-10 h-10 rounded object-cover grayscale" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-300">{c.name}</span>
                            <span className="text-[8px] text-zinc-600 uppercase tracking-widest">Character Asset</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Center Panel: Viewport & Timeline */}
              <main className="flex-1 flex flex-col bg-[#050507] p-6 gap-6">
                {/* Viewport */}
                <div className="flex-1 glass border-white/10 rounded-3xl overflow-hidden relative group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <img 
                    src="https://picsum.photos/seed/onset_main/1920/1080" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Viewport Overlays */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="px-3 py-1 glass border-white/10 rounded-full text-[9px] font-mono text-white/60 tracking-widest">
                      REC 00:12:04:15
                    </div>
                    <div className="px-3 py-1 glass border-white/10 rounded-full text-[9px] font-mono text-[#4CAF50] tracking-widest">
                      AI_GEN_ACTIVE
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full glass border-white/20 flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                      <Zap size={20} fill="white" />
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Generate Sequence</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Nano Banana 2 Pro Engine</span>
                    </div>
                  </div>

                  <div className="absolute top-6 right-6">
                    <button className="p-2 glass border-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                      <Maximize size={16} />
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="h-[200px] glass border-white/5 rounded-3xl p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock size={14} className="text-zinc-500" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px]">Keyframe Timeline</span>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-bold uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Camera
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-bold uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" /> Character
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-bold uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> FX
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-20 text-[8px] text-zinc-600 font-black uppercase tracking-widest">Track 0{i}</div>
                        <div className="flex-1 h-6 bg-white/[0.02] rounded-lg relative overflow-hidden border border-white/5">
                          <div className="absolute inset-y-0 left-1/3 w-[1px] bg-white/5" />
                          <div className="absolute inset-y-0 left-2/3 w-[1px] bg-white/5" />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '40%' }}
                            className="absolute inset-y-0 left-[10%] bg-[#4CAF50]/20 border-x border-[#4CAF50]/40"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </main>

              {/* Right Panel: Parameters & Review */}
              <aside className="w-[340px] border-l border-white/5 flex flex-col bg-[#09090b]">
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px] mb-6">生成参数 / PARAMETERS</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Prompt Strength', val: '0.85' },
                      { label: 'Motion Scale', val: '1.2' },
                      { label: 'Detail Level', val: 'High' }
                    ].map(p => (
                      <div key={p.label} className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                          <span className="text-zinc-500">{p.label}</span>
                          <span className="text-[#4CAF50]">{p.val}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#4CAF50]/40 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-8">
                  <div>
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[2px] mb-4">导演评审 / REVIEW</h4>
                    <div className="space-y-3">
                      <button className="w-full py-4 bg-[#4CAF50] text-black text-[11px] font-black uppercase tracking-[4px] rounded-xl hover:bg-[#4CAF50]/90 transition-all shadow-[0_0_30px_rgba(76,175,80,0.2)]">
                        批准 OK 条
                      </button>
                      <button className="w-full py-3 border border-white/10 text-[10px] font-black uppercase tracking-[2px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        微调调整
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[2px]">批注 / ANNOTATIONS</h4>
                      <Plus size={12} className="text-zinc-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 glass border-white/5 rounded-lg text-[9px] text-zinc-500 leading-relaxed">
                        "背景光效需要再冷一点，莫十一的眼神光可以再亮一些。"
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </motion.div>
        )}

        {/* View 3: Canvas */}
        {view === 'canvas' && (
          <motion.div 
            key="canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-[#050507] pt-[60px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div className="w-full h-full relative overflow-hidden">
              <div 
                ref={canvasRef} 
                className="w-full h-full relative"
                onClick={handleCanvasClick}
              >
                {/* Dot Background */}
                <div className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] canvas-dot-bg pointer-events-none" />
                
                {/* Private Workspace Boundary */}
                <div className="absolute top-[100px] left-[400px] w-[1200px] h-[800px] border border-[#4CAF50]/20 rounded-[40px] pointer-events-none flex flex-col p-8">
                  <div className="text-[10px] text-[#4CAF50] uppercase tracking-[4px] font-bold">私有无限画布创作区</div>
                  <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">(Shot Creation Private Workspace)</div>
                </div>

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  {nodes.map(node => node.inputs?.map(inputId => {
                    const fromNode = nodes.find(n => n.id === inputId);
                    if (!fromNode) return null;
                    return (
                      <NodeLink 
                        key={`${fromNode.id}-${node.id}`} 
                        x1={fromNode.x + 280} 
                        y1={fromNode.y + 120} 
                        x2={node.x} 
                        y2={node.y + 120} 
                      />
                    );
                  }))}
                  {linkingFrom && (
                    <NodeLink 
                      x1={(nodes.find(n => n.id === linkingFrom)?.x || 0) + 280}
                      y1={(nodes.find(n => n.id === linkingFrom)?.y || 0) + 120}
                      x2={(mousePos.x - (panzoomRef.current?.getTransform().x || 0)) / (panzoomRef.current?.getTransform().scale || 1)}
                      y2={(mousePos.y - (panzoomRef.current?.getTransform().y || 0)) / (panzoomRef.current?.getTransform().scale || 1)}
                    />
                  )}
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                  <CanvasNode 
                    key={node.id} 
                    node={node} 
                    onDoubleClick={() => node.url && setLightboxImage(node.url)}
                    onMove={(x, y) => {
                      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x, y } : n));
                    }}
                    onPromptChange={(p) => handleNodePromptChange(node.id, p)}
                    onLinkStart={() => handleLinkStart(node.id)}
                    onLinkEnd={() => handleLinkEnd(node.id)}
                    isLinking={!!linkingFrom}
                  />
                ))}
              </div>
            </div>

            {/* Edge Triggers for Drawers */}
            <div className="fixed left-0 top-[60px] bottom-0 w-2 z-[2500]" onMouseEnter={() => toggleDrawer('left', true)} />
            <div className="fixed right-0 top-[60px] bottom-0 w-2 z-[2500]" onMouseEnter={() => toggleDrawer('right', true)} />
            <div className="fixed top-[60px] left-0 right-0 h-2 z-[2500]" onMouseEnter={() => toggleDrawer('top', true)} />
            <div className="fixed bottom-0 left-0 right-0 h-2 z-[2500]" onMouseEnter={() => toggleDrawer('bottom', true)} />

            {/* Edge Drawers - Refined Style */}
            <Drawer side="left" visible={drawers.left} title="角色与服装库 / CHARACTER & COSTUME" onClose={() => toggleDrawer('left', false)}>
              <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 h-full content-start pb-20">
                {CHARACTERS.map(asset => (
                  <AssetItem key={asset.id} asset={asset} onDragStart={onDragStart} />
                ))}
              </div>
            </Drawer>

            <Drawer side="right" visible={drawers.right} title="场景与道具库 / SCENE & PROP" onClose={() => toggleDrawer('right', false)}>
              <div className="grid grid-cols-1 gap-6 overflow-y-auto pr-2 h-full content-start pb-20">
                {SCENES.map(asset => (
                  <AssetItem key={asset.id} asset={asset} onDragStart={onDragStart} horizontal />
                ))}
              </div>
            </Drawer>

            <Drawer side="top" visible={drawers.top} title="剧本提示 / SCRIPT & CONTEXT" onClose={() => toggleDrawer('top', false)}>
              <div className="flex items-center gap-6 p-2">
                <div className="glass px-4 py-2 rounded-xl border-white/10">
                  <div className="text-[9px] text-[#4CAF50] mb-1 uppercase font-mono">第十二场:</div>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    莫十一在实验室中拔出飞剑。他的眼神坚定，看向前方。
                  </p>
                </div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                  TOP EDGE DRAWER<br/>下控的剧本与分镜提示
                </div>
              </div>
            </Drawer>

            <Drawer side="bottom" visible={drawers.bottom} title="分镜时间轴 / SHOT TIMELINE" onClose={() => toggleDrawer('bottom', false)}>
              <div className="flex gap-6 overflow-x-auto pb-4 h-full items-center px-4 no-scrollbar">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[200px] aspect-video glass border-white/5 rounded-xl flex flex-col overflow-hidden group cursor-pointer hover:border-[#4CAF50]/30 transition-all">
                    <div className="flex-1 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" style={{ backgroundImage: `url(https://picsum.photos/seed/shot${i}/400/250)` }} />
                    <div className="p-3 text-[10px] text-zinc-500 uppercase flex justify-between items-center bg-black/40">
                      <span className="font-bold tracking-widest">Scene 12-Shot 0{i}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-[#4CAF50]">OK Take</span>
                        <CheckCircle size={12} className="text-[#4CAF50]" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="min-w-[200px] aspect-video border border-dashed border-white/10 rounded-xl flex items-center justify-center text-zinc-700 hover:text-white hover:border-white/20 transition-all cursor-pointer bg-white/[0.02]">
                  <Plus size={24} />
                </div>
              </div>
            </Drawer>

            {/* Floating Toolbar - Refined */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-2xl flex items-center gap-8 z-[3000] border-white/10 shadow-2xl">
              <div className="flex items-center gap-4">
                <ToolbarBtn icon={<PenTool size={18} />} active />
                <ToolbarBtn icon={<Square size={18} />} />
                <ToolbarBtn icon={<Layers size={18} />} />
                <ToolbarBtn icon={<Move size={18} />} />
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <button onClick={() => setView('storyboard')} className="text-[11px] uppercase tracking-[3px] text-zinc-400 hover:text-white transition-colors font-black">切换工作台</button>
              <button className="bg-[#4CAF50] text-black px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-[3px] hover:bg-[#4CAF50]/90 transition-all shadow-[0_0_20px_rgba(76,175,80,0.2)]">提交分镜审批</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center p-10"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative group">
            <img src={lightboxImage} alt="Full View" className="max-w-full max-h-full shadow-2xl border border-white/10" />
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 glass rounded-full hover:bg-white/10"><Share2 size={16} /></button>
              <button className="p-2 glass rounded-full hover:bg-white/10"><Maximize size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

const StyleTag: React.FC<{ label: string, active?: boolean }> = ({ label, active = false }) => {
  return (
    <div className={cn(
      "px-3 py-2 text-[10px] border transition-all cursor-pointer rounded-sm",
      active ? "bg-white text-black border-white" : "border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300"
    )}>
      {label}
    </div>
  );
};

const MiniWorkCard: React.FC<{ title: string, count: number, status: 'ok' | 'pending' | 'none' }> = ({ title, count, status }) => {
  return (
    <div className="bg-white/5 border border-white/5 p-2 rounded-sm flex flex-col gap-1">
      <div className="text-[9px] text-zinc-500 uppercase">{title}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold">{count}</div>
        {status !== 'none' && (
          <div className={cn("text-[8px] px-1.5 py-0.5 rounded-full", status === 'ok' ? "bg-[#4CAF50]/20 text-[#4CAF50]" : "bg-[#FF9800]/20 text-[#FF9800]")}>
            {status === 'ok' ? 'OK条' : '待审批'}
          </div>
        )}
      </div>
    </div>
  );
};

const Drawer: React.FC<{ 
  side: 'left' | 'right' | 'top' | 'bottom', 
  visible: boolean, 
  title: string, 
  children: React.ReactNode,
  onClose: () => void 
}> = ({ side, visible, title, children, onClose }) => {
  const variants = {
    left: { x: visible ? 0 : '-100%' },
    right: { x: visible ? 0 : '100%' },
    top: { y: visible ? 0 : '-100%' },
    bottom: { y: visible ? 0 : '100%' }
  };

  const styleMap = {
    left: 'top-[60px] left-0 bottom-0 w-[320px] border-r',
    right: 'top-[60px] right-0 bottom-0 w-[320px] border-l',
    top: 'top-[60px] left-[320px] right-[320px] h-[140px] border-b',
    bottom: 'bottom-0 left-0 right-0 h-[160px] border-t'
  };

  return (
    <motion.div 
      initial={false}
      animate={variants[side]}
      onMouseLeave={onClose}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        "fixed z-[2000] glass p-4 flex flex-col border-white/10", 
        styleMap[side],
        !visible && "pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[2px] text-zinc-500 font-bold">{title}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <div className="w-1 h-1 rounded-full bg-zinc-700" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

const AssetItem: React.FC<{ asset: Asset, onDragStart: (e: React.DragEvent, asset: Asset) => void, horizontal?: boolean }> = ({ asset, onDragStart, horizontal = false }) => {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, asset)}
      className={cn(
        "bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing relative group overflow-hidden rounded-sm transition-all hover:border-white/30",
        horizontal ? "flex h-24" : "aspect-[3/4]"
      )}
    >
      <div 
        className={cn("bg-cover bg-center grayscale group-hover:grayscale-0 transition-all", horizontal ? "w-32 h-full" : "absolute inset-0")} 
        style={{ backgroundImage: `url(${asset.url})` }} 
      />
      <div className={cn("relative p-2 flex flex-col justify-end h-full bg-gradient-to-t from-black/80 to-transparent", horizontal && "flex-1")}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-white truncate">{asset.name}</span>
          {asset.status === 'ok' && <CheckCircle size={10} className="text-[#4CAF50]" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">OK Take</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>
      </div>
      <div className="absolute inset-0 bg-[#4CAF50]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

const CanvasNode: React.FC<{ 
  node: Node, 
  onDoubleClick: () => void, 
  onMove: (x: number, y: number) => void,
  onPromptChange: (p: string) => void,
  onLinkStart: () => void,
  onLinkEnd: () => void,
  isLinking: boolean
}> = ({ node, onDoubleClick, onMove, onPromptChange, onLinkStart, onLinkEnd, isLinking }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('input')) return;
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onMove(node.x + e.movementX, node.y + e.movementY);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, node.x, node.y, onMove]);

  return (
    <div 
      ref={nodeRef}
      className={cn(
        "absolute glass rounded-2xl border-white/10 overflow-hidden flex flex-col min-w-[280px] shadow-2xl transition-all duration-300",
        isDragging ? "shadow-[#4CAF50]/30 border-[#4CAF50]/50 scale-[1.05] z-50" : "hover:border-white/30 z-10",
        isLinking && "cursor-crosshair"
      )}
      style={{ left: node.x, top: node.y }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onClick={(e) => {
        if (isLinking) {
          e.stopPropagation();
          onLinkEnd();
        }
      }}
    >
      <div className="bg-white/5 px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", 
            node.type === 'asset' ? "bg-blue-500" : 
            node.type === 'creation' ? "bg-[#4CAF50]" : 
            node.type === 'prompt' ? "bg-yellow-500" : "bg-purple-500"
          )} />
          <span className="text-[11px] font-black uppercase tracking-[2px] text-zinc-400">{node.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <Settings size={12} className="text-zinc-600 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
      
      <div className="p-5 flex flex-col gap-5 relative">
        {/* Link Handle (Plus) - Improved Interaction */}
        <motion.div 
          whileHover={{ scale: 1.2, backgroundColor: 'rgba(76, 175, 80, 0.2)' }}
          onClick={(e) => {
            e.stopPropagation();
            onLinkStart();
          }}
          className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass border-white/20 flex items-center justify-center text-zinc-400 hover:text-[#4CAF50] hover:border-[#4CAF50]/50 cursor-pointer transition-all z-20 shadow-lg"
        >
          <Plus size={18} />
        </motion.div>

        {node.url ? (
          <div className="relative group overflow-hidden rounded-xl">
            <img src={node.url} alt={node.title} className="w-full aspect-video object-cover border border-white/5 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <Maximize size={24} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-white/10">
            <Box size={32} className="text-zinc-800" />
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-[3px] font-bold">创作提示词 / PROMPT</div>
          <textarea 
            rows={2}
            value={node.prompt || ''} 
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="输入提示词进行创作..."
            className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#4CAF50]/40 transition-all resize-none font-medium leading-relaxed"
          />
        </div>

        <div className="flex justify-between items-center mt-2 px-1">
          <div className="w-4 h-4 rounded-full border border-white/10 bg-zinc-950 -ml-7 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          </div>
          <div className="w-4 h-4 rounded-full border border-[#4CAF50]/30 bg-zinc-950 -mr-7 flex items-center justify-center handle-glow">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
          </div>
        </div>
      </div>
      
      {(node.type === 'creation' || node.type === 'prompt') && (
        <div className="px-5 py-3 bg-[#4CAF50]/5 border-t border-[#4CAF50]/10 flex items-center justify-between text-[10px] text-[#4CAF50] font-black tracking-[2px]">
          <span>READY TO RENDER</span>
          <Zap size={12} className="animate-pulse" />
        </div>
      )}
    </div>
  );
};

const NodeLink: React.FC<{ x1: number, y1: number, x2: number, y2: number }> = ({ x1, y1, x2, y2 }) => {
  const dx = Math.abs(x1 - x2) * 0.5;
  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  
  return (
    <g>
      <path d={path} stroke="rgba(255,255,255,0.05)" fill="none" strokeWidth="4" />
      <path d={path} stroke="#4CAF50" fill="none" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50" />
    </g>
  );
};

const ToolbarBtn: React.FC<{ icon: React.ReactNode, active?: boolean }> = ({ icon, active = false }) => {
  return (
    <button className={cn(
      "p-2 rounded-lg transition-all",
      active ? "bg-[#4CAF50] text-black" : "text-zinc-500 hover:text-white hover:bg-white/5"
    )}>
      {icon}
    </button>
  );
};
