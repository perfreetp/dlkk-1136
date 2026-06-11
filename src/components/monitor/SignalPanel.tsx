import { useEffect, useRef } from 'react';
import { HudPanel } from '../common/HudPanel';
import type { Target } from '../../types/game';

interface SignalPanelProps {
  targets: Target[];
  selectedTarget: Target | null;
  className?: string;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function SignalPanel({
  targets,
  selectedTarget,
  className,
  onFullscreen,
  isFullscreen,
}: SignalPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

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

    const bands = [
      { freq: '2.4G', strength: 0.3, type: 'wifi' },
      { freq: '5.8G', strength: 0.5, type: 'drone' },
      { freq: '1.2G', strength: 0.2, type: 'video' },
      { freq: '433M', strength: 0.1, type: 'control' },
      { freq: '900M', strength: 0.4, type: 'control' },
      { freq: '2.4G', strength: 0.6, type: 'drone' },
      { freq: '5.2G', strength: 0.25, type: 'wifi' },
      { freq: '3.5G', strength: 0.15, type: 'unknown' },
    ];

    const drawSignal = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const barWidth = width / bands.length - 8;

      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.stroke();
      }

      bands.forEach((band, index) => {
        const x = index * (barWidth + 8) + 4;
        const time = Date.now() / 1000;
        const fluctuation = Math.sin(time * 2 + index) * 0.05;

        let strength = band.strength + fluctuation;

        if (selectedTarget && (band.type === 'drone' || band.type === 'control')) {
          strength = Math.min(1, strength + selectedTarget.signalStrength * 0.3);
        }

        targets.forEach((target) => {
          if (!target.detected) return;
          if (target.type === 'blackFlight' && band.type === 'drone') {
            strength = Math.min(1, strength + target.signalStrength * 0.1);
          }
          if (target.type === 'noise') {
            strength = Math.min(1, strength + 0.1);
          }
        });

        const barHeight = strength * height * 0.85;
        const barY = height - barHeight;

        const gradient = ctx.createLinearGradient(x, barY, x, height);
        if (strength > 0.7) {
          gradient.addColorStop(0, '#ff4757');
          gradient.addColorStop(1, '#ff475733');
        } else if (strength > 0.4) {
          gradient.addColorStop(0, '#ffc107');
          gradient.addColorStop(1, '#ffc10733');
        } else {
          gradient.addColorStop(0, '#00d4ff');
          gradient.addColorStop(1, '#00d4ff33');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, barY, barWidth, barHeight);

        ctx.fillStyle = '#00d4ff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(band.freq, x + barWidth / 2, height - 2);

        if (strength > 0.6) {
          ctx.fillStyle = strength > 0.7 ? '#ff4757' : '#ffc107';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(
            `${Math.round(strength * 100)}%`,
            x + barWidth / 2,
            barY - 4
          );
        }
      });

      const peakBand = bands.reduce((max, band) =>
        band.strength > max.strength ? band : max
      );
      const peakX = bands.indexOf(peakBand) * (barWidth + 8) + 4 + barWidth / 2;

      ctx.beginPath();
      ctx.moveTo(peakX, 0);
      ctx.lineTo(peakX, height - 20);
      ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      animationRef.current = requestAnimationFrame(drawSignal);
    };

    drawSignal();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targets, selectedTarget]);

  return (
    <HudPanel
      title="信号强度"
      className={className}
      onFullscreen={onFullscreen}
      isFullscreen={isFullscreen}
      headerRight={
        <span className="text-yellow-400 text-xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          监测中
        </span>
      }
    >
      <div className="relative aspect-video w-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div className="mt-2 flex justify-between text-xs text-cyan-400/70">
        <span>频段: 400M - 6GHz</span>
        <span>峰值: -30dBm</span>
        <span>干扰源: {targets.filter(t => t.detected && t.type === 'noise').length}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-sm" />
          <span className="text-red-400">强信号</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded-sm" />
          <span className="text-yellow-400">中信号</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
          <span className="text-cyan-400">弱信号</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-500 rounded-sm" />
          <span className="text-purple-400">未知</span>
        </div>
      </div>
    </HudPanel>
  );
}
