import { useState, useEffect, useRef } from 'react';
import { HudPanel } from '../common/HudPanel';
import { Camera, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { Target } from '../../types/game';

interface VideoPanelProps {
  targets: Target[];
  selectedTarget: Target | null;
  className?: string;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

const CAMERAS = [
  { id: 'cam-1', name: '摄像头 01', angle: '东北方向' },
  { id: 'cam-2', name: '摄像头 02', angle: '西北方向' },
  { id: 'cam-3', name: '摄像头 03', angle: '东南方向' },
  { id: 'cam-4', name: '摄像头 04', angle: '西南方向' },
];

export function VideoPanel({
  targets,
  selectedTarget,
  className,
  onFullscreen,
  isFullscreen,
}: VideoPanelProps) {
  const [activeCamera, setActiveCamera] = useState(CAMERAS[0]);
  const [zoom, setZoom] = useState(1);
  const [scanlinePos, setScanlinePos] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    let animationId: number;

    const drawScene = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a1628');
      gradient.addColorStop(0.5, '#0f2744');
      gradient.addColorStop(1, '#0a1628');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#1a2a3a';
      for (let i = 0; i < 8; i++) {
        const buildingX = (i / 8) * width + Math.random() * 20 - 10;
        const buildingHeight = height * 0.3 + Math.random() * height * 0.4;
        const buildingWidth = 30 + Math.random() * 40;
        ctx.fillRect(buildingX, height - buildingHeight, buildingWidth, buildingHeight);

        ctx.fillStyle = '#00d4ff33';
        for (let j = 0; j < 4; j++) {
          for (let k = 0; k < 8; k++) {
            if (Math.random() > 0.3) {
              ctx.fillRect(
                buildingX + 4 + k * 4,
                height - buildingHeight + 8 + j * 10,
                3,
                5
              );
            }
          }
        }
        ctx.fillStyle = '#1a2a3a';
      }

      targets.forEach((target) => {
        if (!target.detected) return;

        const tx = (target.x / 100) * width;
        const ty = (target.y / 100) * height * 0.7;

        const color = target.isBlackFlight
          ? '#ff4757'
          : target.type === 'bird'
          ? '#2ed573'
          : target.type === 'legitimate'
          ? '#00d4ff'
          : '#a55eea';

        ctx.save();
        ctx.translate(tx, ty);

        const size = target.type === 'legitimate' ? 12 : target.type === 'bird' ? 6 : 8;

        ctx.beginPath();
        ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + '20';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (target.type === 'blackFlight' || target.type === 'legitimate') {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-size * 1.5, 0);
          ctx.lineTo(size * 1.5, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -size * 0.8);
          ctx.lineTo(0, size * 0.8);
          ctx.stroke();
        }

        if (selectedTarget?.id === target.id) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-size - 8, -size - 8, (size + 8) * 2, (size + 8) * 2);
          ctx.setLineDash([]);

          ctx.fillStyle = '#fff';
          ctx.fillRect(-size - 8, -size - 18, 20, 12);
          ctx.fillStyle = '#000';
          ctx.font = '8px monospace';
          ctx.fillText('LOCK', -size - 6, -size - 9);
        }

        ctx.restore();
      });

      for (let i = 0; i < height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.stroke();
      }

      setScanlinePos((prev) => (prev + 1) % height);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.fillRect(0, scanlinePos, width, 20);

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      animationId = requestAnimationFrame(drawScene);
    };

    drawScene();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [targets, selectedTarget, scanlinePos]);

  return (
    <HudPanel
      title="视频监控"
      className={className}
      onFullscreen={onFullscreen}
      isFullscreen={isFullscreen}
      headerRight={
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs">REC</span>
        </div>
      }
    >
      <div className="relative aspect-video w-full bg-slate-950 rounded-sm overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-2 left-2 text-xs text-green-400 font-mono">
          <div>{activeCamera.name}</div>
          <div className="text-green-400/60">{activeCamera.angle}</div>
        </div>

        <div className="absolute top-2 right-2 text-xs text-green-400 font-mono">
          {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
        </div>

        <div className="absolute bottom-2 left-2 text-xs text-green-400/70 font-mono">
          ZOOM: {zoom.toFixed(1)}x
        </div>

        {selectedTarget && (
          <div className="absolute bottom-2 right-2 text-xs">
            <span className="text-red-400 font-mono">● 目标锁定</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {CAMERAS.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setActiveCamera(cam)}
              className={`px-2 py-1 text-xs border transition-colors ${
                activeCamera.id === cam.id
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                  : 'border-slate-600 text-slate-400 hover:border-cyan-500/50'
              }`}
            >
              {cam.id.replace('cam-', 'CAM')}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            className="p-1 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-400/10"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))}
            className="p-1 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-400/10"
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-cyan-400/60 flex items-center gap-2">
        <Camera size={12} />
        <span>在线摄像头: 4/4</span>
      </div>
    </HudPanel>
  );
}
