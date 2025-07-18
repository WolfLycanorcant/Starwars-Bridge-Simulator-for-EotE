# Star Destroyer Bridge Simulator - Redesign Document

## Overview

A complete redesign of the multiplayer Star Wars-themed spaceship bridge simulator, focusing on scalability, reliability, and enhanced gameplay experience.

## Current System Analysis

### Strengths
- Engaging real-time collaborative gameplay
- Clear role separation between bridge stations
- Simple WebSocket-based communication
- Intuitive station-based interface

### Critical Issues
- No data persistence (state lost on restart)
- Security vulnerabilities (no authentication/authorization)
- Monolithic architecture
- Poor error handling and recovery
- Limited scalability

## Design Goals

### Primary Objectives
1. **Reliability**: Persistent state, connection recovery, proper error handling
2. **Security**: Authentication, input validation, role-based access control
3. **Scalability**: Support multiple concurrent games, horizontal scaling
4. **Maintainability**: Modular architecture, proper separation of concerns
5. **Enhanced UX**: Better feedback, mobile support, session persistence

### Secondary Objectives
- Voice chat integration
- Advanced game mechanics (scenarios, events)
- Spectator mode
- Game session recording/replay

## Architecture Overview

### Technology Stack
- **Backend**: Node.js with TypeScript
- **Framework**: Express.js with Socket.IO
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **Frontend**: React with TypeScript
- **Real-time**: Socket.IO with Redis adapter
- **Authentication**: JWT tokens
- **Deployment**: Docker containers

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Client    │    │   Game Client   │
│    (nginx)      │    │    (React)      │    │    (React)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │              ┌───────┴──────────────────────┴───────┐
          │              │           API Gateway                │
          │              │        (Express + Socket.IO)        │
          │              └───────┬──────────────────────────────┘
          │                      │
    ┌─────┴──────┐    ┌─────────┴─────────┐    ┌─────────────────┐
    │   Game     │    │   Authentication  │    │   Notification  │
    │  Service   │    │     Service       │    │    Service      │
    └─────┬──────┘    └─────────┬─────────┘    └─────────────────┘
          │                     │
    ┌─────┴──────┐    ┌─────────┴─────────┐
    │ PostgreSQL │    │      Redis        │
    │ (Primary)  │    │ (Cache/Sessions)  │
    └────────────┘    └───────────────────┘
```

## Data Models & Core Objects

### Game Session
```typescript
interface GameSession {
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

interface GameSettings {
  allowSpectators: boolean;
  voiceChatEnabled: boolean;
  autoSave: boolean;
  pauseOnDisconnect: boolean;
  maxSessionDuration: number; // minutes
  stationLockTimeout: number; // seconds
}
```

### Complete Game State
```typescript
interface GameState {
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

type MissionStatus = 'initialize' | 'briefing' | 'active' | 'critical' | 'completed' | 'failed';
type AlertLevel = 'green' | 'yellow' | 'red' | 'black';
```

### Systems State
```typescript
interface SystemsState {
  hull: SystemComponent;
  shields: SystemComponent;
  weapons: SystemComponent;
  engines: SystemComponent;
  power: SystemComponent;
  communications: SystemComponent;
  sensors: SystemComponent;
  lifeSupport: SystemComponent;
}

interface SystemComponent {
  health: number; // 0-100
  power: number; // 0-100
  efficiency: number; // 0-100
  temperature: number; // 0-100
  status: 'operational' | 'damaged' | 'critical' | 'offline';
  repairProgress?: number; // 0-100 if being repaired
  lastDamaged?: Date;
}
```

### Navigation State
```typescript
interface NavigationState {
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

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface ProximityAlert {
  id: string;
  type: 'asteroid' | 'ship' | 'station' | 'planet';
  distance: number;
  bearing: number;
  threat: 'none' | 'low' | 'medium' | 'high';
}
```

### Weapons State
```typescript
// Enhanced Weapons State with Modular Vehicle Integration
interface WeaponsState {
  // Core weapon systems
  turbolasers: WeaponSystem[];
  missiles: MissileSystem;
  ionCannons: WeaponSystem[];
  tractorBeam: TractorBeamSystem;
  shields: ShieldSystem;
  targeting: TargetingSystem;
  fireControl: FireControlSystem;
  
  // Enhanced modular systems
  activeVehicle: VehicleConfiguration;
  availableVehicles: VehicleConfiguration[];
  modularWeaponPanels: ModularWeaponPanel[];
  weaponZeroingSystem: WeaponZeroingSystem;
  vehicleWeaponDatabase: VehicleWeaponDatabase;
}

interface WeaponSystem {
  id: string;
  type: 'turbolaser' | 'ion_cannon' | 'laser_cannon' | 'vehicle_weapon';
  status: 'ready' | 'charging' | 'firing' | 'cooldown' | 'damaged' | 'zeroing';
  charge: number; // 0-100
  heat: number; // 0-100
  ammunition?: number; // for projectile weapons
  range: number;
  accuracy: number; // 0-100
  damage: number;
  cooldownTime: number; // seconds
  zeroingCalibration: ZeroingCalibration;
  vehicleSource?: string; // XML filename if from vehicle database
}

interface MissileSystem {
  protonTorpedoes: number;
  concussionMissiles: number;
  ionTorpedoes: number;
  launcherStatus: 'ready' | 'loading' | 'damaged';
  lockStatus: 'none' | 'acquiring' | 'locked';
  selectedMissileType: 'proton' | 'concussion' | 'ion';
  zeroingCalibration: ZeroingCalibration;
}

interface TargetingSystem {
  currentTarget?: Target;
  availableTargets: Target[];
  scannerRange: number;
  resolution: number; // 0-100
  jamming: number; // 0-100 (interference level)
  zeroingMode: boolean;
  zeroingTargets: ZeroingTarget[];
}

// Modular Vehicle Weapon System Integration
interface ModularWeaponPanel {
  id: string;
  vehicleSource: string; // XML filename from helpers/Vehicles/
  weaponSystems: VehicleWeaponSystem[];
  position: PanelPosition;
  isActive: boolean;
  canBeRemoved: boolean;
}

interface VehicleConfiguration {
  name: string; // From XML vehicle name
  xmlSource: string; // helpers/Vehicles/[filename].xml
  weapons: VehicleWeaponSystem[];
  description: string;
  classification: string;
}

interface VehicleWeaponSystem {
  id: string;
  name: string;
  type: string; // From XML <Type>Vehicle</Type>
  damage: number;
  range: number;
  accuracy: number;
  ammunition?: number;
  fireRate: number;
  energyCost: number;
  xmlSource: string; // helpers/Weapons/[filename].xml
  zeroingCalibration: ZeroingCalibration;
}

// Interactive Weapon Zeroing System
interface WeaponZeroingSystem {
  isActive: boolean;
  currentWeapon?: string;
  zeroingExercise: ZeroingExercise;
  calibrationHistory: CalibrationRecord[];
  targetingAccuracy: number; // 0-100
}

interface ZeroingExercise {
  type: 'static_target' | 'moving_target' | 'precision_drill' | 'rapid_fire';
  difficulty: 'novice' | 'intermediate' | 'expert' | 'ace';
  targets: ZeroingTarget[];
  timeLimit: number; // seconds
  shotsAllowed: number;
  currentShot: number;
  score: number;
  status: 'ready' | 'active' | 'completed' | 'failed';
}

interface ZeroingTarget {
  id: string;
  position: Vector3D;
  velocity?: Vector3D; // for moving targets
  size: 'small' | 'medium' | 'large';
  hitRadius: number;
  isHit: boolean;
  hitAccuracy?: number; // distance from center
  timeToHit?: number;
}

interface ZeroingCalibration {
  horizontalOffset: number; // -100 to 100
  verticalOffset: number; // -100 to 100
  rangeCompensation: number; // -100 to 100
  windageAdjustment: number; // -100 to 100
  lastCalibrated: Date;
  calibrationQuality: 'poor' | 'fair' | 'good' | 'excellent';
  shotsToZero: number;
}

interface CalibrationRecord {
  weaponId: string;
  timestamp: Date;
  exerciseType: string;
  score: number;
  accuracy: number;
  adjustments: ZeroingCalibration;
  operator: string;
}

// Vehicle Weapon Database Integration
interface VehicleWeaponDatabase {
  vehicles: VehicleEntry[];
  weapons: WeaponEntry[];
  lastUpdated: Date;
}

interface VehicleEntry {
  filename: string; // from helpers/Vehicles/
  name: string;
  classification: string;
  weapons: string[]; // weapon IDs
  description: string;
  manufacturer?: string;
  era?: string;
}

interface WeaponEntry {
  filename: string; // from helpers/Weapons/
  name: string;
  type: string; // must be "Vehicle" for modular weapons
  specifications: WeaponSpecifications;
  compatibleVehicles: string[];
}

interface WeaponSpecifications {
  damage: number;
  range: number;
  accuracy: number;
  fireRate: number;
  energyCost: number;
  ammunition?: number;
  specialProperties: string[];
}

interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface Target {
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
```

### Communications State
```typescript
interface CommunicationsState {
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

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  encrypted: boolean;
  acknowledged: boolean;
}

interface CommChannel {
  frequency: number;
  name: string;
  encrypted: boolean;
  participants: string[];
  active: boolean;
}
```

### Engineering State
```typescript
interface EngineeringState {
  powerDistribution: PowerDistribution;
  repairQueue: RepairTask[];
  diagnostics: SystemDiagnostic[];
  emergencyProtocols: EmergencyProtocol[];
  maintenanceSchedule: MaintenanceTask[];
}

interface PowerDistribution {
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

interface RepairTask {
  id: string;
  system: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  estimatedTime: number; // minutes
  progress: number; // 0-100
  assignedCrew: number;
  requiredParts: string[];
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
}

interface SystemDiagnostic {
  system: string;
  status: 'healthy' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  autoRepair: boolean;
}
```

### Command State
```typescript
interface CommandState {
  battleStations: boolean;
  generalQuarters: boolean;
  commandOverride: boolean;
  tacticalDisplay: TacticalDisplay;
  missionObjectives: MissionObjective[];
  crewStatus: CrewMember[];
  strategicAssets: StrategicAsset[];
}

interface TacticalDisplay {
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

interface TacticalContact {
  id: string;
  type: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  position: Vector3D;
  velocity: Vector3D;
  classification: string;
  threat: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastUpdate: Date;
}

interface MissionObjective {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeLimit?: Date;
  rewards: string[];
}

interface CrewMember {
  id: string;
  name: string;
  rank: string;
  station: StationType;
  status: 'active' | 'injured' | 'offline' | 'deceased';
  efficiency: number; // 0-100
  morale: number; // 0-100
}
```

### Environment State
```typescript
interface EnvironmentState {
  sector: string;
  region: string;
  hazards: EnvironmentalHazard[];
  celestialBodies: CelestialBody[];
  spatialAnomalies: SpatialAnomaly[];
  traffic: TrafficContact[];
  weather: SpaceWeather;
}

interface EnvironmentalHazard {
  id: string;
  type: 'asteroid_field' | 'ion_storm' | 'gravity_well' | 'radiation';
  position: Vector3D;
  radius: number;
  intensity: number; // 0-100
  duration?: number; // minutes, if temporary
  effects: string[];
}

interface CelestialBody {
  id: string;
  name: string;
  type: 'planet' | 'moon' | 'star' | 'asteroid' | 'station';
  position: Vector3D;
  mass: number;
  radius: number;
  gravitationalPull: number;
}

interface SpatialAnomaly {
  id: string;
  type: 'wormhole' | 'nebula' | 'black_hole' | 'hyperspace_distortion';
  position: Vector3D;
  radius: number;
  effects: AnomalyEffect[];
}

interface AnomalyEffect {
  type: 'sensor_interference' | 'communication_disruption' | 'navigation_error' | 'power_drain';
  intensity: number; // 0-100
  duration: number; // seconds
}
```

### Player & User Management
```typescript
interface Player {
  id: string;
  sessionId: string;
  userId: string;
  station: StationType;
  role: 'player' | 'gm' | 'spectator';
  status: 'connected' | 'disconnected' | 'away';
  joinedAt: Date;
  lastActivity: Date;
  permissions: Permission[];
}

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'gm' | 'player' | 'guest';
  profile: UserProfile;
  preferences: UserPreferences;
  statistics: UserStatistics;
  createdAt: Date;
  lastLogin: Date;
}

interface UserProfile {
  displayName: string;
  avatar?: string;
  bio?: string;
  preferredStations: StationType[];
  experienceLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
}

interface UserPreferences {
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  voiceChatEnabled: boolean;
  notifications: NotificationSettings;
  ui: UIPreferences;
}

interface UserStatistics {
  gamesPlayed: number;
  hoursPlayed: number;
  favoriteStation: StationType;
  winRate: number;
  averageSessionLength: number;
  achievements: Achievement[];
}

type StationType = 'pilot' | 'gunner' | 'engineer' | 'commander' | 'comms' | 'gm';
```

### Events & Scenarios
```typescript
interface GameEvent {
  id: string;
  type: EventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedSystems: string[];
  triggers: EventTrigger[];
  effects: EventEffect[];
  duration?: number; // seconds
  autoResolve: boolean;
  resolutionActions: string[];
  timestamp: Date;
}

type EventType = 
  | 'system_damage' 
  | 'enemy_contact' 
  | 'mission_update' 
  | 'environmental_hazard'
  | 'crew_emergency'
  | 'communication_intercept'
  | 'navigation_anomaly'
  | 'power_fluctuation';

interface EventTrigger {
  condition: string; // e.g., "hull < 50"
  probability: number; // 0-100
  cooldown?: number; // seconds
}

interface EventEffect {
  target: string; // system or state property
  modification: {
    type: 'set' | 'add' | 'multiply' | 'toggle';
    value: any;
  };
  duration?: number; // seconds, 0 for permanent
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  estimatedDuration: number; // minutes
  minPlayers: number;
  maxPlayers: number;
  requiredStations: StationType[];
  initialState: Partial<GameState>;
  events: GameEvent[];
  objectives: MissionObjective[];
  briefing: string;
  debriefing: string;
  tags: string[];
}
```

### Audio & Visual Effects
```typescript
interface SoundEffect {
  id: string;
  name: string;
  file: string;
  volume: number; // 0-100
  loop: boolean;
  spatial: boolean; // 3D positioned audio
  triggers: SoundTrigger[];
}

interface SoundTrigger {
  event: string; // game event that triggers sound
  conditions?: string[]; // additional conditions
  delay?: number; // milliseconds
}

interface VisualEffect {
  id: string;
  type: 'particle' | 'animation' | 'shader' | 'ui_highlight';
  target: string; // UI element or game object
  duration: number; // milliseconds
  properties: Record<string, any>;
  triggers: VisualTrigger[];
}

interface VisualTrigger {
  event: string;
  conditions?: string[];
  delay?: number;
}
```

## Core Services

### 1. Authentication Service
- JWT-based authentication
- Role-based access control (Player, GM, Admin)
- Session management
- Guest access for quick games

### 2. Game Service
- Game session lifecycle management
- State validation and persistence
- Event sourcing for game actions
- Conflict resolution for concurrent updates

### 3. Real-time Communication Service
- WebSocket connection management
- Room-based message routing
- Connection recovery and reconnection
- State synchronization

### 4. Notification Service
- In-game notifications
- System alerts
- Player status updates
- Game event broadcasting

## Security Considerations

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based permissions per station
- GM-only actions protected
- Rate limiting on all endpoints

### Input Validation
- Schema validation for all game actions
- Sanitization of user inputs
- Bounds checking for numeric values
- State transition validation

### Data Protection
- Encrypted connections (HTTPS/WSS)
- Sensitive data encryption at rest
- Audit logging for GM actions
- GDPR compliance considerations

## Game Mechanics Enhancements

### Event System
```typescript
interface GameEvent {
  id: string;
  type: 'system_damage' | 'enemy_contact' | 'mission_update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  description: string;
  autoResolve: boolean;
  duration?: number;
}
```

### Scenario Framework
- Pre-built scenarios with scripted events
- Dynamic difficulty adjustment
- Branching storylines based on player actions
- Performance metrics and scoring

### Station-Specific Features

#### Navigation
- 3D coordinate system
- Hyperspace jump mechanics
- Collision detection
- Fuel consumption tracking

#### Weapons
- Weapon charging and cooldown systems
- Ammunition tracking
- Targeting computer integration
- Damage calculation
- Interactive weapon zeroing/calibration exercises
- Modular weapon system interface with dynamic vehicle integration
- Real-time vehicle weapon configuration from XML database

#### Enhanced Weapons Module System
- **Dynamic Module Management**: Add and remove weapon modules through dropdown selection interface
- **Flexible Positioning**: Drag-and-drop weapon modules to any position on the screen for customized layouts
- **Individual Heat Management**: Each energy weapon displays its own heat bar that increases when fired and gradually cools down over time
- **Torpedo Bay Integration**: Centralized ammunition tracking for proton torpedoes, concussion missiles, ion torpedoes, and rockets
- **Smart Ammunition Display**: Only shows ammunition types that are currently available and relevant to equipped weapons
- **Automatic Consumption Tracking**: Ammunition counts automatically decrease when firing weapons that require it
- **Firing State Management**: Weapons are automatically disabled when out of ammunition to prevent invalid firing attempts

#### Engineering
- Power distribution optimization
- Repair mini-games
- System diagnostics
- Emergency protocols

#### Communications
- Encrypted message channels
- Signal interference mechanics
- Long-range communication delays
- Emergency broadcast systems

## Implementation Phases

### Phase 1: Foundation (4-6 weeks)
- Set up development environment
- Implement authentication service
- Create basic data models
- Set up database schema
- Basic WebSocket infrastructure

### Phase 2: Core Gameplay (6-8 weeks)
- Game session management
- State synchronization
- Basic station interfaces
- GM controls
- Connection recovery

### Phase 3: Enhanced Features (4-6 weeks)
- Event system implementation
- Advanced game mechanics
- Mobile responsiveness
- Performance optimizations

### Phase 4: Polish & Deployment (2-4 weeks)
- Security hardening
- Load testing
- Documentation
- Deployment automation
- Monitoring setup

## Monitoring & Observability

### Metrics
- Active game sessions
- Player connection stability
- Response times
- Error rates
- Resource utilization

### Logging
- Structured logging with correlation IDs
- Game action audit trail
- Performance metrics
- Error tracking and alerting

### Health Checks
- Database connectivity
- Redis availability
- WebSocket connection health
- External service dependencies

## Deployment Strategy

### Development Environment
- Docker Compose for local development
- Hot reloading for rapid iteration
- Automated testing pipeline
- Code quality checks

### Production Environment
- Kubernetes orchestration
- Horizontal pod autoscaling
- Blue-green deployments
- Database migrations
- Backup and recovery procedures

## Migration Strategy

### Data Migration
- Export existing game templates
- Convert state format to new schema
- Preserve user preferences
- Gradual rollout with feature flags

### User Migration
- Parallel deployment during transition
- User notification and training
- Feedback collection and iteration
- Rollback procedures if needed

## Success Metrics

### Technical Metrics
- 99.9% uptime
- <100ms response time for game actions
- Support for 100+ concurrent players
- Zero data loss incidents

### User Experience Metrics
- Session completion rate >80%
- Player retention >60% after first game
- Average session duration >45 minutes
- User satisfaction score >4.5/5

## Risk Assessment

### High Risk
- Data migration complexity
- Real-time synchronization challenges
- Scaling WebSocket connections

### Medium Risk
- User adoption of new interface
- Performance under load
- Third-party service dependencies

### Mitigation Strategies
- Comprehensive testing strategy
- Gradual feature rollout
- Monitoring and alerting
- Rollback procedures
- User feedback loops

## Conclusion

This redesign addresses the core architectural issues while preserving the engaging collaborative gameplay that makes the bridge simulator unique. The modular architecture and robust infrastructure will support future enhancements and scaling needs.

The phased implementation approach allows for iterative development and early user feedback, reducing risk and ensuring the final product meets user expectations.