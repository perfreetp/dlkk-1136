import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Megaphone,
  Eye,
  Upload,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Zap,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { HudPanel } from '../components/common/HudPanel';
import { GlowButton } from '../components/common/GlowButton';
import { StatusBadge } from '../components/common/StatusBadge';
import type { DisposalAction, Target } from '../types/game';

export default function DisposePage() {
  const navigate = useNavigate();
  const {
    detectedTargets,
    selectedTarget,
    selectTarget,
    setDisposal,
    endMission,
    currentMission,
    events,
  } = useGameStore();

  const [disposalLog, setDisposalLog] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const blackFlightTargets = detectedTargets.filter(
    (t) => t.isBlackFlight || t.type === 'blackFlight'
  );

  const pendingTargets = detectedTargets.filter(
    (t) => t.detected && !t.disposalStatus
  );

  const disposalActions: {
    action: DisposalAction;
    label: string;
    icon: React.ReactNode;
    variant: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    description: string;
  }[] = [
    {
      action: 'warn',
      label: '喊话警告',
      icon: <Megaphone size={24} />,
      variant: 'warning',
      description: '通过广播设备对目标发出警告，使其离开',
    },
    {
      action: 'track',
      label: '持续跟踪',
      icon: <Eye size={24} />,
      variant: 'info',
      description: '保持对目标的持续监视，收集更多证据',
    },
    {
      action: 'report',
      label: '上报指挥',
      icon: <Upload size={24} />,
      variant: 'primary',
      description: '将情况上报给上级指挥部门',
    },
    {
      action: 'intercept',
      label: '拦截处置',
      icon: <ShieldAlert size={24} />,
      variant: 'danger',
      description: '使用反无人机设备进行强制拦截',
    },
    {
      action: 'release',
      label: '放行',
      icon: <CheckCircle size={24} />,
      variant: 'success',
      description: '确认目标无威胁，解除警戒',
    },
  ];

  const handleDisposal = (action: DisposalAction) => {
    if (!selectedTarget) return;
    if (selectedTarget.disposalStatus) return;

    setDisposal(selectedTarget.id, action);

    const actionNames: Record<DisposalAction, string> = {
      warn: '喊话警告',
      track: '持续跟踪',
      report: '上报指挥',
      intercept: '拦截处置',
      release: '放行',
    };

    setDisposalLog((prev) => [
      `[${new Date().toLocaleTimeString()}] 对目标执行 ${actionNames[action]}`,
      ...prev,
    ]);

    setTimeout(() => {
      const state = useGameStore.getState();
      const refreshed = state.detectedTargets.find((t) => t.id === selectedTarget.id);
      if (refreshed) selectTarget(refreshed);
    }, 300);
  };

  const handleEndMission = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      endMission();
      navigate('/review');
    }, 1000);
  };

  if (!currentMission) {
    navigate('/');
    return null;
  }

  const getTargetLabel = (target: Target) => {
    if (target.identified) {
      const typeNames: Record<string, string> = {
        blackFlight: '黑飞无人机',
        bird: '鸟群',
        legitimate: '合法航班',
        noise: '设备噪声',
      };
      return typeNames[target.type] || '未知';
    }
    return '待识别';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/map')}
              className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <ShieldAlert size={24} />
                处置决策
              </h1>
              <p className="text-sm text-slate-400">
                根据目标情况选择合适的处置方式
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge variant="danger" pulse={blackFlightTargets.length > 0}>
              <AlertTriangle size={12} className="mr-1" />
              黑飞目标: {blackFlightTargets.length}
            </StatusBadge>
            <StatusBadge variant="warning">
              待处置: {pendingTargets.length}
            </StatusBadge>
            <button
              onClick={handleEndMission}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  结束任务
                </>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">目标列表</h3>

            {detectedTargets.filter(t => t.detected).length === 0 && (
              <div className="bg-slate-900/60 border border-slate-700/50 p-6 text-center text-slate-500">
                暂无目标
              </div>
            )}

            {detectedTargets.filter(t => t.detected).map((target, index) => (
              <div
                key={target.id}
                onClick={() => selectTarget(target)}
                className={`p-3 border cursor-pointer transition-all ${
                  selectedTarget?.id === target.id
                    ? 'border-red-400 bg-red-500/10'
                    : 'border-slate-700/50 bg-slate-900/60 hover:border-red-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">
                    目标 #{index + 1}
                  </span>
                  {target.disposalStatus ? (
                    <StatusBadge variant="success">已处置</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning" pulse>待处置</StatusBadge>
                  )}
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">类型:</span>
                    <span
                      className={
                        target.isBlackFlight || target.type === 'blackFlight'
                          ? 'text-red-400'
                          : 'text-green-400'
                      }
                    >
                      {getTargetLabel(target)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">高度:</span>
                    <span className="text-slate-400">
                      {target.altitude.toFixed(0)}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-6">
            <HudPanel title="处置控制台" className="h-full">
              {selectedTarget ? (
                <div className="space-y-6">
                  <div className="bg-slate-800/50 p-4 border border-slate-700/50">
                    <h4 className="text-sm font-bold text-white mb-3">目标信息</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-slate-500 text-xs">目标类型</div>
                        <div
                          className={`font-bold ${
                            selectedTarget.isBlackFlight ||
                            selectedTarget.type === 'blackFlight'
                              ? 'text-red-400'
                              : 'text-green-400'
                          }`}
                        >
                          {getTargetLabel(selectedTarget)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">当前高度</div>
                        <div className="text-white font-bold">
                          {selectedTarget.altitude.toFixed(0)} m
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">飞行速度</div>
                        <div className="text-white font-bold">
                          {selectedTarget.speed.toFixed(1)} m/s
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">信号强度</div>
                        <div className="text-white font-bold">
                          {(selectedTarget.signalStrength * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">声纹频率</div>
                        <div className="text-white font-bold">
                          {selectedTarget.soundFrequency.toFixed(1)} kHz
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">威胁等级</div>
                        <div
                          className={`font-bold ${
                            selectedTarget.isBlackFlight ||
                            selectedTarget.type === 'blackFlight'
                              ? 'text-red-400'
                              : 'text-green-400'
                          }`}
                        >
                          {selectedTarget.isBlackFlight ||
                          selectedTarget.type === 'blackFlight'
                            ? '高危'
                            : '无威胁'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!selectedTarget.disposalStatus ? (
                    <div>
                      <h4 className="text-sm font-bold text-white mb-4 text-center">
                        选择处置方式
                      </h4>
                      <div className="grid grid-cols-5 gap-3">
                        {disposalActions.map(
                          ({ action, label, icon, variant, description }) => (
                            <div key={action} className="space-y-2">
                              <GlowButton
                                variant={variant}
                                onClick={() => handleDisposal(action)}
                                className="w-full flex flex-col items-center gap-2 py-4"
                              >
                                {icon}
                                <span className="text-xs">{label}</span>
                              </GlowButton>
                              <p className="text-xs text-slate-500 text-center">
                                {description}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 text-center">
                      <CheckCircle className="text-green-400 mx-auto mb-2" size={24} />
                      <p className="text-green-300 text-sm font-bold">
                        已完成处置
                      </p>
                      <p className="text-green-400 text-xs mt-1">
                        {selectedTarget.disposalStatus === 'warn' && '喊话警告'}
                        {selectedTarget.disposalStatus === 'track' && '持续跟踪'}
                        {selectedTarget.disposalStatus === 'report' && '上报指挥'}
                        {selectedTarget.disposalStatus === 'intercept' && '拦截处置'}
                        {selectedTarget.disposalStatus === 'release' && '放行'}
                      </p>
                      <p className="text-slate-500 text-xs mt-2">
                        处置已锁定，无法更改
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <ShieldAlert size={48} className="mx-auto mb-3 opacity-30" />
                    <p>请从左侧选择一个目标进行处置</p>
                  </div>
                </div>
              )}
            </HudPanel>
          </div>

          <div className="col-span-3 space-y-4">
            <HudPanel title="处置日志">
              <div className="h-48 overflow-y-auto space-y-2 text-xs">
                {disposalLog.length === 0 ? (
                  <div className="text-center text-slate-600 py-8">
                    暂无处置记录
                  </div>
                ) : (
                  disposalLog.map((log, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-800/50 border-l-2 border-cyan-500/50 text-slate-400"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </HudPanel>

            <HudPanel title="证据收集">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">雷达数据</span>
                  <StatusBadge variant="success">已收集</StatusBadge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">声纹记录</span>
                  <StatusBadge variant="success">已收集</StatusBadge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">信号分析</span>
                  <StatusBadge variant="success">已收集</StatusBadge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">视频录像</span>
                  <StatusBadge variant="success">已收集</StatusBadge>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cyan-400">证据完整度</span>
                  <span className="text-cyan-300 font-bold">100%</span>
                </div>
                <div className="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500 w-full" />
                </div>
              </div>
            </HudPanel>

            <HudPanel title="快速提示">
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <Zap size={12} className="text-yellow-400 mt-0.5" />
                  <p>确认是黑飞无人机后再执行处置</p>
                </div>
                <div className="flex items-start gap-2">
                  <Zap size={12} className="text-yellow-400 mt-0.5" />
                  <p>优先使用喊话警告，严重情况再拦截</p>
                </div>
                <div className="flex items-start gap-2">
                  <Zap size={12} className="text-yellow-400 mt-0.5" />
                  <p>收集完整证据有利于评分</p>
                </div>
                <div className="flex items-start gap-2">
                  <Zap size={12} className="text-yellow-400 mt-0.5" />
                  <p>误报会影响最终评分</p>
                </div>
              </div>
            </HudPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
