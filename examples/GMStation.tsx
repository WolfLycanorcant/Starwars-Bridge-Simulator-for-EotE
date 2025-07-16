import React from 'react';
import styled from 'styled-components';
import { GameState } from '../../types';

const GMContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  height: 100%;
`;

const Panel = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #ff00ff;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const PanelTitle = styled.h3`
  color: #ffff00;
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 1.2rem;
`;

const GMButton = styled.button<{ danger?: boolean; warning?: boolean }>`
  background: ${props => {
    if (props.danger) return '#330000';
    if (props.warning) return '#333300';
    return '#330033';
  }};
  border: 2px solid ${props => {
    if (props.danger) return '#ff0000';
    if (props.warning) return '#ffff00';
    return '#ff00ff';
  }};
  color: ${props => {
    if (props.danger) return '#ff0000';
    if (props.warning) return '#ffff00';
    return '#ff00ff';
  }};
  padding: 12px 20px;
  font-family: inherit;
  cursor: pointer;
  margin: 5px 0;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 0, 255, 0.3);
  }
`;

const SystemSlider = styled.div`
  margin: 10px 0;
  
  label {
    display: block;
    margin-bottom: 5px;
    color: #ff00ff;
  }
  
  input {
    width: 100%;
    margin-bottom: 5px;
  }
  
  .value {
    color: #ffff00;
    font-size: 12px;
  }
`;

const GameStateViewer = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #666666;
  padding: 15px;
  overflow-y: auto;
  font-size: 10px;
  font-family: monospace;
  color: #cccccc;
  flex: 1;
`;

interface GMStationProps {
  gameState: GameState;
  onGMUpdate: (changes: Partial<GameState>) => void;
}

const GMStation: React.FC<GMStationProps> = ({ gameState, onGMUpdate }) => {
  const setAlertLevel = (level: 'green' | 'yellow' | 'red' | 'black') => {
    onGMUpdate({ alertLevel: level });
  };

  const setMissionStatus = (status: 'initialize' | 'briefing' | 'active' | 'critical' | 'completed' | 'failed') => {
    onGMUpdate({ missionStatus: status });
  };

  const damageSystem = (systemName: string, health: number) => {
    onGMUpdate({
      systems: {
        ...gameState.systems,
        [systemName]: {
          ...gameState.systems[systemName as keyof typeof gameState.systems],
          health,
          status: health < 25 ? 'critical' : health < 50 ? 'damaged' : 'operational'
        }
      }
    });
  };

  const addProximityAlert = () => {
    const newAlert = {
      id: `alert_${Date.now()}`,
      type: 'ship' as const,
      distance: Math.random() * 1000 + 100,
      bearing: Math.random() * 360,
      threat: 'medium' as const
    };

    onGMUpdate({
      navigation: {
        ...gameState.navigation,
        proximityAlerts: [...gameState.navigation.proximityAlerts, newAlert]
      }
    });
  };

  const addTarget = () => {
    const newTarget = {
      id: `target_${Date.now()}`,
      type: 'ship' as const,
      position: { x: Math.random() * 1000, y: Math.random() * 1000, z: Math.random() * 1000 },
      velocity: { x: 0, y: 0, z: 0 },
      size: 'medium' as const,
      threat: 'high' as const,
      shields: 100,
      hull: 100,
      distance: Math.random() * 5000 + 1000,
      bearing: Math.random() * 360
    };

    onGMUpdate({
      weapons: {
        ...gameState.weapons,
        targeting: {
          ...gameState.weapons.targeting,
          availableTargets: [...gameState.weapons.targeting.availableTargets, newTarget]
        }
      }
    });
  };

  return (
    <GMContainer>
      <Panel>
        <PanelTitle>ALERT & MISSION CONTROL</PanelTitle>
        
        <GMButton onClick={() => setAlertLevel('green')}>
          SET ALERT: GREEN
        </GMButton>
        <GMButton warning onClick={() => setAlertLevel('yellow')}>
          SET ALERT: YELLOW
        </GMButton>
        <GMButton danger onClick={() => setAlertLevel('red')}>
          SET ALERT: RED
        </GMButton>
        <GMButton danger onClick={() => setAlertLevel('black')}>
          SET ALERT: BLACK
        </GMButton>

        <div style={{ margin: '20px 0', borderTop: '1px solid #666', paddingTop: '20px' }}>
          <GMButton onClick={() => setMissionStatus('briefing')}>
            MISSION: BRIEFING
          </GMButton>
          <GMButton onClick={() => setMissionStatus('active')}>
            MISSION: ACTIVE
          </GMButton>
          <GMButton warning onClick={() => setMissionStatus('critical')}>
            MISSION: CRITICAL
          </GMButton>
          <GMButton danger onClick={() => setMissionStatus('failed')}>
            MISSION: FAILED
          </GMButton>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>SYSTEM DAMAGE CONTROL</PanelTitle>
        
        <GMButton danger onClick={() => damageSystem('hull', 50)}>
          DAMAGE HULL (50%)
        </GMButton>
        <GMButton danger onClick={() => damageSystem('shields', 25)}>
          DAMAGE SHIELDS (25%)
        </GMButton>
        <GMButton danger onClick={() => damageSystem('weapons', 0)}>
          WEAPONS OFFLINE
        </GMButton>
        <GMButton danger onClick={() => damageSystem('engines', 30)}>
          ENGINE DAMAGE (30%)
        </GMButton>
        <GMButton danger onClick={() => damageSystem('power', 60)}>
          POWER FLUCTUATION (60%)
        </GMButton>

        <div style={{ margin: '20px 0', borderTop: '1px solid #666', paddingTop: '20px' }}>
          <GMButton onClick={() => {
            const systems = { ...gameState.systems };
            Object.keys(systems).forEach(key => {
              systems[key as keyof typeof systems] = {
                ...systems[key as keyof typeof systems],
                health: 100,
                status: 'operational' as const
              };
            });
            onGMUpdate({ systems });
          }}>
            REPAIR ALL SYSTEMS
          </GMButton>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>ENVIRONMENT CONTROL</PanelTitle>
        
        <GMButton onClick={addProximityAlert}>
          ADD PROXIMITY ALERT
        </GMButton>
        <GMButton onClick={addTarget}>
          ADD ENEMY TARGET
        </GMButton>
        <GMButton onClick={() => {
          onGMUpdate({
            navigation: {
              ...gameState.navigation,
              fuel: Math.max(0, gameState.navigation.fuel - 20)
            }
          });
        }}>
          REDUCE FUEL (-20%)
        </GMButton>
        <GMButton onClick={() => {
          onGMUpdate({
            communications: {
              ...gameState.communications,
              interference: Math.min(100, gameState.communications.interference + 30)
            }
          });
        }}>
          INCREASE INTERFERENCE
        </GMButton>

        <div style={{ margin: '20px 0', borderTop: '1px solid #666', paddingTop: '20px' }}>
          <GMButton onClick={() => {
            onGMUpdate({
              navigation: {
                ...gameState.navigation,
                proximityAlerts: [],
                fuel: 100
              },
              weapons: {
                ...gameState.weapons,
                targeting: {
                  ...gameState.weapons.targeting,
                  availableTargets: []
                }
              },
              communications: {
                ...gameState.communications,
                interference: 0
              }
            });
          }}>
            CLEAR ALL EVENTS
          </GMButton>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>POWER OVERRIDE</PanelTitle>
        
        {Object.entries(gameState.engineering.powerDistribution.powerAllocations).map(([system, power]) => (
          <SystemSlider key={system}>
            <label>{system.toUpperCase()}: {power}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={power}
              onChange={(e) => {
                const newAllocations = {
                  ...gameState.engineering.powerDistribution.powerAllocations,
                  [system]: parseInt(e.target.value)
                };
                onGMUpdate({
                  engineering: {
                    ...gameState.engineering,
                    powerDistribution: {
                      ...gameState.engineering.powerDistribution,
                      powerAllocations: newAllocations
                    }
                  }
                });
              }}
            />
          </SystemSlider>
        ))}
      </Panel>

      <Panel>
        <PanelTitle>NAVIGATION OVERRIDE</PanelTitle>
        
        <SystemSlider>
          <label>SPEED: {gameState.navigation.speed}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={gameState.navigation.speed}
            onChange={(e) => {
              onGMUpdate({
                navigation: {
                  ...gameState.navigation,
                  speed: parseInt(e.target.value)
                }
              });
            }}
          />
        </SystemSlider>

        <SystemSlider>
          <label>FUEL: {gameState.navigation.fuel.toFixed(1)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={gameState.navigation.fuel}
            onChange={(e) => {
              onGMUpdate({
                navigation: {
                  ...gameState.navigation,
                  fuel: parseInt(e.target.value)
                }
              });
            }}
          />
        </SystemSlider>

        <GMButton onClick={() => {
          onGMUpdate({
            navigation: {
              ...gameState.navigation,
              hyperspaceStatus: gameState.navigation.hyperspaceStatus === 'ready' ? 'charging' : 'ready'
            }
          });
        }}>
          TOGGLE HYPERSPACE: {gameState.navigation.hyperspaceStatus.toUpperCase()}
        </GMButton>
      </Panel>

      <Panel>
        <PanelTitle>GAME STATE MONITOR</PanelTitle>
        
        <GameStateViewer>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </GameStateViewer>
      </Panel>
    </GMContainer>
  );
};

export default GMStation;