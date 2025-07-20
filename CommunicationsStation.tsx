import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../../types';

interface CommunicationsStationProps {
  gameState: GameState;
  onPlayerAction: (action: string, value: any) => void;
}

const CommunicationsStation: React.FC<CommunicationsStationProps> = ({ gameState, onPlayerAction }) => {
  const [messageText, setMessageText] = useState('');
  const [recipient, setRecipient] = useState('All Stations');
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high' | 'emergency'>('normal');

  // Real-time communication state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentSignalStrength, setCurrentSignalStrength] = useState(85);
  const [currentInterference, setCurrentInterference] = useState(15);
  const [currentFrequency, setCurrentFrequency] = useState(121.5);
  const [messageQueue, setMessageQueue] = useState<any[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState('normal');

  // Signal analysis options (matching GM Station)
  const signalAnalysisOptions = [
    { id: 'normal', name: 'Normal Scan', description: 'Standard signal analysis', effect: 'baseline' },
    { id: 'deep', name: 'Deep Scan', description: 'Enhanced signal penetration', effect: 'enhanced_range' },
    { id: 'encrypted', name: 'Decrypt Mode', description: 'Attempt to decrypt signals', effect: 'decrypt_attempt' },
    { id: 'jamming', name: 'Anti-Jam', description: 'Counter jamming attempts', effect: 'jam_resistance' },
    { id: 'triangulate', name: 'Triangulate', description: 'Locate signal source', effect: 'source_location' },
    { id: 'intercept', name: 'Intercept', description: 'Monitor enemy communications', effect: 'enemy_monitoring' },
    { id: 'boost', name: 'Signal Boost', description: 'Amplify weak signals', effect: 'signal_amplification' },
    { id: 'filter', name: 'Noise Filter', description: 'Remove background noise', effect: 'noise_reduction' }
  ];

  // Initialize socket connection and listeners
  useEffect(() => {
    // Use relative connection for ngrok compatibility
    // This will connect to the same domain/port as the React app
    console.log('🔌 Communications Station connecting to current domain');
    const newSocket = io();
    setSocket(newSocket);

    // Get room from URL parameter
    const room = new URLSearchParams(window.location.search).get('room') || 'default';

    // Connection testing
    newSocket.on('connect', () => {
      console.log('✅ Communications Station connected to server:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Communications Station connection failed:', error);
    });

    // Listen for GM broadcasts
    newSocket.on('gm_broadcast', (data: { type: string; value: any; room: string; source: string }) => {
      console.log('🔊 Communications Station received GM broadcast:', data);

      switch (data.type) {
        case 'signal_strength_update':
          console.log('📶 Updating signal strength to:', data.value);
          setCurrentSignalStrength(data.value);
          // Also update parent component
          onPlayerAction('set_signal_strength', data.value);
          break;
        case 'interference_update':
          console.log('📡 Updating interference to:', data.value);
          setCurrentInterference(data.value);
          // Also update parent component
          onPlayerAction('set_interference', data.value);
          break;
        case 'frequency_update':
          if (data.source === 'gm') {  // Only update if from GM
            console.log('📻 Updating frequency to:', data.value);
            setCurrentFrequency(data.value);
            onPlayerAction('set_frequency', data.value);
          }
          break;
        case 'new_message':
          // push GM message into the log
          console.log('📨 Received GM message:', data.value);
          setCurrentAnalysis(data.value.analysisMode || 'normal');
          setMessageQueue(prev => [...prev, data.value]);
          break;
      }
    });

    // Listen for frequency changes coming from the GM
    newSocket.on('comm_broadcast', (data: { type: string; value: number; room: string; source: string; }) => {
      if (data.type === 'frequency_update') {
        setCurrentFrequency(data.value);
        onPlayerAction('set_frequency', data.value);
      }
    });

    // Join communications room with URL parameter support
    newSocket.emit('join', { room, station: 'communications' });

    return () => {
      newSocket.disconnect();
    };
  }, [onPlayerAction]);

  // Sync with gameState changes
  useEffect(() => {
    if (gameState?.communications) {
      if (gameState.communications.signalStrength !== undefined) {
        setCurrentSignalStrength(gameState.communications.signalStrength);
      }
      if (gameState.communications.interference !== undefined) {
        setCurrentInterference(gameState.communications.interference);
      }
      if (gameState.communications.primaryFrequency !== undefined) {
        setCurrentFrequency(gameState.communications.primaryFrequency);
      }
    }
  }, [gameState?.communications]);

  // Mock data for demonstration
  const mockComms = {
    primaryFrequency: 121.5,
    secondaryFrequency: 243.0,
    signalStrength: 85,
    interference: 15,
    transmissionStatus: 'standby',
    emergencyBeacon: false,
    messageQueue: [
      {
        id: '1',
        from: 'Imperial Command',
        to: 'All Stations',
        content: 'Maintain current heading. Rebel activity detected in sector 7.',
        priority: 'high' as const,
        encrypted: false,
        timestamp: Date.now() - 300000,
        acknowledged: false
      }
    ]
  };

  // Use real-time socket values instead of stale gameState
  const communications = {
    ...mockComms,
    ...gameState?.communications,
    signalStrength: currentSignalStrength,
    interference: currentInterference,
    primaryFrequency: currentFrequency,
    messageQueue: [...mockComms.messageQueue, ...messageQueue], // Combine mock messages with real GM messages
  };

  const adjustFrequency = (type: 'primary' | 'secondary', delta: number) => {
    const currentFreq = type === 'primary' ? communications.primaryFrequency : communications.secondaryFrequency;
    const newFreq = Math.max(0, Math.min(999.9, currentFreq + delta));
    onPlayerAction(type === 'primary' ? 'set_frequency' : 'set_secondary_frequency', newFreq);
  };

  const sendMessage = () => {
    if (messageText.trim()) {
      onPlayerAction('send_message', {
        to: recipient,
        content: messageText,
        priority: messagePriority
      });
      setMessageText('');
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '15px',
    padding: '15px',
    height: '100%',
    background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%)'
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(0, 20, 20, 0.8)',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
  };

  const panelTitleStyle: React.CSSProperties = {
    color: '#00ffff',
    margin: '0 0 15px 0',
    textAlign: 'center',
    fontSize: '1.1rem',
    textShadow: '0 0 10px currentColor',
    letterSpacing: '2px'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(0, 255, 255, 0.1)',
    border: '1px solid #00ffff',
    color: '#00ffff',
    padding: '4px 8px',
    fontSize: '10px',
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'all 0.2s ease'
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid #00ffff',
    color: '#00ffff',
    padding: '8px',
    fontFamily: 'inherit',
    fontSize: '12px',
    borderRadius: '4px'
  };

  return (
    <div style={containerStyle}>
      {/* Frequency Control Panel */}
      <div style={panelStyle}>
        <h3 style={panelTitleStyle}>SUBSPACE TRANSCEIVER</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#888888', marginBottom: '5px' }}>PRIMARY FREQ</div>
            <div style={{ fontSize: '18px', color: '#00ffff', fontWeight: 'bold', textShadow: '0 0 5px currentColor' }}>
              {currentFrequency.toFixed(1)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '8px' }}>
              <button style={buttonStyle} onClick={() => adjustFrequency('primary', -0.1)}>-0.1</button>
              <button style={buttonStyle} onClick={() => adjustFrequency('primary', -1)}>-1</button>
              <button style={buttonStyle} onClick={() => adjustFrequency('primary', 1)}>+1</button>
              <button style={buttonStyle} onClick={() => adjustFrequency('primary', 0.1)}>+0.1</button>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid #004444',
            borderRadius: '4px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#888888', marginBottom: '5px' }}>SECONDARY FREQ</div>
            <div style={{ fontSize: '18px', color: '#006666', fontWeight: 'bold', textShadow: '0 0 5px currentColor' }}>
              {communications.secondaryFrequency.toFixed(1)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '8px' }}>
              <button style={buttonStyle} onClick={() => adjustFrequency('secondary', -0.1)}>-0.1</button>
              <button style={buttonStyle} onClick={() => adjustFrequency('secondary', -1)}>-1</button>
              <button style={buttonStyle} onClick={() => adjustFrequency('secondary', 1)}>+1</button>
              <button style={buttonStyle} onClick={() => adjustFrequency('secondary', 0.1)}>+0.1</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
          <div style={{ width: '80px', fontSize: '11px', color: '#888888' }}>SIGNAL</div>
          <div style={{ flex: 1, height: '8px', background: '#001111', border: '1px solid #004444', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00)',
              transition: 'width 0.3s ease',
              width: `${currentSignalStrength}%`,
              boxShadow: currentSignalStrength > 75 ? '0 0 8px #00ff00' : currentSignalStrength > 50 ? '0 0 8px #ffff00' : '0 0 8px #ff0000'
            }}></div>
          </div>
          <div style={{
            width: '40px',
            textAlign: 'right',
            fontSize: '11px',
            color: currentSignalStrength > 75 ? '#00ff00' : currentSignalStrength > 50 ? '#ffff00' : '#ff0000',
            marginLeft: '10px',
            fontWeight: 'bold',
            textShadow: '0 0 5px currentColor'
          }}>{currentSignalStrength}%</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
          <div style={{ width: '80px', fontSize: '11px', color: '#888888' }}>INTERFERENCE</div>
          <div style={{ flex: 1, height: '8px', background: '#001111', border: '1px solid #004444', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000)',
              transition: 'width 0.3s ease',
              width: `${currentInterference}%`,
              boxShadow: currentInterference < 25 ? '0 0 8px #00ff00' : currentInterference < 50 ? '0 0 8px #ffff00' : '0 0 8px #ff0000'
            }}></div>
          </div>
          <div style={{
            width: '40px',
            textAlign: 'right',
            fontSize: '11px',
            color: currentInterference < 25 ? '#00ff00' : currentInterference < 50 ? '#ffff00' : '#ff0000',
            marginLeft: '10px',
            fontWeight: 'bold',
            textShadow: '0 0 5px currentColor'
          }}>{currentInterference}%</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          margin: '10px 0',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid #004444',
          borderRadius: '4px',
          color: '#00ffff',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {communications.transmissionStatus.toUpperCase()}
        </div>

        <button
          style={{
            background: communications.emergencyBeacon ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 0, 0, 0.1)',
            border: '2px solid #ff0000',
            color: '#ff0000',
            padding: '15px',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderRadius: '4px',
            marginTop: '15px',
            transition: 'all 0.3s ease'
          }}
          onClick={() => onPlayerAction('toggle_emergency_beacon', !communications.emergencyBeacon)}
        >
          EMERGENCY BEACON
          <br />
          {communications.emergencyBeacon ? 'ACTIVE' : 'STANDBY'}
        </button>
      </div>

      {/* Message Composer */}
      <div style={panelStyle}>
        <h3 style={panelTitleStyle}>MESSAGE COMPOSER</h3>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <select
            style={{ ...inputStyle, marginBottom: '10px' }}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          >
            <option value="All Stations">All Stations</option>
            <option value="Navigation">Navigation</option>
            <option value="Weapons">Weapons</option>
            <option value="Engineering">Engineering</option>
            <option value="Command">Command</option>
            <option value="Imperial Command">Imperial Command</option>
            <option value="Rebel Leadership">Rebel Leadership</option>
          </select>

          <textarea
            style={{ ...inputStyle, resize: 'none', flex: 1, marginBottom: '10px' }}
            placeholder="Enter transmission..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select
              style={inputStyle}
              value={messagePriority}
              onChange={(e) => setMessagePriority(e.target.value as any)}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="emergency">EMERGENCY</option>
            </select>

            <button
              style={{
                background: messagePriority === 'emergency' ? 'rgba(255, 0, 0, 0.2)' :
                  messagePriority === 'high' ? 'rgba(255, 136, 0, 0.2)' :
                    'rgba(0, 255, 255, 0.1)',
                border: `2px solid ${messagePriority === 'emergency' ? '#ff0000' :
                  messagePriority === 'high' ? '#ff8800' :
                    '#00ffff'}`,
                color: messagePriority === 'emergency' ? '#ff0000' :
                  messagePriority === 'high' ? '#ff8800' :
                    '#00ffff',
                padding: '8px 16px',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                opacity: !messageText.trim() ? 0.5 : 1
              }}
              onClick={sendMessage}
              disabled={!messageText.trim()}
            >
              TRANSMIT
            </button>
          </div>
        </div>
      </div>

      {/* Message Log */}
      <div style={panelStyle}>
        <h3 style={panelTitleStyle}>TRANSMISSION LOG</h3>

        <div style={{
          flex: 1,
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid #004444',
          borderRadius: '4px',
          padding: '10px',
          overflowY: 'auto',
          fontSize: '11px',
          maxHeight: '300px'
        }}>
          {communications.messageQueue.length === 0 ? (
            <div style={{ color: '#666666', textAlign: 'center', marginTop: '50px' }}>
              No transmissions received
            </div>
          ) : (
            communications.messageQueue.map((message: any) => (
              <div
                key={message.id}
                style={{
                  margin: '8px 0',
                  padding: '8px',
                  borderLeft: `3px solid ${message.priority === 'emergency' ? '#ff0000' :
                    message.priority === 'high' ? '#ff8800' :
                      message.priority === 'normal' ? '#00ff00' :
                        '#004444'
                    }`,
                  background: message.encrypted ? 'rgba(255, 255, 0, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0 4px 4px 0',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '10px' }}>
                  <div style={{ color: '#888888' }}>
                    FROM: {message.from} → TO: {message.to}
                  </div>
                  <div style={{ color: '#666666' }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ color: '#00ffff', marginBottom: '5px', lineHeight: 1.3 }}>
                  {message.content}
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: '#666666' }}>
                  <span>PRIORITY: {message.priority.toUpperCase()}</span>
                  {message.encrypted && <span>ENCRYPTED</span>}
                  {message.acknowledged && <span>ACKNOWLEDGED</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Communication Channels */}
      <div style={panelStyle}>
        <h3 style={panelTitleStyle}>COMMUNICATION CHANNELS</h3>

        {/* Frequency Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px' }}>
            FREQUENCY TUNER
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            padding: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '10px', color: '#888888' }}>0.0</span>
              <span style={{
                fontSize: '16px',
                color: '#00ffff',
                fontWeight: 'bold',
                textShadow: '0 0 5px currentColor'
              }}>
                {currentFrequency.toFixed(1)} MHz
              </span>
              <span style={{ fontSize: '10px', color: '#888888' }}>999.9</span>
            </div>

            <input
              type="range"
              min="0"
              max="999.9"
              step="0.1"
              value={currentFrequency}
              onChange={(e) => {
                const newFreq = parseFloat(e.target.value);
                setCurrentFrequency(newFreq);
                // tell the server AND broadcast to everyone
                const room = new URLSearchParams(window.location.search).get('room') || 'default';
                socket?.emit('player_action', {
                  action: 'set_frequency',
                  value: newFreq,
                  room: room,
                });
                socket?.emit('comm_broadcast', {
                  type: 'frequency_update',
                  value: newFreq,
                  room: room,
                  source: 'communications',
                });
                onPlayerAction('set_frequency', newFreq);
              }}
              style={{
                width: '100%',
                height: '6px',
                background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                accentColor: '#00ffff'
              }}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '9px',
              color: '#666666'
            }}>
              <span>Emergency</span>
              <span>Command</span>
              <span>Tactical</span>
              <span>Override</span>
            </div>
          </div>
        </div>

        {/* Quick Channel Presets */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px' }}>
            QUICK CHANNELS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            {[
              { name: 'Emergency', freq: 121.5, color: '#ff0000' },
              { name: 'Command', freq: 243.0, color: '#ffd700' },
              { name: 'Medical', freq: 156.8, color: '#ff6b6b' },
              { name: 'Security', freq: 453.212, color: '#a8e6cf' },
              { name: 'Engineering', freq: 467.775, color: '#4ecdc4' },
              { name: 'Navigation', freq: 156.05, color: '#95e1d3' },
              { name: 'Tactical', freq: 462.675, color: '#ff8c42' }
            ].map(channel => (
              <button
                key={channel.name}
                style={{
                  ...buttonStyle,
                  borderColor: channel.color,
                  color: channel.color,
                  fontSize: '9px',
                  padding: '6px 8px'
                }}
                onClick={() => {
                  const room = new URLSearchParams(window.location.search).get('room') || 'default';
                  setCurrentFrequency(channel.freq);
                  socket?.emit('player_action', {
                    action: 'set_frequency',
                    value: channel.freq,
                    room: room,
                  });
                  socket?.emit('comm_broadcast', {
                    type: 'frequency_update',
                    value: channel.freq,
                    room: room,
                    source: 'communications',
                  });
                  onPlayerAction('set_frequency', channel.freq);
                }}
              >
                {channel.name}
                <br />
                {channel.freq}
              </button>
            ))}
          </div>
        </div>

        {/* Channel Status */}
        <div style={{ fontSize: '10px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '2px'
          }}>
            <span>Active Channels:</span>
            <span style={{ color: '#00ff00' }}>3</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '2px'
          }}>
            <span>Encrypted:</span>
            <span style={{ color: '#ffff00' }}>1</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '2px'
          }}>
            <span>Monitoring:</span>
            <span style={{ color: '#00ffff' }}>All</span>
          </div>
        </div>
      </div>

      {/* Long Range Communications */}
      <div style={panelStyle}>
        <h3 style={panelTitleStyle}>LONG RANGE COMMS</h3>
        <div style={{ fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Imperial Network:</span>
            <span style={{ color: '#00ff00' }}>CONNECTED</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Fleet Coordination:</span>
            <span style={{ color: '#00ff00' }}>ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Signal Analysis */}
      <div style={panelStyle}>
        <h3 style={panelTitleStyle}>SIGNAL ANALYSIS</h3>
        <div style={{ fontSize: '11px', color: '#888888' }}>
          <div style={{ marginBottom: '8px' }}>
            Current Analysis: <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
              {signalAnalysisOptions.find(o => o.id === currentAnalysis)?.name ?? 'Normal'}
            </span>
          </div>
          <div>Imperial Frequency: 121.5 MHz</div>
          <div>Rebel Leadership: 243.0 MHz</div>
          <div>Emergency Channel: 406.0 MHz</div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsStation;