export type TargetType = 'blackFlight' | 'bird' | 'legitimate' | 'noise' | 'unknown';

export type MissionType = 'business' | 'airport' | 'event' | 'industrial' | 'residential';

export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'night' | 'rain' | 'fog';

export type FenceLevel = 'low' | 'medium' | 'high';

export type DisposalAction = 'warn' | 'track' | 'report' | 'intercept' | 'release';

export type GamePhase = 'lobby' | 'monitor' | 'identify' | 'map' | 'dispose' | 'review';

export interface Target {
  id: string;
  type: TargetType;
  trueType: TargetType;
  x: number;
  y: number;
  speed: number;
  direction: number;
  altitude: number;
  signalStrength: number;
  soundFrequency: number;
  soundPattern: string;
  radarSignature: string;
  videoDescription: string;
  isBlackFlight: boolean;
  detected: boolean;
  identified: boolean;
  disposalStatus?: DisposalAction;
  riskPath?: { x: number; y: number }[];
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  difficulty: number;
  description: string;
  duration: number;
  weather: WeatherType;
  targetCount: number;
  blackFlightCount: number;
  reward: number;
  unlocked: boolean;
  requiredFeature?: string;
}

export interface Fence {
  id: string;
  name: string;
  level: FenceLevel;
  vertices: { x: number; y: number }[];
  color: string;
}

export interface Patrol {
  id: string;
  x: number;
  y: number;
  status: 'idle' | 'patrolling' | 'investigating' | 'returning';
  targetId?: string;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'detection' | 'identification' | 'fence' | 'patrol' | 'disposal' | 'warning';
  description: string;
  targetId?: string;
  result?: 'correct' | 'wrong';
  playerType?: TargetType;
  trueType?: TargetType;
  disposalAction?: string;
}

export interface Score {
  falseAlarmRate: number;
  responseTime: number;
  publicImpact: number;
  evidenceCompleteness: number;
  total: number;
  grade: string;
}

export interface PlayerState {
  level: number;
  experience: number;
  totalScore: number;
  credits: number;
  unlockedSensors: string[];
  unlockedFeatures: string[];
  achievements: string[];
  missionHistory: MissionResult[];
}

export interface MissionResult {
  id: string;
  missionId: string;
  missionName: string;
  score: Score;
  completedAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: string;
}

export interface Sensor {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  cost: number;
  level: number;
}
