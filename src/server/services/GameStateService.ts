import { GameState, SystemsState, NavigationState, WeaponsState, CommunicationsState, EngineeringState, CommandState, EnvironmentState, Vector3D } from '../../shared/types';
import { redisClient } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export class GameStateService {
  private static readonly STATE_KEY_PREFIX = 'game_state:';
  private static readonly STATE_EXPIRY = 3600; // 1 hour in seconds

  /**
   * Create initial game state for a new session
   */
  static createInitialState(sessionId: string): GameState {
    const now = new Date();
    
    return {
      sessionId,
      missionStatus: 'initialize',
      alertLevel: 'green',
      systems: this.createInitialSystems(),
      navigation: this.createInitialNavigation(),
      weapons: this.createInitialWeapons(),
      communications: this.createInitialCommunications(),
      engineering: this.createInitialEngineering(),
      command: this.createInitialCommand(),
      environment: this.createInitialEnvironment(),
      timestamp: now,
      version: 1,
    };
  }

  /**
   * Get game state from Redis
   */
  static async getState(sessionId: string): Promise<GameState | null> {
    try {
      const key = this.STATE_KEY_PREFIX + sessionId;
      const stateJson = await redisClient.get(key);
      
      if (!stateJson) {
        return null;
      }

      const state = JSON.parse(stateJson);
      // Convert date strings back to Date objects
      state.timestamp = new Date(state.timestamp);
      
      return state as GameState;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  /**
   * Save game state to Redis
   */
  static async saveState(state: GameState): Promise<boolean> {
    try {
      const key = this.STATE_KEY_PREFIX + state.sessionId;
      const stateJson = JSON.stringify({
        ...state,
        timestamp: new Date(),
        version: state.version + 1,
      });
      
      await redisClient.setEx(key, this.STATE_EXPIRY, stateJson);
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  }

  /**
   * Update specific parts of game state
   */
  static async updateState(sessionId: string, updates: Partial<GameState>): Promise<GameState | null> {
    try {
      const currentState = await this.getState(sessionId);
      if (!currentState) {
        return null;
      }

      const updatedState: GameState = {
        ...currentState,
        ...updates,
        timestamp: new Date(),
        version: currentState.version + 1,
      };

      const saved = await this.saveState(updatedState);
      return saved ? updatedState : null;
    } catch (error) {
      console.error('Error updating game state:', error);
      return null;
    }
  }

  /**
   * Delete game state
   */
  static async deleteState(sessionId: string): Promise<boolean> {
    try {
      const key = this.STATE_KEY_PREFIX + sessionId;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Error deleting game state:', error);
      return false;
    }
  }

  // Private helper methods for creating initial state components

  private static createInitialSystems(): SystemsState {
    const createSystem = () => ({
      health: 100,
      power: 100,
      efficiency: 100,
      temperature: 25,
      status: 'operational' as const,
    });

    return {
      hull: createSystem(),
      shields: createSystem(),
      weapons: createSystem(),
      engines: createSystem(),
      power: createSystem(),
      communications: createSystem(),
      sensors: createSystem(),
      lifeSupport: createSystem(),
    };
  }

  private static createInitialNavigation(): NavigationState {
    return {
      position: { x: 0, y: 0, z: 0 },
      heading: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      speed: 0,
      altitude: 1000,
      hyperspaceStatus: 'ready',
      hyperspaceCharge: 100,
      fuel: 100,
      autopilot: false,
      navigationLock: false,
      proximityAlerts: [],
    };
  }

  private static createInitialWeapons(): WeaponsState {
    return {
      turbolasers: [
        {
          id: uuidv4(),
          type: 'turbolaser',
          status: 'ready',
          charge: 100,
          heat: 0,
          range: 5000,
          accuracy: 85,
          damage: 50,
          cooldownTime: 3,
        },
        {
          id: uuidv4(),
          type: 'turbolaser',
          status: 'ready',
          charge: 100,
          heat: 0,
          range: 5000,
          accuracy: 85,
          damage: 50,
          cooldownTime: 3,
        },
      ],
      missiles: {
        protonTorpedoes: 12,
        concussionMissiles: 8,
        ionTorpedoes: 4,
        launcherStatus: 'ready',
        lockStatus: 'none',
        selectedMissileType: 'proton',
      },
      ionCannons: [
        {
          id: uuidv4(),
          type: 'ion_cannon',
          status: 'ready',
          charge: 100,
          heat: 0,
          range: 3000,
          accuracy: 75,
          damage: 30,
          cooldownTime: 5,
        },
      ],
      targeting: {
        availableTargets: [],
        scannerRange: 10000,
        resolution: 85,
        jamming: 0,
      },
    };
  }

  private static createInitialCommunications(): CommunicationsState {
    return {
      primaryFrequency: 121.5,
      secondaryFrequency: 243.0,
      signalStrength: 100,
      interference: 0,
      transmissionStatus: 'standby',
      messageQueue: [],
      activeChannels: [
        {
          frequency: 121.5,
          name: 'Command',
          encrypted: false,
          participants: [],
          active: true,
        },
      ],
      emergencyBeacon: false,
    };
  }

  private static createInitialEngineering(): EngineeringState {
    return {
      powerDistribution: {
        totalPower: 100,
        reactorOutput: 100,
        powerAllocations: {
          weapons: 20,
          shields: 25,
          engines: 25,
          sensors: 10,
          lifeSupport: 15,
          communications: 5,
        },
        batteryBackup: 100,
        emergencyPower: false,
      },
      repairQueue: [],
      diagnostics: [],
    };
  }

  private static createInitialCommand(): CommandState {
    return {
      battleStations: false,
      generalQuarters: false,
      commandOverride: false,
      tacticalDisplay: {
        zoom: 1.0,
        center: { x: 0, y: 0, z: 0 },
        overlays: {
          threats: true,
          friendlies: true,
          navigation: true,
          communications: false,
        },
        contacts: [],
      },
      missionObjectives: [
        {
          id: uuidv4(),
          title: 'System Initialization',
          description: 'Bring all ship systems online and prepare for mission briefing',
          status: 'active',
          priority: 'normal',
          rewards: ['Experience Points'],
        },
      ],
      crewStatus: [],
    };
  }

  private static createInitialEnvironment(): EnvironmentState {
    return {
      sector: 'Coruscant System',
      region: 'Core Worlds',
      hazards: [],
      celestialBodies: [
        {
          id: uuidv4(),
          name: 'Coruscant',
          type: 'planet',
          position: { x: 0, y: 0, z: -50000 },
          mass: 1.0,
          radius: 6371,
          gravitationalPull: 9.8,
        },
      ],
      spatialAnomalies: [],
    };
  }
}