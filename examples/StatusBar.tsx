import React from 'react';
import styled from 'styled-components';
import { GameState, StationType, AlertLevel } from '../../types';

const StatusContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 2px solid #00ff00;
  font-size: 14px;
  min-height: 60px;
`;

const StatusSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const StatusLabel = styled.div`
  color: #888888;
  font-size: 12px;
`;

const StatusValue = styled.div<{ alert?: AlertLevel }>`
  color: ${props => {
    if (props.alert === 'red') return '#ff0000';
    if (props.alert === 'yellow') return '#ffff00';
    if (props.alert === 'black') return '#ff00ff';
    return '#00ff00';
  }};
  font-weight: bold;
  font-size: 16px;
`;

const SystemStatus = styled.div`
  display: flex;
  gap: 15px;
`;

const SystemIndicator = styled.div<{ health: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;

  .label {
    font-size: 10px;
    color: #888888;
  }

  .bar {
    width: 40px;
    height: 8px;
    background: #333333;
    border: 1px solid #666666;
    position: relative;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: ${props => {
      if (props.health > 75) return '#00ff00';
      if (props.health > 50) return '#ffff00';
      if (props.health > 25) return '#ff8800';
      return '#ff0000';
    }};
    width: ${props => props.health}%;
    transition: all 0.3s ease;
  }

  .value {
    font-size: 10px;
    color: ${props => {
      if (props.health > 75) return '#00ff00';
      if (props.health > 50) return '#ffff00';
      if (props.health > 25) return '#ff8800';
      return '#ff0000';
    }};
  }
`;

const StationBadge = styled.div`
  background: #003300;
  border: 1px solid #00ff00;
  padding: 5px 10px;
  color: #00ff00;
  font-size: 12px;
  font-weight: bold;
`;

interface StatusBarProps {
  gameState: GameState;
  currentStation: StationType;
  sessionId: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ gameState, currentStation, sessionId }) => {
  const getStationName = (station: StationType): string => {
    const names = {
      pilot: 'NAVIGATION',
      gunner: 'WEAPONS',
      engineer: 'ENGINEERING',
      commander: 'COMMAND',
      comms: 'COMMUNICATIONS',
      gm: 'GAME MASTER'
    };
    return names[station];
  };

  const getMissionStatusColor = (status: string): string => {
    switch (status) {
      case 'critical': return '#ff0000';
      case 'active': return '#ffff00';
      case 'completed': return '#00ff00';
      case 'failed': return '#ff0000';
      default: return '#888888';
    }
  };

  return (
    <StatusContainer>
      <StatusSection>
        <StatusLabel>STATION</StatusLabel>
        <StationBadge>{getStationName(currentStation)}</StationBadge>
      </StatusSection>

      <StatusSection>
        <StatusLabel>SESSION</StatusLabel>
        <StatusValue>{sessionId}</StatusValue>
      </StatusSection>

      <StatusSection>
        <StatusLabel>ALERT LEVEL</StatusLabel>
        <StatusValue alert={gameState.alertLevel}>
          {gameState.alertLevel.toUpperCase()}
        </StatusValue>
      </StatusSection>

      <StatusSection>
        <StatusLabel>MISSION STATUS</StatusLabel>
        <StatusValue style={{ color: getMissionStatusColor(gameState.missionStatus) }}>
          {gameState.missionStatus.toUpperCase()}
        </StatusValue>
      </StatusSection>

      <SystemStatus>
        <SystemIndicator health={gameState.systems.hull.health}>
          <div className="label">HULL</div>
          <div className="bar">
            <div className="fill"></div>
          </div>
          <div className="value">{Math.round(gameState.systems.hull.health)}%</div>
        </SystemIndicator>

        <SystemIndicator health={gameState.systems.shields.health}>
          <div className="label">SHIELDS</div>
          <div className="bar">
            <div className="fill"></div>
          </div>
          <div className="value">{Math.round(gameState.systems.shields.health)}%</div>
        </SystemIndicator>

        <SystemIndicator health={gameState.systems.power.health}>
          <div className="label">POWER</div>
          <div className="bar">
            <div className="fill"></div>
          </div>
          <div className="value">{Math.round(gameState.systems.power.health)}%</div>
        </SystemIndicator>

        <SystemIndicator health={gameState.systems.weapons.health}>
          <div className="label">WEAPONS</div>
          <div className="bar">
            <div className="fill"></div>
          </div>
          <div className="value">{Math.round(gameState.systems.weapons.health)}%</div>
        </SystemIndicator>
      </SystemStatus>

      <StatusSection>
        <StatusLabel>SPEED</StatusLabel>
        <StatusValue>{gameState.navigation.speed}%</StatusValue>
      </StatusSection>

      <StatusSection>
        <StatusLabel>FUEL</StatusLabel>
        <StatusValue>{Math.round(gameState.navigation.fuel)}%</StatusValue>
      </StatusSection>
    </StatusContainer>
  );
};

export default StatusBar;