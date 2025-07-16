import React, { useState } from 'react';
import styled from 'styled-components';
import { StationType } from '../types';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 3rem;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 0 20px #00ff00;
  animation: glow 2s ease-in-out infinite alternate;

  @keyframes glow {
    from { text-shadow: 0 0 20px #00ff00; }
    to { text-shadow: 0 0 30px #00ff00, 0 0 40px #00ff00; }
  }
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 3rem;
  color: #ffff00;
`;

const StationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
  width: 100%;
  margin-bottom: 3rem;
`;

const StationCard = styled.div<{ selected: boolean }>`
  border: 2px solid ${props => props.selected ? '#ffff00' : '#00ff00'};
  background: ${props => props.selected ? 'rgba(255, 255, 0, 0.1)' : 'rgba(0, 255, 0, 0.05)'};
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    background: rgba(0, 255, 0, 0.1);
    border-color: #ffff00;
    transform: translateY(-2px);
  }

  h3 {
    color: ${props => props.selected ? '#ffff00' : '#00ff00'};
    margin-bottom: 10px;
    font-size: 1.3rem;
  }

  p {
    color: #cccccc;
    margin: 0;
    line-height: 1.4;
  }
`;

const JoinForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  max-width: 400px;
  width: 100%;
`;

const Input = styled.input`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 12px;
  font-family: inherit;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #ffff00;
    box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
  }

  &::placeholder {
    color: #666666;
  }
`;

const JoinButton = styled.button`
  background: #003300;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 15px 30px;
  font-family: inherit;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover:not(:disabled) {
    background: #006600;
    border-color: #ffff00;
    color: #ffff00;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const stations = [
  {
    id: 'pilot' as StationType,
    name: 'NAVIGATION',
    description: 'Control ship heading, speed, and hyperspace jumps. Navigate through space and avoid hazards.'
  },
  {
    id: 'gunner' as StationType,
    name: 'WEAPONS',
    description: 'Operate turbolasers, ion cannons, and missile systems. Target and engage enemy vessels.'
  },
  {
    id: 'engineer' as StationType,
    name: 'ENGINEERING',
    description: 'Manage power distribution, repair systems, and maintain ship operations.'
  },
  {
    id: 'commander' as StationType,
    name: 'COMMAND',
    description: 'Strategic oversight, mission objectives, and crew coordination.'
  },
  {
    id: 'comms' as StationType,
    name: 'COMMUNICATIONS',
    description: 'Handle subspace communications, encryption, and signal management.'
  },
  {
    id: 'gm' as StationType,
    name: 'GAME MASTER',
    description: 'Control the simulation, create events, and manage the overall game experience.'
  }
];

interface LobbyScreenProps {
  onJoinSession: (sessionId: string, station: StationType, playerName: string) => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onJoinSession }) => {
  const [selectedStation, setSelectedStation] = useState<StationType | null>(null);
  const [sessionId, setSessionId] = useState('bridge-alpha-1');
  const [playerName, setPlayerName] = useState('');

  const handleJoin = () => {
    if (selectedStation && sessionId.trim() && playerName.trim()) {
      onJoinSession(sessionId.trim(), selectedStation, playerName.trim());
    }
  };

  const canJoin = selectedStation && sessionId.trim() && playerName.trim();

  return (
    <LobbyContainer>
      <Title>⭐ IMPERIAL STAR DESTROYER ⭐</Title>
      <Subtitle>Bridge Crew Assignment Terminal</Subtitle>

      <StationGrid>
        {stations.map(station => (
          <StationCard
            key={station.id}
            selected={selectedStation === station.id}
            onClick={() => setSelectedStation(station.id)}
          >
            <h3>{station.name}</h3>
            <p>{station.description}</p>
          </StationCard>
        ))}
      </StationGrid>

      <JoinForm>
        <Input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Session ID (e.g., bridge-alpha-1)"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <JoinButton
          onClick={handleJoin}
          disabled={!canJoin}
        >
          {selectedStation ? `JOIN AS ${stations.find(s => s.id === selectedStation)?.name}` : 'SELECT A STATION'}
        </JoinButton>
      </JoinForm>
    </LobbyContainer>
  );
};

export default LobbyScreen;