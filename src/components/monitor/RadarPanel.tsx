import { useEffect, useRef } from 'react';
import { HudPanel } from '../common/HudPanel';
import type { Target } from '../../types/game';

interface RadarPanelProps {
  targets: Target[];
  onTargetClick?: (target: Target) => void;
  className?: string;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function RadarPanel({
  targets,
  onTargetClick,
  className,
  onFullscreen,
  isFullscreen,
}: RadarPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const angleRef = useRef(0);

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

    const drawRadar = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 20;

      ctx.clearRect(0, 0, width, height);

      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        );
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      angleRef.current += 0.02;
      const scanAngle = angleRef.current;

      const sweepGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 255, 100, 0)');
      sweepGradient.addColorStop(0.8, 'rgba(0, 255, 100, 0.3)');
      sweepGradient.addColorStop(1, 'rgba(0, 255, 100, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, scanAngle - 0.3, scanAngle);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(scanAngle) * radius,
        centerY + Math.sin(scanAngle) * radius
      );
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      targets.forEach((target) => {
        if (!target.detected) return;

        const targetAngle = scanAngle - Math.atan2(target.y - 50, target.x - 50);
        const normalizedAngle = ((targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        if (normalizedAngle < 0.3 || normalizedAngle > Math.PI * 2 - 0.1) {
          const dx = target.x - 50;
          const dy = target.y - 50;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const targetRadius = (distance / 70) * radius;
          const angle = Math.atan2(dy, dx);

          const tx = centerX + Math.cos(angle) * targetRadius;
          const ty = centerY + Math.sin(angle) * targetRadius;

          const color = target.isBlackFlight ? '#ff4757' : target.type === 'bird' ? '#2ed573' : target.type === 'legitimate' ? '#00d4ff' : '#a55eea';

          const pulseSize = 3 + Math.sin(Date.now() / 300) * 2;
          ctx.beginPath();
          ctx.arc(tx, ty, pulseSize + 4, 0, Math.PI * 2);
          ctx.fillStyle = color + '30';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(tx, ty, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(tx, ty, pulseSize + 2, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();

      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
      ctx.fillText('N', centerX - 3, centerY - radius + 12);
      ctx.fillText('S', centerX - 3, centerY + radius - 4);
      ctx.fillText('W', centerX - radius + 4, centerY + 3);
      ctx.fillText('E', centerX + radius - 8, centerY + 3);

      animationRef.current = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targets]);

  return (
    <HudPanel
      title="雷达监测"
      className={className}
      onFullscreen={onFullscreen}
      isFullscreen={isFullscreen}
      headerRight={
        <span className="text-green-400 text-xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          在线
        </span>
      }
    >
      <div className="relative aspect-square w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            const clicked = targets.find((t) => {
              const dx = t.x - x;
              const dy = t.y - y;
              return Math.sqrt(dx * dx + dy * dy) < 8 && t.detected;
            });
            if (clicked && onTargetClick) {
              onTargetClick(clicked);
            }
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-cyan-400/70">
        <span>扫描频率: 12GHz</span>
        <span>范围: 5km</span>
        <span>目标: {targets.filter(t => t.detected).length}</span>
      </div>
    </HudPanel>
  );
}
