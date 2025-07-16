import { GameSession, Player, StationType, PlayerRole } from '../../shared/types';
import { redisClient } from '../config/database';
import { GameStateService } from './GameStateService';
import { v4 as uuidv4 } from 'uuid';

export class SessionService {
  private static readonly SESSION_KEY_PREFIX = 'session:';
  private static readonly PLAYER_KEY_PREFIX = 'players:';
  private static readonly SESSION_EXPIRY = 7200; // 2 hours in seconds

  /**
   * Create a new game session
   */
  static async createSession(name: string, creatorId: string, sessionId?: string): Promise<GameSession> {
    const session: GameSession = {
      id: sessionId || uuidv4(),
      name,
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPlayers: 8,
      gameMode: 'sandbox',
      settings: {
        allowSpectators: true,
        voiceChatEnabled: false,
        autoSave: true,
        pauseOnDisconnect: false,
        maxSessionDuration: 90,
        stationLockTimeout: 30,
      },
      difficulty: 'normal',
    };

    // Save session to Redis
    await this.saveSession(session);

    // Create initial game state
    const initialState = GameStateService.createInitialState(session.id);
    await GameStateService.saveState(initialState);

    return session;
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<GameSession | null> {
    try {
      const key = this.SESSION_KEY_PREFIX + sessionId;
      const sessionJson = await redisClient.get(key);
      
      if (!sessionJson) {
        return null;
      }

      const session = JSON.parse(sessionJson);
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      
      return session as GameSession;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Save session to Redis
   */
  static async saveSession(session: GameSession): Promise<boolean> {
    try {
      const key = this.SESSION_KEY_PREFIX + session.id;
      const sessionJson = JSON.stringify({
        ...session,
        updatedAt: new Date(),
      });
      
      await redisClient.setEx(key, this.SESSION_EXPIRY, sessionJson);
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  /**
   * Add player to session
   */
  static async addPlayer(sessionId: string, userId: string, station: StationType, role: PlayerRole = 'player'): Promise<Player | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const players = await this.getSessionPlayers(sessionId);
      
      // Check if session is full
      if (players.length >= session.maxPlayers && role !== 'spectator') {
        throw new Error('Session is full');
      }

      // Check if station is already taken (except for spectators and GM)
      if (station !== 'gm' && role !== 'spectator') {
        const stationTaken = players.some(p => p.station === station && p.status === 'connected');
        if (stationTaken) {
          throw new Error('Station already occupied');
        }
      }

      const player: Player = {
        id: uuidv4(),
        sessionId,
        userId,
        station,
        role,
        status: 'connected',
        joinedAt: new Date(),
        lastActivity: new Date(),
      };

      // Save player
      const playersKey = this.PLAYER_KEY_PREFIX + sessionId;
      const playersJson = await redisClient.get(playersKey) || '[]';
      const playersList = JSON.parse(playersJson);
      playersList.push(player);
      
      await redisClient.setEx(playersKey, this.SESSION_EXPIRY, JSON.stringify(playersList));

      return player;
    } catch (error) {
      console.error('Error adding player:', error);
      return null;
    }
  }

  /**
   * Remove player from session
   */
  static async removePlayer(sessionId: string, playerId: string): Promise<boolean> {
    try {
      const playersKey = this.PLAYER_KEY_PREFIX + sessionId;
      const playersJson = await redisClient.get(playersKey) || '[]';
      const playersList = JSON.parse(playersJson);
      
      const updatedPlayers = playersList.filter((p: Player) => p.id !== playerId);
      
      await redisClient.setEx(playersKey, this.SESSION_EXPIRY, JSON.stringify(updatedPlayers));
      return true;
    } catch (error) {
      console.error('Error removing player:', error);
      return false;
    }
  }

  /**
   * Get all players in a session
   */
  static async getSessionPlayers(sessionId: string): Promise<Player[]> {
    try {
      const playersKey = this.PLAYER_KEY_PREFIX + sessionId;
      const playersJson = await redisClient.get(playersKey) || '[]';
      const players = JSON.parse(playersJson);
      
      // Convert date strings back to Date objects
      return players.map((p: any) => ({
        ...p,
        joinedAt: new Date(p.joinedAt),
        lastActivity: new Date(p.lastActivity),
      }));
    } catch (error) {
      console.error('Error getting session players:', error);
      return [];
    }
  }

  /**
   * Update player status
   */
  static async updatePlayerStatus(sessionId: string, playerId: string, status: 'connected' | 'disconnected' | 'away'): Promise<boolean> {
    try {
      const playersKey = this.PLAYER_KEY_PREFIX + sessionId;
      const playersJson = await redisClient.get(playersKey) || '[]';
      const playersList = JSON.parse(playersJson);
      
      const playerIndex = playersList.findIndex((p: Player) => p.id === playerId);
      if (playerIndex === -1) {
        return false;
      }

      playersList[playerIndex].status = status;
      playersList[playerIndex].lastActivity = new Date();
      
      await redisClient.setEx(playersKey, this.SESSION_EXPIRY, JSON.stringify(playersList));
      return true;
    } catch (error) {
      console.error('Error updating player status:', error);
      return false;
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(sessionId: string, status: GameSession['status']): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      session.status = status;
      return await this.saveSession(session);
    } catch (error) {
      console.error('Error updating session status:', error);
      return false;
    }
  }

  /**
   * Get player by socket ID (stored separately for quick lookup)
   */
  static async getPlayerBySocketId(socketId: string): Promise<Player | null> {
    try {
      const key = `socket:${socketId}`;
      const playerJson = await redisClient.get(key);
      
      if (!playerJson) {
        return null;
      }

      const player = JSON.parse(playerJson);
      player.joinedAt = new Date(player.joinedAt);
      player.lastActivity = new Date(player.lastActivity);
      
      return player as Player;
    } catch (error) {
      console.error('Error getting player by socket ID:', error);
      return null;
    }
  }

  /**
   * Associate socket ID with player
   */
  static async setPlayerSocketId(socketId: string, player: Player): Promise<boolean> {
    try {
      const key = `socket:${socketId}`;
      await redisClient.setEx(key, this.SESSION_EXPIRY, JSON.stringify(player));
      return true;
    } catch (error) {
      console.error('Error setting player socket ID:', error);
      return false;
    }
  }

  /**
   * Remove socket ID association
   */
  static async removePlayerSocketId(socketId: string): Promise<boolean> {
    try {
      const key = `socket:${socketId}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Error removing player socket ID:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions and players
   */
  static async cleanupExpiredSessions(): Promise<void> {
    // This would typically be run as a scheduled job
    // For now, we rely on Redis TTL for cleanup
    console.log('Session cleanup completed');
  }
}