import { useEffect, useRef, useState } from 'react';
import { HudPanel } from '../common/HudPanel';
import type { Target } from '../../types/game';

interface SonogramPanelProps {
  targets: Target[];
  selectedTarget: Target | null;
  className?: string;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function SonogramPanel({
  targets,
  selectedTarget,
  className,
  onFullscreen,
  isFullscreen,
}: SonogramPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [selectedFreq, setSelectedFreq] = useState<number | null>(null);

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

    let offset = 0;

    const drawSonogram = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 10; i++) {
        const y = (height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.stroke();
      }

      for (let i = 0; i < 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.stroke();
      }

      offset += 1;
      if (offset > 10) offset = 0;

      const baseNoise = () => {
        return Math.random() * 0.1;
      };

      const waveformData: number[] = [];
      for (let x = 0; x < width; x++) {
        let amplitude = baseNoise();

        targets.forEach((target) => {
          if (!target.detected) return;
          const freq = target.soundFrequency;
          const targetY = height - (freq / 10) * height;
          const dist = Math.abs((x + offset) % 50 - 25);
          const widthFactor = Math.max(0, 1 - dist / 25);
          amplitude += widthFactor * target.signalStrength * 0.8;
        });

        if (selectedTarget) {
          const highlightFreq = selectedTarget.soundFrequency;
          const highlightY = height - (highlightFreq / 10) * height;
          const dist = Math.abs((x + offset) % 40 - 20);
          const widthFactor = Math.max(0, 1 - dist / 20);
          amplitude += widthFactor * 0.3;
        }

        waveformData.push(amplitude);
      }

      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x < width; x++) {
        const amp = waveformData[x];
        const y = height - amp * height * 0.8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const amp = waveformData[x];
        const y = height - amp * height * 0.8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (selectedFreq !== null) {
        const freqY = height - (selectedFreq / 10) * height;
        ctx.beginPath();
        ctx.moveTo(0, freqY);
        ctx.lineTo(width, freqY);
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ff4757';
        ctx.font = '10px monospace';
        ctx.fillText(`${selectedFreq.toFixed(1)} kHz`, 5, freqY - 5);
      }

      animationRef.current = requestAnimationFrame(drawSonogram);
    };

    drawSonogram();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targets, selectedTarget, selectedFreq]);

  return (
    <HudPanel
      title="声纹分析"
      className={className}
      onFullscreen={onFullscreen}
      isFullscreen={isFullscreen}
      headerRight={
        <span className="text-cyan-400 text-xs">
          频段: 20Hz - 20kHz
        </span>
      }
    >
      <div className="relative aspect-video w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = (e.clientY - rect.top) / rect.height;
            const freq = (1 - y) * 10;
            setSelectedFreq(freq);
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-cyan-400/70">
        <span>采样率: 44.1kHz</span>
        <span>灵敏度: 高</span>
        <span>可疑信号: {targets.filter(t => t.detected).length}</span>
      </div>
      {selectedTarget && (
        <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-sm">
          <div className="text-xs text-cyan-300">
            目标频率: {selectedTarget.soundFrequency.toFixed(1)} kHz
          </div>
          <div className="text-xs text-cyan-400/70">
            模式: {selectedTarget.soundPattern}
          </div>
        </div>
      )}
    </HudPanel>
  );
}
