// Core game types based on design document

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type MissionStatus = 'initialize' | 'briefing' | 'active' | 'critical' | 'completed' | 'failed';
export type AlertLevel = 'green' | 'yellow' | 'red' | 'black';
export type StationType = 'pilot' | 'gunner' | 'engineer' | 'commander' | 'comms' | 'gm';
export type PlayerRole = 'player' | 'gm' | 'spectator';
export type UserRole = 'admin' | 'gm' | 'player' | 'guest';

export interface GameSession {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  maxPlayers: number;
  gameMode: 'campaign' | 'scenario' | 'sandbox';
  settings: GameSettings;
  currentScenario?: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
}

export interface GameSettings {
  allowSpectators: boolean;
  voiceChatEnabled: boolean;
  autoSave: boolean;
  pauseOnDisconnect: boolean;
  maxSessionDuration: number; // minutes
  stationLockTimeout: number; // seconds
}

export interface GameState {
  sessionId: string;
  missionStatus: MissionStatus;
  alertLevel: AlertLevel;
  systems: SystemsState;
  navigation: NavigationState;
  weapons: WeaponsState;
  communications: CommunicationsState;
  engineering: EngineeringState;
  command: CommandState;
  environment: EnvironmentState;
  timestamp: Date;
  version: number; // For optimistic locking
}

export interface SystemsState {
  hull: SystemComponent;
  shields: SystemComponent;
  weapons: SystemComponent;
  engines: SystemComponent;
  power: SystemComponent;
  communications: SystemComponent;
  sensors: SystemComponent;
  lifeSupport: SystemComponent;
}

export interface SystemComponent {
  health: number; // 0-100
  power: number; // 0-100
  efficiency: number; // 0-100
  temperature: number; // 0-100
  status: 'operational' | 'damaged' | 'critical' | 'offline';
  repairProgress?: number; // 0-100 if being repaired
  lastDamaged?: Date;
}

export interface NavigationState {
  position: Vector3D;
  heading: Vector3D;
  velocity: Vector3D;
  speed: number; // 0-100 (percentage of max speed)
  altitude: number;
  hyperspaceStatus: 'ready' | 'charging' | 'jumping' | 'cooldown';
  hyperspaceCharge: number; // 0-100
  fuel: number; // 0-100
  autopilot: boolean;
  navigationLock: boolean;
  proximityAlerts: ProximityAlert[];
}

export interface ProximityAlert {
  id: string;
  type: 'asteroid' | 'ship' | 'station' | 'planet';
  distance: number;
  bearing: number;
  threat: 'none' | 'low' | 'medium' | 'high';
}

export interface WeaponsState {
  turbolasers: WeaponSystem[];
  missiles: MissileSystem;
  ionCannons: WeaponSystem[];
  targeting: TargetingSystem;
}

export interface WeaponSystem {
  id: string;
  type: 'turbolaser' | 'ion_cannon' | 'laser_cannon';
  status: 'ready' | 'charging' | 'firing' | 'cooldown' | 'damaged';
  charge: number; // 0-100
  heat: number; // 0-100
  ammunition?: number; // for projectile weapons
  range: number;
  accuracy: number; // 0-100
  damage: number;
  cooldownTime: number; // seconds
}

export interface MissileSystem {
  protonTorpedoes: number;
  concussionMissiles: number;
  ionTorpedoes: number;
  launcherStatus: 'ready' | 'loading' | 'damaged';
  lockStatus: 'none' | 'acquiring' | 'locked';
  selectedMissileType: 'proton' | 'concussion' | 'ion';
}

export interface TargetingSystem {
  currentTarget?: Target;
  availableTargets: Target[];
  scannerRange: number;
  resolution: number; // 0-100
  jamming: number; // 0-100 (interference level)
}

export interface Target {
  id: string;
  type: 'ship' | 'station' | 'asteroid' | 'debris';
  position: Vector3D;
  velocity: Vector3D;
  size: 'small' | 'medium' | 'large' | 'capital';
  threat: 'none' | 'low' | 'medium' | 'high' | 'critical';
  shields: number; // 0-100
  hull: number; // 0-100
  distance: number;
  bearing: number;
}

export interface CommunicationsState {
  primaryFrequency: number;
  secondaryFrequency: number;
  encryptionKey?: string;
  signalStrength: number; // 0-100
  interference: number; // 0-100
  transmissionStatus: 'standby' | 'transmitting' | 'receiving' | 'jammed';
  messageQueue: Message[];
  activeChannels: CommChannel[];
  emergencyBeacon: boolean;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  encrypted: boolean;
  acknowledged: boolean;
}

export interface CommChannel {
  frequency: number;
  name: string;
  encrypted: boolean;
  participants: string[];
  active: boolean;
}

export interface EngineeringState {
  powerDistribution: PowerDistribution;
  repairQueue: RepairTask[];
  diagnostics: SystemDiagnostic[];
}

export interface PowerDistribution {
  totalPower: number; // 0-100
  reactorOutput: number; // 0-100
  powerAllocations: {
    weapons: number; // 0-100
    shields: number; // 0-100
    engines: number; // 0-100
    sensors: number; // 0-100
    lifeSupport: number; // 0-100
    communications: number; // 0-100
  };
  batteryBackup: number; // 0-100
  emergencyPower: boolean;
}

export interface RepairTask {
  id: string;
  system: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  estimatedTime: number; // minutes
  progress: number; // 0-100
  assignedCrew: number;
  requiredParts: string[];
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
}

export interface SystemDiagnostic {
  system: string;
  status: 'healthy' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  autoRepair: boolean;
}

export interface CommandState {
  battleStations: boolean;
  generalQuarters: boolean;
  commandOverride: boolean;
  tacticalDisplay: TacticalDisplay;
  missionObjectives: MissionObjective[];
  crewStatus: CrewMember[];
}

export interface TacticalDisplay {
  zoom: number;
  center: Vector3D;
  overlays: {
    threats: boolean;
    friendlies: boolean;
    navigation: boolean;
    communications: boolean;
  };
  contacts: TacticalContact[];
}

export interface TacticalContact {
  id: string;
  type: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  position: Vector3D;
  velocity: Vector3D;
  classification: string;
  threat: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastUpdate: Date;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeLimit?: Date;
  rewards: string[];
}

export interface CrewMember {
  id: string;
  name: string;
  rank: string;
  station: StationType;
  status: 'active' | 'injured' | 'offline' | 'deceased';
  efficiency: number; // 0-100
  morale: number; // 0-100
}

export interface EnvironmentState {
  sector: string;
  region: string;
  hazards: EnvironmentalHazard[];
  celestialBodies: CelestialBody[];
  spatialAnomalies: SpatialAnomaly[];
}

export interface EnvironmentalHazard {
  id: string;
  type: 'asteroid_field' | 'ion_storm' | 'gravity_well' | 'radiation';
  position: Vector3D;
  radius: number;
  intensity: number; // 0-100
  duration?: number; // minutes, if temporary
  effects: string[];
}

export interface CelestialBody {
  id: string;
  name: string;
  type: 'planet' | 'moon' | 'star' | 'asteroid' | 'station';
  position: Vector3D;
  mass: number;
  radius: number;
  gravitationalPull: number;
}

export interface SpatialAnomaly {
  id: string;
  type: 'wormhole' | 'nebula' | 'black_hole' | 'hyperspace_distortion';
  position: Vector3D;
  radius: number;
  effects: AnomalyEffect[];
}

export interface AnomalyEffect {
  type: 'sensor_interference' | 'communication_disruption' | 'navigation_error' | 'power_drain';
  intensity: number; // 0-100
  duration: number; // seconds
}

export interface Player {
  id: string;
  sessionId: string;
  userId: string;
  station: StationType;
  role: PlayerRole;
  status: 'connected' | 'disconnected' | 'away';
  joinedAt: Date;
  lastActivity: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

// WebSocket Events
export interface SocketEvents {
  // Client to Server
  'join_session': (data: { sessionId: string; station: StationType; name?: string }) => void;
  'player_action': (data: { action: string; value: any; station: StationType }) => void;
  'gm_update': (data: { changes: Partial<GameState> }) => void;
  
  // Server to Client
  'state_update': (state: GameState) => void;
  'player_joined': (player: Player) => void;
  'player_left': (playerId: string) => void;
  'error': (error: { message: string; code?: string }) => void;
  'gm_notification': (notification: { type: string; data: any }) => void;
}