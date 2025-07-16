// Basic types for the Bridge Simulator
export interface SystemComponent {
  health: number;
  status: 'operational' | 'damaged' | 'critical';
  temperature: number;
  efficiency: number;
}

export interface GameState {
  sessionId: string;
  players: { [key: string]: { name: string; station: string } };
  systems: {
    power: number;
    shields: number;
    weapons: number;
    engines: number;
    hull?: SystemComponent;
    sensors?: SystemComponent;
    lifeSupport?: SystemComponent;
    communications?: SystemComponent;
  };
  alertLevel?: 'green' | 'yellow' | 'red' | 'black';
  missionStatus?: string;
  navigation?: any;
  communications?: {
    primaryFrequency: number;
    secondaryFrequency: number;
    signalStrength: number;
    interference: number;
    transmissionStatus: string;
    emergencyBeacon: boolean;
    messageQueue: Message[];
  };
  engineering?: {
    powerDistribution: {
      totalPower: number;
      reactorOutput: number;
      emergencyPower: boolean;
      batteryBackup: number;
      powerAllocations: {
        [key: string]: number;
      };
    };
    repairQueue: any[];
    diagnostics: any[];
  };
  weapons?: any;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  encrypted: boolean;
  timestamp: number;
  acknowledged: boolean;
}

export interface CommChannel {
  name: string;
  frequency: number;
  encrypted: boolean;
  active: boolean;
  participants: string[];
}

export type StationType = 'pilot' | 'gunner' | 'engineer' | 'commander' | 'comms' | 'gm';