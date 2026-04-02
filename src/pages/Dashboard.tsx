import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Grid, List, FolderOpen, Plus, Bell, User, 
  ChevronDown, LayoutTemplate, MonitorPlay, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// --- 纯 CSS 文字标 (添加 onClick 支持) ---
const TextBrand = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
  <div className={cn("flex items-center gap-2 select-none cursor-pointer group", className)} onClick={onClick}>
    <div className="flex flex-col items-center justify-center border-r border-zinc-600/40 pr-2 py-0.5 group-hover:border-white/40 transition-colors">
      <span className="text-[10px] font-black leading-tight text-zinc-200 group-hover:text-white transition-colors">一</span>
      <span className="text-[10px] font-black leading-tight text-zinc-200 group-hover:text-white transition-colors">幀</span>
    </div>
    <span className="text-base font-light tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">studio</span>
  </div>
);

// --- 模拟后台数据 ---
const MOCK_PROJECTS = [
  { id: 'wuneng', title: '无能之力 (第1集)', thumb: 'https://picsum.photos/seed/cyber/600/400', time: '编辑于 1 小时前', type: '系列剧集' },
  { id: 'mila', title: '密勒日巴传奇_Demo', thumb: 'https://picsum.photos/seed/mila/600/400', time: '编辑于 1 天前', type: '电影项目' },
  { id: 'env', title: '赛博修仙场景测试', thumb: 'https://picsum.photos/seed/env/600/400', time: '编辑于 3 天前', type: '资产实验' },
  { id: 'char', title: '莫十一 角色定妆', thumb: 'https://picsum.photos/seed/char/600/400', time: '编辑于 1 周前', type: '角色开发' },
  { id: 'test1', title: '分镜预演_042', thumb: 'https://picsum.photos/seed/test1/600/400', time: '编辑于 1 个月前', type: '分镜序列' },
  { id: 'test2', title: '色彩情绪板', thumb: 'https://picsum.photos/seed/test2/600/400', time: '编辑于 1 个月前', type: '概念美术' },
];

export default function DashboardScene() {
  const navigate = useNavigate();
  
  // --- 交互状态管理区 ---
  const [activeTab, setActiveTab] = useState('personal'); // 个人/团队切换
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // 网格/列表切换
  const [lang, setLang] = useState<'CN' | 'EN'>('CN'); // 当前语言
  const [showLangMenu, setShowLangMenu] = useState(false); // 语言下拉菜单是否展开

  return (
    <div className="w-screen h-screen bg-[#050505] flex flex-col font-sans text-zinc-300 overflow-hidden">
      
      {/* 1. 顶部全局导航 */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0A0A0C] flex items-center justify-between px-6 shrink-0 relative z-50">
        <div className="flex items-center gap-8">
          {/* 左上角 Logo 绑定点击事件，瞬间跳回欢迎页 */}
          <TextBrand onClick={() => navigate('/')} />
          
          <nav className="flex items-center gap-6 text-[13px] font-medium">
            <div className="flex items-center gap-2 text-white cursor-pointer"><MonitorPlay size={14} /> 工作空间</div>
            <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"><LayoutTemplate size={14} /> 模板库</div>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-[10px] font-black tracking-widest text-zinc-500 border border-white/10 px-2 py-1 rounded bg-black/50">
            PRO PLAN
          </div>
          
          {/* 语言切换下拉菜单 (真实交互) */}
          <div className="relative">
            <div 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 text-[12px] text-zinc-400 cursor-pointer hover:text-white transition-colors"
            >
              {lang} <ChevronDown size={14} className={cn("transition-transform", showLangMenu && "rotate-180")} />
            </div>
            
            {/* 下拉浮层 */}
            <AnimatePresence>
              {showLangMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-3 w-32 bg-[#111] border border-white/10 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1 overflow-hidden"
                >
                  <div 
                    onClick={() => { setLang('CN'); setShowLangMenu(false); }} 
                    className={cn("px-4 py-2 text-[12px] cursor-pointer hover:bg-white/10 transition-colors", lang === 'CN' ? "text-white bg-white/5" : "text-zinc-400")}
                  >
                    中文 (CN)
                  </div>
                  <div 
                    onClick={() => { setLang('EN'); setShowLangMenu(false); }} 
                    className={cn("px-4 py-2 text-[12px] cursor-pointer hover:bg-white/10 transition-colors", lang === 'EN' ? "text-white bg-white/5" : "text-zinc-400")}
                  >
                    English (EN)
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />
          <Bell size={16} className="text-zinc-500 hover:text-white cursor-pointer transition-colors" />
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center cursor-pointer hover:border-white/50 transition-colors">
            <User size={14} className="text-zinc-300" />
          </div>
        </div>
      </header>

      {/* 2. 主体内容区 */}
      <main className="flex-1 flex flex-col overflow-y-auto px-10 py-8 scrollbar-hide relative z-0">
        
        <div className="flex items-center justify-between mb-8">
          {/* 左侧 Tabs */}
          <div className="flex items-center gap-6 border-b border-white/10">
            <div 
              className={cn("pb-3 text-sm font-bold cursor-pointer relative", activeTab === 'personal' ? "text-white" : "text-zinc-500 hover:text-zinc-300")}
              onClick={() => setActiveTab('personal')}
            >
              个人
              {activeTab === 'personal' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
            </div>
            <div 
              className={cn("pb-3 text-sm font-bold cursor-pointer relative", activeTab === 'team' ? "text-white" : "text-zinc-500 hover:text-zinc-300")}
              onClick={() => setActiveTab('team')}
            >
              团队项目
              {activeTab === 'team' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
            </div>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 focus-within:border-white/30 focus-within:bg-white/10 transition-colors w-64">
              <Search size={14} className="text-zinc-500" />
              <input type="text" placeholder={lang === 'CN' ? "搜索项目..." : "Search projects..."} className="bg-transparent border-none outline-none text-[12px] text-zinc-200 w-full placeholder:text-zinc-600" />
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white/10 text-[12px] text-zinc-300 transition-colors">
              {lang === 'CN' ? '显示全部' : 'All Types'} <ChevronDown size={14} />
            </div>
            
            {/* 视图排列切换小按钮 (核心交互) */}
            <div className="flex items-center gap-1 border border-white/10 rounded-md p-1 bg-black/40">
              <div 
                onClick={() => setViewMode('grid')}
                className={cn("p-1 rounded cursor-pointer transition-all", viewMode === 'grid' ? "bg-white/20 text-white shadow-sm" : "text-zinc-500 hover:text-white")}
              >
                <Grid size={14} />
              </div>
              <div 
                onClick={() => setViewMode('list')}
                className={cn("p-1 rounded cursor-pointer transition-all", viewMode === 'list' ? "bg-white/20 text-white shadow-sm" : "text-zinc-500 hover:text-white")}
              >
                <List size={14} />
              </div>
            </div>
            
            <div className="p-1.5 border border-white/10 rounded-md bg-black/40 text-zinc-500 hover:text-white cursor-pointer transition-colors">
              <FolderOpen size={16} />
            </div>

            <button className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-md text-[13px] font-bold hover:bg-zinc-200 transition-colors">
              <Plus size={16} /> {lang === 'CN' ? '新建项目' : 'New Project'}
            </button>
          </div>
        </div>

        {/* 3. 项目流 (根据 viewMode 动态切换网格或列表) */}
        <div className={cn("transition-all duration-500", viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" : "flex flex-col gap-4")}>
          
          {/* 新建项目卡片 */}
          <div className={cn(
            "bg-[#111111] border border-white/5 flex cursor-pointer hover:bg-[#1A1A1A] hover:border-white/20 transition-all group shadow-lg rounded-xl", 
            viewMode === 'grid' ? "flex-col items-center justify-center aspect-[4/3]" : "flex-row items-center px-6 h-24 gap-6"
          )}>
            <div className={cn("rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all", viewMode === 'grid' ? "w-12 h-12 mb-3" : "w-10 h-10")}>
              <Plus size={viewMode === 'grid' ? 24 : 20} className="text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-300">
              {lang === 'CN' ? '新建项目' : 'Create New Project'}
            </span>
          </div>

          {/* 渲染真实项目 */}
          {MOCK_PROJECTS.map((project) => (
            <div 
              key={project.id}
              onClick={() => navigate('/workspace')}
              className={cn(
                "bg-[#0F0F11] border border-white/5 flex overflow-hidden cursor-pointer hover:border-white/20 transition-all group shadow-lg rounded-xl", 
                viewMode === 'grid' ? "flex-col aspect-[4/3]" : "flex-row h-24 items-center"
              )}
            >
              <div className={cn("relative overflow-hidden shrink-0", viewMode === 'grid' ? "flex-1 w-full" : "w-48 h-full")}>
                <img 
                  src={project.thumb} 
                  alt={project.title} 
                  className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className={cn("absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity", viewMode === 'grid' ? "opacity-0 group-hover:opacity-100" : "opacity-40")} />
                
                {/* 列表模式下的左侧播放悬停小圆圈 */}
                {viewMode === 'list' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center"><ArrowRight size={14} className="text-white"/></div>
                  </div>
                )}
              </div>

              <div className={cn("bg-[#0F0F11] flex flex-col justify-center", viewMode === 'grid' ? "h-16 px-4 py-3 border-t border-white/5" : "flex-1 px-8 py-2 border-l border-white/5")}>
                <div className="flex items-center gap-3">
                  <h3 className="text-[14px] font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{project.title}</h3>
                  {viewMode === 'list' && <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-500">{project.type}</span>}
                </div>
                <p className="text-[11px] text-zinc-600 mt-1">{project.time}</p>
              </div>
              
              {/* 列表模式下的右侧额外操作区 */}
              {viewMode === 'list' && (
                <div className="px-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white">进入沙盘</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}