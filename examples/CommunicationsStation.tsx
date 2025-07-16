import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { GameState, Message, CommChannel } from '../../types';

const scanAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const CommsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  padding: 15px;
  height: 100%;
  background: radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%);
`;

const Panel = styled.div<{ alert?: boolean }>`
  background: rgba(0, 20, 20, 0.8);
  border: 2px solid ${props => props.alert ? '#ff0000' : '#00ffff'};
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ffff, transparent);
    animation: ${scanAnimation} 3s infinite;
  }
`;

const PanelTitle = styled.h3<{ alert?: boolean }>`
  color: ${props => props.alert ? '#ff0000' : '#00ffff'};
  margin: 0 0 15px 0;
  text-align: center;
  font-size: 1.1rem;
  text-shadow: 0 0 10px currentColor;
  letter-spacing: 2px;
`;

const FrequencyDisplay = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const FrequencyPanel = styled.div<{ active?: boolean }>`
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid ${props => props.active ? '#00ffff' : '#004444'};
  border-radius: 4px;
  padding: 10px;
  text-align: center;
  position: relative;

  .label {
    font-size: 10px;
    color: #888888;
    margin-bottom: 5px;
  }

  .frequency {
    font-size: 18px;
    color: ${props => props.active ? '#00ffff' : '#006666'};
    font-weight: bold;
    text-shadow: 0 0 5px currentColor;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 8px;
  }
`;

const FrequencyButton = styled.button`
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.2);
    box-shadow: 0 0 5px #00ffff;
  }
`;

const SignalStrengthMeter = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0;
  
  .label {
    width: 80px;
    font-size: 11px;
    color: #888888;
  }
  
  .meter {
    flex: 1;
    height: 8px;
    background: #001111;
    border: 1px solid #004444;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }
  
  .fill {
    height: 100%;
    background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00);
    transition: width 0.3s ease;
    position: relative;
  }
  
  .value {
    width: 40px;
    text-align: right;
    font-size: 11px;
    color: #00ffff;
    margin-left: 10px;
  }
`;

const TransmissionStatus = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 10px 0;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid ${props => {
    switch (props.status) {
      case 'transmitting': return '#ff0000';
      case 'receiving': return '#00ff00';
      case 'jammed': return '#ff8800';
      default: return '#004444';
    }
  }};
  border-radius: 4px;
  color: ${props => {
    switch (props.status) {
      case 'transmitting': return '#ff0000';
      case 'receiving': return '#00ff00';
      case 'jammed': return '#ff8800';
      default: return '#00ffff';
    }
  }};
  font-weight: bold;
  font-size: 12px;
  animation: ${props => props.status !== 'standby' ? pulseAnimation : 'none'} 1s infinite;
`;

const MessageComposer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const RecipientSelector = styled.select`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 8px;
  font-family: inherit;
  font-size: 12px;
  margin-bottom: 10px;
  border-radius: 4px;

  option {
    background: #001111;
    color: #00ffff;
  }
`;

const MessageInput = styled.textarea`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 10px;
  font-family: inherit;
  font-size: 12px;
  resize: none;
  flex: 1;
  border-radius: 4px;
  margin-bottom: 10px;

  &::placeholder {
    color: #004444;
  }

  &:focus {
    outline: none;
    border-color: #00ffff;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }
`;

const MessageControls = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const PrioritySelector = styled.select`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 6px;
  font-family: inherit;
  font-size: 11px;
  border-radius: 4px;
`;

const TransmitButton = styled.button<{ priority: string }>`
  background: ${props => {
    switch (props.priority) {
      case 'emergency': return 'rgba(255, 0, 0, 0.2)';
      case 'high': return 'rgba(255, 136, 0, 0.2)';
      default: return 'rgba(0, 255, 255, 0.1)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.priority) {
      case 'emergency': return '#ff0000';
      case 'high': return '#ff8800';
      default: return '#00ffff';
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case 'emergency': return '#ff0000';
      case 'high': return '#ff8800';
      default: return '#00ffff';
    }
  }};
  padding: 8px 16px;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageLog = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #004444;
  border-radius: 4px;
  padding: 10px;
  overflow-y: auto;
  font-size: 11px;
  max-height: 300px;
`;

const MessageEntry = styled.div<{ priority: string; encrypted: boolean }>`
  margin: 8px 0;
  padding: 8px;
  border-left: 3px solid ${props => {
    switch (props.priority) {
      case 'emergency': return '#ff0000';
      case 'high': return '#ff8800';
      case 'normal': return '#00ff00';
      default: return '#004444';
    }
  }};
  background: ${props => props.encrypted ? 'rgba(255, 255, 0, 0.05)' : 'rgba(0, 0, 0, 0.3)'};
  border-radius: 0 4px 4px 0;
  position: relative;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    font-size: 10px;
  }

  .from-to {
    color: #888888;
  }

  .timestamp {
    color: #666666;
  }

  .content {
    color: #00ffff;
    margin-bottom: 5px;
    line-height: 1.3;
  }

  .flags {
    display: flex;
    gap: 10px;
    font-size: 9px;
    color: #666666;
  }

  ${props => props.encrypted && `
    &::after {
      content: '🔒';
      position: absolute;
      top: 5px;
      right: 5px;
      color: #ffff00;
      font-size: 10px;
    }
  `}
`;

const ChannelGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const ChannelEntry = styled.div<{ active: boolean; encrypted: boolean }>`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.active ? '#00ff00' : '#004444'};
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #00ffff;
    background: rgba(0, 255, 255, 0.05);
  }

  .channel-name {
    font-weight: bold;
    color: ${props => props.active ? '#00ff00' : '#00ffff'};
    margin-bottom: 5px;
    font-size: 12px;
  }

  .channel-freq {
    color: #888888;
    font-size: 11px;
    margin-bottom: 5px;
  }

  .channel-info {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #666666;
  }

  ${props => props.encrypted && `
    &::before {
      content: '🔒';
      position: absolute;
      top: 5px;
      right: 5px;
      color: #ffff00;
      font-size: 10px;
    }
  `}
`;

const EmergencyBeacon = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 0, 0, 0.1)'};
  border: 2px solid #ff0000;
  color: #ff0000;
  padding: 15px;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 15px;
  transition: all 0.3s ease;
  animation: ${props => props.active ? pulseAnimation : 'none'} 1s infinite;

  &:hover {
    background: rgba(255, 0, 0, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 0, 0, 0.3);
  }
`;

const EncryptionPanel = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #ffff00;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;

  .title {
    color: #ffff00;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .key-input {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #ffff00;
    color: #ffff00;
    padding: 6px;
    font-family: inherit;
    font-size: 10px;
    width: 100%;
    border-radius: 2px;
    margin-bottom: 8px;
  }

  .encrypt-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    color: #ffff00;
  }
`;

interface CommunicationsStationProps {
  gameState: GameState;
  onPlayerAction: (action: string, value: any) => void;
}

const CommunicationsStation: React.FC<CommunicationsStationProps> = ({ gameState, onPlayerAction }) => {
  // All hooks must be called before any conditional returns
  const [messageText, setMessageText] = useState('');
  const [recipient, setRecipient] = useState('All Stations');
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high' | 'emergency'>('normal');
  const [encryptMessage, setEncryptMessage] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Auto-scroll message log - must be before conditional return
  useEffect(() => {
    const messageLog = document.getElementById('message-log');
    if (messageLog && gameState?.communications?.messageQueue) {
      messageLog.scrollTop = messageLog.scrollHeight;
    }
  }, [gameState?.communications?.messageQueue]);

  // Debug logging
  console.log('CommunicationsStation render:', { gameState, communications: gameState?.communications });
  
  if (!gameState || !gameState.communications) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        color: '#ff0000',
        fontSize: '1.5rem'
      }}>
        COMMUNICATIONS SYSTEM OFFLINE - NO GAME STATE
      </div>
    );
  }
  
  const { communications } = gameState;

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
        priority: messagePriority,
        encrypted: encryptMessage,
        encryptionKey: encryptMessage ? encryptionKey : undefined
      });
      setMessageText('');
    }
  };

  const joinChannel = (channel: CommChannel) => {
    onPlayerAction('join_channel', { frequency: channel.frequency });
    setSelectedChannel(channel.frequency.toString());
  };

  const createChannel = () => {
    const name = prompt('Enter channel name:');
    const frequency = parseFloat(prompt('Enter frequency:') || '0');
    if (name && frequency) {
      onPlayerAction('create_channel', { name, frequency, encrypted: false });
    }
  };

  return (
    <CommsContainer>
      {/* Frequency Control Panel */}
      <Panel>
        <PanelTitle>SUBSPACE TRANSCEIVER</PanelTitle>
        
        <FrequencyDisplay>
          <FrequencyPanel active={true}>
            <div className="label">PRIMARY FREQ</div>
            <div className="frequency">{communications.primaryFrequency.toFixed(1)}</div>
            <div className="controls">
              <FrequencyButton onClick={() => adjustFrequency('primary', -0.1)}>-0.1</FrequencyButton>
              <FrequencyButton onClick={() => adjustFrequency('primary', -1)}>-1</FrequencyButton>
              <FrequencyButton onClick={() => adjustFrequency('primary', 1)}>+1</FrequencyButton>
              <FrequencyButton onClick={() => adjustFrequency('primary', 0.1)}>+0.1</FrequencyButton>
            </div>
          </FrequencyPanel>

          <FrequencyPanel>
            <div className="label">SECONDARY FREQ</div>
            <div className="frequency">{communications.secondaryFrequency.toFixed(1)}</div>
            <div className="controls">
              <FrequencyButton onClick={() => adjustFrequency('secondary', -0.1)}>-0.1</FrequencyButton>
              <FrequencyButton onClick={() => adjustFrequency('secondary', -1)}>-1</FrequencyButton>
              <FrequencyButton onClick={() => adjustFrequency('secondary', 1)}>+1</FrequencyButton>
              <FrequencyButton onClick={() => adjustFrequency('secondary', 0.1)}>+0.1</FrequencyButton>
            </div>
          </FrequencyPanel>
        </FrequencyDisplay>

        <SignalStrengthMeter>
          <div className="label">SIGNAL</div>
          <div className="meter">
            <div className="fill" style={{ width: `${communications.signalStrength}%` }}></div>
          </div>
          <div className="value">{communications.signalStrength}%</div>
        </SignalStrengthMeter>

        <SignalStrengthMeter>
          <div className="label">INTERFERENCE</div>
          <div className="meter">
            <div className="fill" style={{ 
              width: `${communications.interference}%`,
              background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000)'
            }}></div>
          </div>
          <div className="value">{communications.interference}%</div>
        </SignalStrengthMeter>

        <TransmissionStatus status={communications.transmissionStatus}>
          {communications.transmissionStatus.toUpperCase()}
        </TransmissionStatus>

        <EmergencyBeacon
          active={communications.emergencyBeacon}
          onClick={() => onPlayerAction('toggle_emergency_beacon', !communications.emergencyBeacon)}
        >
          EMERGENCY BEACON
          <br />
          {communications.emergencyBeacon ? 'ACTIVE' : 'STANDBY'}
        </EmergencyBeacon>
      </Panel>

      {/* Message Composer */}
      <Panel>
        <PanelTitle>MESSAGE COMPOSER</PanelTitle>
        
        <MessageComposer>
          <RecipientSelector
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          >
            <option value="All Stations">All Stations</option>
            <option value="Navigation">Navigation</option>
            <option value="Weapons">Weapons</option>
            <option value="Engineering">Engineering</option>
            <option value="Command">Command</option>
            <option value="Imperial Command">Imperial Command</option>
            <option value="Fleet Command">Fleet Command</option>
            <option value="External Contact">External Contact</option>
          </RecipientSelector>

          <MessageInput
            placeholder="Enter transmission..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
          />

          <EncryptionPanel>
            <div className="title">ENCRYPTION SETTINGS</div>
            <input
              className="key-input"
              type="password"
              placeholder="Encryption key..."
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
            />
            <label className="encrypt-toggle">
              <input
                type="checkbox"
                checked={encryptMessage}
                onChange={(e) => setEncryptMessage(e.target.checked)}
              />
              Encrypt transmission
            </label>
          </EncryptionPanel>

          <MessageControls>
            <PrioritySelector
              value={messagePriority}
              onChange={(e) => setMessagePriority(e.target.value as any)}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="emergency">EMERGENCY</option>
            </PrioritySelector>

            <TransmitButton
              priority={messagePriority}
              onClick={sendMessage}
              disabled={!messageText.trim()}
            >
              TRANSMIT
            </TransmitButton>
          </MessageControls>
        </MessageComposer>
      </Panel>

      {/* Message Log */}
      <Panel>
        <PanelTitle>TRANSMISSION LOG</PanelTitle>
        
        <MessageLog id="message-log">
          {communications.messageQueue.length === 0 ? (
            <div style={{ color: '#666666', textAlign: 'center', marginTop: '50px' }}>
              No transmissions received
            </div>
          ) : (
            communications.messageQueue.map(message => (
              <MessageEntry
                key={message.id}
                priority={message.priority}
                encrypted={message.encrypted}
              >
                <div className="header">
                  <div className="from-to">
                    FROM: {message.from} → TO: {message.to}
                  </div>
                  <div className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="content">
                  {message.content}
                </div>
                <div className="flags">
                  <span>PRIORITY: {message.priority.toUpperCase()}</span>
                  {message.encrypted && <span>ENCRYPTED</span>}
                  {message.acknowledged && <span>ACKNOWLEDGED</span>}
                </div>
              </MessageEntry>
            ))
          )}
        </MessageLog>
      </Panel>

      {/* Active Channels */}
      <Panel>
        <PanelTitle>COMMUNICATION CHANNELS</PanelTitle>
        
        <ChannelGrid>
          {communications.activeChannels.map(channel => (
            <ChannelEntry
              key={channel.frequency}
              active={channel.active}
              encrypted={channel.encrypted}
              onClick={() => joinChannel(channel)}
            >
              <div className="channel-name">{channel.name}</div>
              <div className="channel-freq">{channel.frequency.toFixed(1)} MHz</div>
              <div className="channel-info">
                <span>{channel.participants.length} participants</span>
                <span>{channel.active ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
            </ChannelEntry>
          ))}
        </ChannelGrid>

        <FrequencyButton
          onClick={createChannel}
          style={{ marginTop: '10px', width: '100%', padding: '10px' }}
        >
          CREATE NEW CHANNEL
        </FrequencyButton>
      </Panel>

      {/* Long Range Communications */}
      <Panel alert={communications.interference > 50}>
        <PanelTitle alert={communications.interference > 50}>
          LONG RANGE COMMS
        </PanelTitle>
        
        <div style={{ fontSize: '11px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Hyperspace Relay:</span>
            <span style={{ color: communications.signalStrength > 75 ? '#00ff00' : '#ff8800' }}>
              {communications.signalStrength > 75 ? 'ONLINE' : 'DEGRADED'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Imperial Network:</span>
            <span style={{ color: '#00ff00' }}>CONNECTED</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Fleet Coordination:</span>
            <span style={{ color: communications.interference < 30 ? '#00ff00' : '#ff0000' }}>
              {communications.interference < 30 ? 'ACTIVE' : 'JAMMED'}
            </span>
          </div>
        </div>

        <FrequencyButton
          onClick={() => onPlayerAction('send_status_report', { type: 'automated' })}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          SEND STATUS REPORT
        </FrequencyButton>

        <FrequencyButton
          onClick={() => onPlayerAction('request_reinforcements', {})}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          REQUEST REINFORCEMENTS
        </FrequencyButton>

        <FrequencyButton
          onClick={() => onPlayerAction('distress_signal', {})}
          style={{ width: '100%', backgroundColor: 'rgba(255, 0, 0, 0.2)', borderColor: '#ff0000', color: '#ff0000' }}
        >
          DISTRESS SIGNAL
        </FrequencyButton>
      </Panel>

      {/* Signal Analysis */}
      <Panel>
        <PanelTitle>SIGNAL ANALYSIS</PanelTitle>
        
        <div style={{ fontSize: '11px', color: '#888888' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#00ffff', marginBottom: '5px' }}>DETECTED SIGNALS:</div>
            <div>Imperial Frequency: 121.5 MHz</div>
            <div>Fleet Command: 243.0 MHz</div>
            <div>Emergency Channel: 406.0 MHz</div>
            <div style={{ color: '#ff8800' }}>Unknown Signal: 156.8 MHz</div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#00ffff', marginBottom: '5px' }}>INTERFERENCE SOURCES:</div>
            {communications.interference > 0 && (
              <>
                <div>Solar radiation: {Math.min(communications.interference, 20)}%</div>
                {communications.interference > 20 && <div>Ion storm: {communications.interference - 20}%</div>}
                {communications.interference > 50 && <div style={{ color: '#ff0000' }}>Enemy jamming detected</div>}
              </>
            )}
            {communications.interference === 0 && <div>No interference detected</div>}
          </div>

          <div>
            <div style={{ color: '#00ffff', marginBottom: '5px' }}>TRANSMISSION QUALITY:</div>
            <div>
              {communications.signalStrength > 90 && 'Excellent'}
              {communications.signalStrength > 70 && communications.signalStrength <= 90 && 'Good'}
              {communications.signalStrength > 50 && communications.signalStrength <= 70 && 'Fair'}
              {communications.signalStrength <= 50 && 'Poor'}
            </div>
          </div>
        </div>
      </Panel>
    </CommsContainer>
  );
};

export default CommunicationsStation;