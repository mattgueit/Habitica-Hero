export interface HabiticaUser {
  auth: {
    local: {
      username: string;
    }
  }
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
        up?: number;
        collectedItems?: number;
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
  icon: string;
  httpCode: number;
  timeElapsed: number;
  responseSize: number;
  timestamp: Date;
}

export interface ScheduledCast {
  id: string;
  ability: AbilityConfig;
  iterations: number;
  delay: number;
  scheduledTime: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}
