import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';
import { GameState, StationType } from './types';
import CommunicationsStation from './components/stations/CommunicationsStation';
import EngineeringStation from './components/stations/EngineeringStation';
import PilotStation from './components/stations/PilotStation';
import WeaponsStation from './components/stations/WeaponsStation';

const STATIONS = [
  'COMMANDER',
  'PILOT', 
  'GUNNER',
  'ENGINEER',
  'COMMUNICATIONS',
  'GAME_MASTER'
];

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedStation, setSelectedStation] = useState('COMMUNICATIONS');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to Bridge Simulator');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from Bridge Simulator');
    });

    newSocket.on('gameStateUpdate', (state: GameState) => {
      setGameState(state);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinBridge = () => {
    if (socket && playerName && sessionId && selectedStation) {
      console.log('Joining bridge with:', { sessionId, playerName, station: selectedStation });
      socket.emit('join_session', {
        sessionId,
        name: playerName,
        station: selectedStation.toLowerCase()
      });
      setJoined(true);
      
      // Create a mock gameState if none exists after a short delay
      setTimeout(() => {
        if (!gameState) {
          console.log('No gameState received, creating mock state');
          const mockGameState: GameState = {
            sessionId: sessionId,
            players: {
              [playerName]: { name: playerName, station: selectedStation }
            },
            systems: {
              power: 85,
              shields: 70,
              weapons: 90,
              engines: 80
            },
            alertLevel: 'green',
            missionStatus: 'active'
          };
          setGameState(mockGameState);
        }
      }, 2000);
    }
  };

  const leaveBridge = () => {
    if (socket) {
      socket.emit('leaveSession');
      setJoined(false);
      setGameState(null);
    }
  };

  const handlePlayerAction = (action: string, value: any) => {
    if (socket) {
      socket.emit('playerAction', {
        action,
        value,
        station: selectedStation.toLowerCase()
      });
    }
  };

  const renderStation = () => {
    if (!gameState) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          color: '#ff0000',
          fontSize: '1.5rem'
        }}>
          CONNECTING TO BRIDGE SYSTEMS...
        </div>
      );
    }

    switch (selectedStation) {
      case 'COMMUNICATIONS':
        return <CommunicationsStation gameState={gameState} onPlayerAction={handlePlayerAction} />;
      case 'ENGINEER':
        return <EngineeringStation gameState={gameState} onPlayerAction={handlePlayerAction} />;
      case 'PILOT':
        return <PilotStation />;
      case 'GUNNER':
        return <WeaponsStation />;
      case 'COMMANDER':
      case 'GAME_MASTER':
      default:
        return (
          <div className="station-display">
            <h2>{selectedStation.replace('_', ' ')} STATION</h2>
            <div style={{ color: '#ffaa00', textAlign: 'center', marginTop: '50px' }}>
              Station interface under construction
            </div>
            
            {gameState && (
              <div className="system-status">
                <h3>Ship Systems Status:</h3>
                <div className="status-grid">
                  <div className="status-item">
                    <span>Power:</span>
                    <div className="status-bar">
                      <div 
                        className="status-fill power"
                        style={{ width: `${gameState.systems.power}%` }}
                      ></div>
                    </div>
                    <span>{gameState.systems.power}%</span>
                  </div>
                  
                  <div className="status-item">
                    <span>Shields:</span>
                    <div className="status-bar">
                      <div 
                        className="status-fill shields"
                        style={{ width: `${gameState.systems.shields}%` }}
                      ></div>
                    </div>
                    <span>{gameState.systems.shields}%</span>
                  </div>
                  
                  <div className="status-item">
                    <span>Weapons:</span>
                    <div className="status-bar">
                      <div 
                        className="status-fill weapons"
                        style={{ width: `${gameState.systems.weapons}%` }}
                      ></div>
                    </div>
                    <span>{gameState.systems.weapons}%</span>
                  </div>
                  
                  <div className="status-item">
                    <span>Engines:</span>
                    <div className="status-bar">
                      <div 
                        className="status-fill engines"
                        style={{ width: `${gameState.systems.engines}%` }}
                      ></div>
                    </div>
                    <span>{gameState.systems.engines}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="crew-roster">
              <h3>Bridge Crew:</h3>
              {gameState && Object.entries(gameState.players).map(([id, player]) => (
                <div key={id} className="crew-member">
                  <span className="station">{player.station}:</span>
                  <span className="name">{player.name}</span>
                </div>
              ))}
            </div>

            <div className="station-controls">
              <h3>Station Controls:</h3>
              <div className="control-panel">
                <button className="control-button" onClick={() => handlePlayerAction('system_scan', {})}>
                  System Scan
                </button>
                <button className="control-button" onClick={() => handlePlayerAction('status_report', {})}>
                  Status Report
                </button>
                <button className="control-button" onClick={() => handlePlayerAction('emergency_alert', {})}>
                  Emergency Alert
                </button>
                <button className="control-button" onClick={() => handlePlayerAction('comm_channel', {})}>
                  Comm Channel
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!joined) {
    return (
      <div className="App">
        <div className="lobby">
          <div className="header">
            <h1>🚀 IMPERIAL STAR DESTROYER</h1>
            <h2>BRIDGE SIMULATOR</h2>
            <div className="status">
              Status: {connected ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </div>
          </div>

          <div className="join-form">
            <div className="form-group">
              <label>Session ID:</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="e.g., bridge-alpha-1"
              />
            </div>

            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Bridge Station:</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
              >
                {STATIONS.map(station => (
                  <option key={station} value={station}>
                    {station.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={joinBridge}
              disabled={!connected || !playerName || !sessionId}
              className="join-button"
            >
              JOIN BRIDGE
            </button>
          </div>

          <div className="instructions">
            <h3>Bridge Stations:</h3>
            <ul>
              <li><strong>COMMANDER:</strong> Mission control and tactical oversight</li>
              <li><strong>PILOT:</strong> Navigation and ship movement</li>
              <li><strong>GUNNER:</strong> Weapons systems and combat</li>
              <li><strong>ENGINEER:</strong> Power management and repairs</li>
              <li><strong>COMMUNICATIONS:</strong> Information and fleet coordination</li>
              <li><strong>GAME MASTER:</strong> Scenario control</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="bridge-interface">
        <div className="bridge-header">
          <h1>IMPERIAL STAR DESTROYER - {selectedStation}</h1>
          <div className="session-info">
            Session: {sessionId} | Officer: {playerName}
            <button onClick={leaveBridge} className="leave-button">
              LEAVE BRIDGE
            </button>
          </div>
        </div>

        <div className="bridge-content">
          {renderStation()}
        </div>
      </div>
    </div>
  );
}

export default App;