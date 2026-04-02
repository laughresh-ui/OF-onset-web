import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Image as ImageIcon, Users, BookOpen, ArrowRight, Expand, Film, ChevronDown
} from 'lucide-react';

// --- 纯 CSS 文字标 ---
const TextBrand = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-2 select-none pointer-events-none ${className || ''}`}>
    <div className="flex flex-col items-center justify-center border-r border-zinc-600/40 pr-2 py-0.5">
      <span className="text-[10px] font-black leading-tight text-zinc-200">一</span>
      <span className="text-[10px] font-black leading-tight text-zinc-200">幀</span>
    </div>
    <span className="text-base font-light tracking-[0.2em] uppercase text-zinc-300">studio</span>
  </div>
);

const MILAREPA_ASSETS = {
  characters: [
    { id: 'c1', name: '青年密勒日巴', url: 'https://picsum.photos/seed/mila_dark/300/400' },
    { id: 'c2', name: '大译师玛尔巴', url: 'https://picsum.photos/seed/marpa/300/400' },
  ],
  scenes: [
    { id: 's1', name: '护马洞 (内火定)', url: 'https://picsum.photos/seed/cave/400/300' },
    { id: 's2', name: '九层碉楼', url: 'https://picsum.photos/seed/tower/400/300' },
  ]
};

export default function WorkspaceScene() {
  const navigate = useNavigate();
  const [drawers, setDrawers] = useState({ top: false, left: false, right: false, bottom: false });

  // 画布状态
  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 鼠标交互：仅在点击背景时触发拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'canvas-root' || (e.target as HTMLElement).id === 'grid-bg') {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale * scaleAdjust, 0.1), 5) }));
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-300 overflow-hidden font-sans select-none">
      
      {/* ================= 层级 1: 无限画布 (最底层) ================= */}
      <div 
        id="canvas-root"
        ref={canvasRef}
        className={`absolute inset-0 z-0 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div 
          id="grid-bg"
          className="canvas-dot-bg absolute top-1/2 left-1/2 w-[10000px] h-[10000px] transform-gpu origin-center pointer-events-none"
          style={{ transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-30">
            <TextBrand className="scale-150 mb-6 opacity-50" />
            <p className="text-[14px] font-mono tracking-[0.5em] text-white uppercase border border-white/10 px-8 py-3 rounded-lg">双击进入创作模式</p>
          </div>
        </div>
      </div>

      {/* ================= 层级 2: UI 覆盖层 (固定在屏幕，不随画布缩放) ================= */}
      
      {/* 顶部状态栏 & 剧本触发区 */}
      <header 
        className="fixed top-0 left-0 w-full h-14 z-[3000] border-b border-white/[0.05] bg-[#050505]/60 backdrop-blur-xl flex items-center justify-between px-6 transition-colors hover:bg-[#050505]/90"
        onMouseEnter={() => setDrawers(p => ({ ...p, top: true }))}
      >
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 cursor-pointer bg-transparent border-none">
            <LayoutDashboard size={16} /> <span className="text-[11px] font-bold uppercase tracking-widest">大厅</span>
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <TextBrand />
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
            <BookOpen size={14} className="text-[#4CAF50]" /> 《密勒日巴传记》 <ChevronDown size={12} />
          </div>
        </div>
      </header>

      {/* 侧边触发手柄 (实体化，不受画布缩放影响) */}
      <div 
        className="fixed top-1/2 -translate-y-1/2 left-0 w-1.5 h-32 bg-[#4CAF50]/40 hover:w-3 hover:bg-[#4CAF50] transition-all cursor-pointer z-[4000] rounded-r-full shadow-[4px_0_15px_rgba(76,175,80,0.3)]"
        onMouseEnter={() => setDrawers(p => ({ ...p, left: true }))}
      />
      <div 
        className="fixed top-1/2 -translate-y-1/2 right-0 w-1.5 h-32 bg-white/10 hover:w-3 hover:bg-white/40 transition-all cursor-pointer z-[4000] rounded-l-full"
        onMouseEnter={() => setDrawers(p => ({ ...p, right: true }))}
      />
      <div 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-[#4CAF50]/20 hover:h-3 hover:bg-[#4CAF50]/60 transition-all cursor-pointer z-[4000] rounded-t-full"
        onMouseEnter={() => setDrawers(p => ({ ...p, bottom: true }))}
      />

      {/* ================= 层级 3: 动态抽屉 (Glassmorphism) ================= */}
      
      <AnimatePresence>
        {/* 顶部剧本详情 */}
        {drawers.top && (
          <motion.div 
            initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
            className="fixed top-14 left-0 w-full glass z-[5000] border-b border-white/10 p-6 flex justify-center"
            onMouseLeave={() => setDrawers(p => ({ ...p, top: false }))}
          >
            <div className="max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black tracking-[0.3em] text-[#4CAF50] uppercase">Scenario / 第12场</span>
                <span className="text-[10px] text-zinc-500 hover:text-white cursor-pointer transition-colors underline underline-offset-4">编辑剧本</span>
              </div>
              <p className="text-[14px] text-zinc-200 leading-relaxed font-serif tracking-wide italic border-l-2 border-[#4CAF50]/50 pl-6 py-2">
                “暴风雪连续下了三天三夜，护马洞的洞口已被大雪封死。玛尔巴的考验如影随形，青年密勒日巴在极寒中端坐，体内的拙火逐渐燃起，照亮了斑驳的岩壁...”
              </p>
            </div>
          </motion.div>
        )}

        {/* 左侧角色库 (宽度收窄至 260px) */}
        {drawers.left && (
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            className="fixed top-14 bottom-0 left-0 w-[260px] glass z-[5000] border-r border-white/5 shadow-2xl flex flex-col"
            onMouseLeave={() => setDrawers(p => ({ ...p, left: false }))}
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Users size={14} className="text-[#4CAF50]" />
              <span className="text-[10px] font-black tracking-widest uppercase">角色设定库</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
              {MILAREPA_ASSETS.characters.map(char => (
                <div key={char.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group cursor-crosshair">
                  <img src={char.url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500" alt={char.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white tracking-wider">{char.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 右侧场景库 */}
        {drawers.right && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed top-14 bottom-0 right-0 w-[260px] glass z-[5000] border-l border-white/5 shadow-2xl flex flex-col"
            onMouseLeave={() => setDrawers(p => ({ ...p, right: false }))}
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <ImageIcon size={14} className="text-zinc-400" />
              <span className="text-[10px] font-black tracking-widest uppercase">环境资产库</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
              {MILAREPA_ASSETS.scenes.map(scene => (
                <div key={scene.id} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group cursor-crosshair">
                  <img src={scene.url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500" alt={scene.name} />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white tracking-widest bg-black/40 px-2 py-0.5 rounded">{scene.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 底部 OK 胶片带 */}
        {drawers.bottom && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 w-full h-[180px] glass z-[5000] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col"
            onMouseLeave={() => setDrawers(p => ({ ...p, bottom: false }))}
          >
            <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <Film size={14} className="text-zinc-500" />
                <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400">输出序列 (审批区)</span>
              </div>
              <button className="bg-white text-black px-4 py-1 rounded text-[10px] font-black uppercase tracking-widest hover:bg-[#4CAF50] hover:text-white transition-all">进入专属工作台 <ArrowRight size={12} className="inline ml-1" /></button>
            </div>
            <div className="flex-1 flex items-center gap-4 px-6 overflow-x-auto scrollbar-hide">
              {/* 这里就是你说的 X 轴，用于保存和审批 */}
              {[1,2,3,4,5].map(i => (
                <div key={i} className="relative h-[100px] aspect-video bg-zinc-900 rounded-md overflow-hidden border border-white/10 shrink-0 group cursor-pointer hover:border-[#4CAF50] transition-all shadow-lg">
                  <img src={`https://picsum.photos/seed/ok${i}/400/200`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt="Shot" />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#4CAF50]/90 text-[8px] font-black text-black rounded uppercase">OK</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}