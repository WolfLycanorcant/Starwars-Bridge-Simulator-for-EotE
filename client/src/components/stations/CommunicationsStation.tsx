import React, { useState } from 'react';
import { GameState } from '../../types';

interface CommunicationsStationProps {
  gameState: GameState;
  onPlayerAction: (action: string, value: any) => void;
}

const CommunicationsStation: React.FC<CommunicationsStationProps> = ({ gameState, onPlayerAction }) => {
  const [messageText, setMessageText] = useState('');
  const [recipient, setRecipient] = useState('All Stations');
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high' | 'emergency'>('normal');

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

  const communications = gameState?.communications || mockComms;

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
              {communications.primaryFrequency.toFixed(1)}
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
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00)', transition: 'width 0.3s ease', width: `${communications.signalStrength}%` }}></div>
          </div>
          <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', color: '#00ffff', marginLeft: '10px' }}>{communications.signalStrength}%</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
          <div style={{ width: '80px', fontSize: '11px', color: '#888888' }}>INTERFERENCE</div>
          <div style={{ flex: 1, height: '8px', background: '#001111', border: '1px solid #004444', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000)', transition: 'width 0.3s ease', width: `${communications.interference}%` }}></div>
          </div>
          <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', color: '#00ffff', marginLeft: '10px' }}>{communications.interference}%</div>
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
            style={{...inputStyle, marginBottom: '10px'}}
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
            style={{...inputStyle, resize: 'none', flex: 1, marginBottom: '10px'}}
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
                  borderLeft: `3px solid ${
                    message.priority === 'emergency' ? '#ff0000' :
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
        <div style={{ color: '#888888', textAlign: 'center', marginTop: '50px' }}>
          Channel management interface
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
          <div>Imperial Frequency: 121.5 MHz</div>
          <div>Rebel Leadership: 243.0 MHz</div>
          <div>Emergency Channel: 406.0 MHz</div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsStation;