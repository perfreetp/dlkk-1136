import { useEffect, useRef, useState } from 'react';
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
  Target as TargetIcon,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Radio,
  Signal,
  Video,
  ShieldAlert,
} from 'lucide-react';
import { useGameStore, usePlayerStore } from '../store/useGameStore';
import { TARGET_REFERENCES } from '../data/gameData';
import { HudPanel } from '../components/common/HudPanel';
import { GlowButton } from '../components/common/GlowButton';
import { StatusBadge } from '../components/common/StatusBadge';
import type { Target, TargetType } from '../types/game';

const TYPE_NAMES: Record<TargetType, string> = {
  blackFlight: '黑飞无人机',
  bird: '鸟群',
  legitimate: '合法航线',
  noise: '设备噪声',
  unknown: '未识别',
};

const DISPOSAL_NAMES: Record<string, string> = {
  warn: '喊话警告',
  track: '持续跟踪',
  report: '上报指挥',
  intercept: '拦截处置',
  release: '放行',
};

export default function ReviewPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    score,
    currentMission,
    events,
    resetGame,
    detectedTargets,
    settled,
    markSettled,
  } = useGameStore();
  const { addExperience, addScore, addMissionResult } = usePlayerStore();
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);

  useEffect(() => {
    if (score && currentMission && !settled) {
      const resultId = `result-${currentMission.id}-${Date.now()}`;
      const added = addMissionResult({
        id: resultId,
        missionId: currentMission.id,
        missionName: currentMission.name,
        score,
        completedAt: Date.now(),
      });
      if (added) {
        addExperience(Math.floor(score.total * 2));
        addScore(score.total);
      }
      markSettled();
    }
  }, [score, currentMission, settled, addExperience, addScore, addMissionResult, markSettled]);

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
    }
  };

  if (!score || !currentMission) {
    navigate('/');
    return null;
  }

  const identificationEvents = events.filter((e) => e.type === 'identification');
  const disposalEvents = events.filter((e) => e.type === 'disposal');

  const targetReports = detectedTargets.map((target, idx) => {
    const idEvent = identificationEvents.find((e) => e.targetId === target.id);
    const dpEvent = disposalEvents.find((e) => e.targetId === target.id);
    const playerType: TargetType | null = (idEvent?.playerType as TargetType) || (target.identified ? target.type : null);
    const isCorrect = idEvent?.result === 'correct' || (playerType && playerType === target.trueType);
    const disposal = dpEvent?.disposalAction || target.disposalStatus;

    let deductionReason: string | null = null;
    if (idEvent && idEvent.result === 'wrong') {
      deductionReason = `误判：识别为「${TYPE_NAMES[playerType || 'unknown']}」，真实为「${TYPE_NAMES[target.trueType]}」`;
    } else if (target.trueType === 'blackFlight' && !disposal) {
      deductionReason = '黑飞目标未采取任何处置措施';
    } else if (target.trueType !== 'blackFlight' && disposal === 'intercept') {
      deductionReason = `对「${TYPE_NAMES[target.trueType]}」实施了拦截，可能造成负面影响`;
    }

    return {
      target,
      index: idx + 1,
      playerType,
      isCorrect,
      disposal,
      deductionReason,
    };
  });

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

  const correctCount = targetReports.filter((r) => r.isCorrect).length;
  const wrongCount = targetReports.filter((r) => r.playerType && !r.isCorrect).length;
  const unidentifiedCount = targetReports.filter((r) => !r.playerType).length;

  const renderTargetClues = (target: Target) => (
    <div className="pt-4 space-y-3 border-t border-slate-700/50">
      <div className="text-xs text-cyan-400 font-bold mb-2">— 采集到的多维度线索 —</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-800/60 border border-cyan-500/20 rounded-sm">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold mb-2">
            <Zap size={12} />
            雷达特征
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">回波类型</span>
              <span className="text-white">{target.radarSignature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">移动速度</span>
              <span className="text-white">{target.speed.toFixed(1)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">飞行高度</span>
              <span className="text-white">{target.altitude.toFixed(0)} m</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-800/60 border border-green-500/20 rounded-sm">
          <div className="flex items-center gap-2 text-green-300 text-xs font-bold mb-2">
            <Radio size={12} />
            声纹特征
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">主频率</span>
              <span className="text-white">{target.soundFrequency.toFixed(2)} kHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">模式</span>
              <span className="text-white">{target.soundPattern}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">强度</span>
              <span className="text-white">{(target.signalStrength * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-800/60 border border-yellow-500/20 rounded-sm">
          <div className="flex items-center gap-2 text-yellow-300 text-xs font-bold mb-2">
            <Signal size={12} />
            信号特征
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">遥控信号</span>
              <span className="text-white">
                {target.signalStrength > 0.6 ? '强 (2.4/5.8G)' : target.signalStrength > 0.3 ? '中等' : '微弱/无'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">应答信号</span>
              <span className="text-white">
                {target.trueType === 'legitimate' ? '有合法识别码' : '无'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-800/60 border border-purple-500/20 rounded-sm">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold mb-2">
            <Video size={12} />
            视频特征
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">外观描述</span>
              <span className="text-white">{target.videoDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">编队/集群</span>
              <span className="text-white">
                {target.trueType === 'bird' ? '鸟群编队' : '单目标'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/map')}
              className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText size={24} className="text-cyan-400" />
                值守任务报告
              </h1>
              <p className="text-sm text-slate-400">
                {currentMission.name} · 任务编号 #{currentMission.id} ·{' '}
                {new Date().toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          {settled && (
            <StatusBadge variant="success">
              <CheckCircle size={12} className="mr-1" />
              已归档
            </StatusBadge>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-4">
            <HudPanel title="综合评估">
              <div className="flex flex-col items-center py-2">
                <canvas
                  ref={canvasRef}
                  width={260}
                  height={260}
                  className="w-56 h-56"
                />
                <div className="mt-2 text-center">
                  <div className={`text-5xl font-bold ${gradeColors[score.grade]}`}>
                    {score.grade}
                  </div>
                  <div className="text-slate-400 text-sm">{gradeLabels[score.grade]}</div>
                </div>
              </div>
            </HudPanel>
          </div>

          <div className="col-span-8 space-y-4">
            <HudPanel title="总得分">
              <div className="flex items-center justify-between px-2 py-2">
                <div>
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    {score.total}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">综合评分</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-yellow-400" size={16} />
                      <span className="text-yellow-400 text-sm font-bold">+{score.total}</span>
                    </div>
                    <div className="text-xs text-slate-500">可用积分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-cyan-400 text-sm font-bold">+{Math.floor(score.total * 2)} XP</div>
                    <div className="text-xs text-slate-500">经验值</div>
                  </div>
                </div>
              </div>
            </HudPanel>

            <div className="grid grid-cols-4 gap-2">
              {scoreItems.map((item) => (
                <div
                  key={item.label}
                  className={`p-3 border ${item.bgColor} rounded-sm`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={item.color}>{item.icon}</span>
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                  <div className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                  </div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <HudPanel title={`目标处置记录 (${targetReports.length} 个目标)`} className="mb-6">
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-400 border-b border-slate-700/50">
              <div className="col-span-1">#</div>
              <div className="col-span-2">真实类型</div>
              <div className="col-span-2">玩家判读</div>
              <div className="col-span-2">结果</div>
              <div className="col-span-2">处置措施</div>
              <div className="col-span-2">扣分说明</div>
              <div className="col-span-1 text-right">操作</div>
            </div>

            {targetReports.map(({ target, index, playerType, isCorrect, disposal, deductionReason }) => {
              const trueRef = TARGET_REFERENCES[target.trueType];
              const isExpanded = expandedTarget === target.id;

              return (
                <div key={target.id} className="border border-slate-700/50 rounded-sm overflow-hidden">
                  <div
                    className="grid grid-cols-12 gap-2 px-3 py-3 items-center cursor-pointer hover:bg-slate-800/40 transition-colors"
                    onClick={() => setExpandedTarget(isExpanded ? null : target.id)}
                  >
                    <div className="col-span-1 text-slate-400 text-sm font-mono">{String(index).padStart(2, '0')}</div>

                    <div className="col-span-2">
                      <span className="text-sm font-bold" style={{ color: trueRef?.color }}>
                        {trueRef?.name || '未知'}
                      </span>
                    </div>

                    <div className="col-span-2">
                      {playerType ? (
                        <span
                          className="text-sm"
                          style={{ color: TARGET_REFERENCES[playerType]?.color || '#888' }}
                        >
                          {TYPE_NAMES[playerType]}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">— 未判读 —</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {playerType ? (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle size={14} />
                            正确
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                            <XCircle size={14} />
                            误判
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 text-sm flex items-center gap-1">
                          <ShieldAlert size={14} />
                          漏判
                        </span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {disposal ? (
                        <StatusBadge variant={disposal === 'intercept' ? 'danger' : disposal === 'release' ? 'info' : 'warning'}>
                          {DISPOSAL_NAMES[disposal] || disposal}
                        </StatusBadge>
                      ) : (
                        <span className="text-xs text-slate-600">未处置</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {deductionReason ? (
                        <span className="text-xs text-orange-400 line-clamp-1">{deductionReason}</span>
                      ) : (
                        <span className="text-xs text-green-500">— 无 —</span>
                      )}
                    </div>

                    <div className="col-span-1 text-right">
                      {isExpanded ? (
                        <ChevronUp size={16} className="inline text-cyan-400" />
                      ) : (
                        <ChevronDown size={16} className="inline text-slate-500" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-4">
                      {renderTargetClues(target)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{targetReports.length}</div>
              <div className="text-xs text-slate-500">监测目标总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{correctCount}</div>
              <div className="text-xs text-slate-500">正确识别</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
              <div className="text-xs text-slate-500">误判</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-500">{unidentifiedCount}</div>
              <div className="text-xs text-slate-500">漏判/未判</div>
            </div>
          </div>
        </HudPanel>

        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-700/50 z-20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              * 报告已自动写入值守员档案，奖励已结算，重复查看不会重复发放
            </div>
            <div className="flex items-center gap-3">
              <GlowButton
                variant="warning"
                onClick={handleRetry}
                className="gap-2"
              >
                <RotateCcw size={16} />
                重新挑战
              </GlowButton>
              <GlowButton
                variant="info"
                onClick={() => navigate('/growth')}
                className="gap-2"
              >
                <Trophy size={16} />
                查看成长
              </GlowButton>
              <GlowButton
                variant="primary"
                onClick={handleReturnHome}
                size="lg"
                className="gap-2"
              >
                <Home size={16} />
                返回主控室
                <ChevronRight size={16} />
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
