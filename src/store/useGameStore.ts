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
  isPaused: boolean;

  setPhase: (phase: GamePhase) => void;
  startMission: (mission: Mission) => void;
  addTarget: (target: Target) => void;
  selectTarget: (target: Target | null) => void;
  identifyTarget: (targetId: string, type: string) => void;
  addFence: (fence: Fence) => void;
  removeFence: (fenceId: string) => void;
  addPatrol: (patrol: Patrol) => void;
  updatePatrol: (patrolId: string, updates: Partial<Patrol>) => void;
  addEvent: (event: GameEvent) => void;
  setDisposal: (targetId: string, action: string) => void;
  endMission: () => void;
  updateElapsedTime: (time: number) => void;
  resetGame: () => void;
  updateTargetPosition: (targetId: string, x: number, y: number) => void;
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
  isPaused: false,

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
    }),

  addTarget: (target) =>
    set((state) => ({
      detectedTargets: [...state.detectedTargets, target],
    })),

  selectTarget: (target) => set({ selectedTarget: target }),

  identifyTarget: (targetId, type) =>
    set((state) => {
      const target = state.detectedTargets.find((t) => t.id === targetId);
      if (!target) return state;

      const isCorrect =
        (type === 'blackFlight' && target.isBlackFlight) ||
        (type !== 'blackFlight' && !target.isBlackFlight);

      const event: GameEvent = {
        id: `event-${Date.now()}`,
        timestamp: Date.now(),
        type: 'identification',
        description: `目标 ${targetId} 识别为 ${type}`,
        targetId,
        result: isCorrect ? 'correct' : 'wrong',
      };

      return {
        detectedTargets: state.detectedTargets.map((t) =>
          t.id === targetId ? { ...t, identified: true, type: type as Target['type'] } : t
        ),
        events: [...state.events, event],
      };
    }),

  addFence: (fence) =>
    set((state) => ({
      fences: [...state.fences, fence],
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

  setDisposal: (targetId, action) =>
    set((state) => {
      const target = state.detectedTargets.find((t) => t.id === targetId);
      if (!target) return state;

      const event: GameEvent = {
        id: `event-${Date.now()}`,
        timestamp: Date.now(),
        type: 'disposal',
        description: `对目标 ${targetId} 执行 ${action}`,
        targetId,
      };

      return {
        detectedTargets: state.detectedTargets.map((t) =>
          t.id === targetId
            ? { ...t, disposalStatus: action as Target['disposalStatus'] }
            : t
        ),
        events: [...state.events, event],
      };
    }),

  endMission: () => {
    const state = get();
    const mission = state.currentMission;
    if (!mission) return;

    const blackFlightTargets = state.detectedTargets.filter((t) => t.isBlackFlight);
    const identifiedBlack = blackFlightTargets.filter((t) => t.identified && t.type === 'blackFlight');
    const falseAlarms = state.detectedTargets.filter(
      (t) => t.identified && t.type === 'blackFlight' && !t.isBlackFlight
    );

    const totalDetections = state.detectedTargets.filter((t) => t.identified).length;
    const falseAlarmRate = totalDetections > 0 ? falseAlarms.length / totalDetections : 0;

    const avgResponseTime = state.events.filter((e) => e.type === 'detection').length > 0
      ? 30
      : 60;

    const interceptedBlack = blackFlightTargets.filter(
      (t) => t.disposalStatus === 'intercept' || t.disposalStatus === 'track' || t.disposalStatus === 'warn'
    ).length;
    const publicImpact = 1 - (interceptedBlack / Math.max(blackFlightTargets.length, 1)) * 0.8;

    const evidenceCount = state.events.filter(
      (e) => e.type === 'identification' && e.result === 'correct'
    ).length;
    const evidenceCompleteness = Math.min(evidenceCount / Math.max(blackFlightTargets.length, 1), 1);

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
    }),

  updateTargetPosition: (targetId, x, y) =>
    set((state) => ({
      detectedTargets: state.detectedTargets.map((t) =>
        t.id === targetId ? { ...t, x, y } : t
      ),
    })),
}));

interface PlayerStore extends PlayerState {
  addExperience: (exp: number) => void;
  addScore: (score: number) => void;
  unlockSensor: (sensorId: string) => void;
  unlockFeature: (featureId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  addMissionResult: (result: MissionResult) => void;
  resetPlayer: () => void;
}

const initialPlayerState: PlayerState = {
  level: 1,
  experience: 0,
  totalScore: 0,
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
        })),

      unlockSensor: (sensorId) =>
        set((state) => ({
          unlockedSensors: [...state.unlockedSensors, sensorId],
        })),

      unlockFeature: (featureId) =>
        set((state) => ({
          unlockedFeatures: [...state.unlockedFeatures, featureId],
        })),

      unlockAchievement: (achievementId) =>
        set((state) => ({
          achievements: [...state.achievements, achievementId],
        })),

      addMissionResult: (result) =>
        set((state) => ({
          missionHistory: [...state.missionHistory, result],
        })),

      resetPlayer: () => set(initialPlayerState),
    }),
    {
      name: 'drone-patrol-player',
    }
  )
);

export { MISSIONS };
