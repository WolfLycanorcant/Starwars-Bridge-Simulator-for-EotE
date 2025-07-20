import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../../types';

/* ---------- TYPES ---------- */
type StationName = 'communications' | 'navigation' | 'weapons' | 'engineering';

interface GlobalGameState {
  communications: any;
  navigation: any;
  weapons: any;
  engineering: any;
}

interface FrequencyMacro {
  id: string;
  name: string;
  frequency: number;
  description: string;
  color: string;
}

interface SignalAnalysisOption {
  id: string;
  name: string;
  description: string;
  effect: string;
}

interface CommunicationMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  frequency: number;
  onAir?: string;
}

const initialGlobalState: GlobalGameState = {
  communications: null,
  navigation: null,
  weapons: null,
  engineering: null,
};

/* ---------- ANIMATIONS ---------- */

/* ---------- STYLES ---------- */
const Container = styled.div`
  background: #0a0a0a;
  color: #eee;
  font-family: 'Orbitron', 'Courier New', monospace;
  min-height: 100vh;
  padding: 20px;
  --gm-green: #00ff88;
  --gm-red: #ff0040;
  --gm-yellow: #ffd700;
  --gm-blue: #0088ff;
`;

const Header = styled.h1`
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 25px;
  color: var(--gm-green);
  text-shadow: 0 0 15px var(--gm-green);
  letter-spacing: 4px;
`;

const PanelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 25px;
`;

const Panel = styled.div<{ collapsed?: boolean }>`
  background: rgba(20, 20, 20, 0.85);
  border: 2px solid var(--gm-blue);
  border-radius: 10px;
  padding: ${(p) => (p.collapsed ? '10px' : '15px')};
  position: relative;
  transition: all 0.3s ease;
  max-height: ${(p) => (p.collapsed ? '50px' : 'none')};
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  cursor: pointer;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: var(--gm-green);
  font-size: 1.2rem;
  letter-spacing: 1px;
`;

const CollapseBtn = styled.button`
  background: none;
  border: none;
  color: var(--gm-yellow);
  font-size: 1rem;
  cursor: pointer;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.9rem;
`;

const EmitButton = styled.button`
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--gm-green);
  color: var(--gm-green);
  padding: 6px 10px;
  margin: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  &:hover {
    background: var(--gm-green);
    color: #000;
  }
`;

const EmitRed = styled(EmitButton)`
  border-color: var(--gm-red);
  color: var(--gm-red);
  &:hover {
    background: var(--gm-red);
    color: #000;
  }
`;

/* ---------- COMPONENT ---------- */
interface GMStationProps {
  gameState?: GameState;
  onGMUpdate?: (changes: Partial<GameState>) => void;
}

const GMStation: React.FC<GMStationProps> = ({ gameState, onGMUpdate }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [states, setStates] = useState<GlobalGameState>(initialGlobalState);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const roomRef = useRef<string>('default');

  // Use passed gameState if available, otherwise use internal state
  const currentGameState = gameState || states;

  // Communications state
  const [signalStrength, setSignalStrength] = useState(100);
  const [interference, setInterference] = useState(0);
  const [messageResponse, setMessageResponse] = useState('');
  const [messagePriority, setMessagePriority] = useState<'normal' | 'high' | 'emergency'>('normal');
  const [messageFrom, setMessageFrom] = useState('Command');
  const [messageAnalysis, setMessageAnalysis] = useState('normal');
  const [commsTransmissions, setCommsTransmissions] = useState<CommunicationMessage[]>([]);

  // Frequency macros for different channels
  const frequencyMacros: FrequencyMacro[] = [
    { id: 'emergency', name: 'Emergency', frequency: 121.5, description: 'Emergency & Distress', color: '#ff0040' },
    { id: 'command', name: 'Command', frequency: 243.0, description: 'Command & Control', color: '#ffd700' },
    { id: 'medical', name: 'Medical', frequency: 156.8, description: 'Medical Emergency', color: '#ff6b6b' },
    { id: 'engineering', name: 'Engineering', frequency: 467.775, description: 'Engineering Ops', color: '#4ecdc4' },
    { id: 'tactical', name: 'Tactical', frequency: 462.675, description: 'Tactical Operations', color: '#ff8c42' },
    { id: 'navigation', name: 'Navigation', frequency: 156.05, description: 'Navigation & Traffic', color: '#95e1d3' },
    { id: 'security', name: 'Security', frequency: 453.212, description: 'Security & Defense', color: '#a8e6cf' },
    { id: 'outofcontrol', name: 'Out of Control', frequency: 999.9, description: 'Emergency Override', color: '#ff1744' }
  ];

  // Signal analysis options
  const signalAnalysisOptions: SignalAnalysisOption[] = [
    { id: 'normal', name: 'Normal Scan', description: 'Standard signal analysis', effect: 'baseline' },
    { id: 'deep', name: 'Deep Scan', description: 'Enhanced signal penetration', effect: 'enhanced_range' },
    { id: 'encrypted', name: 'Decrypt Mode', description: 'Attempt to decrypt signals', effect: 'decrypt_attempt' },
    { id: 'jamming', name: 'Anti-Jam', description: 'Counter jamming attempts', effect: 'jam_resistance' },
    { id: 'triangulate', name: 'Triangulate', description: 'Locate signal source', effect: 'source_location' },
    { id: 'intercept', name: 'Intercept', description: 'Monitor enemy communications', effect: 'enemy_monitoring' },
    { id: 'boost', name: 'Signal Boost', description: 'Amplify weak signals', effect: 'signal_amplification' },
    { id: 'filter', name: 'Noise Filter', description: 'Remove background noise', effect: 'noise_reduction' }
  ];

  const toggleCollapse = (key: string) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  /* Socket setup */
  useEffect(() => {
    // Use relative connection for ngrok compatibility
    // This will connect to the same domain/port as the React app
    console.log('🔌 GM Station connecting to current domain');
    const s = io();
    setSocket(s);

    // Connection testing
    s.on('connect', () => {
      console.log('✅ GM Station connected to server:', s.id);
    });

    s.on('connect_error', (error) => {
      console.error('❌ GM Station connection failed:', error);
    });

    /* Listen for communications station frequency changes */
    s.on('comm_frequency_change', (data: { frequency: number; room: string }) => {
      console.log('GM received frequency change from communications:', data);
      // Update GM display to show the new frequency
      setStates((prev) => ({
        ...prev,
        communications: {
          ...prev.communications,
          primaryFrequency: data.frequency
        }
      }));
    });

    /* Listen for communications broadcasts */
    s.on('comm_broadcast', (data: { type: string; value: number; room: string; source: string }) => {
      console.log('GM received communications broadcast:', data);

      if (data.source === 'communications') {
        switch (data.type) {
          case 'frequency_update':
            // Update GM display when communications station changes frequency
            setStates((prev) => ({
              ...prev,
              communications: {
                ...prev.communications,
                primaryFrequency: data.value
              }
            }));

            // Update parent component if available
            if (onGMUpdate) {
              onGMUpdate({
                communications: {
                  ...currentGameState.communications,
                  primaryFrequency: data.value
                }
              });
            }
            break;
        }
      }
    });

    const room = new URLSearchParams(window.location.search).get('room') || 'default';
    roomRef.current = room;

    s.emit('join', { room: roomRef.current, station: 'gm' });

    /* Listen for GM broadcasts (including our own messages) */
    s.on('gm_broadcast', (data: { type: string; value: any; room: string; source: string }) => {
      console.log('GM received gm_broadcast:', data);

      switch (data.type) {
        case 'new_message':
          // ignore our own messages so we don't duplicate them
          if (data.source === 'communications') {
            setCommsTransmissions(prev => [...prev, data.value]);
          }
          break;
      }
    });

    /* Listen to every station's state_update */
    s.on('state_update', (payload: { station: StationName; state: any }) => {
      setStates((prev) => ({ ...prev, [payload.station]: payload.state }));
    });

    return () => {
      s.disconnect();
    };
  }, []);

  /* ---------- EMITTER HELPERS ---------- */
  const emit = (action: string, value?: any, station?: StationName) => {
    if (!socket) return;
    socket.emit('player_action', { room: roomRef.current, action, value, target: station });
  };

  /* ---------- RENDER ---------- */
  return (
    <Container>
      <Header>GAME MASTER CONTROL</Header>

      <PanelsGrid>
        {/* ENHANCED COMMUNICATIONS */}
        <Panel collapsed={collapsed.comms}>
          <PanelHeader onClick={() => toggleCollapse('comms')}>
            <PanelTitle>Communications Control</PanelTitle>
            <CollapseBtn>{collapsed.comms ? '▲' : '▼'}</CollapseBtn>
          </PanelHeader>
          {!collapsed.comms && (
            <>
              {/* Current Status */}
              <Row>
                <span>Primary Freq:</span>
                <span>{states.communications?.primaryFrequency ?? '—'} MHz</span>
              </Row>
              <Row>
                <span>Signal Strength:</span>
                <span style={{ color: signalStrength > 75 ? '#00ff88' : signalStrength > 50 ? '#ffd700' : '#ff0040' }}>
                  {signalStrength}%
                </span>
              </Row>
              <Row>
                <span>Interference:</span>
                <span style={{ color: interference < 25 ? '#00ff88' : interference < 50 ? '#ffd700' : '#ff0040' }}>
                  {interference}%
                </span>
              </Row>
              <Row>
                <span>Analysis Mode:</span>
                <span>{signalAnalysisOptions.find(opt => opt.id === messageAnalysis)?.name ?? 'Normal'}</span>
              </Row>

              {/* Frequency Macros */}
              <div style={{ marginTop: 15, marginBottom: 10 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gm-yellow)', marginBottom: 8, fontWeight: 'bold' }}>
                  FREQUENCY MACROS:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {frequencyMacros.map(macro => (
                    <EmitButton
                      key={macro.id}
                      onClick={() => {
                        emit('set_frequency', macro.frequency, 'communications');
                        // ALSO broadcast the change
                        socket?.emit('comm_broadcast', {
                          type: 'frequency_update',
                          value: macro.frequency,
                          room: roomRef.current,
                          source: 'gm',
                        });
                        if (onGMUpdate) {
                          onGMUpdate({
                            communications: {
                              ...currentGameState.communications,
                              primaryFrequency: macro.frequency
                            }
                          });
                        }
                      }}
                      style={{
                        borderColor: macro.color,
                        color: macro.color,
                        fontSize: '0.7rem',
                        padding: '4px 6px'
                      }}
                      title={`${macro.description} - ${macro.frequency} MHz`}
                    >
                      {macro.name}
                    </EmitButton>
                  ))}
                </div>
              </div>

              {/* Signal Strength Controls */}
              <div style={{ marginTop: 15, marginBottom: 10 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gm-yellow)', marginBottom: 8, fontWeight: 'bold' }}>
                  SIGNAL STRENGTH:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={signalStrength}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSignalStrength(value);
                      // Emit to communications station
                      emit('gm_signal_strength_change', value, 'communications');
                      // Broadcast to all stations
                      if (socket) {
                        console.log('🎛️ GM Broadcasting signal strength update:', value);
                        socket.emit('gm_broadcast', {
                          type: 'signal_strength_update',
                          value: value,
                          room: roomRef.current,
                          source: 'gm'
                        });
                      }
                      if (onGMUpdate) {
                        onGMUpdate({
                          communications: {
                            ...currentGameState.communications,
                            signalStrength: value
                          }
                        });
                      }
                    }}
                    style={{ flex: 1, accentColor: 'var(--gm-green)' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>{signalStrength}%</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <EmitButton onClick={() => {
                    setSignalStrength(Math.min(100, signalStrength + 25));
                    emit('boost_signal', 25, 'communications');
                  }}>+25%</EmitButton>
                  <EmitButton onClick={() => {
                    setSignalStrength(Math.max(0, signalStrength - 25));
                    emit('reduce_signal', 25, 'communications');
                  }}>-25%</EmitButton>
                  <EmitRed onClick={() => {
                    setSignalStrength(0);
                    emit('kill_signal', true, 'communications');
                  }}>KILL</EmitRed>
                </div>
              </div>

              {/* Interference Controls */}
              <div style={{ marginTop: 15, marginBottom: 10 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gm-yellow)', marginBottom: 8, fontWeight: 'bold' }}>
                  INTERFERENCE:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={interference}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setInterference(value);
                      // Emit to communications station
                      emit('gm_interference_change', value, 'communications');
                      // Broadcast to all stations
                      if (socket) {
                        socket.emit('gm_broadcast', {
                          type: 'interference_update',
                          value: value,
                          room: roomRef.current,
                          source: 'gm'
                        });
                      }
                      if (onGMUpdate) {
                        onGMUpdate({
                          communications: {
                            ...currentGameState.communications,
                            interference: value
                          }
                        });
                      }
                    }}
                    style={{ flex: 1, accentColor: 'var(--gm-red)' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>{interference}%</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <EmitButton onClick={() => {
                    setInterference(Math.min(100, interference + 25));
                    emit('add_interference', 25, 'communications');
                  }}>+25%</EmitButton>
                  <EmitButton onClick={() => {
                    setInterference(Math.max(0, interference - 25));
                    emit('reduce_interference', 25, 'communications');
                  }}>-25%</EmitButton>
                  <EmitRed onClick={() => {
                    setInterference(100);
                    emit('jam_all_signals', true, 'communications');
                  }}>JAM ALL</EmitRed>
                </div>
              </div>

              {/* MESSAGE COMPOSER */}
              <div style={{ marginTop: 15, marginBottom: 10 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gm-yellow)', marginBottom: 8, fontWeight: 'bold' }}>
                  MESSAGE COMPOSER:
                </div>

                {/* Priority selector */}
                <select
                  value={messagePriority}
                  onChange={(e) => setMessagePriority(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: '#111',
                    border: '1px solid var(--gm-blue)',
                    color: '#eee',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    marginBottom: 6
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="emergency">EMERGENCY</option>
                </select>

                {/* From field */}
                <input
                  type="text"
                  placeholder="From (source)"
                  value={messageFrom}
                  onChange={(e) => setMessageFrom(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#111',
                    border: '1px solid var(--gm-blue)',
                    color: '#eee',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    marginBottom: 6
                  }}
                />

                {/* Signal Analysis selector */}


                {/* Message text */}
                <textarea
                  placeholder="Type transmission..."
                  value={messageResponse}
                  onChange={(e) => setMessageResponse(e.target.value)}
                  style={{
                    width: '100%',
                    height: '60px',
                    background: '#111',
                    border: '1px solid var(--gm-blue)',
                    color: '#eee',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    padding: '6px',
                    resize: 'vertical',
                    marginBottom: 6
                  }}
                />

                {/* Send buttons */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <EmitButton
                    onClick={() => {
                      if (!messageResponse.trim()) return;
                      const room = roomRef.current;
                      const freq = states.communications?.primaryFrequency ?? 121.5;

                      // use the *same* channel Comms already listens for
                      socket?.emit('gm_broadcast', {
                        type: 'new_message',
                        value: {
                          id: Date.now().toString(),
                          from: messageFrom,              // <- dynamic
                          to: 'All Stations',
                          content: messageResponse,
                          priority: messagePriority,
                          frequency: freq,
                          timestamp: Date.now(),
                          analysisMode: messageAnalysis,        // <-- new
                          onAir: `(${freq.toFixed(1)} MHz)`               // <-- new
                        },
                        room,
                        source: 'gm'
                      });
                      setMessageResponse('');
                    }}
                  >
                    Send Transmission
                  </EmitButton>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginTop: 15 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gm-yellow)', marginBottom: 8, fontWeight: 'bold' }}>
                  QUICK ACTIONS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <EmitButton onClick={() => emit('toggle_emergency_beacon', true, 'communications')}>
                    Beacon ON
                  </EmitButton>
                  <EmitRed onClick={() => emit('toggle_emergency_beacon', false, 'communications')}>
                    Beacon OFF
                  </EmitRed>
                  <EmitButton onClick={() => emit('clear_all_messages', true, 'communications')}>
                    Clear Messages
                  </EmitButton>
                  <EmitRed onClick={() => emit('communications_blackout', true, 'communications')}>
                    BLACKOUT
                  </EmitRed>
                </div>
              </div>

              {/* LIVE COMMUNICATION LOG */}
              <div style={{ marginTop: 20, border: '1px solid var(--gm-blue)', borderRadius: 4, padding: 10 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gm-yellow)', marginBottom: 6 }}>COMMS TRANSMISSION LOG</div>
                <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: '0.7rem' }}>
                  {commsTransmissions.length === 0 ? (
                    <div style={{ color: '#666' }}>No transmissions yet</div>
                  ) : (
                    commsTransmissions.map(msg => (
                      <div key={msg.id} style={{ marginBottom: 4 }}>
                        <strong>{msg.from}</strong> → {msg.to}: {msg.content} <em>({msg.priority})</em> {msg.onAir}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>

        {/* NAVIGATION */}
        <Panel collapsed={collapsed.nav}>
          <PanelHeader onClick={() => toggleCollapse('nav')}>
            <PanelTitle>Navigation</PanelTitle>
            <CollapseBtn>{collapsed.nav ? '▲' : '▼'}</CollapseBtn>
          </PanelHeader>
          {!collapsed.nav && (
            <>
              <Row>
                <span>Speed:</span>
                <span>{states.navigation?.speed ?? '—'}</span>
              </Row>
              <Row>
                <span>Altitude:</span>
                <span>{states.navigation?.altitude?.toFixed(0) ?? '—'}</span>
              </Row>
              <Row>
                <span>Fuel:</span>
                <span>{states.navigation?.fuelLevel ?? '—'}%</span>
              </Row>
              <Row>
                <span>Hyperdrive:</span>
                <span>{states.navigation?.hyperdriveStatus ?? '—'}</span>
              </Row>
              <div style={{ marginTop: 10 }}>
                <EmitButton onClick={() => emit('set_speed', 100)}>Max Speed</EmitButton>
                <EmitButton onClick={() => emit('hyperdrive_jump', 1)}>Force Jump</EmitButton>
                <EmitRed onClick={() => emit('set_speed', 0)}>Full Stop</EmitRed>
                <EmitButton onClick={() => emit('emergency_power', true)}>Emergency PWR</EmitButton>
              </div>
            </>
          )}
        </Panel>

        {/* WEAPONS */}
        <Panel collapsed={collapsed.weapons}>
          <PanelHeader onClick={() => toggleCollapse('weapons')}>
            <PanelTitle>Weapons</PanelTitle>
            <CollapseBtn>{collapsed.weapons ? '▲' : '▼'}</CollapseBtn>
          </PanelHeader>
          {!collapsed.weapons && (
            <>
              <Row>
                <span>Power:</span>
                <span>{states.weapons?.weapons?.powerLevel ?? '—'}%</span>
              </Row>
              <Row>
                <span>Heat:</span>
                <span>{states.weapons?.weapons?.heatLevel ?? '—'}%</span>
              </Row>
              <Row>
                <span>Lock:</span>
                <span>{states.weapons?.targeting?.lockStatus ?? '—'}</span>
              </Row>
              <div style={{ marginTop: 10 }}>
                <EmitButton onClick={() => emit('fire_primary_weapons', {})}>Fire Primaries</EmitButton>
                <EmitButton onClick={() => emit('fire_torpedo', { type: 'proton' })}>
                  Fire Proton
                </EmitButton>
                <EmitRed onClick={() => emit('clear_all_assigned_weapons', {})}>
                  Strip All Weapons
                </EmitRed>
              </div>
            </>
          )}
        </Panel>

        {/* ENGINEERING */}
        <Panel collapsed={collapsed.eng}>
          <PanelHeader onClick={() => toggleCollapse('eng')}>
            <PanelTitle>Engineering</PanelTitle>
            <CollapseBtn>{collapsed.eng ? '▲' : '▼'}</CollapseBtn>
          </PanelHeader>
          {!collapsed.eng && (
            <>
              <Row>
                <span>Reactor:</span>
                <span>{states.engineering?.powerDistribution?.reactorOutput ?? '—'}%</span>
              </Row>
              <Row>
                <span>Available:</span>
                <span>{states.engineering?.powerDistribution?.totalPower ?? '—'}%</span>
              </Row>
              <Row>
                <span>Emergency:</span>
                <span>{states.engineering?.powerDistribution?.emergencyPower ? 'ON' : 'OFF'}</span>
              </Row>
              <div style={{ marginTop: 10 }}>
                <EmitButton onClick={() => emit('toggle_emergency_power', true)}>
                  Emergency ON
                </EmitButton>
                <EmitButton
                  onClick={() =>
                    emit('set_power_allocation', {
                      weapons: 50,
                      shields: 50,
                      engines: 50,
                      sensors: 20,
                      lifeSupport: 20,
                      communications: 10,
                      maxAvailable: 200,
                    })
                  }
                >
                  Overload All
                </EmitButton>
              </div>
            </>
          )}
        </Panel>

        {/* GLOBAL PRESETS */}
        <Panel collapsed={collapsed.presets}>
          <PanelHeader onClick={() => toggleCollapse('presets')}>
            <PanelTitle>Global Presets</PanelTitle>
            <CollapseBtn>{collapsed.presets ? '▲' : '▼'}</CollapseBtn>
          </PanelHeader>
          {!collapsed.presets && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <EmitButton
                onClick={() => {
                  emit('red_alert', true);
                  emit('toggle_emergency_power', true);
                }}
              >
                RED ALERT
              </EmitButton>
              <EmitButton
                onClick={() => {
                  emit('clear_all_assigned_weapons', {});
                  emit('weapons_offline', true);
                }}
              >
                Weapons Offline
              </EmitButton>
              <EmitButton onClick={() => emit('hyperdrive_ready', true)}>
                Hyperdrive Ready
              </EmitButton>
              <EmitButton onClick={() => emit('fuel_empty', true)}>Empty Fuel</EmitButton>
            </div>
          )}
        </Panel>

        {/* RAW EMITTER */}
        <Panel collapsed={collapsed.raw}>
          <PanelHeader onClick={() => toggleCollapse('raw')}>
            <PanelTitle>Raw Emitter</PanelTitle>
            <CollapseBtn>{collapsed.raw ? '▲' : '▼'}</CollapseBtn>
          </PanelHeader>
          {!collapsed.raw && (
            <div>
              <textarea
                placeholder='{ "action": "set_speed", "value": 50, "target": "navigation" }'
                style={{
                  width: '100%',
                  height: 60,
                  background: '#111',
                  border: '1px solid var(--gm-blue)',
                  color: '#eee',
                  borderRadius: 4,
                  fontSize: 12,
                  padding: 6,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    try {
                      const json = JSON.parse(e.currentTarget.value);
                      emit(json.action, json.value, json.target);
                      e.currentTarget.value = '';
                    } catch { }
                  }
                }}
              />
              <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                Ctrl+Enter to fire
              </div>
            </div>
          )}
        </Panel>
      </PanelsGrid>
    </Container>
  );
};

export default GMStation;