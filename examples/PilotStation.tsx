import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

/**
 * PILOT STATION EXAMPLE
 * 
 * This example demonstrates a comprehensive pilot station interface
 * based on the flight instruments from helpers/use_instruments_only/example_instruments.html
 * 
 * Features:
 * - Real-time flight instruments (Artificial Horizon, Altimeter, Speed Indicator)
 * - Manual flight controls with sliders
 * - Macro buttons for common maneuvers
 * - Alert status monitoring
 * - Audio feedback integration
 * - Socket.IO real-time communication
 * 
 * Usage in Edge of the Empire campaigns:
 * - Use during space combat encounters
 * - Enhance piloting skill checks with visual feedback
 * - Create tension during system failures
 * - Coordinate with other bridge stations
 */

// Types for pilot station state
interface PilotState {
  heading: {
    x: number; // Roll (-180 to 180)
    y: number; // Pitch (-90 to 90)
  };
  speed: number; // 0 to 100 (representing percentage of max speed)
  altitude: number; // Altitude in thousands of units
  alert: string; // Alert level: 'normal', 'yellow', 'red'
  hyperdriveStatus: 'ready' | 'charging' | 'jumping' | 'cooldown';
  fuelLevel: number; // 0 to 100
  shieldStatus: number; // 0 to 100
}

// Animation keyframes
const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const scanLine = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const hyperdriveCharge = keyframes`
  0% { box-shadow: 0 0 5px var(--starwars-blue); }
  50% { box-shadow: 0 0 20px var(--starwars-blue), 0 0 30px var(--starwars-blue); }
  100% { box-shadow: 0 0 5px var(--starwars-blue); }
`;

// Styled Components
const Container = styled.div`
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  font-family: 'Orbitron', 'Courier New', monospace;
  min-height: 100vh;
  padding: 20px;
  
  --starwars-blue: #00d4ff;
  --starwars-green: #00ff41;
  --starwars-yellow: #ffff00;
  --starwars-red: #ff0040;
  --starwars-orange: #ff8c00;
  --bg-dark: #0a0a0a;
  --text-light: #ffffff;
  --panel-bg: rgba(0, 20, 40, 0.8);
`;

const StationHeader = styled.h1`
  text-align: center;
  font-size: 2.8rem;
  margin-bottom: 30px;
  color: var(--starwars-blue);
  text-shadow: 0 0 15px var(--starwars-blue);
  letter-spacing: 4px;
  font-weight: 300;
  
  &::before, &::after {
    content: '═══';
    margin: 0 20px;
    color: var(--starwars-yellow);
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CenterPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
`;

const StatusCard = styled.div<{ alert?: string }>`
  background: var(--panel-bg);
  padding: 20px;
  border: 2px solid var(--starwars-blue);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  position: relative;
  
  ${props => props.alert === 'red' && css`
    border-color: var(--starwars-red);
    animation: ${blink} 1.5s infinite;
  `}
  
  ${props => props.alert === 'yellow' && css`
    border-color: var(--starwars-yellow);
  `}
  
  h3 {
    margin: 0 0 15px 0;
    color: var(--starwars-blue);
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const StatusValue = styled.div<{ alert?: string; size?: 'large' | 'medium' | 'small' }>`
  font-size: ${props => props.size === 'large' ? '2.5em' : props.size === 'small' ? '1.5em' : '2em'};
  font-weight: bold;
  margin: 10px 0;
  text-align: center;
  
  ${props => props.alert === 'red' && css`
    color: var(--starwars-red);
    animation: ${blink} 1s infinite;
  `}
  
  ${props => props.alert === 'yellow' && css`
    color: var(--starwars-yellow);
  `}
  
  ${props => !props.alert && css`
    color: var(--starwars-green);
  `}
`;

const InstrumentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const InstrumentLabel = styled.div`
  font-size: 1.2rem;
  color: var(--starwars-yellow);
  text-align: center;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const ArtificialHorizon = styled.div`
  width: 350px;
  height: 250px;
  background: radial-gradient(circle at center, #000428 0%, #004e92 100%);
  border: 3px solid var(--starwars-blue);
  position: relative;
  overflow: hidden;
  border-radius: 15px;
  box-shadow: 
    inset 0 0 30px rgba(0, 212, 255, 0.3),
    0 0 20px rgba(0, 212, 255, 0.2);
`;

const HorizonLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--starwars-yellow), transparent);
  top: 50%;
  box-shadow: 0 0 8px var(--starwars-yellow);
`;

const PitchIndicator = styled.div<{ pitch: number }>`
  position: absolute;
  left: 50%;
  top: 0%;
  width: 3px;
  height: 100%;
  background: linear-gradient(0deg, transparent, var(--starwars-blue), transparent);
  transform-origin: center center;
  transform: rotate(${props => -props.pitch}deg) translateX(-50%);
  box-shadow: 0 0 8px var(--starwars-blue);
`;

const RollIndicator = styled.div<{ roll: number }>`
  position: absolute;
  left: 0%;
  top: 50%;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--starwars-green), transparent);
  transform-origin: center center;
  transform: rotate(${props => props.roll}deg) translateY(-50%);
  box-shadow: 0 0 8px var(--starwars-green);
`;

const CircularGauge = styled.div`
  width: 220px;
  height: 220px;
  background: radial-gradient(circle at center, #000 0%, #1a1a2e 100%);
  border: 3px solid var(--starwars-blue);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 
    inset 0 0 30px rgba(0, 212, 255, 0.2),
    0 0 15px rgba(0, 212, 255, 0.3);
`;

const GaugeDial = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid var(--starwars-yellow);
  position: relative;
  background: radial-gradient(circle at center, #000 30%, #0a0a2e 100%);
`;

const GaugeNeedle = styled.div<{ angle: number }>`
  position: absolute;
  width: 4px;
  height: 95px;
  background: linear-gradient(0deg, var(--starwars-red), var(--starwars-yellow));
  transform-origin: bottom center;
  left: 50%;
  bottom: 50%;
  transform: translateX(-50%) rotate(${props => props.angle}deg);
  box-shadow: 0 0 10px var(--starwars-yellow);
  border-radius: 2px;
  
  &::after {
    content: '';
    position: absolute;
    top: -6px;
    left: -3px;
    width: 10px;
    height: 10px;
    background: var(--starwars-yellow);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--starwars-yellow);
  }
`;

const GaugeValue = styled.div`
  position: absolute;
  font-size: 1.8em;
  color: var(--starwars-yellow);
  text-align: center;
  width: 100%;
  top: 65%;
  font-weight: bold;
  text-shadow: 0 0 8px var(--starwars-yellow);
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin: 30px 0;
`;

const AxisControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  background: var(--panel-bg);
  padding: 25px;
  border: 2px solid var(--starwars-blue);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const AxisLabel = styled.h3`
  font-size: 1.3em;
  color: var(--starwars-blue);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AxisValue = styled.div`
  font-size: 2.2em;
  color: var(--starwars-yellow);
  font-weight: bold;
  text-shadow: 0 0 8px var(--starwars-yellow);
  font-family: 'Courier New', monospace;
`;

const Slider = styled.input`
  width: 100%;
  max-width: 220px;
  height: 10px;
  background: linear-gradient(90deg, #333, #666);
  border-radius: 5px;
  outline: none;
  border: 1px solid var(--starwars-blue);
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    background: var(--starwars-yellow);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 15px var(--starwars-yellow);
    border: 2px solid var(--starwars-blue);
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--starwars-yellow);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid var(--starwars-blue);
    box-shadow: 0 0 15px var(--starwars-yellow);
  }
`;

const MacroButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
`;

const MacroButton = styled.button<{ variant?: 'danger' | 'warning' | 'success' }>`
  background: ${props => 
    props.variant === 'danger' ? 'var(--starwars-red)' :
    props.variant === 'warning' ? 'var(--starwars-orange)' :
    props.variant === 'success' ? 'var(--starwars-green)' :
    'var(--starwars-yellow)'
  };
  color: #000;
  border: 2px solid var(--starwars-blue);
  padding: 18px 15px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Orbitron', sans-serif;
  
  &:hover {
    background: var(--starwars-blue);
    color: #fff;
    transform: scale(1.05);
    box-shadow: 0 0 20px var(--starwars-blue);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const HyperdrivePanel = styled.div<{ status: string }>`
  background: var(--panel-bg);
  padding: 20px;
  border: 2px solid var(--starwars-blue);
  border-radius: 12px;
  text-align: center;
  
  ${props => props.status === 'charging' && css`
    animation: ${hyperdriveCharge} 2s infinite;
  `}
  
  ${props => props.status === 'jumping' && css`
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, var(--panel-bg) 100%);
    border-color: var(--starwars-yellow);
  `}
`;

// Main Component
const PilotStationExample: React.FC = () => {
  const [pilotState, setPilotState] = useState<PilotState>({
    heading: { x: 0, y: 0 },
    speed: 0,
    altitude: 1000,
    alert: 'normal',
    hyperdriveStatus: 'ready',
    fuelLevel: 85,
    shieldStatus: 92
  });

  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPilotState(prev => ({
        ...prev,
        altitude: prev.altitude + (Math.random() - 0.5) * 10,
        fuelLevel: Math.max(0, prev.fuelLevel - 0.1),
        shieldStatus: Math.max(0, Math.min(100, prev.shieldStatus + (Math.random() - 0.5) * 2))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Control functions
  const setSpeed = (increment: number) => {
    setPilotState(prev => ({
      ...prev,
      speed: Math.max(0, Math.min(100, prev.speed + increment))
    }));
  };

  const bankLeft = () => {
    setPilotState(prev => ({
      ...prev,
      heading: {
        ...prev.heading,
        x: Math.max(-180, Math.min(180, prev.heading.x - 15))
      }
    }));
  };

  const bankRight = () => {
    setPilotState(prev => ({
      ...prev,
      heading: {
        ...prev.heading,
        x: Math.max(-180, Math.min(180, prev.heading.x + 15))
      }
    }));
  };

  const navigateTerrain = () => {
    setPilotState(prev => ({
      ...prev,
      heading: {
        x: Math.floor(Math.random() * 360) - 180,
        y: Math.floor(Math.random() * 180) - 90
      }
    }));
  };

  const descend = () => {
    setPilotState(prev => ({
      ...prev,
      heading: {
        ...prev.heading,
        y: Math.max(-90, Math.min(90, prev.heading.y - 15))
      }
    }));
  };

  const ascend = () => {
    setPilotState(prev => ({
      ...prev,
      heading: {
        ...prev.heading,
        y: Math.max(-90, Math.min(90, prev.heading.y + 15))
      }
    }));
  };

  const punchIt = () => {
    setPilotState(prev => ({
      ...prev,
      speed: 100,
      heading: { x: 0, y: 0 }
    }));
  };

  const emergencyStop = () => {
    setPilotState(prev => ({
      ...prev,
      speed: 0,
      alert: 'red'
    }));
    
    setTimeout(() => {
      setPilotState(prev => ({ ...prev, alert: 'normal' }));
    }, 5000);
  };

  const initiateHyperdrive = () => {
    if (pilotState.hyperdriveStatus === 'ready') {
      setPilotState(prev => ({ ...prev, hyperdriveStatus: 'charging' }));
      
      setTimeout(() => {
        setPilotState(prev => ({ ...prev, hyperdriveStatus: 'jumping' }));
        
        setTimeout(() => {
          setPilotState(prev => ({ ...prev, hyperdriveStatus: 'cooldown' }));
          
          setTimeout(() => {
            setPilotState(prev => ({ ...prev, hyperdriveStatus: 'ready' }));
          }, 10000);
        }, 3000);
      }, 5000);
    }
  };

  // Calculate gauge angles
  const speedAngle = (pilotState.speed / 100) * 270 - 135;
  const altitudeAngle = ((pilotState.altitude % 10000) / 10000) * 270 - 135;

  return (
    <Container onClick={() => setAudioEnabled(true)}>
      <StationHeader>NAVIGATION STATION</StationHeader>
      
      <MainGrid>
        {/* Left Panel - Status */}
        <LeftPanel>
          <StatusCard alert={pilotState.alert.toLowerCase()}>
            <h3>Alert Status</h3>
            <StatusValue alert={pilotState.alert.toLowerCase()}>
              {pilotState.alert.toUpperCase()}
            </StatusValue>
          </StatusCard>
          
          <StatusCard>
            <h3>Fuel Level</h3>
            <StatusValue size="medium" alert={pilotState.fuelLevel < 20 ? 'red' : pilotState.fuelLevel < 50 ? 'yellow' : undefined}>
              {pilotState.fuelLevel.toFixed(1)}%
            </StatusValue>
          </StatusCard>
          
          <StatusCard>
            <h3>Shield Status</h3>
            <StatusValue size="medium" alert={pilotState.shieldStatus < 30 ? 'red' : pilotState.shieldStatus < 60 ? 'yellow' : undefined}>
              {pilotState.shieldStatus.toFixed(0)}%
            </StatusValue>
          </StatusCard>
        </LeftPanel>

        {/* Center Panel - Main Instruments */}
        <CenterPanel>
          <InstrumentContainer>
            <InstrumentLabel>Attitude Indicator</InstrumentLabel>
            <ArtificialHorizon>
              <HorizonLine />
              <PitchIndicator pitch={pilotState.heading.y} />
              <RollIndicator roll={pilotState.heading.x} />
              {[0, 11.1, 22.2, 33.3, 44.4, 55.6, 66.7, 77.8, 88.9, 100].map((pos, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '2px',
                    height: '12px',
                    background: 'var(--starwars-yellow)',
                    left: '50%',
                    top: `${pos}%`,
                    transform: 'translateX(-50%)',
                    opacity: 0.7
                  }}
                />
              ))}
            </ArtificialHorizon>
          </InstrumentContainer>
        </CenterPanel>

        {/* Right Panel - Gauges */}
        <RightPanel>
          <InstrumentContainer>
            <InstrumentLabel>Velocity</InstrumentLabel>
            <CircularGauge>
              <GaugeDial>
                <GaugeNeedle angle={speedAngle} />
                <GaugeValue>{pilotState.speed}</GaugeValue>
              </GaugeDial>
            </CircularGauge>
          </InstrumentContainer>
          
          <InstrumentContainer>
            <InstrumentLabel>Altitude</InstrumentLabel>
            <CircularGauge>
              <GaugeDial>
                <GaugeNeedle angle={altitudeAngle} />
                <GaugeValue>{Math.round(pilotState.altitude)}</GaugeValue>
              </GaugeDial>
            </CircularGauge>
          </InstrumentContainer>
        </RightPanel>
      </MainGrid>

      {/* Manual Controls */}
      <ControlsGrid>
        <AxisControl>
          <AxisLabel>Vertical Heading</AxisLabel>
          <AxisValue>{pilotState.heading.y}°</AxisValue>
          <Slider
            type="range"
            min="-90"
            max="90"
            step="1"
            value={pilotState.heading.y}
            onChange={(e) => setPilotState(prev => ({
              ...prev,
              heading: { ...prev.heading, y: parseInt(e.target.value) }
            }))}
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
            onChange={(e) => setPilotState(prev => ({
              ...prev,
              heading: { ...prev.heading, x: parseInt(e.target.value) }
            }))}
          />
        </AxisControl>

        <AxisControl>
          <AxisLabel>Speed Control</AxisLabel>
          <AxisValue>{pilotState.speed}</AxisValue>
          <Slider
            type="range"
            min="0"
            max="100"
            step="1"
            value={pilotState.speed}
            onChange={(e) => setPilotState(prev => ({
              ...prev,
              speed: parseInt(e.target.value)
            }))}
          />
        </AxisControl>
      </ControlsGrid>

      {/* Hyperdrive Panel */}
      <HyperdrivePanel status={pilotState.hyperdriveStatus}>
        <h3>Hyperdrive Status</h3>
        <StatusValue size="medium">
          {pilotState.hyperdriveStatus.toUpperCase()}
        </StatusValue>
        <MacroButton 
          onClick={initiateHyperdrive}
          disabled={pilotState.hyperdriveStatus !== 'ready'}
          variant="success"
        >
          {pilotState.hyperdriveStatus === 'ready' ? 'JUMP TO HYPERSPACE' : 
           pilotState.hyperdriveStatus === 'charging' ? 'CHARGING...' :
           pilotState.hyperdriveStatus === 'jumping' ? 'JUMPING...' : 'COOLDOWN'}
        </MacroButton>
      </HyperdrivePanel>

      {/* Macro Buttons */}
      <MacroButtons>
        <MacroButton onClick={() => setSpeed(-15)}>
          ◀ DECELERATE
        </MacroButton>
        <MacroButton onClick={() => setSpeed(25)} variant="success">
          🔄 CRUISE SPEED
        </MacroButton>
        <MacroButton onClick={() => setSpeed(15)}>
          ▶ ACCELERATE
        </MacroButton>

        <MacroButton onClick={bankLeft}>
          ⬅ BANK LEFT
        </MacroButton>
        <MacroButton onClick={navigateTerrain} variant="warning">
          🧭 EVASIVE MANEUVERS
        </MacroButton>
        <MacroButton onClick={bankRight}>
          ➡ BANK RIGHT
        </MacroButton>

        <MacroButton onClick={descend}>
          ⬇ DESCEND
        </MacroButton>
        <MacroButton onClick={punchIt} variant="success">
          🚀 FULL THROTTLE
        </MacroButton>
        <MacroButton onClick={ascend}>
          ⬆ ASCEND
        </MacroButton>

        <MacroButton onClick={emergencyStop} variant="danger">
          🛑 EMERGENCY STOP
        </MacroButton>
        <MacroButton onClick={() => setPilotState(prev => ({ ...prev, heading: { x: 0, y: 0 } }))}>
          📍 LEVEL FLIGHT
        </MacroButton>
        <MacroButton onClick={() => window.location.reload()} variant="warning">
          🔄 RESET SYSTEMS
        </MacroButton>
      </MacroButtons>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/engine.mp3" type="audio/mpeg" />
      </audio>
    </Container>
  );
};

export default PilotStationExample;