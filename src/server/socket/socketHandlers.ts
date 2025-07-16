import { Server, Socket } from 'socket.io';
import { GameState, StationType, SocketEvents } from '../../shared/types';
import { SessionService } from '../services/SessionService';
import { GameStateService } from '../services/GameStateService';

export class SocketHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);

    // Register event handlers
    socket.on('join_session', (data) => this.handleJoinSession(socket, data));
    socket.on('player_action', (data) => this.handlePlayerAction(socket, data));
    socket.on('gm_update', (data) => this.handleGMUpdate(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Send initial connection confirmation
    socket.emit('connected', { socketId: socket.id });
  }

  /**
   * Handle player joining a session
   */
  private async handleJoinSession(
    socket: Socket, 
    data: { sessionId: string; station: StationType; name?: string }
  ) {
    try {
      const { sessionId, station, name = 'Player' } = data;

      // Get or create session
      let session = await SessionService.getSession(sessionId);
      if (!session) {
        console.log(`Creating new session: ${sessionId}`);
        session = await SessionService.createSession(sessionId, socket.id, sessionId);
        if (!session) {
          socket.emit('error', { message: 'Could not create session', code: 'SESSION_CREATE_FAILED' });
          return;
        }
      }

      // For now, use socket ID as user ID (in production, this would come from authentication)
      const userId = socket.id;

      // Determine role based on station
      const role = station === 'gm' ? 'gm' : 'player';

      // Add player to session
      const player = await SessionService.addPlayer(sessionId, userId, station, role);
      if (!player) {
        socket.emit('error', { message: 'Could not join session', code: 'JOIN_FAILED' });
        return;
      }

      // Associate socket with player
      await SessionService.setPlayerSocketId(socket.id, player);

      // Join socket rooms
      socket.join(sessionId);
      socket.join(`${sessionId}_${station}`);

      // Get current game state
      const gameState = await GameStateService.getState(sessionId);
      if (gameState) {
        socket.emit('state_update', gameState);
      }

      // Notify other players
      socket.to(sessionId).emit('player_joined', player);

      console.log(`Player ${name} joined session ${sessionId} as ${station}`);
    } catch (error) {
      console.error('Error handling join session:', error);
      socket.emit('error', { message: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Handle player actions (station-specific controls)
   */
  private async handlePlayerAction(
    socket: Socket,
    data: { action: string; value: any; station: StationType }
  ) {
    try {
      const player = await SessionService.getPlayerBySocketId(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not found', code: 'PLAYER_NOT_FOUND' });
        return;
      }

      // Verify player is authorized for this station
      if (player.station !== data.station && player.role !== 'gm') {
        socket.emit('error', { message: 'Unauthorized station access', code: 'UNAUTHORIZED' });
        return;
      }

      const currentState = await GameStateService.getState(player.sessionId);
      if (!currentState) {
        socket.emit('error', { message: 'Game state not found', code: 'STATE_NOT_FOUND' });
        return;
      }

      // Process the action based on station and action type
      const updatedState = await this.processPlayerAction(currentState, data);
      if (updatedState) {
        // Save updated state
        await GameStateService.saveState(updatedState);

        // Broadcast state update to all players in session
        this.io.to(player.sessionId).emit('state_update', updatedState);

        // Send specific notifications if needed
        await this.sendActionNotifications(player.sessionId, data);
      }

      console.log(`Player action in ${player.sessionId}: ${data.action} = ${data.value}`);
    } catch (error) {
      console.error('Error handling player action:', error);
      socket.emit('error', { message: 'Action failed', code: 'ACTION_FAILED' });
    }
  }

  /**
   * Handle GM updates (direct state manipulation)
   */
  private async handleGMUpdate(
    socket: Socket,
    data: { changes: Partial<GameState> }
  ) {
    try {
      const player = await SessionService.getPlayerBySocketId(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not found', code: 'PLAYER_NOT_FOUND' });
        return;
      }

      // Verify player is GM
      if (player.role !== 'gm') {
        socket.emit('error', { message: 'GM access required', code: 'GM_REQUIRED' });
        return;
      }

      // Apply GM changes to game state
      const updatedState = await GameStateService.updateState(player.sessionId, data.changes);
      if (updatedState) {
        // Broadcast updated state to all players
        this.io.to(player.sessionId).emit('state_update', updatedState);
        console.log(`GM updated state in session ${player.sessionId}`);
      }
    } catch (error) {
      console.error('Error handling GM update:', error);
      socket.emit('error', { message: 'GM update failed', code: 'GM_UPDATE_FAILED' });
    }
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnect(socket: Socket) {
    try {
      const player = await SessionService.getPlayerBySocketId(socket.id);
      if (player) {
        // Update player status to disconnected
        await SessionService.updatePlayerStatus(player.sessionId, player.id, 'disconnected');

        // Notify other players
        socket.to(player.sessionId).emit('player_left', player.id);

        // Clean up socket association
        await SessionService.removePlayerSocketId(socket.id);

        console.log(`Player disconnected from session ${player.sessionId}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }

    console.log(`Client disconnected: ${socket.id}`);
  }

  /**
   * Process player actions and update game state accordingly
   */
  private async processPlayerAction(
    currentState: GameState,
    action: { action: string; value: any; station: StationType }
  ): Promise<GameState | null> {
    const newState = { ...currentState };

    switch (action.station) {
      case 'pilot':
        return this.processPilotAction(newState, action.action, action.value);
      case 'gunner':
        return this.processGunnerAction(newState, action.action, action.value);
      case 'engineer':
        return this.processEngineerAction(newState, action.action, action.value);
      case 'commander':
        return this.processCommanderAction(newState, action.action, action.value);
      case 'comms':
        return this.processCommsAction(newState, action.action, action.value);
      default:
        return null;
    }
  }

  /**
   * Process pilot/navigation actions
   */
  private processPilotAction(state: GameState, action: string, value: any): GameState {
    switch (action) {
      case 'set_speed':
        state.navigation.speed = Math.max(0, Math.min(100, value));
        break;
      case 'set_heading_x':
        state.navigation.heading.x = value;
        break;
      case 'set_heading_y':
        state.navigation.heading.y = value;
        break;
      case 'set_heading_z':
        state.navigation.heading.z = value;
        break;
      case 'toggle_autopilot':
        state.navigation.autopilot = !state.navigation.autopilot;
        break;
      case 'initiate_hyperspace':
        if (state.navigation.hyperspaceStatus === 'ready') {
          state.navigation.hyperspaceStatus = 'charging';
        }
        break;
    }
    return state;
  }

  /**
   * Process gunner/weapons actions
   */
  private processGunnerAction(state: GameState, action: string, value: any): GameState {
    switch (action) {
      case 'fire_turbolaser':
        const turbolaser = state.weapons.turbolasers.find(w => w.id === value.weaponId);
        if (turbolaser && turbolaser.status === 'ready') {
          turbolaser.status = 'firing';
          turbolaser.heat = Math.min(100, turbolaser.heat + 20);
        }
        break;
      case 'select_target':
        state.weapons.targeting.currentTarget = value;
        break;
      case 'launch_missile':
        if (state.weapons.missiles.launcherStatus === 'ready') {
          const missileType = state.weapons.missiles.selectedMissileType;
          if (missileType === 'proton' && state.weapons.missiles.protonTorpedoes > 0) {
            state.weapons.missiles.protonTorpedoes--;
          } else if (missileType === 'concussion' && state.weapons.missiles.concussionMissiles > 0) {
            state.weapons.missiles.concussionMissiles--;
          } else if (missileType === 'ion' && state.weapons.missiles.ionTorpedoes > 0) {
            state.weapons.missiles.ionTorpedoes--;
          }
        }
        break;
    }
    return state;
  }

  /**
   * Process engineer actions
   */
  private processEngineerAction(state: GameState, action: string, value: any): GameState {
    switch (action) {
      case 'set_power_allocation':
        const { system, power } = value;
        const validSystems = ['weapons', 'shields', 'engines', 'sensors', 'lifeSupport', 'communications'] as const;
        if (validSystems.includes(system) && typeof power === 'number') {
          state.engineering.powerDistribution.powerAllocations[system as keyof typeof state.engineering.powerDistribution.powerAllocations] = Math.max(0, Math.min(100, power));
        }
        break;
      case 'initiate_repair':
        // Add repair task to queue
        const repairTask = {
          id: `repair_${Date.now()}`,
          system: value.system,
          priority: value.priority || 'normal',
          estimatedTime: value.estimatedTime || 10,
          progress: 0,
          assignedCrew: 1,
          requiredParts: [],
          status: 'queued' as const,
        };
        state.engineering.repairQueue.push(repairTask);
        break;
      case 'toggle_emergency_power':
        state.engineering.powerDistribution.emergencyPower = !state.engineering.powerDistribution.emergencyPower;
        break;
    }
    return state;
  }

  /**
   * Process commander actions
   */
  private processCommanderAction(state: GameState, action: string, value: any): GameState {
    switch (action) {
      case 'set_alert_level':
        state.alertLevel = value;
        break;
      case 'toggle_battle_stations':
        state.command.battleStations = !state.command.battleStations;
        break;
      case 'set_mission_status':
        state.missionStatus = value;
        break;
      case 'update_tactical_zoom':
        state.command.tacticalDisplay.zoom = Math.max(0.1, Math.min(10, value));
        break;
    }
    return state;
  }

  /**
   * Process communications actions
   */
  private processCommsAction(state: GameState, action: string, value: any): GameState {
    switch (action) {
      case 'set_frequency':
        state.communications.primaryFrequency = value;
        break;
      case 'send_message':
        const message = {
          id: `msg_${Date.now()}`,
          from: 'Bridge',
          to: value.to,
          content: value.content,
          timestamp: new Date(),
          priority: value.priority || 'normal',
          encrypted: value.encrypted || false,
          acknowledged: false,
        };
        state.communications.messageQueue.push(message);
        break;
      case 'toggle_emergency_beacon':
        state.communications.emergencyBeacon = !state.communications.emergencyBeacon;
        break;
    }
    return state;
  }

  /**
   * Send action-specific notifications
   */
  private async sendActionNotifications(sessionId: string, action: { action: string; value: any; station: StationType }) {
    // Send notifications to GM about important actions
    if (action.action === 'set_speed' || action.action.includes('heading')) {
      this.io.to(`${sessionId}_gm`).emit('gm_notification', {
        type: 'navigation_update',
        station: action.station,
        action: action.action,
        value: action.value,
      });
    }
  }
}