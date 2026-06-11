import { useNavigate } from 'react-router-dom';
import { Building2, Plane, Trophy, Factory, Home, Star, Lock, ChevronRight, Moon, Cloud, Target, Zap } from 'lucide-react';
import { useGameStore, usePlayerStore, MISSIONS } from '../store/useGameStore';
import { GlowButton } from '../components/common/GlowButton';
import type { Mission } from '../types/game';

const missionIcons: Record<string, React.ReactNode> = {
  business: <Building2 size={32} />,
  airport: <Plane size={32} />,
  event: <Trophy size={32} />,
  industrial: <Factory size={32} />,
  residential: <Home size={32} />,
};

const weatherNames: Record<string, string> = {
  clear: '晴朗',
  cloudy: '多云',
  rainy: '雨天',
  night: '夜间',
  rain: '暴雨',
  fog: '浓雾',
};

const featureLockInfo: Record<string, { label: string; icon: React.ReactNode }> = {
  'night-mode': { label: '需解锁「夜间模式」', icon: <Moon size={12} /> },
  'bad-weather': { label: '需解锁「恶劣天气」', icon: <Cloud size={12} /> },
  'multi-target-track': { label: '需解锁「多目标追踪」', icon: <Target size={12} /> },
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const startMission = useGameStore((state) => state.startMission);
  const { level, experience, totalScore, credits, unlockedFeatures, missionHistory } = usePlayerStore();

  const expToNextLevel = level * 500;
  const expProgress = (experience / expToNextLevel) * 100;

  const isMissionAvailable = (mission: Mission): boolean => {
    if (mission.requiredFeature) {
      return unlockedFeatures.includes(mission.requiredFeature);
    }
    return mission.unlocked;
  };

  const handleStartMission = (mission: Mission) => {
    if (!isMissionAvailable(mission)) return;
    startMission(mission);
    navigate('/monitor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
              <Plane className="text-cyan-400" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">
            低空黑飞巡防系统
          </h1>
          <p className="mt-2 text-cyan-400/60 text-sm tracking-widest">
            LOW-ALTITUDE DRONE PATROL SYSTEM
          </p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-sm p-6">
              <h2 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-cyan-400" />
                值守员信息
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">等级</span>
                    <span className="text-cyan-300 font-bold">Lv.{level}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${expProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1 text-right">
                    {experience} / {expToNextLevel} XP
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700/50">
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-400">
                      {credits}
                    </div>
                    <div className="text-xs text-slate-500">可用积分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-400">
                      {totalScore}
                    </div>
                    <div className="text-xs text-slate-500">总积分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">
                      {missionHistory.length}
                    </div>
                    <div className="text-xs text-slate-500">完成任务</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => navigate('/growth')}
                    className="w-full py-2 text-sm text-cyan-400 border border-cyan-500/30 hover:bg-cyan-400/10 transition-colors flex items-center justify-center gap-2"
                  >
                    成长系统
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-900/60 backdrop-blur-sm border border-yellow-500/30 rounded-sm p-6">
              <h2 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-yellow-400" />
                任务简报
              </h2>
              <div className="text-sm text-slate-300 space-y-2">
                <p>• 监测可疑空中目标</p>
                <p>• 识别黑飞无人机</p>
                <p>• 部署电子围栏</p>
                <p>• 执行处置行动</p>
                <p>• 降低误报率</p>
              </div>
            </div>
          </div>

          <div className="col-span-8">
            <h2 className="text-xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-400" />
              选择任务区域
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {MISSIONS.map((mission) => {
                const available = isMissionAvailable(mission);
                const lockInfo = mission.requiredFeature ? featureLockInfo[mission.requiredFeature] : null;

                return (
                  <div
                    key={mission.id}
                    className={`relative group ${
                      available ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    onClick={() => handleStartMission(mission)}
                  >
                    <div
                      className={`bg-slate-900/60 backdrop-blur-sm border rounded-sm p-5 transition-all duration-300 ${
                        available
                          ? mission.weather === 'night'
                            ? 'border-indigo-500/40 hover:border-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:-translate-y-1'
                            : mission.weather === 'rain' || mission.weather === 'fog'
                            ? 'border-blue-400/40 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:-translate-y-1'
                            : mission.requiredFeature === 'multi-target-track'
                            ? 'border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:-translate-y-1'
                            : 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:-translate-y-1'
                          : 'border-slate-700/50 opacity-60'
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        {available ? (
                          <div className="flex">
                            {Array.from({ length: Math.min(mission.difficulty, 6) }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < mission.difficulty
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-slate-600'
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <Lock size={16} className="text-slate-500" />
                        )}
                      </div>

                      <div
                        className={`w-14 h-14 rounded-sm flex items-center justify-center mb-3 ${
                          available
                            ? mission.weather === 'night'
                              ? 'bg-indigo-500/15 text-indigo-400'
                              : mission.weather === 'rain' || mission.weather === 'fog'
                              ? 'bg-blue-500/15 text-blue-400'
                              : mission.requiredFeature === 'multi-target-track'
                              ? 'bg-purple-500/15 text-purple-400'
                              : 'bg-cyan-500/10 text-cyan-400'
                            : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        {missionIcons[mission.type]}
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1">
                        {mission.name}
                      </h3>

                      <p className="text-xs text-slate-400 mb-3 h-8">
                        {mission.description}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          天气: {weatherNames[mission.weather] || mission.weather}
                        </span>
                        <span className="text-slate-500">
                          目标: {mission.targetCount}个
                        </span>
                      </div>

                      {!available && lockInfo && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-orange-400">
                          {lockInfo.icon}
                          {lockInfo.label}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-sm font-bold">
                            +{mission.reward}
                          </span>
                        </div>

                        {available && (
                          <span className="text-cyan-400 text-sm group-hover:translate-x-1 transition-transform">
                            开始 →
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
                        available ? 'block' : 'hidden'
                      }`}
                    >
                      <div
                        className={`absolute inset-0 blur-xl ${
                          mission.weather === 'night'
                            ? 'bg-indigo-400/5'
                            : mission.weather === 'rain' || mission.weather === 'fog'
                            ? 'bg-blue-400/5'
                            : mission.requiredFeature === 'multi-target-track'
                            ? 'bg-purple-400/5'
                            : 'bg-cyan-400/5'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>© 2024 低空黑飞巡防模拟系统 | 版本 1.0</p>
        </footer>
      </div>
    </div>
  );
}
