import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Shield,
  Plane,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Navigation,
  Route,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { HudPanel } from '../components/common/HudPanel';
import { GlowButton } from '../components/common/GlowButton';
import { StatusBadge } from '../components/common/StatusBadge';
import type { Fence, FenceLevel, Patrol, Target } from '../types/game';

type EditMode = 'none' | 'draw-fence' | 'draw-path' | 'select';

interface DragState {
  type: 'vertex' | 'fence';
  fenceId: string;
  vertexIndex?: number;
  offsetX: number;
  offsetY: number;
}

export default function MapPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    detectedTargets,
    fences,
    addFence,
    removeFence,
    updateFenceVertex,
    moveFence,
    patrols,
    addPatrol,
    currentMission,
    selectedTarget,
    selectTarget,
    setTargetRiskPath,
  } = useGameStore();

  const [editMode, setEditMode] = useState<EditMode>('select');
  const [drawingVertices, setDrawingVertices] = useState<{ x: number; y: number }[]>([]);
  const [fenceName, setFenceName] = useState('');
  const [fenceLevel, setFenceLevel] = useState<FenceLevel>('medium');
  const [selectedFence, setSelectedFence] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [pathDrawing, setPathDrawing] = useState<{ targetId: string; points: { x: number; y: number }[] } | null>(null);

  const buildings = [
    { x: 20, y: 30, w: 15, h: 20, name: '商业中心' },
    { x: 60, y: 25, w: 12, h: 25, name: '科技园区' },
    { x: 40, y: 60, w: 18, h: 18, name: '住宅区' },
    { x: 75, y: 55, w: 14, h: 20, name: '工业区' },
    { x: 15, y: 70, w: 10, h: 15, name: '学校' },
    { x: 55, y: 80, w: 20, h: 12, name: '体育场馆' },
  ];

  const roads = [
    [{ x: 0, y: 50 }, { x: 100, y: 50 }],
    [{ x: 50, y: 0 }, { x: 50, y: 100 }],
    [{ x: 25, y: 0 }, { x: 25, y: 100 }],
    [{ x: 75, y: 0 }, { x: 75, y: 100 }],
    [{ x: 0, y: 25 }, { x: 100, y: 25 }],
    [{ x: 0, y: 75 }, { x: 100, y: 75 }],
  ];

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  }, []);

  const pointInPolygon = (x: number, y: number, vertices: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  const findNearestVertex = useCallback((x: number, y: number): { fenceId: string; vertexIndex: number } | null => {
    const threshold = 3;
    let nearest: { fenceId: string; vertexIndex: number; dist: number } | null = null;
    for (const fence of fences) {
      for (let i = 0; i < fence.vertices.length; i++) {
        const v = fence.vertices[i];
        const dist = Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2);
        if (dist < threshold && (!nearest || dist < nearest.dist)) {
          nearest = { fenceId: fence.id, vertexIndex: i, dist };
        }
      }
    }
    return nearest ? { fenceId: nearest.fenceId, vertexIndex: nearest.vertexIndex } : null;
  }, [fences]);

  const findFenceAtPoint = useCallback((x: number, y: number): Fence | null => {
    for (let i = fences.length - 1; i >= 0; i--) {
      const f = fences[i];
      if (f.vertices.length >= 3 && pointInPolygon(x, y, f.vertices)) {
        return f;
      }
    }
    return null;
  }, [fences]);

  const findTargetAtPoint = useCallback((x: number, y: number): Target | null => {
    for (const t of detectedTargets) {
      if (!t.detected) continue;
      const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2);
      if (dist < 5) return t;
    }
    return null;
  }, [detectedTargets]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (editMode === 'draw-fence') {
      setDrawingVertices([...drawingVertices, { x, y }]);
      return;
    }

    if (editMode === 'draw-path' && selectedTarget) {
      if (!pathDrawing) {
        setPathDrawing({ targetId: selectedTarget.id, points: [{ x: selectedTarget.x, y: selectedTarget.y }, { x, y }] });
      } else {
        setPathDrawing({ ...pathDrawing, points: [...pathDrawing.points, { x, y }] });
      }
      return;
    }

    const nearVertex = findNearestVertex(x, y);
    if (nearVertex) {
      setSelectedFence(nearVertex.fenceId);
      const fence = fences.find((f) => f.id === nearVertex.fenceId);
      if (fence) {
        const v = fence.vertices[nearVertex.vertexIndex];
        setDragState({
          type: 'vertex',
          fenceId: nearVertex.fenceId,
          vertexIndex: nearVertex.vertexIndex,
          offsetX: x - v.x,
          offsetY: y - v.y,
        });
      }
      return;
    }

    const fenceAtPoint = findFenceAtPoint(x, y);
    if (fenceAtPoint) {
      setSelectedFence(fenceAtPoint.id);
      const centroid = fenceAtPoint.vertices.reduce(
        (acc, v) => ({ x: acc.x + v.x / fenceAtPoint.vertices.length, y: acc.y + v.y / fenceAtPoint.vertices.length }),
        { x: 0, y: 0 }
      );
      setDragState({
        type: 'fence',
        fenceId: fenceAtPoint.id,
        offsetX: x - centroid.x,
        offsetY: y - centroid.y,
      });
      return;
    }

    const clickedTarget = findTargetAtPoint(x, y);
    if (clickedTarget) {
      selectTarget(clickedTarget);
    } else {
      setSelectedFence(null);
      selectTarget(null as unknown as Target);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (dragState && dragState.type === 'vertex' && dragState.vertexIndex !== undefined) {
      updateFenceVertex(dragState.fenceId, dragState.vertexIndex, x - dragState.offsetX, y - dragState.offsetY);
    } else if (dragState && dragState.type === 'fence') {
      const fence = fences.find((f) => f.id === dragState.fenceId);
      if (fence) {
        const centroid = fence.vertices.reduce(
          (acc, v) => ({ x: acc.x + v.x / fence.vertices.length, y: acc.y + v.y / fence.vertices.length }),
          { x: 0, y: 0 }
        );
        const deltaX = (x - dragState.offsetX) - centroid.x;
        const deltaY = (y - dragState.offsetY) - centroid.y;
        moveFence(dragState.fenceId, deltaX, deltaY);
      }
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawMap = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a1628');
      gradient.addColorStop(1, '#0f2744');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 100; i += 5) {
        ctx.beginPath();
        ctx.moveTo((i / 100) * width, 0);
        ctx.lineTo((i / 100) * width, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, (i / 100) * height);
        ctx.lineTo(width, (i / 100) * height);
        ctx.stroke();
      }

      roads.forEach((road) => {
        ctx.beginPath();
        ctx.moveTo((road[0].x / 100) * width, (road[0].y / 100) * height);
        ctx.lineTo((road[1].x / 100) * width, (road[1].y / 100) * height);
        ctx.strokeStyle = 'rgba(100, 120, 140, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();
      });

      buildings.forEach((building) => {
        const bx = (building.x / 100) * width;
        const by = (building.y / 100) * height;
        const bw = (building.w / 100) * width;
        const bh = (building.h / 100) * height;

        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(bx, by, bw, bh);

        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
        for (let wx = bx + 5; wx < bx + bw - 5; wx += 10) {
          for (let wy = by + 5; wy < by + bh - 5; wy += 12) {
            if (Math.random() > 0.4) {
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }

        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(building.name, bx + 4, by - 4);
      });

      detectedTargets.forEach((target) => {
        const path = target.riskPath;
        if (path && path.length >= 2 && (target.trueType === 'blackFlight' || target.type === 'blackFlight')) {
          ctx.beginPath();
          path.forEach((p, i) => {
            const px = (p.x / 100) * width;
            const py = (p.y / 100) * height;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          const arrowP = path[path.length - 1];
          const prevP = path[path.length - 2];
          if (arrowP && prevP) {
            const angle = Math.atan2(arrowP.y - prevP.y, arrowP.x - prevP.x);
            const ax = (arrowP.x / 100) * width;
            const ay = (arrowP.y / 100) * height;
            const arrowLen = 10;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - arrowLen * Math.cos(angle - Math.PI / 6), ay - arrowLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - arrowLen * Math.cos(angle + Math.PI / 6), ay - arrowLen * Math.sin(angle + Math.PI / 6));
            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });

      if (pathDrawing && pathDrawing.points.length >= 2) {
        ctx.beginPath();
        pathDrawing.points.forEach((p, i) => {
          const px = (p.x / 100) * width;
          const py = (p.y / 100) * height;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#ffa502';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        pathDrawing.points.forEach((p) => {
          const px = (p.x / 100) * width;
          const py = (p.y / 100) * height;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffa502';
          ctx.fill();
        });
      }

      fences.forEach((fence) => {
        if (fence.vertices.length < 2) return;

        ctx.beginPath();
        fence.vertices.forEach((v, i) => {
          const vx = (v.x / 100) * width;
          const vy = (v.y / 100) * height;
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        });
        ctx.closePath();

        ctx.fillStyle = fence.color + '20';
        ctx.fill();

        ctx.strokeStyle = fence.color;
        ctx.lineWidth = selectedFence === fence.id ? 3 : 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (selectedFence === fence.id) {
          fence.vertices.forEach((v, idx) => {
            const vx = (v.x / 100) * width;
            const vy = (v.y / 100) * height;
            ctx.beginPath();
            ctx.arc(vx, vy, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(vx, vy, 5, 0, Math.PI * 2);
            ctx.fillStyle = fence.color;
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(idx + 1), vx, vy + 3);
            ctx.textAlign = 'start';
          });
        } else {
          fence.vertices.forEach((v) => {
            const vx = (v.x / 100) * width;
            const vy = (v.y / 100) * height;
            ctx.beginPath();
            ctx.arc(vx, vy, 4, 0, Math.PI * 2);
            ctx.fillStyle = fence.color;
            ctx.fill();
          });
        }
      });

      if (editMode === 'draw-fence' && drawingVertices.length > 0) {
        ctx.beginPath();
        drawingVertices.forEach((v, i) => {
          const vx = (v.x / 100) * width;
          const vy = (v.y / 100) * height;
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        });
        if (mousePos) {
          const mx = (mousePos.x / 100) * width;
          const my = (mousePos.y / 100) * height;
          ctx.lineTo(mx, my);
        }
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        drawingVertices.forEach((v, idx) => {
          const vx = (v.x / 100) * width;
          const vy = (v.y / 100) * height;
          ctx.beginPath();
          ctx.arc(vx, vy, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(vx, vy, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffc107';
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(idx + 1), vx, vy + 3);
          ctx.textAlign = 'start';
        });
      }

      patrols.forEach((patrol) => {
        const px = (patrol.x / 100) * width;
        const py = (patrol.y / 100) * height;

        ctx.beginPath();
        ctx.arc(px, py, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 213, 115, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(px, py - 8);
        ctx.lineTo(px + 6, py + 4);
        ctx.lineTo(px - 6, py + 4);
        ctx.closePath();
        ctx.fillStyle = '#2ed573';
        ctx.fill();
      });

      detectedTargets.forEach((target) => {
        if (!target.detected) return;

        const tx = (target.x / 100) * width;
        const ty = (target.y / 100) * height;

        const color = target.type === 'blackFlight'
          ? '#ff4757'
          : target.type === 'bird'
          ? '#2ed573'
          : target.type === 'legitimate'
          ? '#00d4ff'
          : target.type === 'noise'
          ? '#a55eea'
          : '#94a3b8';

        if (target.type === 'blackFlight' || (target.type === 'unknown' && target.trueType === 'blackFlight')) {
          const pulseSize = 20 + Math.sin(Date.now() / 200) * 5;
          ctx.beginPath();
          ctx.arc(tx, ty, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(tx, ty, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (selectedTarget?.id === target.id) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(tx - 15, ty - 15, 30, 30);
          ctx.setLineDash([]);
        }

        if (target.type === 'blackFlight') {
          ctx.fillStyle = '#ff4757';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('⚠', tx - 4, ty - 12);
        }
      });

      if (mousePos && editMode === 'draw-fence') {
        const mx = (mousePos.x / 100) * width;
        const my = (mousePos.y / 100) * height;
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      requestAnimationFrame(drawMap);
    };

    drawMap();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [detectedTargets, fences, patrols, editMode, drawingVertices, selectedFence, selectedTarget, mousePos, pathDrawing]);

  const handleFinishFence = () => {
    if (drawingVertices.length < 3) return;

    const levelColors: Record<FenceLevel, string> = {
      low: '#2ed573',
      medium: '#ffc107',
      high: '#ff4757',
    };

    const newFence: Fence = {
      id: `fence-${Date.now()}`,
      name: fenceName || `围栏 ${fences.length + 1}`,
      level: fenceLevel,
      vertices: drawingVertices,
      color: levelColors[fenceLevel],
    };

    addFence(newFence);
    setEditMode('select');
    setDrawingVertices([]);
    setFenceName('');
  };

  const handleCancelFence = () => {
    setEditMode('select');
    setDrawingVertices([]);
    setFenceName('');
  };

  const handleFinishPath = () => {
    if (pathDrawing && pathDrawing.points.length >= 2 && selectedTarget) {
      setTargetRiskPath(selectedTarget.id, pathDrawing.points);
    }
    setPathDrawing(null);
    setEditMode('select');
  };

  const handleCancelPath = () => {
    setPathDrawing(null);
    setEditMode('select');
  };

  const handleAddPatrol = () => {
    if (!selectedTarget) return;

    const newPatrol: Patrol = {
      id: `patrol-${Date.now()}`,
      x: 50,
      y: 50,
      status: 'investigating',
      targetId: selectedTarget.id,
    };

    addPatrol(newPatrol);
  };

  if (!currentMission) {
    navigate('/');
    return null;
  }

  const blackFlightTargets = detectedTargets.filter(
    (t) => t.type === 'blackFlight' || (t.identified && t.trueType === 'blackFlight')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 p-4">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/identify')}
              className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-cyan-300">地图部署</h1>
              <p className="text-sm text-slate-400">
                布设电子围栏，标记风险路径
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant="danger" pulse={blackFlightTargets.length > 0}>
              <AlertTriangle size={12} className="mr-1" />
              黑飞目标: {blackFlightTargets.length}
            </StatusBadge>
            <StatusBadge variant="info">
              围栏: {fences.length}
            </StatusBadge>
            <StatusBadge variant="success">
              巡查队: {patrols.length}
            </StatusBadge>
            <button
              onClick={() => navigate('/dispose')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-400 text-red-300 hover:bg-red-400/30 transition-colors"
            >
              进入处置
              <Navigation size={16} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          <div className="col-span-9">
            <HudPanel title="城市空域地图" className="h-full">
              <div className="relative h-[calc(100%-40px)]">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ cursor: dragState ? 'grabbing' : editMode === 'draw-fence' || editMode === 'draw-path' ? 'crosshair' : 'grab' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />

                <div className="absolute top-3 left-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-red-400">黑飞无人机</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-green-400">鸟群</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-cyan-400">合法航班</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-purple-400">设备噪声</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                    <span className="flex-1 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
                    <span className="text-red-400">风险路径</span>
                  </div>
                </div>

                {editMode === 'draw-fence' && (
                  <div className="absolute top-3 right-3 px-3 py-2 bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-xs">
                    围栏绘制 - 点击添加顶点
                    <br />
                    已添加 {drawingVertices.length} 个顶点
                  </div>
                )}
                {editMode === 'draw-path' && (
                  <div className="absolute top-3 right-3 px-3 py-2 bg-orange-500/20 border border-orange-400 text-orange-300 text-xs">
                    路径标记 - 点击添加路径点
                    <br />
                    已添加 {pathDrawing?.points.length || 0} 个点
                  </div>
                )}
                {editMode === 'select' && (
                  <div className="absolute top-3 right-3 px-3 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs">
                    选择模式 - 拖拽顶点或围栏调整范围
                  </div>
                )}
              </div>
            </HudPanel>
          </div>

          <div className="col-span-3 space-y-4 overflow-y-auto">
            <HudPanel title="工具">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setEditMode(editMode === 'draw-fence' ? 'select' : 'draw-fence'); setPathDrawing(null); }}
                  className={`flex items-center justify-center gap-1 py-2 text-xs border transition-colors ${
                    editMode === 'draw-fence'
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                      : 'border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <Shield size={14} />
                  绘制围栏
                </button>
                <button
                  onClick={() => {
                    if (!selectedTarget) return;
                    setEditMode(editMode === 'draw-path' ? 'select' : 'draw-path');
                    setDrawingVertices([]);
                  }}
                  disabled={!selectedTarget}
                  className={`flex items-center justify-center gap-1 py-2 text-xs border transition-colors ${
                    editMode === 'draw-path'
                      ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                      : !selectedTarget
                      ? 'border-slate-700 text-slate-600 cursor-not-allowed'
                      : 'border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <Route size={14} />
                  标记路径
                </button>
              </div>
            </HudPanel>

            {editMode === 'draw-fence' ? (
              <HudPanel title="新建围栏">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="围栏名称"
                    value={fenceName}
                    onChange={(e) => setFenceName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">警戒级别</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as FenceLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setFenceLevel(level)}
                          className={`flex-1 py-1 text-xs border ${
                            fenceLevel === level
                              ? level === 'low'
                                ? 'bg-green-500/20 border-green-400 text-green-300'
                                : level === 'medium'
                                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                                : 'bg-red-500/20 border-red-400 text-red-300'
                              : 'border-slate-600 text-slate-500'
                          }`}
                        >
                          {level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GlowButton
                      variant="success"
                      className="flex-1 text-xs"
                      onClick={handleFinishFence}
                      disabled={drawingVertices.length < 3}
                    >
                      <Check size={14} className="inline mr-1" />
                      完成
                    </GlowButton>
                    <GlowButton
                      variant="danger"
                      className="flex-1 text-xs"
                      onClick={handleCancelFence}
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      取消
                    </GlowButton>
                  </div>
                </div>
              </HudPanel>
            ) : editMode === 'draw-path' ? (
              <HudPanel title="标记风险路径">
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    在地图上依次点击添加路径点，标记黑飞目标的预计飞行路线。
                  </p>
                  <div className="text-xs text-slate-300">
                    已添加路径点: <span className="text-orange-300">{pathDrawing?.points.length || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <GlowButton
                      variant="success"
                      className="flex-1 text-xs"
                      onClick={handleFinishPath}
                      disabled={!pathDrawing || pathDrawing.points.length < 2}
                    >
                      <Check size={14} className="inline mr-1" />
                      完成
                    </GlowButton>
                    <GlowButton
                      variant="danger"
                      className="flex-1 text-xs"
                      onClick={handleCancelPath}
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      取消
                    </GlowButton>
                  </div>
                </div>
              </HudPanel>
            ) : (
              <HudPanel title="电子围栏">
                <div className="space-y-3">
                  <div className="space-y-2 pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-slate-400">已有围栏（选中后可拖拽调整）</div>
                    {fences.length === 0 ? (
                      <div className="text-xs text-slate-600 text-center py-4">
                        暂无围栏，点击上方「绘制围栏」开始
                      </div>
                    ) : (
                      fences.map((fence) => (
                        <div
                          key={fence.id}
                          className={`p-2 text-xs border cursor-pointer transition-colors ${
                            selectedFence === fence.id
                              ? 'border-cyan-400 bg-cyan-500/10'
                              : 'border-slate-700/50 hover:border-slate-600'
                          }`}
                          onClick={() => setSelectedFence(fence.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield size={12} style={{ color: fence.color }} />
                              <span className="text-white">{fence.name}</span>
                            </div>
                            <span
                              className="text-xs"
                              style={{ color: fence.color }}
                            >
                              {fence.level === 'low'
                                ? '低级'
                                : fence.level === 'medium'
                                ? '中级'
                                : '高级'}
                            </span>
                          </div>
                          <div className="text-slate-500 mt-1">
                            {fence.vertices.length} 个顶点 · 拖拽可调整
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedFence && (
                    <button
                      onClick={() => {
                        removeFence(selectedFence);
                        setSelectedFence(null);
                      }}
                      className="w-full py-2 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} />
                      删除选中围栏
                    </button>
                  )}
                </div>
              </HudPanel>
            )}

            <HudPanel title="巡查队">
              <div className="space-y-3">
                <GlowButton
                  variant="success"
                  className="w-full flex items-center justify-center gap-2 text-xs"
                  onClick={handleAddPatrol}
                  disabled={!selectedTarget}
                >
                  <Plane size={14} />
                  派遣巡查队
                </GlowButton>

                {!selectedTarget && (
                  <p className="text-xs text-slate-500 text-center">
                    请先选择目标
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  {patrols.length === 0 ? (
                    <div className="text-xs text-slate-600 text-center py-4">
                      暂无巡查队
                    </div>
                  ) : (
                    patrols.map((patrol, index) => (
                      <div
                        key={patrol.id}
                        className="p-2 border border-slate-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white">
                            巡查队 #{index + 1}
                          </span>
                          <StatusBadge
                            variant={
                              patrol.status === 'investigating'
                                ? 'warning'
                                : patrol.status === 'patrolling'
                                ? 'success'
                                : 'info'
                            }
                          >
                            {patrol.status === 'investigating'
                              ? '调查中'
                              : patrol.status === 'patrolling'
                              ? '巡逻中'
                              : '待命'}
                          </StatusBadge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </HudPanel>

            {selectedTarget && (
              <HudPanel title="选中目标">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">识别类型:</span>
                    <span
                      className={
                        selectedTarget.type === 'blackFlight'
                          ? 'text-red-400 font-bold'
                          : selectedTarget.type === 'bird'
                          ? 'text-green-400'
                          : selectedTarget.type === 'legitimate'
                          ? 'text-cyan-400'
                          : selectedTarget.type === 'noise'
                          ? 'text-purple-400'
                          : 'text-slate-400'
                      }
                    >
                      {selectedTarget.type === 'blackFlight'
                        ? '黑飞无人机'
                        : selectedTarget.type === 'bird'
                        ? '鸟群'
                        : selectedTarget.type === 'legitimate'
                        ? '合法航班'
                        : selectedTarget.type === 'noise'
                        ? '设备噪声'
                        : '未识别'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">位置:</span>
                    <span className="text-white">
                      {selectedTarget.x.toFixed(1)}, {selectedTarget.y.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">高度:</span>
                    <span className="text-white">
                      {selectedTarget.altitude.toFixed(0)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">速度:</span>
                    <span className="text-white">
                      {selectedTarget.speed.toFixed(1)} m/s
                    </span>
                  </div>
                  {selectedTarget.riskPath && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">风险路径:</span>
                      <span className="text-orange-400">
                        已标记 {selectedTarget.riskPath.length} 个点
                      </span>
                    </div>
                  )}
                </div>
              </HudPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
