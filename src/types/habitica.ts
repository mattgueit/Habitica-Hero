export interface HabiticaUser {
  auth: {
    local: {
      username: string;
    }
  }
  stats: {
    lvl: number;
    hp: number;
    maxHealth: number;
    exp: number;
    toNextLevel: number;
    mp: number;
    maxMP: number;
  };
  party?: {
    _id?: string;
    quest?: {
      key: string;
      progress?: {
        up?: number;
        collectedItems?: number;
      };
    };
  };
}

export interface QuestData {
  name: string;
  type: string;
  boss_HP: number;
  image: string;
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
  scheduledTime: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}
