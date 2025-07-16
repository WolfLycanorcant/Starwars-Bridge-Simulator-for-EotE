import React from 'react';
import styled from 'styled-components';
import { GameState, StationType } from '../types';
import NavigationStation from './stations/NavigationStation';
import WeaponsStation from './stations/WeaponsStation';
import EngineeringStation from './stations/EngineeringStation';
import CommandStation from './stations/CommandStation';
import CommunicationsStation from './stations/CommunicationsStation';
import GMStation from './stations/GMStation';
import StatusBar from './common/StatusBar';

const BridgeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DisconnectButton = styled.button`
  position: fixed;
  top: 10px;
  left: 10px;
  background: #330000;
  border: 1px solid #ff0000;
  color: #ff0000;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  z-index: 1000;

  &:hover {
    background: #660000;
  }
`;

interface BridgeInterfaceProps {
  gameState: GameState;
  currentStation: StationType;
  sessionId: string;
  onPlayerAction: (action: string, value: any) => void;
  onGMUpdate: (changes: Partial<GameState>) => void;
  onDisconnect: () => void;
}

const BridgeInterface: React.FC<BridgeInterfaceProps> = ({
  gameState,
  currentStation,
  sessionId,
  onPlayerAction,
  onGMUpdate,
  onDisconnect
}) => {
  const renderStation = () => {
    const commonProps = {
      gameState,
      onPlayerAction
    };

    switch (currentStation) {
      case 'pilot':
        return <NavigationStation {...commonProps} />;
      case 'gunner':
        return <WeaponsStation {...commonProps} />;
      case 'engineer':
        return <EngineeringStation {...commonProps} />;
      case 'commander':
        return <CommandStation {...commonProps} />;
      case 'comms':
        return <CommunicationsStation {...commonProps} />;
      case 'gm':
        return <GMStation gameState={gameState} onGMUpdate={onGMUpdate} />;
      default:
        return <div>Unknown station: {currentStation}</div>;
    }
  };

  return (
    <BridgeContainer>
      <DisconnectButton onClick={onDisconnect}>
        DISCONNECT
      </DisconnectButton>

      <StatusBar 
        gameState={gameState} 
        currentStation={currentStation}
        sessionId={sessionId}
      />

      <MainContent>
        {renderStation()}
      </MainContent>
    </BridgeContainer>
  );
};

export default BridgeInterface;