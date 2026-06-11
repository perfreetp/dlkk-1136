import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, HelpCircle, Eye, Zap, MapPin } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { TARGET_REFERENCES } from '../data/gameData';
import { HudPanel } from '../components/common/HudPanel';
import { GlowButton } from '../components/common/GlowButton';
import { StatusBadge } from '../components/common/StatusBadge';
import type { TargetType } from '../types/game';

export default function IdentifyPage() {
  const navigate = useNavigate();
  const {
    detectedTargets,
    selectedTarget,
    selectTarget,
    identifyTarget,
    currentMission,
  } = useGameStore();

  const [showReference, setShowReference] = useState(true);
  const [feedback, setFeedback] = useState<{ targetId: string; correct: boolean } | null>(null);

  const pendingTargets = detectedTargets.filter((t) => t.detected && !t.identified);
  const identifiedTargets = detectedTargets.filter((t) => t.identified);

  const handleIdentify = (targetId: string, type: TargetType) => {
    const target = detectedTargets.find((t) => t.id === targetId);
    if (!target) return;

    const isCorrect = target.trueType === type;

    identifyTarget(targetId, type);
    setFeedback({ targetId, correct: isCorrect });

    setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

  const targetTypes: { type: TargetType; label: string; color: string; icon: string }[] = [
    { type: 'blackFlight', label: '黑飞无人机', color: 'danger', icon: '🚁' },
    { type: 'bird', label: '鸟群', color: 'success', icon: '🐦' },
    { type: 'legitimate', label: '合法航班', color: 'info', icon: '✈️' },
    { type: 'noise', label: '设备噪声', color: 'warning', icon: '📡' },
  ];

  if (!currentMission) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/monitor')}
              className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-cyan-300">目标判读</h1>
              <p className="text-sm text-slate-400">
                根据多维度信息判断目标类型
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge variant="warning">
              待识别: {pendingTargets.length}
            </StatusBadge>
            <StatusBadge variant="success">
              已识别: {identifiedTargets.length}
            </StatusBadge>
            <button
              onClick={() => setShowReference(!showReference)}
              className="text-sm text-cyan-400 border border-cyan-500/30 px-3 py-1 hover:bg-cyan-400/10"
            >
              {showReference ? '隐藏参考' : '显示参考'}
            </button>
            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-400/30 transition-colors"
            >
              <MapPin size={16} />
              地图部署
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">目标列表</h3>

            {pendingTargets.length === 0 && identifiedTargets.length === 0 && (
              <div className="bg-slate-900/60 border border-slate-700/50 p-6 text-center text-slate-500">
                <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>暂无待识别目标</p>
                <p className="text-xs mt-1">请先在监测界面发现目标</p>
              </div>
            )}

            {pendingTargets.map((target, index) => (
              <div
                key={target.id}
                onClick={() => selectTarget(target)}
                className={`p-3 border cursor-pointer transition-all ${
                  selectedTarget?.id === target.id
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-slate-700/50 bg-slate-900/60 hover:border-cyan-500/50'
                } ${feedback?.targetId === target.id ? (feedback.correct ? 'border-green-400 bg-green-500/10' : 'border-red-400 bg-red-500/10') : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">
                    目标 #{index + 1}
                  </span>
                  <StatusBadge variant="warning" pulse>
                    待识别
                  </StatusBadge>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>信号强度: {(target.signalStrength * 100).toFixed(0)}%</div>
                  <div>声频: {target.soundFrequency.toFixed(1)} kHz</div>
                  <div>高度: {target.altitude.toFixed(0)}m</div>
                </div>
              </div>
            ))}

            {identifiedTargets.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-500 mb-2">已识别</h3>
                {identifiedTargets.map((target, index) => (
                  <div
                    key={target.id}
                    onClick={() => selectTarget(target)}
                    className={`p-3 border cursor-pointer transition-all opacity-70 ${
                      selectedTarget?.id === target.id
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-slate-700/50 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        目标 #{index + 1}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: TARGET_REFERENCES[target.type as keyof typeof TARGET_REFERENCES]?.color || '#888' }}
                      >
                        {TARGET_REFERENCES[target.type as keyof typeof TARGET_REFERENCES]?.name || '未知'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-6">
            {selectedTarget ? (
              <HudPanel title="目标详细分析" className="h-full">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 border border-cyan-500/20">
                      <h4 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
                        <Zap size={14} />
                        雷达特征
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">类型:</span>
                          <span className="text-white">{selectedTarget.radarSignature}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">速度:</span>
                          <span className="text-white">{selectedTarget.speed.toFixed(1)} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">高度:</span>
                          <span className="text-white">{selectedTarget.altitude.toFixed(0)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">位置:</span>
                          <span className="text-white">
                            {selectedTarget.x.toFixed(1)}, {selectedTarget.y.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 border border-green-500/20">
                      <h4 className="text-sm font-bold text-green-300 mb-2">声纹特征</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">主频率:</span>
                          <span className="text-white">
                            {selectedTarget.soundFrequency.toFixed(2)} kHz
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">模式:</span>
                          <span className="text-white">{selectedTarget.soundPattern}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">强度:</span>
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-400"
                              style={{ width: `${selectedTarget.signalStrength * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 border border-yellow-500/20">
                      <h4 className="text-sm font-bold text-yellow-300 mb-2">信号特征</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">强度:</span>
                          <span className="text-white">
                            {(selectedTarget.signalStrength * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">频段:</span>
                          <span className="text-white">
                            {selectedTarget.signalStrength > 0.6 ? '2.4/5.8 GHz' : '低频段'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">跳频:</span>
                          <span className="text-white">
                            {selectedTarget.isBlackFlight ? '有规律' : '无'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 border border-purple-500/20">
                      <h4 className="text-sm font-bold text-purple-300 mb-2">视频特征</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">外观:</span>
                          <span className="text-white">{selectedTarget.videoDescription}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">尺寸:</span>
                          <span className="text-white">
                            {selectedTarget.type === 'legitimate' ? '大型' : selectedTarget.type === 'bird' ? '小型群' : '小型'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">LED灯:</span>
                          <span className="text-white">
                            {selectedTarget.isBlackFlight ? '有闪烁' : '无'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!selectedTarget.identified && (
                    <div className="pt-4 border-t border-slate-700/50">
                      <h4 className="text-sm font-bold text-white mb-3 text-center">
                        请判断目标类型
                      </h4>
                      <div className="grid grid-cols-4 gap-3">
                        {targetTypes.map(({ type, label, color, icon }) => (
                          <GlowButton
                            key={type}
                            variant={color as any}
                            onClick={() => handleIdentify(selectedTarget.id, type)}
                            className="flex flex-col items-center gap-1 py-3"
                          >
                            <span className="text-2xl">{icon}</span>
                            <span className="text-xs">{label}</span>
                          </GlowButton>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTarget.identified && (
                    <div className="pt-4 border-t border-slate-700/50 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30">
                        <Check className="text-green-400" size={18} />
                        <span className="text-green-300">已完成判读</span>
                      </div>
                    </div>
                  )}
                </div>
              </HudPanel>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900/30 border border-slate-700/50">
                <div className="text-center text-slate-500">
                  <Eye size={48} className="mx-auto mb-3 opacity-30" />
                  <p>请从左侧选择一个目标进行判读</p>
                </div>
              </div>
            )}
          </div>

          {showReference && (
            <div className="col-span-3">
              <HudPanel title="参考样本库" className="h-full">
                <div className="space-y-3">
                  {Object.entries(TARGET_REFERENCES).map(([key, ref]) => (
                    <div
                      key={key}
                      className="p-3 border border-slate-700/50 bg-slate-800/30"
                      style={{ borderColor: ref.color + '40' }}
                    >
                      <div
                        className="font-bold text-sm mb-2"
                        style={{ color: ref.color }}
                      >
                        {ref.name}
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div>
                          <span className="text-slate-500">声纹: </span>
                          {ref.sound}
                        </div>
                        <div>
                          <span className="text-slate-500">雷达: </span>
                          {ref.radar}
                        </div>
                        <div>
                          <span className="text-slate-500">信号: </span>
                          {ref.signal}
                        </div>
                        <div>
                          <span className="text-slate-500">视频: </span>
                          {ref.video}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30">
                  <div className="text-xs text-cyan-300 font-bold mb-1">💡 判读技巧</div>
                  <div className="text-xs text-cyan-400/70 space-y-1">
                    <p>• 黑飞无人机通常有高频电机声和强遥控信号</p>
                    <p>• 鸟群信号不规则，无遥控信号</p>
                    <p>• 合法航班体积大、速度快，有应答信号</p>
                    <p>• 设备噪声位置固定，无移动目标</p>
                  </div>
                </div>
              </HudPanel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
