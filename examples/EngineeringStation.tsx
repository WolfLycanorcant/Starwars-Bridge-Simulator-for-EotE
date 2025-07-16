import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { GameState, SystemComponent, RepairTask } from '../../types';

const scanAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const sparkAnimation = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
`;

const EngineeringContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  padding: 15px;
  height: 100%;
  background: radial-gradient(circle at center, rgba(255, 170, 0, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%);
`;

const Panel = styled.div<{ alert?: boolean; critical?: boolean }>`
  background: rgba(20, 10, 0, 0.8);
  border: 2px solid ${props =>
    props.critical ? '#ff0000' :
      props.alert ? '#ff8800' :
        '#ffaa00'
  };
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ffaa00, transparent);
    animation: ${scanAnimation} 4s infinite;
  }

  ${props => props.critical && css`
    animation: ${pulseAnimation} 1s infinite;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 0, 0, 0.1);
      pointer-events: none;
      animation: ${sparkAnimation} 0.5s infinite;
    }
  `}
`;

const PanelTitle = styled.h3<{ alert?: boolean; critical?: boolean }>`
  color: ${props =>
    props.critical ? '#ff0000' :
      props.alert ? '#ff8800' :
        '#ffaa00'
  };
  margin: 0 0 15px 0;
  text-align: center;
  font-size: 1.1rem;
  text-shadow: 0 0 10px currentColor;
  letter-spacing: 2px;
`;

const PowerDistributionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
`;

const PowerSystemRow = styled.div<{ overloaded?: boolean }>`
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid ${props => props.overloaded ? '#ff0000' : '#664400'};
  border-radius: 4px;
  padding: 10px;
  position: relative;

  ${props => props.overloaded && css`
    animation: ${pulseAnimation} 0.8s infinite;
  `}
`;

const SystemLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #ffaa00;
  font-weight: bold;
`;

const PowerSlider = styled.input<{ overloaded?: boolean }>`
  width: 100%;
  height: 8px;
  background: #221100;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: ${props => props.overloaded ? '#ff0000' : '#ffaa00'};
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px currentColor;
  }

  &::-webkit-slider-track {
    background: linear-gradient(90deg, #003300 0%, #ffaa00 50%, #ff0000 100%);
    height: 8px;
    border-radius: 4px;
  }
`;

const PowerMeter = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
  
  .label {
    width: 100px;
    font-size: 11px;
    color: #888888;
  }
  
  .meter {
    flex: 1;
    height: 12px;
    background: #001100;
    border: 1px solid #004400;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    margin: 0 10px;
  }
  
  .fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
    transition: width 0.3s ease;
    position: relative;
  }
  
  .value {
    width: 50px;
    text-align: right;
    font-size: 11px;
    color: #ffaa00;
    font-weight: bold;
  }
`;

const ReactorStatus = styled.div<{ critical?: boolean }>`
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid ${props => props.critical ? '#ff0000' : '#00ff00'};
  border-radius: 8px;
  padding: 10px;
  margin: 10px 0;
  text-align: center;
  position: relative;

  .status-text {
    font-size: 11px;
    font-weight: bold;
    color: ${props => props.critical ? '#ff0000' : '#00ff00'};
    margin-bottom: 5px;
    text-shadow: 0 0 10px currentColor;
  }

  .output-display {
    font-size: 18px;
    color: #ffaa00;
    font-weight: bold;
    text-shadow: 0 0 15px currentColor;
  }

  ${props => props.critical && css`
    animation: ${pulseAnimation} 1s infinite;
  `}
`;

const SystemStatusGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
`;

const SystemStatusRow = styled.div<{ status: string }>`
  display: grid;
  grid-template-columns: 1fr 60px 80px 60px;
  gap: 10px;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => {
    switch (props.status) {
      case 'critical': return '#ff0000';
      case 'damaged': return '#ff8800';
      case 'operational': return '#00ff00';
      default: return '#664400';
    }
  }};
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
  position: relative;

  .system-name {
    color: #ffaa00;
    font-weight: bold;
  }

  .health {
    color: ${props => {
    switch (props.status) {
      case 'critical': return '#ff0000';
      case 'damaged': return '#ff8800';
      case 'operational': return '#00ff00';
      default: return '#888888';
    }
  }};
    text-align: center;
    font-weight: bold;
  }

  .status {
    color: ${props => {
    switch (props.status) {
      case 'critical': return '#ff0000';
      case 'damaged': return '#ff8800';
      case 'operational': return '#00ff00';
      default: return '#888888';
    }
  }};
    text-align: center;
    font-size: 10px;
    text-transform: uppercase;
  }

  .temp {
    color: ${props => props.status === 'critical' ? '#ff0000' : '#ffaa00'};
    text-align: center;
    font-size: 10px;
  }

  ${props => props.status === 'critical' && css`
    animation: ${pulseAnimation} 1.5s infinite;
  `}
`;

const RepairQueueContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const RepairTaskList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
`;

const RepairTaskItem = styled.div<{ priority: string }>`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => {
    switch (props.priority) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'normal': return '#ffaa00';
      default: return '#664400';
    }
  }};
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
  position: relative;

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .system-name {
    color: #ffaa00;
    font-weight: bold;
    font-size: 12px;
  }

  .priority {
    color: ${props => {
    switch (props.priority) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'normal': return '#ffaa00';
      default: return '#888888';
    }
  }};
    font-size: 10px;
    text-transform: uppercase;
    font-weight: bold;
  }

  .progress-bar {
    height: 6px;
    background: #221100;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 5px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff8800, #ffaa00, #00ff00);
    transition: width 0.3s ease;
  }

  .task-details {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #888888;
  }
`;

const RepairControls = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: 'danger' | 'warning' | 'success' }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return 'rgba(255, 0, 0, 0.1)';
      case 'warning': return 'rgba(255, 136, 0, 0.1)';
      case 'success': return 'rgba(0, 255, 0, 0.1)';
      default: return 'rgba(255, 170, 0, 0.1)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.variant) {
      case 'danger': return '#ff0000';
      case 'warning': return '#ff8800';
      case 'success': return '#00ff00';
      default: return '#ffaa00';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'danger': return '#ff0000';
      case 'warning': return '#ff8800';
      case 'success': return '#00ff00';
      default: return '#ffaa00';
    }
  }};
  padding: 8px 12px;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 170, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DiagnosticLog = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #664400;
  border-radius: 4px;
  padding: 10px;
  overflow-y: auto;
  font-size: 11px;
  max-height: 300px;
`;

const DiagnosticEntry = styled.div<{ status: string }>`
  margin: 6px 0;
  padding: 8px;
  border-left: 3px solid ${props => {
    switch (props.status) {
      case 'critical': return '#ff0000';
      case 'error': return '#ff8800';
      case 'warning': return '#ffff00';
      case 'healthy': return '#00ff00';
      default: return '#664400';
    }
  }};
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0 4px 4px 0;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .system {
    color: #ffaa00;
    font-weight: bold;
    font-size: 10px;
  }

  .timestamp {
    color: #666666;
    font-size: 9px;
  }

  .message {
    color: ${props => {
    switch (props.status) {
      case 'critical': return '#ff0000';
      case 'error': return '#ff8800';
      case 'warning': return '#ffff00';
      case 'healthy': return '#00ff00';
      default: return '#888888';
    }
  }};
    line-height: 1.3;
  }
`;

const EmergencyControls = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 15px;
`;

const CoolantSystem = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #0088ff;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;

  .title {
    color: #0088ff;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 8px;
    text-align: center;
  }

  .coolant-level {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .level-bar {
    flex: 1;
    height: 8px;
    background: #001122;
    border: 1px solid #004488;
    border-radius: 4px;
    overflow: hidden;
    margin: 0 8px;
  }

  .level-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff0000, #ffff00, #0088ff);
    transition: width 0.3s ease;
  }
`;

interface EngineeringStationProps {
  gameState: GameState;
  onPlayerAction: (action: string, value: any) => void;
}

const EngineeringStation: React.FC<EngineeringStationProps> = ({ gameState, onPlayerAction }) => {
  // All hooks must be called before any conditional returns
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [coolantLevel, setCoolantLevel] = useState(85);

  // Debug logging and error handling
  console.log('EngineeringStation render:', { gameState, engineering: gameState?.engineering });

  if (!gameState || !gameState.engineering || !gameState.systems) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#ff0000',
        fontSize: '1.5rem'
      }}>
        ENGINEERING SYSTEMS OFFLINE - NO GAME STATE
      </div>
    );
  }

  const { engineering, systems } = gameState;

  // Calculate total power usage and available power
  const totalPowerUsage = Object.values(engineering.powerDistribution.powerAllocations).reduce((sum, power) => sum + power, 0);
  const basePower = engineering.powerDistribution.totalPower; // GM can control this
  const maxAvailablePower = engineering.powerDistribution.emergencyPower ? basePower * 2 : basePower; // Emergency power doubles capacity
  const availablePower = maxAvailablePower - totalPowerUsage;
  const powerOverload = totalPowerUsage > maxAvailablePower;

  // Check for critical systems
  const criticalSystems = Object.entries(systems).filter(([_, system]) => system.status === 'critical');
  const hasCriticalSystems = criticalSystems.length > 0;

  const handlePowerChange = (system: string, value: number) => {
    // Type guard to ensure system is a valid key
    const validSystems = ['weapons', 'shields', 'engines', 'sensors', 'lifeSupport', 'communications'];
    if (!validSystems.includes(system)) {
      console.error('Invalid system:', system);
      return;
    }
    
    // Calculate what the new total would be
    const currentAllocations = { ...engineering.powerDistribution.powerAllocations };
    (currentAllocations as any)[system] = value;
    const newTotalUsage = Object.values(currentAllocations).reduce((sum, power) => sum + power, 0);
    
    // Check if this would exceed available power
    if (newTotalUsage > maxAvailablePower) {
      // Calculate how much we can actually allocate
      const otherSystemsTotal = Object.entries(currentAllocations)
        .filter(([name]) => name !== system)
        .reduce((sum, [_, power]) => sum + power, 0);
      
      const maxAllowedForThisSystem = Math.max(0, maxAvailablePower - otherSystemsTotal);
      
      // Only allow the change if it doesn't exceed limits
      if (value <= maxAllowedForThisSystem) {
        onPlayerAction('set_power_allocation', { system, power: value });
      } else {
        // Optionally set to maximum allowed value
        onPlayerAction('set_power_allocation', { system, power: maxAllowedForThisSystem });
      }
    } else {
      // Safe to make the change
      onPlayerAction('set_power_allocation', { system, power: value });
    }
  };

  const handleEmergencyPower = () => {
    onPlayerAction('toggle_emergency_power', !engineering.powerDistribution.emergencyPower);
  };

  const handleRepairSystem = (systemName: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') => {
    onPlayerAction('initiate_repair', { system: systemName, priority });
  };

  const handleEmergencyShutdown = () => {
    onPlayerAction('emergency_shutdown', { confirm: true });
  };

  const handleCoolantFlush = () => {
    onPlayerAction('coolant_flush', { level: coolantLevel });
  };

  return (
    <EngineeringContainer>
      {/* Power Distribution Panel */}
      <Panel alert={powerOverload} critical={engineering.powerDistribution.emergencyPower}>
        <PanelTitle alert={powerOverload} critical={engineering.powerDistribution.emergencyPower}>
          POWER DISTRIBUTION
        </PanelTitle>

        <ReactorStatus critical={engineering.powerDistribution.reactorOutput < 50}>
          <div className="status-text">
            {engineering.powerDistribution.emergencyPower ? 'EMERGENCY POWER' : 'REACTOR ONLINE'}
          </div>
          <div className="output-display">
            {engineering.powerDistribution.reactorOutput}% OUTPUT
          </div>
        </ReactorStatus>

        <PowerDistributionGrid>
          {Object.entries(engineering.powerDistribution.powerAllocations).map(([systemName, power]) => (
            <PowerSystemRow key={systemName} overloaded={power > 80}>
              <SystemLabel>
                <span>{systemName.toUpperCase()}</span>
                <span>{power}%</span>
              </SystemLabel>
              <PowerSlider
                type="range"
                min="0"
                max="100"
                value={power}
                overloaded={power > 80}
                onChange={(e) => handlePowerChange(systemName, parseInt(e.target.value))}
              />
            </PowerSystemRow>
          ))}
        </PowerDistributionGrid>

        <PowerMeter>
          <div className="label">AVAILABLE PWR</div>
          <div className="meter">
            <div 
              className="fill" 
              style={{ 
                width: Math.max(0, (availablePower / maxAvailablePower) * 100) + '%',
                background: availablePower < 0 ? '#ff0000' : 
                           availablePower < (maxAvailablePower * 0.2) ? '#ff8800' : 
                           'linear-gradient(90deg, #00ff00, #ffaa00)'
              }}
            ></div>
          </div>
          <div className="value" style={{ 
            color: availablePower < 0 ? '#ff0000' : 
                   availablePower < (maxAvailablePower * 0.2) ? '#ff8800' : 
                   '#ffaa00'
          }}>
            {availablePower}%
          </div>
        </PowerMeter>

        <PowerMeter>
          <div className="label">MAX POWER</div>
          <div className="meter">
            <div className="fill" style={{ width: '100%', background: '#0088ff' }}></div>
          </div>
          <div className="value" style={{ color: '#0088ff' }}>{maxAvailablePower}%</div>
        </PowerMeter>

        <PowerMeter>
          <div className="label">BATTERY</div>
          <div className="meter">
            <div className="fill" style={{ width: engineering.powerDistribution.batteryBackup + '%' }}></div>
          </div>
          <div className="value">{engineering.powerDistribution.batteryBackup}%</div>
        </PowerMeter>

        <EmergencyControls>
          <ActionButton
            variant={engineering.powerDistribution.emergencyPower ? 'success' : 'warning'}
            onClick={handleEmergencyPower}
          >
            {engineering.powerDistribution.emergencyPower ? 'EMERGENCY ON' : 'EMERGENCY PWR'}
          </ActionButton>
          <ActionButton variant="danger" onClick={handleEmergencyShutdown}>
            SHUTDOWN
          </ActionButton>
        </EmergencyControls>
      </Panel>

      {/* System Status Panel */}
      <Panel alert={hasCriticalSystems} critical={hasCriticalSystems}>
        <PanelTitle alert={hasCriticalSystems} critical={hasCriticalSystems}>
          SYSTEM STATUS
        </PanelTitle>

        <SystemStatusGrid>
          {Object.entries(systems).map(([systemName, system]) => (
            <SystemStatusRow key={systemName} status={system.status}>
              <div className="system-name">{systemName.toUpperCase()}</div>
              <div className="health">{system.health}%</div>
              <div className="status">{system.status}</div>
              <div className="temp">{system.temperature}°C</div>
            </SystemStatusRow>
          ))}
        </SystemStatusGrid>

        <CoolantSystem>
          <div className="title">COOLANT SYSTEM</div>
          <div className="coolant-level">
            <span style={{ fontSize: '10px', color: '#888888' }}>LEVEL:</span>
            <div className="level-bar">
              <div className="level-fill" style={{ width: coolantLevel + '%' }}></div>
            </div>
            <span style={{ fontSize: '10px', color: '#0088ff' }}>{coolantLevel}%</span>
          </div>
          <ActionButton onClick={handleCoolantFlush} style={{ width: '100%', fontSize: '10px' }}>
            FLUSH COOLANT
          </ActionButton>
        </CoolantSystem>
      </Panel>

      {/* Repair Queue Panel */}
      <Panel>
        <PanelTitle>REPAIR OPERATIONS</PanelTitle>

        <RepairQueueContainer>
          <RepairTaskList>
            {engineering.repairQueue.length === 0 ? (
              <div style={{ color: '#888888', textAlign: 'center', marginTop: '20px' }}>
                No active repair operations
              </div>
            ) : (
              engineering.repairQueue.map(task => (
                <RepairTaskItem key={task.id} priority={task.priority}>
                  <div className="task-header">
                    <div className="system-name">{task.system.toUpperCase()}</div>
                    <div className="priority">{task.priority}</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: task.progress + '%' }}></div>
                  </div>
                  <div className="task-details">
                    <span>ETA: {task.estimatedTime}min</span>
                    <span>Crew: {task.assignedCrew}</span>
                    <span>Status: {task.status}</span>
                  </div>
                </RepairTaskItem>
              ))
            )}
          </RepairTaskList>

          <RepairControls>
            <ActionButton
              variant="warning"
              onClick={() => handleRepairSystem('hull', 'high')}
            >
              REPAIR HULL
            </ActionButton>
            <ActionButton
              variant="warning"
              onClick={() => handleRepairSystem('shields', 'high')}
            >
              REPAIR SHIELDS
            </ActionButton>
            <ActionButton
              onClick={() => handleRepairSystem('weapons', 'normal')}
            >
              REPAIR WEAPONS
            </ActionButton>
            <ActionButton
              onClick={() => handleRepairSystem('engines', 'normal')}
            >
              REPAIR ENGINES
            </ActionButton>
          </RepairControls>
        </RepairQueueContainer>
      </Panel>

      {/* Diagnostics Panel */}
      <Panel>
        <PanelTitle>SYSTEM DIAGNOSTICS</PanelTitle>

        <DiagnosticLog>
          {engineering.diagnostics.length === 0 ? (
            <div style={{ color: '#00ff00', textAlign: 'center', marginTop: '50px' }}>
              ALL SYSTEMS NOMINAL
              <br />
              <span style={{ fontSize: '10px', color: '#888888' }}>
                No diagnostic alerts
              </span>
            </div>
          ) : (
            engineering.diagnostics.map((diagnostic, index) => (
              <DiagnosticEntry key={index} status={diagnostic.status}>
                <div className="header">
                  <div className="system">{diagnostic.system.toUpperCase()}</div>
                  <div className="timestamp">
                    {new Date(diagnostic.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="message">{diagnostic.message}</div>
              </DiagnosticEntry>
            ))
          )}
        </DiagnosticLog>

        <EmergencyControls>
          <ActionButton onClick={() => onPlayerAction('run_diagnostics', { full: true })}>
            FULL SCAN
          </ActionButton>
          <ActionButton onClick={() => onPlayerAction('clear_diagnostics', {})}>
            CLEAR LOG
          </ActionButton>
        </EmergencyControls>
      </Panel>

      {/* Damage Control Panel */}
      <Panel critical={hasCriticalSystems}>
        <PanelTitle critical={hasCriticalSystems}>
          DAMAGE CONTROL
        </PanelTitle>

        <div style={{ fontSize: '11px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Hull Integrity:</span>
            <span style={{ color: systems.hull.health > 50 ? '#00ff00' : '#ff0000' }}>
              {systems.hull.health}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Shield Status:</span>
            <span style={{ color: systems.shields.health > 50 ? '#00ff00' : '#ff8800' }}>
              {systems.shields.status.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Life Support:</span>
            <span style={{ color: systems.lifeSupport.health > 75 ? '#00ff00' : '#ff0000' }}>
              {systems.lifeSupport.health > 75 ? 'STABLE' : 'CRITICAL'}
            </span>
          </div>
        </div>

        {hasCriticalSystems && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid #ff0000',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <div style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '5px' }}>
              CRITICAL SYSTEMS DETECTED:
            </div>
            {criticalSystems.map(([name, system]) => (
              <div key={name} style={{ fontSize: '10px', color: '#ff8800' }}>
                • {name.toUpperCase()}: {system.health}%
              </div>
            ))}
          </div>
        )}

        <EmergencyControls>
          <ActionButton
            variant="danger"
            onClick={() => onPlayerAction('seal_hull_breach', {})}
          >
            SEAL BREACH
          </ActionButton>
          <ActionButton
            variant="warning"
            onClick={() => onPlayerAction('reroute_power', { emergency: true })}
          >
            REROUTE PWR
          </ActionButton>
        </EmergencyControls>

        <ActionButton
          variant="danger"
          onClick={() => onPlayerAction('abandon_ship', { confirm: false })}
          style={{ width: '100%', marginTop: '10px' }}
        >
          ABANDON SHIP PROTOCOL
        </ActionButton>
      </Panel>

      {/* Environmental Systems Panel */}
      <Panel>
        <PanelTitle>ENVIRONMENTAL</PanelTitle>

        <div style={{ fontSize: '11px' }}>
          <PowerMeter>
            <div className="label">ATMOSPHERE</div>
            <div className="meter">
              <div className="fill" style={{ width: systems.lifeSupport.efficiency + '%' }}></div>
            </div>
            <div className="value">{systems.lifeSupport.efficiency}%</div>
          </PowerMeter>

          <PowerMeter>
            <div className="label">GRAVITY</div>
            <div className="meter">
              <div className="fill" style={{ width: '98%' }}></div>
            </div>
            <div className="value">98%</div>
          </PowerMeter>

          <PowerMeter>
            <div className="label">TEMPERATURE</div>
            <div className="meter">
              <div className="fill" style={{ width: '72%' }}></div>
            </div>
            <div className="value">22°C</div>
          </PowerMeter>

          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '4px' }}>
            <div style={{ color: '#ffaa00', marginBottom: '8px', fontWeight: 'bold' }}>
              ENVIRONMENTAL STATUS:
            </div>
            <div style={{ color: systems.lifeSupport.status === 'operational' ? '#00ff00' : '#ff8800' }}>
              Life Support: {systems.lifeSupport.status.toUpperCase()}
            </div>
            <div style={{ color: '#00ff00' }}>
              Artificial Gravity: NOMINAL
            </div>
            <div style={{ color: '#00ff00' }}>
              Atmospheric Pressure: NORMAL
            </div>
          </div>
        </div>

        <EmergencyControls>
          <ActionButton onClick={() => onPlayerAction('adjust_life_support', { level: 'high' })}>
            BOOST O2
          </ActionButton>
          <ActionButton onClick={() => onPlayerAction('emergency_lighting', {})}>
            EMRG LIGHTS
          </ActionButton>
        </EmergencyControls>
      </Panel>
    </EngineeringContainer>
  );
};

export default EngineeringStation;