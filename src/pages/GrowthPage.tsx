import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Lock,
  Star,
  Trophy,
  Award,
  Cpu,
  Cloud,
  Moon,
  Target,
  Check,
  ChevronRight,
  AlertCircle,
  Route,
  CircleDot,
  FileText,
  User,
  Filter,
  MapPin,
  ThermometerSun,
  Bird,
  Plane,
  Radio,
  X,
  BarChart3,
  Clock,
  Users,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { usePlayerStore, MISSIONS } from '../store/useGameStore';
import { SENSORS, ACHIEVEMENTS, TARGET_REFERENCES } from '../data/gameData';
import { HudPanel } from '../components/common/HudPanel';
import { GlowButton } from '../components/common/GlowButton';
import { StatusBadge } from '../components/common/StatusBadge';
import type { Mission, MissionResult, MissionType, WeatherType, TargetType } from '../types/game';

type TabType = 'sensors' | 'achievements' | 'features' | 'training' | 'profile';

const TYPE_NAMES: Record<TargetType, string> = {
  blackFlight: '黑飞无人机',
  bird: '鸟群',
  legitimate: '合法航线',
  noise: '设备噪声',
  unknown: '未识别',
};

interface TrainingNode {
  id: string;
  missionId: string;
  label: string;
  description: string;
  reward: number;
}

interface TrainingLine {
  id: string;
  featureId: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  nodes: TrainingNode[];
  unlockCondition: string;
  recommendedPrereq: string[];
}

export default function GrowthPage() {
  const navigate = useNavigate();
  const {
    level,
    experience,
    totalScore,
    credits,
    unlockedSensors,
    unlockedFeatures,
    achievements,
    missionHistory,
    unlockSensor,
    unlockFeature,
    unlockAchievement,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<TabType>('sensors');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterWeather, setFilterWeather] = useState<string>('all');
  const [filterTargetType, setFilterTargetType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<MissionResult | null>(null);

  const expToNextLevel = level * 500;
  const expProgress = (experience / expToNextLevel) * 100;

  const sensorIcons: Record<string, React.ReactNode> = {
    'basic-radar': <Cpu size={24} />,
    'high-sens-sound': <Zap size={24} />,
    'multi-band-signal': <Target size={24} />,
    'night-vision': <Moon size={24} />,
    'weather-filter': <Cloud size={24} />,
    'multi-target': <Target size={24} />,
  };

  const features = [
    {
      id: 'night-mode',
      name: '夜间模式',
      description: '解锁夜间任务场景，任务在低光照环境下进行',
      cost: 300,
      icon: <Moon size={24} />,
      unlocked: unlockedFeatures.includes('night-mode'),
    },
    {
      id: 'bad-weather',
      name: '恶劣天气',
      description: '解锁雨天、雾天等复杂天气任务，信号与雷达衰减',
      cost: 400,
      icon: <Cloud size={24} />,
      unlocked: unlockedFeatures.includes('bad-weather'),
    },
    {
      id: 'multi-target-track',
      name: '多目标追踪',
      description: '解锁多目标同时入侵的高级任务场景',
      cost: 500,
      icon: <Target size={24} />,
      unlocked: unlockedFeatures.includes('multi-target-track'),
    },
  ];

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 2500);
  };

  const handleUnlockSensor = (sensorId: string, cost: number) => {
    if (unlockedSensors.includes(sensorId)) return;
    if (credits < cost) {
      showError(`积分不足！需要 ${cost} 积分，当前可用 ${credits} 积分`);
      return;
    }
    const success = unlockSensor(sensorId, cost);
    if (!success) {
      showError('解锁失败，请稍后重试');
    }
  };

  const handleUnlockFeature = (featureId: string, cost: number) => {
    if (unlockedFeatures.includes(featureId)) return;
    if (credits < cost) {
      showError(`积分不足！需要 ${cost} 积分，当前可用 ${credits} 积分`);
      return;
    }
    const success = unlockFeature(featureId, cost);
    if (!success) {
      showError('解锁失败，请稍后重试');
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'sensors', label: '传感器', icon: <Cpu size={16} /> },
    { id: 'features', label: '能力解锁', icon: <Zap size={16} /> },
    { id: 'training', label: '训练路线', icon: <Route size={16} /> },
    { id: 'profile', label: '值守员档案', icon: <User size={16} /> },
    { id: 'achievements', label: '成就', icon: <Trophy size={16} /> },
  ];

  const trainingLines: TrainingLine[] = [
    {
      id: 'basic',
      featureId: 'basic',
      title: '基础值守训练',
      subtitle: '新手入门，所有值守员必做',
      color: '#00d4ff',
      icon: <Cpu size={22} />,
      unlockCondition: '默认开放',
      recommendedPrereq: [],
      nodes: MISSIONS.filter((m) => !m.requiredFeature).map((m) => ({
        id: m.id,
        missionId: m.id,
        label: m.name,
        description: m.description,
        reward: m.reward,
      })),
    },
    {
      id: 'night',
      featureId: 'night-mode',
      title: '夜间值守训练',
      subtitle: '解锁「夜间模式」后开放',
      color: '#a78bfa',
      icon: <Moon size={22} />,
      unlockCondition: '需在能力解锁中花费 300 积分解锁「夜间模式」',
      recommendedPrereq: ['基础值守训练完成度 >= 50%'],
      nodes: MISSIONS.filter((m) => m.requiredFeature === 'night-mode').map((m) => ({
        id: m.id,
        missionId: m.id,
        label: m.name,
        description: m.description,
        reward: m.reward,
      })),
    },
    {
      id: 'weather',
      featureId: 'bad-weather',
      title: '恶劣天气训练',
      subtitle: '解锁「恶劣天气」后开放',
      color: '#60a5fa',
      icon: <Cloud size={22} />,
      unlockCondition: '需在能力解锁中花费 400 积分解锁「恶劣天气」',
      recommendedPrereq: ['基础值守训练完成度 >= 50%'],
      nodes: MISSIONS.filter((m) => m.requiredFeature === 'bad-weather').map((m) => ({
        id: m.id,
        missionId: m.id,
        label: m.name,
        description: m.description,
        reward: m.reward,
      })),
    },
    {
      id: 'multi',
      featureId: 'multi-target-track',
      title: '多目标协同训练',
      subtitle: '解锁「多目标追踪」后开放',
      color: '#f472b6',
      icon: <Target size={22} />,
      unlockCondition: '需在能力解锁中花费 500 积分解锁「多目标追踪」',
      recommendedPrereq: ['基础值守训练全部完成', '夜间/天气训练至少完成 1 个'],
      nodes: MISSIONS.filter((m) => m.requiredFeature === 'multi-target-track').map((m) => ({
        id: m.id,
        missionId: m.id,
        label: m.name,
        description: m.description,
        reward: m.reward,
      })),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
                <Award size={28} />
                成长系统
              </h1>
              <p className="text-sm text-slate-400">升级装备，解锁新能力</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30">
              <Trophy className="text-cyan-400" size={18} />
              <span className="text-cyan-300 font-bold">{totalScore}</span>
              <span className="text-cyan-400/60 text-sm">总积分</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30">
              <Star className="text-yellow-400 fill-yellow-400" size={18} />
              <span className="text-yellow-300 font-bold">{credits}</span>
              <span className="text-yellow-400/60 text-sm">可用积分</span>
            </div>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <HudPanel title="值守员档案">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-cyan-400 bg-cyan-400/10 mb-4">
                  <Trophy className="text-cyan-400" size={40} />
                </div>
                <h3 className="text-xl font-bold text-white">高级值守员</h3>
                <div className="text-cyan-400 text-lg font-bold">Lv.{level}</div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">经验值</span>
                  <span className="text-cyan-300">
                    {experience} / {expToNextLevel}
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {missionHistory.length}
                  </div>
                  <div className="text-xs text-slate-500">完成任务</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {achievements.length}
                  </div>
                  <div className="text-xs text-slate-500">获得成就</div>
                </div>
              </div>
            </HudPanel>

            <div className="mt-4">
              <div className="flex gap-1 bg-slate-900/60 p-1 border border-slate-700/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-8">
            {activeTab === 'sensors' && (
              <HudPanel title="传感器升级">
                <div className="grid grid-cols-2 gap-4">
                  {SENSORS.map((sensor) => {
                    const isUnlocked = unlockedSensors.includes(sensor.id);
                    const canAfford = credits >= sensor.cost;

                    return (
                      <div
                        key={sensor.id}
                        className={`p-4 border transition-all ${
                          isUnlocked
                            ? 'border-green-500/50 bg-green-500/5'
                            : canAfford
                            ? 'border-cyan-500/30 bg-slate-800/50 hover:border-cyan-400'
                            : 'border-slate-700/50 bg-slate-900/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`p-3 rounded-sm ${
                              isUnlocked
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-cyan-500/10 text-cyan-400'
                            }`}
                          >
                            {sensorIcons[sensor.id] || <Cpu size={24} />}
                          </div>
                          {isUnlocked ? (
                            <StatusBadge variant="success">已解锁</StatusBadge>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star size={12} className="fill-yellow-400" />
                              <span className="text-sm font-bold">
                                {sensor.cost}
                              </span>
                            </div>
                          )}
                        </div>

                        <h4 className="text-white font-bold mb-1">{sensor.name}</h4>
                        <p className="text-xs text-slate-400 mb-3">
                          {sensor.description}
                        </p>

                        {!isUnlocked && (
                          <GlowButton
                            variant={canAfford ? 'primary' : 'warning'}
                            className="w-full text-xs py-1.5"
                            onClick={() => handleUnlockSensor(sensor.id, sensor.cost)}
                            disabled={!canAfford}
                          >
                            {canAfford ? (
                              <>
                                <Zap size={12} className="inline mr-1" />
                                解锁
                              </>
                            ) : (
                              <>
                                <Lock size={12} className="inline mr-1" />
                                积分不足
                              </>
                            )}
                          </GlowButton>
                        )}
                      </div>
                    );
                  })}
                </div>
              </HudPanel>
            )}

            {activeTab === 'features' && (
              <HudPanel title="特殊能力">
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature) => {
                    const canAfford = credits >= feature.cost;

                    return (
                      <div
                        key={feature.id}
                        className={`p-4 border transition-all ${
                          feature.unlocked
                            ? 'border-green-500/50 bg-green-500/5'
                            : canAfford
                            ? 'border-purple-500/30 bg-slate-800/50 hover:border-purple-400'
                            : 'border-slate-700/50 bg-slate-900/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`p-3 rounded-sm ${
                              feature.unlocked
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-purple-500/10 text-purple-400'
                            }`}
                          >
                            {feature.icon}
                          </div>
                          {feature.unlocked ? (
                            <StatusBadge variant="success">已解锁</StatusBadge>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star size={12} className="fill-yellow-400" />
                              <span className="text-sm font-bold">
                                {feature.cost}
                              </span>
                            </div>
                          )}
                        </div>

                        <h4 className="text-white font-bold mb-1">
                          {feature.name}
                        </h4>
                        <p className="text-xs text-slate-400 mb-3">
                          {feature.description}
                        </p>

                        {!feature.unlocked && (
                          <GlowButton
                            variant={canAfford ? 'info' : 'warning'}
                            className="w-full text-xs py-1.5"
                            onClick={() =>
                              handleUnlockFeature(feature.id, feature.cost)
                            }
                            disabled={!canAfford}
                          >
                            {canAfford ? (
                              <>
                                <Zap size={12} className="inline mr-1" />
                                解锁
                              </>
                            ) : (
                              <>
                                <Lock size={12} className="inline mr-1" />
                                积分不足
                              </>
                            )}
                          </GlowButton>
                        )}
                      </div>
                    );
                  })}
                </div>
              </HudPanel>
            )}

            {activeTab === 'training' && (
              <HudPanel title="任务训练路线">
                <div className="space-y-6">
                  {trainingLines.map((line) => {
                    const isLineUnlocked = line.featureId === 'basic' || unlockedFeatures.includes(line.featureId);
                    const completedMissionIds = new Set(missionHistory.map((h) => h.missionId));
                    const completedNodes = line.nodes.filter((n) => completedMissionIds.has(n.missionId));
                    const progress = line.nodes.length > 0 ? Math.round((completedNodes.length / line.nodes.length) * 100) : 0;

                    const firstIncompleteNode = line.nodes.find((n) => !completedMissionIds.has(n.missionId));
                    const firstIncompleteIndex = line.nodes.findIndex((n) => !completedMissionIds.has(n.missionId));

                    return (
                      <div
                        key={line.id}
                        className={`border rounded-sm p-4 transition-all ${
                          isLineUnlocked
                            ? 'bg-slate-800/40'
                            : 'bg-slate-900/60 opacity-60'
                        }`}
                        style={{ borderColor: isLineUnlocked ? line.color + '60' : 'rgba(51,65,85,0.5)' }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-sm flex items-center justify-center"
                              style={{
                                backgroundColor: isLineUnlocked ? line.color + '20' : 'rgba(51,65,85,0.5)',
                                color: isLineUnlocked ? line.color : '#64748b',
                              }}
                            >
                              {isLineUnlocked ? line.icon : <Lock size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white">{line.title}</h4>
                                {!isLineUnlocked && (
                                  <StatusBadge variant="warning">
                                    <Lock size={10} className="mr-1" />
                                    未解锁
                                  </StatusBadge>
                                )}
                                {isLineUnlocked && progress === 100 && (
                                  <StatusBadge variant="success">
                                    <Check size={10} className="mr-1" />
                                    全部完成
                                  </StatusBadge>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">{line.subtitle}</div>
                              {isLineUnlocked && (
                                <div className="text-xs mt-1" style={{ color: line.color }}>
                                  进度: {completedNodes.length} / {line.nodes.length} · {progress}%
                                </div>
                              )}
                            </div>
                          </div>
                          {isLineUnlocked && (
                            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-500"
                                style={{ width: `${progress}%`, backgroundColor: line.color }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="relative ml-6">
                          {line.nodes.length > 1 && (
                            <div
                              className="absolute left-[18px] top-6 bottom-6 w-0.5"
                              style={{
                                backgroundColor: isLineUnlocked ? line.color + '30' : 'rgba(71,85,105,0.3)',
                              }}
                            />
                          )}
                          <div className="space-y-3">
                            {line.nodes.map((node, idx) => {
                              const isCompleted = completedMissionIds.has(node.missionId);
                              const history = missionHistory.filter((h) => h.missionId === node.missionId).sort((a, b) => b.completedAt - a.completedAt)[0];

                              return (
                                <div
                                  key={node.id}
                                  className={`relative flex items-start gap-4 pl-4 ${
                                    isLineUnlocked && idx < line.nodes.length - 1 ? 'pb-1' : ''
                                  }`}
                                >
                                  <div
                                    className="absolute left-[-18px] top-1 w-9 h-9 rounded-full flex items-center justify-center border-2 z-10"
                                    style={{
                                      backgroundColor: isCompleted
                                        ? line.color + '20'
                                        : isLineUnlocked
                                        ? '#1e293b'
                                        : '#0f172a',
                                      borderColor: isCompleted
                                        ? line.color
                                        : isLineUnlocked
                                        ? line.color + '50'
                                        : 'rgba(71,85,105,0.4)',
                                    }}
                                  >
                                    {isCompleted ? (
                                      <Check size={14} style={{ color: line.color }} />
                                    ) : isLineUnlocked ? (
                                      <CircleDot size={14} style={{ color: line.color + '80' }} />
                                    ) : (
                                      <Lock size={12} className="text-slate-600" />
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-sm font-bold ${
                                          isLineUnlocked ? 'text-white' : 'text-slate-600'
                                        }`}
                                      >
                                        节点 {idx + 1}: {node.label}
                                      </span>
                                      {isCompleted && history && (
                                        <span
                                          className="text-xs font-bold"
                                          style={{ color: line.color }}
                                        >
                                          {history.score.total}分 · {history.score.grade}
                                        </span>
                                      )}
                                      {!isCompleted && isLineUnlocked && (
                                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                                          <Star size={10} className="fill-yellow-400" />
                                          {node.reward}
                                        </span>
                                      )}
                                    </div>
                                    {isLineUnlocked && (
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        {node.description}
                                      </div>
                                    )}
                                    {isCompleted && history && (
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        完成时间: {new Date(history.completedAt).toLocaleString('zh-CN')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {!isLineUnlocked && (
                          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                            <div className="text-xs">
                              <span className="text-slate-500">🔒 解锁条件：</span>
                              <span className="text-yellow-400 ml-1">{line.unlockCondition}</span>
                            </div>
                            {line.recommendedPrereq.length > 0 && (
                              <div className="text-xs">
                                <span className="text-slate-500">📋 前置建议：</span>
                                <span className="text-cyan-400 ml-1">{line.recommendedPrereq.join('；')}</span>
                              </div>
                            )}
                            <div className="text-xs text-slate-600 mt-2">
                              💡 建议先完成基础训练并积分解锁对应能力后再挑战此路线
                            </div>
                          </div>
                        )}

                        {isLineUnlocked && progress < 100 && firstIncompleteNode && (
                          <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <div className="text-xs flex items-start gap-2">
                              <span className="text-green-400 mt-0.5">🎯</span>
                              <div>
                                <span className="text-slate-400">推荐下一步：</span>
                                <span className="text-white ml-1">
                                  完成节点 {firstIncompleteIndex + 1}：
                                  {firstIncompleteNode.label}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 ml-5">
                              预计可获得 {firstIncompleteNode.reward} 积分奖励
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-sm">
                    <h4 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
                      <BarChart3 size={16} />
                      训练进度总览
                    </h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      {trainingLines.map((line) => {
                        const isLineUnlocked = line.featureId === 'basic' || unlockedFeatures.includes(line.featureId);
                        const completedMissionIds = new Set(missionHistory.map((h) => h.missionId));
                        const completedNodes = line.nodes.filter((n) => completedMissionIds.has(n.missionId));
                        const progress = line.nodes.length > 0 ? Math.round((completedNodes.length / line.nodes.length) * 100) : 0;
                        return (
                          <div key={line.id}>
                            <div
                              className="text-2xl font-bold"
                              style={{ color: isLineUnlocked ? line.color : '#64748b' }}
                            >
                              {isLineUnlocked ? `${progress}%` : '—'}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{line.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </HudPanel>
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                missionHistory={missionHistory}
                filterArea={filterArea}
                setFilterArea={setFilterArea}
                filterWeather={filterWeather}
                setFilterWeather={setFilterWeather}
                filterTargetType={filterTargetType}
                setFilterTargetType={setFilterTargetType}
                onSelectReport={setSelectedReport}
              />
            )}

            {activeTab === 'achievements' && (
              <HudPanel title={`成就 (${achievements.length}/${ACHIEVEMENTS.length})`}>
                <div className="grid grid-cols-2 gap-4">
                  {ACHIEVEMENTS.map((achievement) => {
                    const isUnlocked = achievements.includes(achievement.id);

                    return (
                      <div
                        key={achievement.id}
                        className={`p-4 border flex items-center gap-4 transition-all ${
                          isUnlocked
                            ? 'border-yellow-500/50 bg-yellow-500/5'
                            : 'border-slate-700/50 bg-slate-900/30'
                        }`}
                      >
                        <div
                          className={`text-4xl ${
                            isUnlocked ? '' : 'grayscale opacity-40'
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`font-bold ${
                                isUnlocked ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {achievement.name}
                            </h4>
                            {isUnlocked && (
                              <Check
                                size={14}
                                className="text-yellow-400"
                              />
                            )}
                          </div>
                          <p
                            className={`text-xs ${
                              isUnlocked
                                ? 'text-slate-400'
                                : 'text-slate-600'
                            }`}
                          >
                            {achievement.description}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            条件: {achievement.condition}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </HudPanel>
            )}

            {missionHistory.length > 0 && (
              <HudPanel title="任务记录" className="mt-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {missionHistory.slice(-5).reverse().map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50"
                    >
                      <div>
                        <div className="text-sm text-white">
                          {result.missionName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(result.completedAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-400">
                          {result.score.total}分
                        </div>
                        <div className="text-xs text-yellow-400">
                          {result.score.grade}级
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </HudPanel>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <GlowButton
            variant="primary"
            onClick={() => navigate('/')}
            size="lg"
            className="inline-flex items-center gap-2"
          >
            返回主控室
            <ChevronRight size={18} />
          </GlowButton>
        </div>
      </div>
    </div>

    {selectedReport && (
      <ReportSummaryModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    )}
    </>
  );
}

function ProfileTab({
  missionHistory,
  filterArea,
  setFilterArea,
  filterWeather,
  setFilterWeather,
  filterTargetType,
  setFilterTargetType,
  onSelectReport,
}: {
  missionHistory: MissionResult[];
  filterArea: string;
  setFilterArea: (v: string) => void;
  filterWeather: string;
  setFilterWeather: (v: string) => void;
  filterTargetType: string;
  setFilterTargetType: (v: string) => void;
  onSelectReport: (r: MissionResult) => void;
}) {
  const filteredHistory = useMemo(() => {
    return missionHistory
      .slice()
      .sort((a, b) => b.completedAt - a.completedAt)
      .filter((r) => {
        if (filterArea !== 'all' && r.missionType !== filterArea) return false;
        if (filterWeather !== 'all' && r.weather !== filterWeather) return false;
        if (filterTargetType !== 'all') {
          const hasTarget = r.targets.some((t) => t.trueType === filterTargetType);
          if (!hasTarget) return false;
        }
        return true;
      });
  }, [missionHistory, filterArea, filterWeather, filterTargetType]);

  const stats = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        totalMissions: 0,
        avgScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalUnidentified: 0,
        avgAccuracy: 0,
      };
    }
    const totalScore = filteredHistory.reduce((sum, r) => sum + r.score.total, 0);
    const totalCorrect = filteredHistory.reduce((sum, r) => sum + r.correctCount, 0);
    const totalWrong = filteredHistory.reduce((sum, r) => sum + r.wrongCount, 0);
    const totalUnidentified = filteredHistory.reduce((sum, r) => sum + r.unidentifiedCount, 0);
    const totalTargets = totalCorrect + totalWrong + totalUnidentified;

    return {
      totalMissions: filteredHistory.length,
      avgScore: Math.round(totalScore / filteredHistory.length),
      totalCorrect,
      totalWrong,
      totalUnidentified,
      avgAccuracy: totalTargets > 0 ? Math.round((totalCorrect / totalTargets) * 100) : 0,
    };
  }, [filteredHistory]);

  const areaOptions = [
    { value: 'all', label: '全部区域' },
    { value: 'business', label: '商业区' },
    { value: 'airport', label: '机场周边' },
    { value: 'event', label: '赛事现场' },
    { value: 'industrial', label: '工业园区' },
    { value: 'residential', label: '居民区' },
  ];

  const weatherOptions = [
    { value: 'all', label: '全部天气' },
    { value: 'clear', label: '晴天' },
    { value: 'night', label: '夜间' },
    { value: 'rain', label: '雨天' },
    { value: 'fog', label: '雾天' },
  ];

  const targetTypeOptions = [
    { value: 'all', label: '全部目标类型' },
    { value: 'blackFlight', label: '黑飞无人机' },
    { value: 'bird', label: '鸟群' },
    { value: 'legitimate', label: '合法航班' },
    { value: 'noise', label: '设备噪声' },
  ];

  return (
    <div className="space-y-4">
      <HudPanel title="值守员档案 · 统计概览">
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
            <div className="text-3xl font-bold text-cyan-400">{stats.totalMissions}</div>
            <div className="text-xs text-slate-500 mt-1">执行任务</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
            <div className="text-3xl font-bold text-yellow-400">{stats.avgScore}</div>
            <div className="text-xs text-slate-500 mt-1">平均得分</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
            <div className="text-3xl font-bold text-green-400">{stats.avgAccuracy}%</div>
            <div className="text-xs text-slate-500 mt-1">平均准确率</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
            <div className="text-3xl font-bold text-green-400">{stats.totalCorrect}</div>
            <div className="text-xs text-slate-500 mt-1">正确识别</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
            <div className="text-3xl font-bold text-red-400">{stats.totalWrong}</div>
            <div className="text-xs text-slate-500 mt-1">误判</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
            <div className="text-3xl font-bold text-slate-500">{stats.totalUnidentified}</div>
            <div className="text-xs text-slate-500 mt-1">漏判</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500">筛选:</span>
          </div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {areaOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filterWeather}
            onChange={(e) => setFilterWeather(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {weatherOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filterTargetType}
            onChange={(e) => setFilterTargetType(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {targetTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="ml-auto text-xs text-slate-500">
            共 {filteredHistory.length} 条记录
          </div>
        </div>
      </HudPanel>

      <HudPanel title={`历史任务记录 (${filteredHistory.length})`}>
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>暂无符合条件的任务记录</p>
            <p className="text-xs mt-2">去完成一些任务后再回来查看吧</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredHistory.map((result) => {
              const areaLabel = areaOptions.find((o) => o.value === result.missionType)?.label || result.missionType;
              const weatherLabel = weatherOptions.find((o) => o.value === result.weather)?.label || result.weather;
              const accuracy =
                result.correctCount + result.wrongCount + result.unidentifiedCount > 0
                  ? Math.round(
                      (result.correctCount /
                        (result.correctCount + result.wrongCount + result.unidentifiedCount)) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={result.id}
                  onClick={() => onSelectReport(result)}
                  className="p-4 bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {result.missionName}
                      </div>
                      <StatusBadge variant="info">{areaLabel}</StatusBadge>
                      <StatusBadge variant="warning">{weatherLabel}</StatusBadge>
                      <span className="text-xs text-slate-500">
                        {new Date(result.completedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">
                          {result.score.total}分
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            result.score.grade === 'S'
                              ? 'text-yellow-400'
                              : result.score.grade === 'A'
                              ? 'text-green-400'
                              : result.score.grade === 'B'
                              ? 'text-cyan-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {result.score.grade}级
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-500 group-hover:text-cyan-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-8 gap-2 text-xs">
                    <div className="col-span-2">
                      <div className="text-slate-500 mb-0.5">目标类型分布</div>
                      <div className="flex gap-2">
                        <span className="text-red-400">黑飞 {result.blackFlightCount}</span>
                        <span className="text-green-400">鸟群 {result.birdCount}</span>
                        <span className="text-blue-400">航班 {result.legitimateCount}</span>
                        <span className="text-yellow-400">噪声 {result.noiseCount}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-500 mb-0.5">识别统计</div>
                      <div className="flex gap-2">
                        <span className="text-green-400">✓ {result.correctCount}</span>
                        <span className="text-red-400">✗ {result.wrongCount}</span>
                        <span className="text-slate-500">? {result.unidentifiedCount}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-500 mb-0.5">准确率</div>
                      <div className="text-white font-bold">{accuracy}%</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-500 mb-0.5">完成时间</div>
                      <div className="text-white font-mono">
                        {new Date(result.completedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </HudPanel>
    </div>
  );
}

function ReportSummaryModal({
  report,
  onClose,
}: {
  report: MissionResult;
  onClose: () => void;
}) {
  const accuracy =
    report.correctCount + report.wrongCount + report.unidentifiedCount > 0
      ? Math.round(
          (report.correctCount /
            (report.correctCount + report.wrongCount + report.unidentifiedCount)) *
            100
        )
      : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
            <FileText size={20} />
            复盘报告摘要
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">总分</div>
              <div className="text-2xl font-bold text-cyan-400">{report.score.total}</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">评级</div>
              <div
                className={`text-2xl font-bold ${
                  report.score.grade === 'S'
                    ? 'text-yellow-400'
                    : report.score.grade === 'A'
                    ? 'text-green-400'
                    : report.score.grade === 'B'
                    ? 'text-cyan-400'
                    : 'text-slate-500'
                }`}
              >
                {report.score.grade}
              </div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">准确率</div>
              <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">目标总数</div>
              <div className="text-2xl font-bold text-white">{report.targets.length}</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">完成时间</div>
              <div className="text-2xl font-bold text-white">{report.score.responseTime}s</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 border border-cyan-500/30 bg-cyan-500/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-cyan-400" />
                <span className="text-xs text-slate-400">误报率</span>
              </div>
              <div className="text-xl font-bold text-cyan-400">{report.score.falseAlarmRate}%</div>
            </div>
            <div className="p-3 border border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-green-400" />
                <span className="text-xs text-slate-400">响应时间</span>
              </div>
              <div className="text-xl font-bold text-green-400">{report.score.responseTime}s</div>
            </div>
            <div className="p-3 border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-yellow-400" />
                <span className="text-xs text-slate-400">群众影响</span>
              </div>
              <div className="text-xl font-bold text-yellow-400">{report.score.publicImpact}%</div>
            </div>
            <div className="p-3 border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck size={14} className="text-purple-400" />
                <span className="text-xs text-slate-400">证据完整度</span>
              </div>
              <div className="text-xl font-bold text-purple-400">{report.score.evidenceCompleteness}%</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">目标详情</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.targets.map((target, idx) => {
                const typeRef = TARGET_REFERENCES[target.trueType];
                const playerRef = target.playerType ? TARGET_REFERENCES[target.playerType] : null;

                return (
                  <div
                    key={target.id}
                    className="p-3 bg-slate-800/40 border border-slate-700/50"
                  >
                    <div className="grid grid-cols-12 gap-2 text-sm">
                      <div className="col-span-1 text-slate-500 font-mono">#{idx + 1}</div>
                      <div className="col-span-2">
                        <span className="font-bold" style={{ color: typeRef?.color }}>
                          {typeRef?.name || '未知'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {target.playerType ? (
                          <span style={{ color: playerRef?.color || '#888' }}>
                            {TYPE_NAMES[target.playerType]}
                          </span>
                        ) : (
                          <span className="text-slate-600">— 未判读 —</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        {target.playerType ? (
                          target.isCorrect ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <CheckCircle size={14} /> 正确
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              <XCircle size={14} /> 误判
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <AlertCircle size={14} /> 漏判
                          </span>
                        )}
                      </div>
                      <div className="col-span-2">
                        {target.disposalAction ? (
                          <StatusBadge
                            variant={
                              target.disposalAction === 'intercept'
                                ? 'danger'
                                : target.disposalAction === 'release'
                                ? 'info'
                                : 'warning'
                            }
                          >
                            {target.disposalAction === 'warn' && '喊话警告'}
                            {target.disposalAction === 'track' && '持续跟踪'}
                            {target.disposalAction === 'report' && '上报指挥'}
                            {target.disposalAction === 'intercept' && '拦截处置'}
                            {target.disposalAction === 'release' && '放行'}
                          </StatusBadge>
                        ) : (
                          <span className="text-slate-600">未处置</span>
                        )}
                      </div>
                      <div className="col-span-3 text-slate-500 text-xs">
                        <span className="text-slate-400">信号:</span>{' '}
                        {(target.signalStrength * 100).toFixed(0)}% ·
                        <span className="text-slate-400 ml-1">声纹:</span>{' '}
                        {target.soundFrequency.toFixed(1)}kHz
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <span>报告编号: {report.id}</span>
            <span>生成时间: {new Date(report.completedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
