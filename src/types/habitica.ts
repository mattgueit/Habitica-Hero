export interface HabiticaUser {
  username: string;
  stats: {
    hp: number;
    maxHealth: number;
    exp: number;
    toNextLevel: number;
    mp: number;
    maxMP: number;
  };
  party?: {
    quest?: {
      key: string;
      progress?: {
        hp?: number;
        collect?: Record<string, { count: number; total: number }>;
      };
    };
  };
}

export interface AbilityConfig {
  id: string;
  name: string;
  type: 'buff' | 'attack' | 'heal' | 'special';
  icon: string;
  endpoint: string;
  minIterations: number;
  maxIterations: number;
}

export interface CastResponse {
  id: string;
  httpCode: number;
  timeElapsed: number;
  responseSize: number;
  timestamp: Date;
}
