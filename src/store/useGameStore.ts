import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GamePhase,
  Mission,
  Target,
  Fence,
  Patrol,
  GameEvent,
  Score,
  PlayerState,
  MissionResult,
  TargetType,
  TargetSummary,
  TimelineEvent,
} from '../types/game';
import { MISSIONS } from '../data/gameData';

interface GameStore {
  currentPhase: GamePhase;
  currentMission: Mission | null;
  detectedTargets: Target[];
  selectedTarget: Target | null;
  fences: Fence[];
  patrols: Patrol[];
  events: GameEvent[];
  startTime: number;
  elapsedTime: number;
  score: Score | null;
  fullResult: MissionResult | null;
  isPaused: boolean;
  settled: boolean;
  generateFullResult: () => MissionResult | null;

  setPhase: (phase: GamePhase) => void;
  startMission: (mission: Mission) => void;
  addTarget: (target: Target) => void;
  selectTarget: (target: Target | null) => void;
  identifyTarget: (targetId: string, type: TargetType) => boolean;
  addFence: (fence: Fence) => void;
  updateFence: (fenceId: string, updates: Partial<Fence>) => void;
  updateFenceVertex: (fenceId: string, vertexIndex: number, x: number, y: number) => void;
  moveFence: (fenceId: string, offsetX: number, offsetY: number) => void;
  removeFence: (fenceId: string) => void;
  addPatrol: (patrol: Patrol) => void;
  updatePatrol: (patrolId: string, updates: Partial<Patrol>) => void;
  addEvent: (event: GameEvent) => void;
  setDisposal: (targetId: string, action: string) => void;
  setTargetRiskPath: (targetId: string, path: { x: number; y: number }[]) => void;
  endMission: () => void;
  updateElapsedTime: (time: number) => void;
  resetGame: () => void;
  updateTargetPosition: (targetId: string, x: number, y: number) => void;
  markSettled: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentPhase: 'lobby',
  currentMission: null,
  detectedTargets: [],
  selectedTarget: null,
  fences: [],
  patrols: [],
  events: [],
  startTime: 0,
  elapsedTime: 0,
  score: null,
  fullResult: null,
  isPaused: false,
  settled: false,

  setPhase: (phase) => set({ currentPhase: phase }),

  startMission: (mission) =>
    set({
      currentMission: mission,
      currentPhase: 'monitor',
      detectedTargets: [],
      selectedTarget: null,
      fences: [],
      patrols: [],
      events: [],
      startTime: Date.now(),
      elapsedTime: 0,
      score: null,
      fullResult: null,
      settled: false,
    }),

  addTarget: (target) =>
    set((state) => ({
      detectedTargets: [...state.detectedTargets, target],
    })),

  selectTarget: (target) => set({ selectedTarget: target }),

  identifyTarget: (targetId, type) => {
    const state = get();
    const target = state.detectedTargets.find((t) => t.id === targetId);
    if (!target) return false;
    if (target.identified) return false;

    const now = Date.now();
    const isCorrect = target.trueType === type;

    const typeNames: Record<TargetType, string> = {
      blackFlight: '黑飞无人机',
      bird: '鸟群',
      legitimate: '合法航线',
      noise: '设备噪声',
      unknown: '未知',
    };

    const event: GameEvent = {
      id: `event-${now}-${Math.random()}`,
      timestamp: now,
      type: 'identification',
      description: `目标识别为 ${typeNames[type]}${isCorrect ? ' ✓' : ' ✗'}`,
      targetId,
      result: isCorrect ? 'correct' : 'wrong',
      playerType: type,
      trueType: target.trueType,
    };

    set({
      detectedTargets: state.detectedTargets.map((t) =>
        t.id === targetId ? { ...t, identified: true, type, identifiedAt: now } : t
      ),
      events: [...state.events, event],
    });
    return true;
  },

  addFence: (fence) =>
    set((state) => ({
      fences: [...state.fences, fence],
    })),

  updateFence: (fenceId, updates) =>
    set((state) => ({
      fences: state.fences.map((f) =>
        f.id === fenceId ? { ...f, ...updates } : f
      ),
    })),

  updateFenceVertex: (fenceId, vertexIndex, x, y) =>
    set((state) => ({
      fences: state.fences.map((f) => {
        if (f.id !== fenceId) return f;
        const newVertices = [...f.vertices];
        newVertices[vertexIndex] = { x, y };
        return { ...f, vertices: newVertices };
      }),
    })),

  moveFence: (fenceId, offsetX, offsetY) =>
    set((state) => ({
      fences: state.fences.map((f) => {
        if (f.id !== fenceId) return f;
        return {
          ...f,
          vertices: f.vertices.map((v) => ({
            x: Math.max(0, Math.min(100, v.x + offsetX)),
            y: Math.max(0, Math.min(100, v.y + offsetY)),
          })),
        };
      }),
    })),

  removeFence: (fenceId) =>
    set((state) => ({
      fences: state.fences.filter((f) => f.id !== fenceId),
    })),

  addPatrol: (patrol) =>
    set((state) => ({
      patrols: [...state.patrols, patrol],
    })),

  updatePatrol: (patrolId, updates) =>
    set((state) => ({
      patrols: state.patrols.map((p) =>
        p.id === patrolId ? { ...p, ...updates } : p
      ),
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  setDisposal: (targetId, action) => {
    const state = get();
    const target = state.detectedTargets.find((t) => t.id === targetId);
    if (!target) return state;
    if (target.disposalStatus) return state;

    const now = Date.now();

    const actionNames: Record<string, string> = {
      warn: '喊话警告',
      track: '持续跟踪',
      report: '上报指挥',
      intercept: '拦截处置',
      release: '放行',
    };

    const event: GameEvent = {
      id: `event-${now}-${Math.random()}`,
      timestamp: now,
      type: 'disposal',
      description: `对目标执行 ${actionNames[action] || action}`,
      targetId,
      disposalAction: action,
    };

    return {
      detectedTargets: state.detectedTargets.map((t) =>
        t.id === targetId
          ? { ...t, disposalStatus: action as Target['disposalStatus'], disposedAt: now }
          : t
      ),
      events: [...state.events, event],
    };
  },

  setTargetRiskPath: (targetId, path) =>
    set((state) => ({
      detectedTargets: state.detectedTargets.map((t) =>
        t.id === targetId ? { ...t, riskPath: path } : t
      ),
    })),

  generateFullResult: () => {
    const state = get();
    const mission = state.currentMission;
    if (!mission) return null;

    const targets: TargetSummary[] = state.detectedTargets.map((t) => {
      const idEvent = state.events.find(
        (e) => e.type === 'identification' && e.targetId === t.id
      );
      const dpEvent = state.events.find(
        (e) => e.type === 'disposal' && e.targetId === t.id
      );
      const playerType = idEvent?.playerType as TargetType | undefined || (t.identified ? t.type : null);
      const isCorrect = idEvent ? idEvent.result === 'correct' : (playerType ? playerType === t.trueType : null);
      const disposalAction = (dpEvent?.disposalAction as Target['disposalStatus']) || t.disposalStatus || null;

      return {
        id: t.id,
        trueType: t.trueType,
        playerType,
        isCorrect,
        disposalAction,
        signalStrength: t.signalStrength,
        soundFrequency: t.soundFrequency,
        soundPattern: t.soundPattern,
        radarSignature: t.radarSignature,
        videoDescription: t.videoDescription,
        detectedAt: t.detectedAt,
        identifiedAt: t.identifiedAt || null,
        disposedAt: t.disposedAt || null,
      };
    });

    const typeNames: Record<TargetType, string> = {
      blackFlight: '黑飞无人机',
      bird: '鸟群',
      legitimate: '合法航线',
      noise: '设备噪声',
      unknown: '未识别',
    };

    const actionNames: Record<string, string> = {
      warn: '喊话警告',
      track: '持续跟踪',
      report: '上报指挥',
      intercept: '拦截处置',
      release: '放行',
    };

    const timeline: TimelineEvent[] = state.events
      .map((e) => {
        if (e.type === 'detection') {
          const t = state.detectedTargets.find((t) => t.id === e.targetId);
          return {
            id: e.id,
            timestamp: e.timestamp,
            type: 'detection' as const,
            title: '发现目标',
            description: t ? `目标出现，位置 ${t.x.toFixed(1)}, ${t.y.toFixed(1)}` : e.description,
            targetId: e.targetId,
            targetType: t?.trueType,
          };
        }
        if (e.type === 'identification') {
          const isCorrect = e.result === 'correct';
          return {
            id: e.id,
            timestamp: e.timestamp,
            type: 'identification' as const,
            title: isCorrect ? '判读正确' : '判读错误',
            description: `识别为「${typeNames[e.playerType as TargetType] || e.playerType}」，真实为「${typeNames[e.trueType as TargetType] || e.trueType}」`,
            targetId: e.targetId,
            targetType: e.trueType as TargetType,
            playerType: e.playerType as TargetType,
            result: e.result as 'correct' | 'wrong',
            correct: isCorrect,
          };
        }
        if (e.type === 'disposal') {
          return {
            id: e.id,
            timestamp: e.timestamp,
            type: 'disposal' as const,
            title: '执行处置',
            description: `执行措施：${actionNames[e.disposalAction || ''] || e.disposalAction}`,
            targetId: e.targetId,
            disposalAction: e.disposalAction as Target['disposalStatus'],
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.timestamp - b!.timestamp) as TimelineEvent[];

    const correctCount = targets.filter((t) => t.isCorrect === true).length;
    const wrongCount = targets.filter((t) => t.isCorrect === false).length;
    const unidentifiedCount = targets.filter((t) => t.isCorrect === null).length;

    const countByType = (type: TargetType) =>
      targets.filter((t) => t.trueType === type).length;

    return {
      id: '',
      missionId: mission.id,
      missionName: mission.name,
      missionType: mission.type,
      weather: mission.weather,
      score: state.score!,
      completedAt: Date.now(),
      targets,
      events: timeline,
      correctCount,
      wrongCount,
      unidentifiedCount,
      blackFlightCount: countByType('blackFlight'),
      birdCount: countByType('bird'),
      legitimateCount: countByType('legitimate'),
      noiseCount: countByType('noise'),
    };
  },

  endMission: () => {
    const state = get();
    const mission = state.currentMission;
    if (!mission) return;

    const identificationEvents = state.events.filter((e) => e.type === 'identification');
    const uniqueTargetIds = new Set(identificationEvents.map((e) => e.targetId));
    const correctIds = new Set(
      identificationEvents.filter((e) => e.result === 'correct').map((e) => e.targetId)
    );
    const wrongIds = new Set(
      identificationEvents.filter((e) => e.result === 'wrong').map((e) => e.targetId)
    );

    const correctCount = correctIds.size;
    const wrongCount = wrongIds.size;
    const totalIdentified = uniqueTargetIds.size;

    const blackFlightTargets = state.detectedTargets.filter((t) => t.trueType === 'blackFlight');
    const falseAlarmRate = totalIdentified > 0 ? wrongCount / totalIdentified : 0;

    const avgResponseTime = state.events.filter((e) => e.type === 'detection').length > 0
      ? 30
      : 60;

    const interceptedBlack = blackFlightTargets.filter(
      (t) => t.disposalStatus === 'intercept' || t.disposalStatus === 'track' || t.disposalStatus === 'warn'
    ).length;
    const publicImpact = 1 - (interceptedBlack / Math.max(blackFlightTargets.length, 1)) * 0.8;

    const evidenceCompleteness = Math.min(
      correctCount / Math.max(state.detectedTargets.length, 1),
      1
    );

    const falseAlarmScore = (1 - falseAlarmRate) * 25;
    const responseScore = Math.max(0, (60 - avgResponseTime) / 60) * 25;
    const impactScore = (1 - publicImpact) * 25;
    const evidenceScore = evidenceCompleteness * 25;

    const totalScore = Math.round(falseAlarmScore + responseScore + impactScore + evidenceScore);

    let grade = 'D';
    if (totalScore >= 90) grade = 'S';
    else if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 60) grade = 'C';

    const score: Score = {
      falseAlarmRate: Math.round(falseAlarmRate * 100),
      responseTime: avgResponseTime,
      publicImpact: Math.round(publicImpact * 100),
      evidenceCompleteness: Math.round(evidenceCompleteness * 100),
      total: totalScore,
      grade,
    };

    set({
      currentPhase: 'review',
      score,
    });

    setTimeout(() => {
      const full = get().generateFullResult();
      if (full) {
        set({ fullResult: full });
      }
    }, 0);
  },

  updateElapsedTime: (time) => set({ elapsedTime: time }),

  resetGame: () =>
    set({
      currentPhase: 'lobby',
      currentMission: null,
      detectedTargets: [],
      selectedTarget: null,
      fences: [],
      patrols: [],
      events: [],
      startTime: 0,
      elapsedTime: 0,
      score: null,
      fullResult: null,
      settled: false,
    }),

  updateTargetPosition: (targetId, x, y) =>
    set((state) => ({
      detectedTargets: state.detectedTargets.map((t) =>
        t.id === targetId ? { ...t, x, y } : t
      ),
    })),

  markSettled: () => set({ settled: true }),
}));

interface PlayerStore extends PlayerState {
  addExperience: (exp: number) => void;
  addScore: (score: number) => void;
  spendCredits: (amount: number) => boolean;
  unlockSensor: (sensorId: string, cost: number) => boolean;
  unlockFeature: (featureId: string, cost: number) => boolean;
  unlockAchievement: (achievementId: string) => void;
  addMissionResult: (result: MissionResult) => boolean;
  resetPlayer: () => void;
}

const initialPlayerState: PlayerState = {
  level: 1,
  experience: 0,
  totalScore: 0,
  credits: 200,
  unlockedSensors: ['basic-radar'],
  unlockedFeatures: [],
  achievements: [],
  missionHistory: [],
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialPlayerState,

      addExperience: (exp) => {
        const state = get();
        const newExp = state.experience + exp;
        const expToLevel = state.level * 500;
        const newLevel = newExp >= expToLevel ? state.level + 1 : state.level;
        const remainingExp = newExp >= expToLevel ? newExp - expToLevel : newExp;

        set({
          experience: remainingExp,
          level: newLevel,
        });
      },

      addScore: (score) =>
        set((state) => ({
          totalScore: state.totalScore + score,
          credits: state.credits + score,
        })),

      spendCredits: (amount) => {
        const state = get();
        if (state.credits < amount) return false;
        set({ credits: state.credits - amount });
        return true;
      },

      unlockSensor: (sensorId, cost) => {
        const state = get();
        if (state.unlockedSensors.includes(sensorId)) return false;
        if (state.credits < cost) return false;

        set({
          credits: state.credits - cost,
          unlockedSensors: [...state.unlockedSensors, sensorId],
        });
        return true;
      },

      unlockFeature: (featureId, cost) => {
        const state = get();
        if (state.unlockedFeatures.includes(featureId)) return false;
        if (state.credits < cost) return false;

        set({
          credits: state.credits - cost,
          unlockedFeatures: [...state.unlockedFeatures, featureId],
        });
        return true;
      },

      unlockAchievement: (achievementId) =>
        set((state) => ({
          achievements: state.achievements.includes(achievementId)
            ? state.achievements
            : [...state.achievements, achievementId],
        })),

      addMissionResult: (result) => {
        const state = get();
        if (state.missionHistory.some((r) => r.id === result.id)) {
          return false;
        }
        set((state) => ({
          missionHistory: [...state.missionHistory, result],
        }));
        return true;
      },

      resetPlayer: () => set(initialPlayerState),
    }),
    {
      name: 'drone-patrol-player',
    }
  )
);

export { MISSIONS };
