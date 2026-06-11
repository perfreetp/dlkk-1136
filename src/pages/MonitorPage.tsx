import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, Volume2, Radio, Video, ArrowLeft, Play, Pause, SkipForward, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { RadarPanel } from '../components/monitor/RadarPanel';
import { SonogramPanel } from '../components/monitor/SonogramPanel';
import { SignalPanel } from '../components/monitor/SignalPanel';
import { VideoPanel } from '../components/monitor/VideoPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import type { Target, TargetType } from '../types/game';

function generateTarget(id: string, type: TargetType, isBlackFlight: boolean): Target {
  const baseX = 20 + Math.random() * 60;
  const baseY = 20 + Math.random() * 60;
  const direction = Math.random() * 360;

  const soundFreqByType: Record<TargetType, number> = {
    blackFlight: 3.5 + Math.random() * 2,
    bird: 1.5 + Math.random() * 3,
    legitimate: 0.5 + Math.random() * 1,
    noise: 5 + Math.random() * 3,
    unknown: 2 + Math.random() * 4,
  };

  const signalByType: Record<TargetType, number> = {
    blackFlight: 0.7 + Math.random() * 0.3,
    bird: 0.1 + Math.random() * 0.1,
    legitimate: 0.5 + Math.random() * 0.2,
    noise: 0.3 + Math.random() * 0.3,
    unknown: 0.3 + Math.random() * 0.4,
  };

  const speedByType: Record<TargetType, number> = {
    blackFlight: 2 + Math.random() * 2,
    bird: 1 + Math.random() * 2,
    legitimate: 4 + Math.random() * 3,
    noise: 0,
    unknown: 1 + Math.random() * 3,
  };

  const riskPath: { x: number; y: number }[] = [];
  if (type !== 'noise') {
    const rad = (direction * Math.PI) / 180;
    const speed = speedByType[type];
    let px = baseX;
    let py = baseY;
    for (let i = 0; i < 10; i++) {
      px += Math.cos(rad) * speed * 0.5;
      py += Math.sin(rad) * speed * 0.5;
      if (px >= 5 && px <= 95 && py >= 5 && py <= 95) {
        riskPath.push({ x: px, y: py });
      } else {
        break;
      }
    }
  }

  return {
    id,
    type: 'unknown',
    trueType: type,
    x: baseX,
    y: baseY,
    speed: speedByType[type],
    direction,
    altitude: 100 + Math.random() * 400,
    signalStrength: signalByType[type],
    soundFrequency: soundFreqByType[type],
    soundPattern: type === 'bird' ? '不规则' : type === 'noise' ? '固定频率' : '稳定规律',
    radarSignature: type === 'bird' ? '多个小目标' : type === 'legitimate' ? '大型目标' : '单个目标',
    videoDescription: type === 'blackFlight' ? '四轴飞行器' : type === 'bird' ? '鸟群' : type === 'legitimate' ? '固定翼飞机' : '无明显目标',
    isBlackFlight,
    detected: false,
    identified: false,
    detectedAt: 0,
    riskPath,
  };
}

export default function MonitorPage() {
  const navigate = useNavigate();
  const {
    currentMission,
    detectedTargets,
    selectedTarget,
    addTarget,
    selectTarget,
    updateTargetPosition,
    addEvent,
    elapsedTime,
    updateElapsedTime,
  } = useGameStore();

  const [isRunning, setIsRunning] = useState(true);
  const [fullscreenPanel, setFullscreenPanel] = useState<string | null>(null);

  useEffect(() => {
    if (!currentMission) {
      navigate('/');
      return;
    }

    const targetTypes: { type: TargetType; isBlack: boolean }[] = [];
    for (let i = 0; i < currentMission.blackFlightCount; i++) {
      targetTypes.push({ type: 'blackFlight', isBlack: true });
    }
    for (let i = 0; i < currentMission.targetCount - currentMission.blackFlightCount; i++) {
      const nonBlackTypes: TargetType[] = ['bird', 'legitimate', 'noise'];
      const randomType = nonBlackTypes[Math.floor(Math.random() * nonBlackTypes.length)];
      targetTypes.push({ type: randomType, isBlack: false });
    }

    targetTypes.forEach((t, index) => {
      setTimeout(() => {
        const now = Date.now();
        const target = generateTarget(
          `target-${index}`,
          t.type,
          t.isBlack
        );
        target.detected = true;
        target.detectedAt = now;
        addTarget(target);
        addEvent({
          id: `event-detect-${index}`,
          timestamp: now,
          type: 'detection',
          description: `发现可疑目标 #${index + 1}`,
          targetId: target.id,
        });
      }, (index + 1) * 3000 + Math.random() * 2000);
    });
  }, [currentMission, navigate, addTarget, addEvent]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      updateElapsedTime(elapsedTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, elapsedTime, updateElapsedTime]);

  useEffect(() => {
    if (!isRunning) return;

    const moveInterval = setInterval(() => {
      detectedTargets.forEach((target) => {
        if (!target.detected || target.disposalStatus === 'intercept') return;

        const rad = (target.direction * Math.PI) / 180;
        const dx = Math.cos(rad) * target.speed * 0.1;
        const dy = Math.sin(rad) * target.speed * 0.1;

        let newX = target.x + dx;
        let newY = target.y + dy;

        if (newX < 10 || newX > 90) {
          target.direction = 180 - target.direction;
          newX = Math.max(10, Math.min(90, newX));
        }
        if (newY < 10 || newY > 90) {
          target.direction = -target.direction;
          newY = Math.max(10, Math.min(90, newY));
        }

        updateTargetPosition(target.id, newX, newY);
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, [isRunning, detectedTargets, updateTargetPosition]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentMission) return null;

  const identifiedCount = detectedTargets.filter((t) => t.identified).length;
  const pendingCount = detectedTargets.filter((t) => t.detected && !t.identified).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 p-4">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-cyan-300">
                {currentMission.name} - 监测中
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>任务时间: {formatTime(elapsedTime)}</span>
                <StatusBadge variant="info">已发现 {detectedTargets.length} 个目标</StatusBadge>
                <StatusBadge variant="warning">待识别 {pendingCount} 个</StatusBadge>
                <StatusBadge variant="success">已识别 {identifiedCount} 个</StatusBadge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? '暂停' : '继续'}
            </button>

            <button
              onClick={() => navigate('/identify')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-400/30 transition-colors"
            >
              进入判读
              <SkipForward size={16} />
            </button>
          </div>
        </header>

        {pendingCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
            <AlertTriangle className="text-yellow-400" size={20} />
            <span className="text-yellow-300 text-sm">
              检测到 {pendingCount} 个可疑目标等待识别，请尽快进行判读！
            </span>
          </div>
        )}

        {fullscreenPanel ? (
          <div className="h-[calc(100vh-160px)]">
            {fullscreenPanel === 'radar' && (
              <RadarPanel
                targets={detectedTargets}
                onTargetClick={selectTarget}
                onFullscreen={() => setFullscreenPanel(null)}
                isFullscreen
                className="h-full"
              />
            )}
            {fullscreenPanel === 'sonogram' && (
              <SonogramPanel
                targets={detectedTargets}
                selectedTarget={selectedTarget}
                onFullscreen={() => setFullscreenPanel(null)}
                isFullscreen
                className="h-full"
              />
            )}
            {fullscreenPanel === 'signal' && (
              <SignalPanel
                targets={detectedTargets}
                selectedTarget={selectedTarget}
                onFullscreen={() => setFullscreenPanel(null)}
                isFullscreen
                className="h-full"
              />
            )}
            {fullscreenPanel === 'video' && (
              <VideoPanel
                targets={detectedTargets}
                selectedTarget={selectedTarget}
                onFullscreen={() => setFullscreenPanel(null)}
                isFullscreen
                className="h-full"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 h-[calc(100vh-160px)]">
            <RadarPanel
              targets={detectedTargets}
              onTargetClick={selectTarget}
              onFullscreen={() => setFullscreenPanel('radar')}
              className="h-full"
            />
            <SonogramPanel
              targets={detectedTargets}
              selectedTarget={selectedTarget}
              onFullscreen={() => setFullscreenPanel('sonogram')}
              className="h-full"
            />
            <SignalPanel
              targets={detectedTargets}
              selectedTarget={selectedTarget}
              onFullscreen={() => setFullscreenPanel('signal')}
              className="h-full"
            />
            <VideoPanel
              targets={detectedTargets}
              selectedTarget={selectedTarget}
              onFullscreen={() => setFullscreenPanel('video')}
              className="h-full"
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-cyan-500/20 p-3 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400">
              <Radar size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-300">{detectedTargets.length}</div>
              <div className="text-xs text-slate-500">雷达目标</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-green-500/20 p-3 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-400">
              <Volume2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">
                {detectedTargets.filter(t => t.soundFrequency > 2).length}
              </div>
              <div className="text-xs text-slate-500">高频信号</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-yellow-500/20 p-3 flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 text-yellow-400">
              <Radio size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">
                {detectedTargets.filter(t => t.signalStrength > 0.5).length}
              </div>
              <div className="text-xs text-slate-500">强信号源</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-purple-500/20 p-3 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400">
              <Video size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-300">4</div>
              <div className="text-xs text-slate-500">在线摄像头</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
