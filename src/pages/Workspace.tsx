import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  BookOpen,
  Film,
  AlignLeft,
  Video,
  Upload,
  Camera,
  Plus,
  Scale,
  X,
} from 'lucide-react';

// --- 文字标 ---
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
    { id: 'c1', name: '青年密勒日巴', url: 'https://picsum.photos/seed/mila_dark/400/225' },
    { id: 'c2', name: '大译师玛尔巴', url: 'https://picsum.photos/seed/marpa/400/225' },
    { id: 'monk1', name: '噶举派僧侣', url: 'https://picsum.photos/seed/monk1/400/225' },
  ],
  scenes: [
    { id: 's1', name: '护马洞 (内火定)', url: 'https://picsum.photos/seed/cave/400/225' },
    { id: 's2', name: '九层碉楼', url: 'https://picsum.photos/seed/tower/400/225' },
  ],
  script: {
    episodes: [{ scenes: [{ id: 'sh12s02', shot: 'Shot 02 / 拙火定', text: '“青年密勒日巴在极寒中端坐，拙火从脐下升起，体内的拙火逐渐燃起，照亮了斑驳的岩壁...”' }] }],
  },
};

type NodeType = 'text' | 'image_generation' | 'video';

type RefSlotTuple = [string | null, string | null, string | null];

export interface WorkspaceNode {
  id: string;
  type: NodeType;
  prompt: string;
  refSlots: RefSlotTuple;
  generatedUrl: string;
  width: number;
  x: number;
  y: number;
}

interface ConnectionEdge {
  id: string;
  from: string;
  to: string;
}

interface DraftConnection {
  fromNodeId: string;
  mouseX: number;
  mouseY: number;
}

function clientToWorld(clientX: number, clientY: number, t: { x: number; y: number; scale: number }) {
  const wx = (clientX - (t.x * t.scale + window.innerWidth / 2)) / t.scale + 5000;
  const wy = (clientY - (t.y * t.scale + window.innerHeight / 2)) / t.scale + 5000;
  return { wx, wy };
}

function nodeHeightFromWidth(w: number) {
  return (w * 9) / 16;
}

// --- 对话框离合辅助钩子 ---
function useElementPosition(ref: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const updatePosition = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    }
  }, [ref]);
  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);
  return { position, updatePosition };
}

// ================= 命令中心 (绝对锁死缩放，不随画布) =================
const CommandCenter = ({
  isOpen,
  onClose,
  onAddNode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/40 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="w-[320px] glass rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[12px] font-black tracking-widest uppercase text-zinc-100">添加节点</span>
            <X size={16} className="text-zinc-500 cursor-pointer hover:text-white transition-colors" onClick={onClose} />
          </div>
          <div className="p-3 flex flex-col gap-1">
            {[
              { icon: AlignLeft, title: '文本', desc: '脚本、广告词、品牌文案', type: 'text' as const },
              { icon: ImageIcon, title: '图片', desc: '风格库、生图模式', type: 'image_generation' as const },
              { icon: Video, title: '视频', desc: '剧本段落脚本生成', type: 'video' as const },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 group transition-all duration-300 w-full"
                onClick={() => onAddNode(item.type)}
              >
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#4CAF50]/10 group-hover:border-[#4CAF50] transition-all">
                  <item.icon size={18} className="text-zinc-400 group-hover:text-[#4CAF50]" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[13px] font-bold text-white tracking-wider block">{item.title}</span>
                  <p className="text-[10px] text-zinc-500 truncate">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ================= 节点组件 (外挂锚点、删除、缩放) =================
const NodeBox = ({
  node,
  isSelected,
  canvasScale,
  onSelect,
  onDragStart,
  onResizeStart,
  onDelete,
  boxRef,
  onConnectionOutPointerDown,
}: {
  node: WorkspaceNode;
  isSelected: boolean;
  canvasScale: number;
  onSelect: (id: string) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  boxRef: (el: HTMLDivElement | null) => void;
  onConnectionOutPointerDown: (e: React.PointerEvent, nodeId: string) => void;
}) => {
  return (
    <div
      ref={boxRef}
      data-node-box
      id={node.id}
      className={`absolute rounded-xl bg-[#0c0c0e]/95 glass shadow-[0_10px_30px_rgba(0,0,0,0.8)] border transition-colors ${
        isSelected ? 'border-[#4CAF50]' : 'border-white/10 hover:border-white/30'
      }`}
      style={{
        width: node.width,
        zIndex: isSelected ? 50 : 10,
        left: node.x,
        top: node.y,
        aspectRatio: '16/9',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onMouseDown={onDragStart}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full h-full rounded-lg overflow-hidden shrink-0 bg-zinc-900 group">
        {node.generatedUrl ? (
          <img src={node.generatedUrl} className="w-full h-full object-cover" alt="Generated" />
        ) : (
          <div className="w-full h-full border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-600">
            <Upload
              size={20 * canvasScale}
              className="mb-2 opacity-50"
              style={{ scale: Math.max(0.5, canvasScale) }}
            />
            <span
              className="text-[10px] uppercase font-bold tracking-widest"
              style={{ display: canvasScale < 0.5 ? 'none' : 'block' }}
            >
              等待生成...
            </span>
          </div>
        )}

        {isSelected && (
          <button
            type="button"
            className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-black/60 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-[#4CAF50]/80 hover:text-white cursor-se-resize"
            onMouseDown={onResizeStart}
          >
            <Scale size={14} />
          </button>
        )}
      </div>

      {/* 左侧入边锚点 (-) */}
      <button
        type="button"
        data-connection-in={node.id}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#121214] border border-zinc-600 flex items-center justify-center text-zinc-300 hover:border-white hover:shadow-[0_0_12px_rgba(255,255,255,0.35)] transition-all shadow-lg z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[14px] font-light leading-none pb-0.5">−</span>
      </button>

      {/* 右侧出边锚点 (+) */}
      <button
        type="button"
        data-connection-out={node.id}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#121214] border border-zinc-600 flex items-center justify-center text-zinc-300 hover:border-white hover:shadow-[0_0_12px_rgba(255,255,255,0.35)] transition-all shadow-lg z-20 cursor-crosshair"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => onConnectionOutPointerDown(e, node.id)}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>

      {isSelected && (
        <button
          type="button"
          className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-red-500/90 border border-red-400 flex items-center justify-center text-white hover:bg-red-500 hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all z-20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          <X size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};

// ================= 离合对话框 (Portal + 固定 440px，反缩放由 body 挂载保证 1:1) =================
const FloatingPromptDialog = ({
  nodeRef,
  node,
  updateNode,
}: {
  nodeRef: RefObject<HTMLDivElement | null>;
  node: WorkspaceNode;
  updateNode: (id: string, data: Partial<WorkspaceNode>) => void;
}) => {
  const { position, updatePosition } = useElementPosition(nodeRef);
  useEffect(() => {
    const observer = new MutationObserver(updatePosition);
    if (nodeRef.current) observer.observe(nodeRef.current, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [nodeRef, updatePosition]);

  const setSlot = (index: 0 | 1 | 2, url: string | null) => {
    const next: RefSlotTuple = [...node.refSlots] as RefSlotTuple;
    next[index] = url;
    updateNode(node.id, { refSlots: next });
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed z-[5500] pointer-events-auto"
        style={{
          width: 440,
          maxWidth: 440,
          left: position.x + position.width / 2 - 220,
          top: position.y + position.height + 20,
          transform: 'none',
        }}
      >
        <div className="rounded-xl bg-[#0c0c0e]/95 glass shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-[#4CAF50]/50 p-4 flex flex-col gap-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 px-0.5">
            参考图（1×3 · 角色 / 场景）
          </p>
          <div className="flex gap-2">
            {([0, 1, 2] as const).map((i) => (
              <div
                key={i}
                className={`relative h-14 w-14 shrink-0 rounded-md overflow-hidden border ${
                  node.refSlots[i]
                    ? 'border-white/25 shadow-md'
                    : 'border-dashed border-zinc-600 bg-black/40 flex items-center justify-center'
                }`}
              >
                {node.refSlots[i] ? (
                  <>
                    <img src={node.refSlots[i]!} className="w-full h-full object-cover" alt="" />
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/70 text-zinc-200 flex items-center justify-center text-[10px] hover:bg-red-500/90"
                      onClick={() => setSlot(i, null)}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <span className="text-[8px] text-zinc-600 text-center px-1">空</span>
                )}
              </div>
            ))}
          </div>

          <div className="relative rounded-lg bg-black/40 border border-white/10 p-3 flex gap-3 min-h-[7rem]">
            <textarea
              className="flex-1 text-[14px] text-zinc-200 bg-transparent outline-none resize-none scrollbar-hide min-h-[5.5rem] font-serif"
              placeholder="描述你要生成的最终画面..."
              value={node.prompt || ''}
              onChange={(e) => updateNode(node.id, { prompt: e.target.value })}
            />
            <button
              type="button"
              className="absolute bottom-3 right-3 h-10 px-4 rounded-lg bg-[#4CAF50] text-black font-black uppercase text-[11px] flex items-center justify-center hover:bg-[#45a049] shadow-[0_0_15px_rgba(76,175,80,0.4)] transition-all"
            >
              生成节点
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 bg-white text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded flex-shrink-0">
              <Film size={12} className="shrink-0" />
              <span>添加到输出序列</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/30 hover:bg-white/10 border border-white/5 text-zinc-300 text-[10px]"
              >
                <AlignLeft size={12} />
                风格
              </button>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/30 hover:bg-white/10 border border-white/5 text-zinc-300 text-[10px]"
              >
                <Camera size={12} />
                摄影机
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

function bezierPath(x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.max(80, Math.abs(x1 - x0) * 0.45);
  return `M ${x0} ${y0} C ${x0 + dx} ${y0}, ${x1 - dx} ${y1}, ${x1} ${y1}`;
}

// ================= 主沙盘 =================
export default function WorkspaceScene() {
  const navigate = useNavigate();
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<WorkspaceNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const nodeRefsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedNodeDomRef = useRef<HTMLDivElement | null>(null);

  const [connections, setConnections] = useState<ConnectionEdge[]>([]);
  const [draftConnection, setDraftConnection] = useState<DraftConnection | null>(null);
  const draftConnectionRef = useRef<DraftConnection | null>(null);
  const isDraggingConnectionRef = useRef(false);

  useEffect(() => {
    draftConnectionRef.current = draftConnection;
  }, [draftConnection]);

  useLayoutEffect(() => {
    if (selectedNodeId && nodeRefsRef.current[selectedNodeId]) {
      selectedNodeDomRef.current = nodeRefsRef.current[selectedNodeId];
    } else {
      selectedNodeDomRef.current = null;
    }
  }, [selectedNodeId, nodes]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * (e.deltaY > 0 ? 0.9 : 1.1), 0.2), 2.0),
      }));
    } else {
      setTransform((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const nodeDragStateRef = useRef({ draggingNodeId: null as string | null, dragOffsetX: 0, dragOffsetY: 0 });
  const nodeResizeStateRef = useRef({
    resizingNodeId: null as string | null,
    resizeStartX: 0,
    resizeStartPhysicalWidth: 0,
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        }));
      } else if (nodeDragStateRef.current.draggingNodeId) {
        const { draggingNodeId, dragOffsetX, dragOffsetY } = nodeDragStateRef.current;
        const { wx, wy } = clientToWorld(e.clientX, e.clientY, transform);
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeId ? { ...n, x: wx - dragOffsetX, y: wy - dragOffsetY } : n
          )
        );
      } else if (nodeResizeStateRef.current.resizingNodeId) {
        const { resizingNodeId, resizeStartX, resizeStartPhysicalWidth } = nodeResizeStateRef.current;
        const deltaPhysicalWidth = (e.clientX - resizeStartX) / transform.scale;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === resizingNodeId
              ? { ...n, width: Math.min(Math.max(200, resizeStartPhysicalWidth + deltaPhysicalWidth), 800) }
              : n
          )
        );
      } else if (isDraggingConnectionRef.current) {
        const { wx, wy } = clientToWorld(e.clientX, e.clientY, transform);
        setDraftConnection((prev) => {
          if (!prev) return null;
          const next = { ...prev, mouseX: wx, mouseY: wy };
          draftConnectionRef.current = next;
          return next;
        });
      }
    },
    [isPanning, transform]
  );

  const finalizeConnectionDrag = useCallback((clientX: number, clientY: number) => {
    const draft = draftConnectionRef.current;
    if (!draft || !isDraggingConnectionRef.current) return;
    const el = document.elementFromPoint(clientX, clientY);
    const target = el?.closest('[data-connection-in]') as HTMLElement | null;
    const toId = target?.getAttribute('data-connection-in');
    if (toId && toId !== draft.fromNodeId) {
      setConnections((prev) => {
        if (prev.some((c) => c.from === draft.fromNodeId && c.to === toId)) return prev;
        return [...prev, { id: `conn_${Date.now()}`, from: draft.fromNodeId, to: toId }];
      });
    }
    setDraftConnection(null);
    draftConnectionRef.current = null;
    isDraggingConnectionRef.current = false;
  }, []);

  const handleGlobalMouseUp = useCallback(
    (e: MouseEvent) => {
      setIsPanning(false);
      nodeDragStateRef.current = { draggingNodeId: null, dragOffsetX: 0, dragOffsetY: 0 };
      nodeResizeStateRef.current = { resizingNodeId: null, resizeStartX: 0, resizeStartPhysicalWidth: 0 };
      if (isDraggingConnectionRef.current) {
        finalizeConnectionDrag(e.clientX, e.clientY);
      }
    },
    [finalizeConnectionDrag]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseMove, handleGlobalMouseUp]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.id === 'canvas-root' || t.id === 'grid-bg') {
      setSelectedNodeId(null);
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-node-box]')) return;
    if (t.id !== 'canvas-root' && t.id !== 'grid-bg' && !t.closest('#grid-bg')) return;
    setCommandCenterOpen(true);
  };

  const handleAddNode = (type: NodeType) => {
    setCommandCenterOpen(false);
    const { wx, wy } = clientToWorld(window.innerWidth / 2, window.innerHeight / 2, transform);
    const width = 420;
    const h = nodeHeightFromWidth(width);
    const newNode: WorkspaceNode = {
      id: `node_${Date.now()}`,
      type,
      prompt: '',
      refSlots: [null, null, null],
      generatedUrl: '',
      width,
      x: wx - width / 2,
      y: wy - h / 2,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    delete nodeRefsRef.current[id];
  };

  const updateNode = (id: string, data: Partial<WorkspaceNode>) =>
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)));

  const handleReferenceAsset = (asset: { url: string }) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNodeId) return n;
        const slots: RefSlotTuple = [...n.refSlots] as RefSlotTuple;
        const empty = slots.findIndex((s) => !s);
        if (empty >= 0) {
          slots[empty as 0 | 1 | 2] = asset.url;
        } else {
          slots[0] = slots[1];
          slots[1] = slots[2];
          slots[2] = asset.url;
        }
        return { ...n, refSlots: slots };
      })
    );
  };

  const anchorOutWorld = (n: WorkspaceNode) => {
    const h = nodeHeightFromWidth(n.width);
    return { x: n.x + n.width + 12, y: n.y + h / 2 };
  };

  const anchorInWorld = (n: WorkspaceNode) => {
    const h = nodeHeightFromWidth(n.width);
    return { x: n.x - 12, y: n.y + h / 2 };
  };

  const onConnectionOutPointerDown = (e: React.PointerEvent<HTMLButtonElement>, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const { x, y } = anchorOutWorld(node);
    isDraggingConnectionRef.current = true;
    const next: DraftConnection = { fromNodeId: nodeId, mouseX: x, mouseY: y };
    draftConnectionRef.current = next;
    setDraftConnection(next);
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-300 overflow-hidden font-sans select-none flex">
      <div
        ref={canvasRef}
        id="canvas-root"
        className={`absolute inset-0 z-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleCanvasDoubleClick}
      >
        <div
          id="grid-bg"
          className="canvas-dot-bg absolute top-1/2 left-1/2 w-[10000px] h-[10000px] transform-gpu origin-center"
          style={{
            transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
          }}
        >
          <svg className="absolute inset-0 pointer-events-none overflow-visible z-0" aria-hidden>
            <defs>
              <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.55" />
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#e4e4e7" floodOpacity="0.25" />
              </filter>
            </defs>
            {connections.map((conn) => {
              const fromNode = nodes.find((n) => n.id === conn.from);
              const toNode = nodes.find((n) => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              const s = anchorOutWorld(fromNode);
              const t = anchorInWorld(toNode);
              return (
                <path
                  key={conn.id}
                  d={bezierPath(s.x, s.y, t.x, t.y)}
                  stroke="rgba(250,250,250,0.92)"
                  strokeWidth={3}
                  fill="none"
                  filter="url(#edge-glow)"
                  className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                />
              );
            })}
            {draftConnection &&
              (() => {
                const fromNode = nodes.find((n) => n.id === draftConnection.fromNodeId);
                if (!fromNode) return null;
                const s = anchorOutWorld(fromNode);
                return (
                  <path
                    d={bezierPath(s.x, s.y, draftConnection.mouseX, draftConnection.mouseY)}
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={2.5}
                    strokeDasharray="6 6"
                    fill="none"
                    filter="url(#edge-glow)"
                    className="opacity-90"
                  />
                );
              })()}
          </svg>

          <div className="relative z-[1] w-full h-full">
            {nodes.map((node) => (
              <NodeBox
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                canvasScale={transform.scale}
                onSelect={setSelectedNodeId}
                onDelete={handleDeleteNode}
                onDragStart={(e) => {
                  if (selectedNodeId === node.id) {
                    e.stopPropagation();
                    const { wx, wy } = clientToWorld(e.clientX, e.clientY, transform);
                    nodeDragStateRef.current = {
                      draggingNodeId: node.id,
                      dragOffsetX: wx - node.x,
                      dragOffsetY: wy - node.y,
                    };
                  }
                }}
                onResizeStart={(e) => {
                  e.stopPropagation();
                  nodeResizeStateRef.current = {
                    resizingNodeId: node.id,
                    resizeStartX: e.clientX,
                    resizeStartPhysicalWidth: node.width,
                  };
                }}
                onConnectionOutPointerDown={onConnectionOutPointerDown}
                boxRef={(el) => {
                  nodeRefsRef.current[node.id] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedNode && (
        <FloatingPromptDialog nodeRef={selectedNodeDomRef} node={selectedNode} updateNode={updateNode} />
      )}

      {nodes.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-[1000]">
          <TextBrand className="scale-150 mb-8 opacity-40" />
          <p className="text-[14px] font-mono tracking-[0.5em] text-white uppercase border border-white/10 bg-black/40 backdrop-blur-sm px-8 py-3 rounded-lg opacity-80">
            双击画布建立节点
          </p>
        </div>
      )}

      <header className="fixed top-0 left-0 w-full h-14 z-[4000] border-b border-white/[0.05] bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 bg-transparent border-none shrink-0"
          >
            <LayoutDashboard size={16} />{' '}
            <span className="text-[11px] font-bold uppercase tracking-widest">大厅</span>
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <TextBrand className="shrink-0" />
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <BookOpen size={14} className="text-[#4CAF50]" />{' '}
            <span className="font-bold">《密勒日巴传记》</span>
            <span className="px-2 py-0.5 bg-white/10 rounded uppercase font-mono tracking-widest">
              {MILAREPA_ASSETS.script.episodes[0].scenes[0].shot}
            </span>
          </div>
        </div>
      </header>

      <div
        className={`fixed top-14 bottom-0 left-0 glass z-[3000] border-r border-white/5 transition-all duration-300 ease-out flex flex-col ${
          hoverLeft ? 'w-[260px]' : 'w-[80px]'
        }`}
        onMouseEnter={() => setHoverLeft(true)}
        onMouseLeave={() => setHoverLeft(false)}
      >
        <div className="h-12 border-b border-white/5 flex items-center justify-center shrink-0">
          <Users size={16} className={hoverLeft ? 'text-[#4CAF50] mr-2' : 'text-zinc-400'} />
          {hoverLeft && (
            <span className="text-[10px] font-black tracking-widest uppercase truncate">角色资产库</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-3">
          {MILAREPA_ASSETS.characters.map((char) => (
            <div
              key={char.id}
              role="button"
              tabIndex={0}
              className={`relative rounded overflow-hidden border border-white/10 transition-all duration-300 shrink-0 bg-zinc-900 cursor-pointer group aspect-video ${
                selectedNodeId ? 'hover:border-[#4CAF50] hover:scale-105 shadow-xl' : ''
              }`}
              onClick={() => handleReferenceAsset(char)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleReferenceAsset(char);
              }}
            >
              <img
                src={char.url}
                className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500"
                alt={char.name}
              />
              {hoverLeft && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white tracking-wider truncate right-2">
                    {char.name}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`fixed top-14 bottom-0 right-0 glass z-[3000] border-l border-white/5 transition-all duration-300 ease-out flex flex-col ${
          hoverRight ? 'w-[260px]' : 'w-[80px]'
        }`}
        onMouseEnter={() => setHoverRight(true)}
        onMouseLeave={() => setHoverRight(false)}
      >
        <div className="h-12 border-b border-white/5 flex items-center justify-center shrink-0">
          <ImageIcon size={16} className={hoverRight ? 'text-zinc-200 mr-2' : 'text-zinc-500'} />
          {hoverRight && (
            <span className="text-[10px] font-black tracking-widest uppercase truncate">环境资产库</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-3">
          {MILAREPA_ASSETS.scenes.map((scene) => (
            <div
              key={scene.id}
              role="button"
              tabIndex={0}
              className={`relative rounded overflow-hidden border border-white/10 transition-all duration-300 shrink-0 bg-zinc-900 cursor-pointer group aspect-video ${
                selectedNodeId ? 'hover:border-[#4CAF50] hover:scale-105 shadow-xl' : ''
              }`}
              onClick={() => handleReferenceAsset(scene)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleReferenceAsset(scene);
              }}
            >
              <img
                src={scene.url}
                className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500"
                alt={scene.name}
              />
              {hoverRight && (
                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white tracking-widest bg-black/60 px-1.5 py-0.5 rounded truncate max-w-[90%]">
                  {scene.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <CommandCenter
        isOpen={commandCenterOpen}
        onClose={() => setCommandCenterOpen(false)}
        onAddNode={handleAddNode}
      />
    </div>
  );
}
