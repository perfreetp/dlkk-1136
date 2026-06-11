import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Clock,
  AlertTriangle,
  Users,
  FileCheck,
  Star,
  ArrowLeft,
  RotateCcw,
  Home,
  ChevronRight,
  Target,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useGameStore, usePlayerStore } from '../store/useGameStore';
import { HudPanel } from '../components/common/HudPanel';
import { GlowButton } from '../components/common/GlowButton';
import { StatusBadge } from '../components/common/StatusBadge';

export default function ReviewPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { score, currentMission, events, resetGame, detectedTargets } = useGameStore();
  const { addExperience, addScore, addMissionResult } = usePlayerStore();

  useEffect(() => {
    if (score && currentMission) {
      addExperience(Math.floor(score.total * 2));
      addScore(score.total);

      const result = {
        id: `result-${Date.now()}`,
        missionId: currentMission.id,
        missionName: currentMission.name,
        score,
        completedAt: Date.now(),
      };
      addMissionResult(result);
    }
  }, [score, currentMission, addExperience, addScore, addMissionResult]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !score) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 40;

    const dimensions = [
      { label: '误报率', value: 100 - score.falseAlarmRate, angle: -Math.PI / 2 },
      { label: '响应时间', value: 100 - score.responseTime, angle: 0 },
      { label: '群众影响', value: 100 - score.publicImpact, angle: Math.PI / 2 },
      { label: '证据完整度', value: score.evidenceCompleteness, angle: Math.PI },
    ];

    const drawRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      dimensions.forEach((dim) => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(dim.angle) * radius,
          centerY + Math.sin(dim.angle) * radius
        );
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.stroke();
      });

      ctx.beginPath();
      dimensions.forEach((dim, i) => {
        const x = centerX + Math.cos(dim.angle) * radius * (dim.value / 100);
        const y = centerY + Math.sin(dim.angle) * radius * (dim.value / 100);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      dimensions.forEach((dim) => {
        const x = centerX + Math.cos(dim.angle) * radius * (dim.value / 100);
        const y = centerY + Math.sin(dim.angle) * radius * (dim.value / 100);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
      });

      dimensions.forEach((dim) => {
        const labelX = centerX + Math.cos(dim.angle) * (radius + 25);
        const labelY = centerY + Math.sin(dim.angle) * (radius + 25);
        ctx.fillStyle = '#00d4ff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dim.label, labelX, labelY);
      });

      const gradeColors: Record<string, string> = {
        S: '#ffc107',
        A: '#2ed573',
        B: '#00d4ff',
        C: '#a55eea',
        D: '#ff4757',
      };

      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = gradeColors[score.grade] || '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(score.grade, centerX, centerY);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('评级', centerX, centerY + 28);
    };

    drawRadar();
  }, [score]);

  const handleReturnHome = () => {
    resetGame();
    navigate('/');
  };

  const handleRetry = () => {
    if (currentMission) {
      resetGame();
      navigate('/');
      setTimeout(() => {
        // 重新开始同任务需要更多逻辑，这里简化处理
      }, 100);
    }
  };

  if (!score || !currentMission) {
    navigate('/');
    return null;
  }

  const gradeColors: Record<string, string> = {
    S: 'text-yellow-400',
    A: 'text-green-400',
    B: 'text-cyan-400',
    C: 'text-purple-400',
    D: 'text-red-400',
  };

  const gradeLabels: Record<string, string> = {
    S: '完美',
    A: '优秀',
    B: '良好',
    C: '合格',
    D: '不合格',
  };

  const scoreItems = [
    {
      label: '误报率',
      value: `${score.falseAlarmRate}%`,
      description: '越低越好',
      icon: <AlertTriangle size={20} />,
      color: score.falseAlarmRate < 20 ? 'text-green-400' : score.falseAlarmRate < 50 ? 'text-yellow-400' : 'text-red-400',
      bgColor: score.falseAlarmRate < 20 ? 'bg-green-500/10 border-green-500/30' : score.falseAlarmRate < 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30',
    },
    {
      label: '响应时间',
      value: `${score.responseTime}s`,
      description: '越短越好',
      icon: <Clock size={20} />,
      color: score.responseTime < 30 ? 'text-green-400' : score.responseTime < 60 ? 'text-yellow-400' : 'text-red-400',
      bgColor: score.responseTime < 30 ? 'bg-green-500/10 border-green-500/30' : score.responseTime < 60 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30',
    },
    {
      label: '群众影响',
      value: `${score.publicImpact}%`,
      description: '越低越好',
      icon: <Users size={20} />,
      color: score.publicImpact < 30 ? 'text-green-400' : score.publicImpact < 60 ? 'text-yellow-400' : 'text-red-400',
      bgColor: score.publicImpact < 30 ? 'bg-green-500/10 border-green-500/30' : score.publicImpact < 60 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30',
    },
    {
      label: '证据完整度',
      value: `${score.evidenceCompleteness}%`,
      description: '越高越好',
      icon: <FileCheck size={20} />,
      color: score.evidenceCompleteness >= 80 ? 'text-green-400' : score.evidenceCompleteness >= 50 ? 'text-yellow-400' : 'text-red-400',
      bgColor: score.evidenceCompleteness >= 80 ? 'bg-green-500/10 border-green-500/30' : score.evidenceCompleteness >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30',
    },
  ];

  const detectionEvents = events.filter((e) => e.type === 'detection');
  const identificationEvents = events.filter((e) => e.type === 'identification');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-cyan-400 bg-cyan-400/10 mb-4">
            <Trophy className="text-cyan-400" size={36} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">任务复盘</h1>
          <p className="text-slate-400">{currentMission.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <HudPanel title="综合评分">
            <div className="flex flex-col items-center py-4">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="w-64 h-64"
              />
              <div className="mt-4 text-center">
                <div className={`text-5xl font-bold ${gradeColors[score.grade]}`}>
                  {score.grade}
                </div>
                <div className="text-slate-400 text-sm">{gradeLabels[score.grade]}</div>
              </div>
            </div>
          </HudPanel>

          <div className="space-y-4">
            <HudPanel title="总得分">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {score.total}
                </div>
                <div className="text-slate-400 text-sm mt-1">分</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={16} />
                  <span className="text-yellow-400 text-sm">
                    获得 {Math.floor(score.total * 2)} 经验值
                  </span>
                </div>
              </div>
            </HudPanel>

            <div className="grid grid-cols-2 gap-3">
              {scoreItems.map((item) => (
                <div
                  key={item.label}
                  className={`p-3 border ${item.bgColor}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={item.color}>{item.icon}</span>
                    <span className="text-sm text-slate-300">{item.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <HudPanel title="目标统计">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  <Target size={14} className="inline mr-2" />
                  总目标数
                </span>
                <span className="text-white font-bold">{detectedTargets.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  <CheckCircle size={14} className="inline mr-2 text-green-400" />
                  正确识别
                </span>
                <span className="text-green-400 font-bold">
                  {identificationEvents.filter((e) => e.result === 'correct').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  <XCircle size={14} className="inline mr-2 text-red-400" />
                  误判
                </span>
                <span className="text-red-400 font-bold">
                  {identificationEvents.filter((e) => e.result === 'wrong').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  <AlertTriangle size={14} className="inline mr-2 text-red-400" />
                  黑飞目标
                </span>
                <span className="text-red-400 font-bold">
                  {detectedTargets.filter((t) => t.isBlackFlight).length}
                </span>
              </div>
            </div>
          </HudPanel>

          <HudPanel title="事件时间线">
            <div className="h-48 overflow-y-auto space-y-2">
              {events.length === 0 ? (
                <div className="text-center text-slate-600 py-8">暂无事件</div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-slate-300">{event.description}</div>
                      <div className="text-xs text-slate-600">
                        {new Date(event.timestamp).toLocaleTimeString('zh-CN')}
                      </div>
                    </div>
                    {event.result && (
                      <StatusBadge
                        variant={event.result === 'correct' ? 'success' : 'danger'}
                        className="ml-auto"
                      >
                        {event.result === 'correct' ? '正确' : '错误'}
                      </StatusBadge>
                    )}
                  </div>
                ))
              )}
            </div>
          </HudPanel>
        </div>

        <div className="flex items-center justify-center gap-4">
          <GlowButton
            variant="primary"
            onClick={handleReturnHome}
            size="lg"
            className="flex items-center gap-2"
          >
            <Home size={18} />
            返回主控室
          </GlowButton>
          <GlowButton
            variant="warning"
            onClick={handleRetry}
            size="lg"
            className="flex items-center gap-2"
          >
            <RotateCcw size={18} />
            再来一次
          </GlowButton>
          <GlowButton
            variant="success"
            onClick={() => navigate('/growth')}
            size="lg"
            className="flex items-center gap-2"
          >
            成长系统
            <ChevronRight size={18} />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
