import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { io, Socket } from 'socket.io-client';

// Types
interface PilotState {
  heading: {
    x: number;
    y: number;
  };
  speed: number;
  altitude: number;
  alert: string;
}

interface PlayerAction {
  room: string;
  action: string;
  value?: number;
}

// Animations
const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const scanLine = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled Components
const Container = styled.div`
  background: #111;
  color: #fff;
  font-family: 'Orbitron', 'Arial', sans-serif;
  min-height: 100vh;
  padding: 20px;
  
  --starwars-blue: #007bff;
  --starwars-green: #22b14c;
  --starwars-yellow: #ffd700;
  --starwars-red: #dc3545;
  --bg-dark: #111;
  --text-light: #fff;
`;

const StationHeader = styled.h1`
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 30px;
  color: var(--starwars-blue);
  text-shadow: 0 0 10px var(--starwars-blue);
  letter-spacing: 3px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatusCard = styled.div`
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border: 2px solid var(--starwars-blue);
  border-radius: 10px;
  backdrop-filter: blur(5px);
  
  h2 {
    margin: 0 0 15px 0;
    color: var(--starwars-blue);
    font-size: 1.2rem;
  }
`;

const StatusValue = styled.div<{ alert?: string }>`
  font-size: 2.5em;
  font-weight: bold;
  margin: 10px 0;
  
  ${props => props.alert === 'red' && css`
    color: var(--starwars-red);
    animation: ${blink} 1s infinite;
  `}
  
  ${props => props.alert === 'yellow' && css`
    color: var(--starwars-yellow);
  `}
`;

const StatusMessage = styled.div<{ alert?: string }>`
  font-size: 1.2em;
  margin: 10px 0;
  
  ${props => props.alert === 'red' && css`
    color: var(--starwars-red);
    animation: ${blink} 1s infinite;
  `}
  
  ${props => props.alert === 'yellow' && css`
    color: var(--starwars-yellow);
  `}
`;

const InstrumentPanel = styled.div`
  display: flex;
  gap: 30px;
  justify-content: center;
  margin: 30px 0;
  flex-wrap: wrap;
`;

const InstrumentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const InstrumentLabel = styled.div`
  font-size: 1.1rem;
  color: var(--starwars-yellow);
  text-align: center;
  font-weight: bold;
`;

const ArtificialHorizon = styled.div`
  width: 300px;
  height: 200px;
  background: #000;
  border: 2px solid var(--starwars-blue);
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 123, 255, 0.3);
`;

const HorizonLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--starwars-yellow);
  top: 50%;
  box-shadow: 0 0 5px var(--starwars-yellow);
`;

const PitchIndicator = styled.div<{ pitch: number }>`
  position: absolute;
  left: 50%;
  top: 0%;
  width: 2px;
  height: 100%;
  background: var(--starwars-blue);
  transform-origin: center center;
  transform: rotate(${props => -props.pitch}deg) translateX(-50%);
  box-shadow: 0 0 5px var(--starwars-blue);
`;

const RollIndicator = styled.div<{ roll: number }>`
  position: absolute;
  left: 0%;
  top: 50%;
  width: 100%;
  height: 2px;
  background: var(--starwars-green);
  transform-origin: center center;
  transform: rotate(${props => props.roll}deg) translateY(-50%);
  box-shadow: 0 0 5px var(--starwars-green);
`;

const DegreeMark = styled.div<{ position: number }>`
  position: absolute;
  width: 2px;
  height: 10px;
  background: var(--starwars-yellow);
  left: 50%;
  top: ${props => props.position}%;
  transform: translateX(-50%);
`;

const CircularGauge = styled.div`
  width: 200px;
  height: 200px;
  background: #000;
  border: 2px solid var(--starwars-blue);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: inset 0 0 20px rgba(0, 123, 255, 0.3);
`;

const GaugeDial = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 2px solid var(--starwars-yellow);
  position: relative;
  background: radial-gradient(circle at center, #000 0%, #1a1a1a 100%);
`;

const GaugeNeedle = styled.div<{ angle: number }>`
  position: absolute;
  width: 3px;
  height: 90px;
  background: var(--starwars-yellow);
  transform-origin: bottom center;
  left: 50%;
  bottom: 50%;
  transform: translateX(-50%) rotate(${props => props.angle}deg);
  box-shadow: 0 0 5px var(--starwars-yellow);
  
  &::after {
    content: '';
    position: absolute;
    top: -5px;
    left: -2px;
    width: 7px;
    height: 7px;
    background: var(--starwars-yellow);
    border-radius: 50%;
  }
`;

const GaugeValue = styled.div`
  position: absolute;
  font-size: 1.5em;
  color: var(--starwars-yellow);
  text-align: center;
  width: 100%;
  top: 60%;
  font-weight: bold;
  text-shadow: 0 0 5px var(--starwars-yellow);
`;

const GaugeLabel = styled.div`
  position: absolute;
  font-size: 0.9em;
  color: var(--starwars-yellow);
  text-align: center;
  width: 100%;
  bottom: 15px;
`;

const SpeedArc = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin: 30px 0;
`;

const AxisControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  background: rgba(0, 0, 0, 0.5);
  padding: 20px;
  border: 1px solid var(--starwars-blue);
  border-radius: 10px;
`;

const AxisLabel = styled.h3`
  font-size: 1.2em;
  color: var(--starwars-blue);
  margin: 0;
`;

const AxisValue = styled.div`
  font-size: 2em;
  color: var(--starwars-yellow);
  font-weight: bold;
  text-shadow: 0 0 5px var(--starwars-yellow);
`;

const Slider = styled.input`
  width: 100%;
  max-width: 200px;
  height: 8px;
  background: #333;
  border-radius: 5px;
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    background: var(--starwars-yellow);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px var(--starwars-yellow);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: var(--starwars-yellow);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px var(--starwars-yellow);
  }
`;

const VerticalSlider = styled(Slider)`
  width: 20px;
  height: 200px;
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
`;

const MacroButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const MacroButton = styled.button`
  background: var(--starwars-yellow);
  color: #000;
  border: 2px solid var(--starwars-blue);
  padding: 15px 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 5px;
  
  &:hover {
    background: var(--starwars-blue);
    color: #fff;
    transform: scale(1.05);
    box-shadow: 0 0 15px var(--starwars-blue);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Component
const PilotStation: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pilotState, setPilotState] = useState<PilotState>({
    heading: { x: 0, y: 0 },
    speed: 0,
    altitude: 0,
    alert: 'normal'
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    // Get room from URL params
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room') || 'default';
    
    newSocket.emit('join', { room, station: 'pilot' });

    // Listen for state updates
    newSocket.on('state_update', (state: PilotState) => {
      setPilotState(state);
    });

    // Listen for weapon sounds from other stations
    newSocket.on('player_action', (data: any) => {
      if (data.action === 'weapon_sound' && audioEnabled) {
        playWeaponSound();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [audioEnabled]);

  // Enable audio on first user interaction
  const enableAudio = () => {
    if (!audioEnabled) {
      setAudioEnabled(true);
      console.log('Pilot: Audio enabled');
    }
  };

  const playWeaponSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // Socket emit helper
  const emitAction = (action: string, value?: number) => {
    if (socket) {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room') || 'default';
      socket.emit('player_action', { room, action, value });
    }
  };

  // Control functions
  const setSpeed = (increment: number) => {
    const newSpeed = Math.max(0, Math.min(100, pilotState.speed + increment));
    emitAction('set_speed', newSpeed);
  };

  const bankLeft = () => {
    const newHeading = Math.max(-180, Math.min(180, pilotState.heading.x - 10));
    emitAction('update_heading_x', newHeading);
  };

  const bankRight = () => {
    const newHeading = Math.max(-180, Math.min(180, pilotState.heading.x + 10));
    emitAction('update_heading_x', newHeading);
  };

  const navigateTerrain = () => {
    const newHeadingX = Math.floor(Math.random() * 360) - 180;
    const newHeadingY = Math.floor(Math.random() * 180) - 90;
    emitAction('update_heading_x', newHeadingX);
    emitAction('update_heading_y', newHeadingY);
  };

  const descend = () => {
    const newHeading = Math.max(-90, Math.min(90, pilotState.heading.y - 10));
    emitAction('update_heading_y', newHeading);
  };

  const ascend = () => {
    const newHeading = Math.max(-90, Math.min(90, pilotState.heading.y + 10));
    emitAction('update_heading_y', newHeading);
  };

  const punchIt = () => {
    emitAction('set_speed', 100);
    emitAction('update_heading_x', 0);
    emitAction('update_heading_y', 0);
  };

  // Slider handlers
  const handleHeadingXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    emitAction('update_heading_x', value);
  };

  const handleHeadingYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    emitAction('update_heading_y', value);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    emitAction('set_speed', value);
  };

  // Calculate gauge angles
  const speedAngle = (pilotState.speed / 100) * 270 - 135;
  const altitudeAngle = (pilotState.altitude / 1000) * 270 - 135;

  return (
    <Container onClick={enableAudio}>
      <StationHeader>NAVIGATION STATION</StationHeader>
      
      {/* Alert Status */}
      <StatusGrid>
        <StatusCard>
          <h2>ALERT STATUS</h2>
          <StatusValue alert={pilotState.alert.toLowerCase()}>
            {pilotState.alert.toUpperCase()}
          </StatusValue>
          <StatusMessage alert={pilotState.alert.toLowerCase()}>
            {pilotState.alert === 'normal' ? 'All clear' : pilotState.alert}
          </StatusMessage>
        </StatusCard>
      </StatusGrid>

      {/* Flight Instruments */}
      <InstrumentPanel>
        {/* Radio Altimeter */}
        <InstrumentContainer>
          <InstrumentLabel>ALTITUDE</InstrumentLabel>
          <CircularGauge>
            <GaugeDial>
              <GaugeNeedle angle={altitudeAngle} />
              <GaugeValue>{Math.round(pilotState.altitude)}</GaugeValue>
              <GaugeLabel>ALTITUDE (k)</GaugeLabel>
            </GaugeDial>
          </CircularGauge>
        </InstrumentContainer>

        {/* Artificial Horizon */}
        <InstrumentContainer>
          <InstrumentLabel>ATTITUDE INDICATOR</InstrumentLabel>
          <ArtificialHorizon>
            <HorizonLine />
            <PitchIndicator pitch={pilotState.heading.y} />
            <RollIndicator roll={pilotState.heading.x} />
            {[0, 11.1, 22.2, 33.3, 44.4, 55.6, 66.7, 77.8, 88.9, 100].map((pos, i) => (
              <DegreeMark key={i} position={pos} />
            ))}
          </ArtificialHorizon>
        </InstrumentContainer>

        {/* Air-Speed Indicator */}
        <InstrumentContainer>
          <InstrumentLabel>VELOCITY</InstrumentLabel>
          <CircularGauge>
            <GaugeDial>
              <SpeedArc viewBox="0 0 180 180">
                {[0, 54, 108, 162, 216].map((rotation, i) => (
                  <line
                    key={i}
                    x1="90" y1="90" x2="90" y2="10"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeDasharray="2,4"
                    transform={`rotate(${rotation} 90 90)`}
                  />
                ))}
              </SpeedArc>
              <GaugeNeedle angle={speedAngle} />
              <GaugeValue>{pilotState.speed}</GaugeValue>
              <GaugeLabel>(0.1c) SPEED</GaugeLabel>
            </GaugeDial>
          </CircularGauge>
        </InstrumentContainer>
      </InstrumentPanel>

      {/* Manual Controls */}
      <ControlsGrid>
        <AxisControl>
          <AxisLabel>Vertical Heading</AxisLabel>
          <AxisValue>{pilotState.heading.y}°</AxisValue>
          <VerticalSlider
            type="range"
            min="-90"
            max="90"
            step="1"
            value={pilotState.heading.y}
            onChange={handleHeadingYChange}
          />
        </AxisControl>

        <AxisControl>
          <AxisLabel>Horizontal Heading</AxisLabel>
          <AxisValue>{pilotState.heading.x}°</AxisValue>
          <Slider
            type="range"
            min="-180"
            max="180"
            step="1"
            value={pilotState.heading.x}
            onChange={handleHeadingXChange}
          />
        </AxisControl>

        <AxisControl>
          <AxisLabel>Speed</AxisLabel>
          <AxisValue>{pilotState.speed}</AxisValue>
          <Slider
            type="range"
            min="0"
            max="100"
            step="1"
            value={pilotState.speed}
            onChange={handleSpeedChange}
          />
        </AxisControl>
      </ControlsGrid>

      {/* Macro Buttons */}
      <MacroButtons>
        <MacroButton onClick={() => setSpeed(-10)}>
          ◀ SLOW DOWN
        </MacroButton>
        <MacroButton onClick={() => setSpeed(50)}>
          🔄 CRUISE
        </MacroButton>
        <MacroButton onClick={() => setSpeed(10)}>
          ▶ SPEED UP
        </MacroButton>

        <MacroButton onClick={bankLeft}>
          ⬅ BANK LEFT
        </MacroButton>
        <MacroButton onClick={navigateTerrain}>
          🧭 NAVIGATE
        </MacroButton>
        <MacroButton onClick={bankRight}>
          ➡ BANK RIGHT
        </MacroButton>

        <MacroButton onClick={descend}>
          ⬇ DESCEND
        </MacroButton>
        <MacroButton onClick={punchIt}>
          🚀 PUNCH IT!
        </MacroButton>
        <MacroButton onClick={ascend}>
          ⬆ ASCEND
        </MacroButton>
      </MacroButtons>

      {/* Hidden audio element for weapon sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/weapon.mp3" type="audio/mpeg" />
      </audio>
    </Container>
  );
};

export default PilotStation;