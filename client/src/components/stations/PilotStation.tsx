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
  hyperdriveStatus: 'ready' | 'charging' | 'jumping' | 'cooldown';
  fuelLevel: number;
  shieldStatus: number;
  engineTemp: number;
  navigationComputer: {
    targetSystem: string;
    jumpDistance: number;
    eta: number;
  };
  autopilot: boolean;
  emergencyPower: boolean;
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

const hyperdriveCharge = keyframes`
  0% { box-shadow: 0 0 5px var(--starwars-blue); }
  50% { box-shadow: 0 0 20px var(--starwars-blue), 0 0 30px var(--starwars-blue); }
  100% { box-shadow: 0 0 5px var(--starwars-blue); }
`;

const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
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

const StatusValue = styled.div<{ alert?: string; size?: 'large' | 'medium' | 'small' }>`
  font-size: ${props => 
    props.size === 'large' ? '3em' :
    props.size === 'small' ? '1.8em' :
    props.size === 'medium' ? '2.2em' :
    '2.5em'
  };
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

const MacroButton = styled.button<{ variant?: 'danger' | 'warning' | 'success' | 'disabled' }>`
  background: ${props => 
    props.variant === 'danger' ? 'var(--starwars-red)' :
    props.variant === 'warning' ? '#ff8c00' :
    props.variant === 'success' ? 'var(--starwars-green)' :
    props.variant === 'disabled' ? '#666' :
    'var(--starwars-yellow)'
  };
  color: ${props => props.variant === 'disabled' ? '#999' : '#000'};
  border: 2px solid var(--starwars-blue);
  padding: 15px 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: ${props => props.variant === 'disabled' ? 'not-allowed' : 'pointer'};
  transition: all 0.3s;
  border-radius: 5px;
  
  &:hover {
    background: ${props => props.variant === 'disabled' ? '#666' : 'var(--starwars-blue)'};
    color: ${props => props.variant === 'disabled' ? '#999' : '#fff'};
    transform: ${props => props.variant === 'disabled' ? 'none' : 'scale(1.05)'};
    box-shadow: ${props => props.variant === 'disabled' ? 'none' : '0 0 15px var(--starwars-blue)'};
  }
  
  &:active {
    transform: ${props => props.variant === 'disabled' ? 'none' : 'scale(0.95)'};
  }
`;

const HyperdrivePanel = styled.div<{ status: string }>`
  background: rgba(0, 0, 0, 0.7);
  padding: 25px;
  border: 2px solid var(--starwars-blue);
  border-radius: 12px;
  margin: 30px 0;
  text-align: center;
  backdrop-filter: blur(5px);
  
  ${props => props.status === 'charging' && css`
    animation: ${hyperdriveCharge} 2s infinite;
    border-color: var(--starwars-yellow);
  `}
  
  ${props => props.status === 'jumping' && css`
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.7) 100%);
    border-color: var(--starwars-yellow);
    animation: ${pulse} 0.5s infinite;
  `}
  
  h3 {
    margin: 0 0 15px 0;
    color: var(--starwars-blue);
    font-size: 1.4rem;
  }
`;

const NavigationComputer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border: 2px solid var(--starwars-green);
  border-radius: 10px;
  margin: 20px 0;
  
  h3 {
    margin: 0 0 15px 0;
    color: var(--starwars-green);
    font-size: 1.3rem;
  }
  
  .nav-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    font-family: 'Courier New', monospace;
  }
  
  .nav-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid rgba(34, 177, 76, 0.3);
  }
  
  .nav-label {
    color: var(--starwars-green);
    font-weight: bold;
  }
  
  .nav-value {
    color: var(--starwars-yellow);
  }
`;

const SystemStatus = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin: 20px 0;
`;

const SystemCard = styled.div<{ status: 'good' | 'warning' | 'critical' }>`
  background: rgba(0, 0, 0, 0.6);
  padding: 15px;
  border: 2px solid ${props => 
    props.status === 'critical' ? 'var(--starwars-red)' :
    props.status === 'warning' ? 'var(--starwars-yellow)' :
    'var(--starwars-green)'
  };
  border-radius: 8px;
  text-align: center;
  
  ${props => props.status === 'critical' && css`
    animation: ${blink} 1.5s infinite;
  `}
  
  h4 {
    margin: 0 0 10px 0;
    color: ${props => 
      props.status === 'critical' ? 'var(--starwars-red)' :
      props.status === 'warning' ? 'var(--starwars-yellow)' :
      'var(--starwars-green)'
    };
    font-size: 0.9rem;
    text-transform: uppercase;
  }
  
  .system-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: ${props => 
      props.status === 'critical' ? 'var(--starwars-red)' :
      props.status === 'warning' ? 'var(--starwars-yellow)' :
      'var(--starwars-green)'
    };
  }
  
  .system-unit {
    font-size: 0.8rem;
    color: #ccc;
  }
`;

const ToggleSwitch = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'var(--starwars-green)' : '#333'};
  color: ${props => props.active ? '#000' : '#ccc'};
  border: 2px solid ${props => props.active ? 'var(--starwars-green)' : '#666'};
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
  text-transform: uppercase;
  
  &:hover {
    background: ${props => props.active ? 'var(--starwars-yellow)' : 'var(--starwars-blue)'};
    color: #000;
    border-color: var(--starwars-blue);
  }
`;

// Component
const PilotStation: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pilotState, setPilotState] = useState<PilotState>({
    heading: { x: 0, y: 0 },
    speed: 0,
    altitude: 1000,
    alert: 'normal',
    hyperdriveStatus: 'ready',
    fuelLevel: 85,
    shieldStatus: 92,
    engineTemp: 45,
    navigationComputer: {
      targetSystem: 'Coruscant',
      jumpDistance: 12.5,
      eta: 0
    },
    autopilot: false,
    emergencyPower: false
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

  // Simulate altitude changes and system updates (like in original example_instruments.html)
  useEffect(() => {
    const systemInterval = setInterval(() => {
      setPilotState(prev => {
        // Calculate altitude change based on vertical heading and speed
        const verticalComponent = (prev.heading.y / 90) * (prev.speed / 100);
        const altitudeChange = verticalComponent * 50;
        const newAltitude = Math.max(0, prev.altitude + altitudeChange);
        
        // Simulate fuel consumption based on speed and engine temp
        const fuelConsumption = (prev.speed / 100) * 0.1 + (prev.engineTemp > 80 ? 0.05 : 0);
        const newFuelLevel = Math.max(0, prev.fuelLevel - fuelConsumption);
        
        // Engine temperature based on speed and usage
        const targetTemp = 30 + (prev.speed / 100) * 50 + (prev.hyperdriveStatus === 'charging' ? 20 : 0);
        const tempChange = (targetTemp - prev.engineTemp) * 0.1;
        const newEngineTemp = Math.max(20, Math.min(120, prev.engineTemp + tempChange));
        
        // Shield fluctuation
        const shieldChange = (Math.random() - 0.5) * 2;
        const newShieldStatus = Math.max(0, Math.min(100, prev.shieldStatus + shieldChange));
        
        // Update ETA if hyperdrive is active
        let newEta = prev.navigationComputer.eta;
        if (prev.hyperdriveStatus === 'jumping' && newEta > 0) {
          newEta = Math.max(0, newEta - 1);
        }
        
        return {
          ...prev,
          altitude: newAltitude,
          fuelLevel: newFuelLevel,
          engineTemp: newEngineTemp,
          shieldStatus: newShieldStatus,
          navigationComputer: {
            ...prev.navigationComputer,
            eta: newEta
          }
        };
      });
    }, 1000);

    return () => clearInterval(systemInterval);
  }, []);

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

  // Control functions - Update local state immediately AND emit to socket
  const setSpeed = (increment: number) => {
    const newSpeed = Math.max(0, Math.min(100, pilotState.speed + increment));
    // Update local state immediately
    setPilotState(prev => ({ ...prev, speed: newSpeed }));
    // Also emit to socket
    emitAction('set_speed', newSpeed);
  };

  const bankLeft = () => {
    const newHeading = Math.max(-180, Math.min(180, pilotState.heading.x - 10));
    // Update local state immediately
    setPilotState(prev => ({
      ...prev,
      heading: { ...prev.heading, x: newHeading }
    }));
    // Also emit to socket
    emitAction('update_heading_x', newHeading);
  };

  const bankRight = () => {
    const newHeading = Math.max(-180, Math.min(180, pilotState.heading.x + 10));
    // Update local state immediately
    setPilotState(prev => ({
      ...prev,
      heading: { ...prev.heading, x: newHeading }
    }));
    // Also emit to socket
    emitAction('update_heading_x', newHeading);
  };

  const navigateTerrain = () => {
    const newHeadingX = Math.floor(Math.random() * 360) - 180;
    const newHeadingY = Math.floor(Math.random() * 180) - 90;
    // Update local state immediately
    setPilotState(prev => ({
      ...prev,
      heading: { x: newHeadingX, y: newHeadingY }
    }));
    // Also emit to socket
    emitAction('update_heading_x', newHeadingX);
    emitAction('update_heading_y', newHeadingY);
  };

  const descend = () => {
    const newHeading = Math.max(-90, Math.min(90, pilotState.heading.y - 10));
    // Update local state immediately
    setPilotState(prev => ({
      ...prev,
      heading: { ...prev.heading, y: newHeading }
    }));
    // Also emit to socket
    emitAction('update_heading_y', newHeading);
  };

  const ascend = () => {
    const newHeading = Math.max(-90, Math.min(90, pilotState.heading.y + 10));
    // Update local state immediately
    setPilotState(prev => ({
      ...prev,
      heading: { ...prev.heading, y: newHeading }
    }));
    // Also emit to socket
    emitAction('update_heading_y', newHeading);
  };

  const punchIt = () => {
    // Update local state immediately
    setPilotState(prev => ({
      ...prev,
      speed: 100,
      heading: { x: 0, y: 0 }
    }));
    // Also emit to socket
    emitAction('set_speed', 100);
    emitAction('update_heading_x', 0);
    emitAction('update_heading_y', 0);
  };

  // Advanced control functions
  const initiateHyperdrive = () => {
    if (pilotState.hyperdriveStatus === 'ready' && pilotState.fuelLevel > 20) {
      setPilotState(prev => ({ 
        ...prev, 
        hyperdriveStatus: 'charging',
        navigationComputer: {
          ...prev.navigationComputer,
          eta: Math.ceil(prev.navigationComputer.jumpDistance * 2)
        }
      }));
      
      setTimeout(() => {
        setPilotState(prev => ({ ...prev, hyperdriveStatus: 'jumping' }));
        
        setTimeout(() => {
          setPilotState(prev => ({ 
            ...prev, 
            hyperdriveStatus: 'cooldown',
            fuelLevel: Math.max(0, prev.fuelLevel - 15)
          }));
          
          setTimeout(() => {
            setPilotState(prev => ({ ...prev, hyperdriveStatus: 'ready' }));
          }, 10000);
        }, 3000);
      }, 5000);
      
      emitAction('hyperdrive_jump', 1);
    }
  };

  const toggleAutopilot = () => {
    setPilotState(prev => ({ ...prev, autopilot: !prev.autopilot }));
    emitAction('toggle_autopilot', pilotState.autopilot ? 0 : 1);
  };

  const toggleEmergencyPower = () => {
    setPilotState(prev => ({ ...prev, emergencyPower: !prev.emergencyPower }));
    emitAction('emergency_power', pilotState.emergencyPower ? 0 : 1);
  };

  const emergencyStop = () => {
    setPilotState(prev => ({
      ...prev,
      speed: 0,
      alert: 'red',
      emergencyPower: true
    }));
    emitAction('emergency_stop', 1);
    
    setTimeout(() => {
      setPilotState(prev => ({ ...prev, alert: 'normal' }));
    }, 5000);
  };

  const evasiveManeuvers = () => {
    const maneuvers = [
      { x: -45, y: 15, speed: 80 },
      { x: 30, y: -20, speed: 90 },
      { x: -60, y: 25, speed: 75 },
      { x: 45, y: -10, speed: 85 }
    ];
    
    const maneuver = maneuvers[Math.floor(Math.random() * maneuvers.length)];
    
    setPilotState(prev => ({
      ...prev,
      heading: { x: maneuver.x, y: maneuver.y },
      speed: maneuver.speed,
      alert: 'yellow'
    }));
    
    emitAction('evasive_maneuvers', 1);
    
    setTimeout(() => {
      setPilotState(prev => ({ ...prev, alert: 'normal' }));
    }, 3000);
  };

  // Slider handlers - Update local state immediately AND emit to socket
  const handleHeadingXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Update local state immediately for responsive UI
    setPilotState(prev => ({
      ...prev,
      heading: { ...prev.heading, x: value }
    }));
    // Also emit to socket for multiplayer sync
    emitAction('update_heading_x', value);
  };

  const handleHeadingYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Update local state immediately for responsive UI
    setPilotState(prev => ({
      ...prev,
      heading: { ...prev.heading, y: value }
    }));
    // Also emit to socket for multiplayer sync
    emitAction('update_heading_y', value);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Update local state immediately for responsive UI
    setPilotState(prev => ({
      ...prev,
      speed: value
    }));
    // Also emit to socket for multiplayer sync
    emitAction('set_speed', value);
  };

  // Calculate gauge angles
  // Speed needle starts at 12 o'clock (0 degrees) and rotates 270 degrees clockwise
  const speedAngle = (pilotState.speed / 100) * 270;
  // Altitude needle also starts at 12 o'clock
  const altitudeAngle = ((pilotState.altitude % 10000) / 10000) * 270;

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

      {/* System Status Monitoring */}
      <SystemStatus>
        <SystemCard status={pilotState.fuelLevel < 20 ? 'critical' : pilotState.fuelLevel < 50 ? 'warning' : 'good'}>
          <h4>Fuel Level</h4>
          <div className="system-value">{pilotState.fuelLevel.toFixed(1)}</div>
          <div className="system-unit">%</div>
        </SystemCard>
        
        <SystemCard status={pilotState.shieldStatus < 30 ? 'critical' : pilotState.shieldStatus < 60 ? 'warning' : 'good'}>
          <h4>Shield Status</h4>
          <div className="system-value">{pilotState.shieldStatus.toFixed(0)}</div>
          <div className="system-unit">%</div>
        </SystemCard>
        
        <SystemCard status={pilotState.engineTemp > 90 ? 'critical' : pilotState.engineTemp > 70 ? 'warning' : 'good'}>
          <h4>Engine Temp</h4>
          <div className="system-value">{pilotState.engineTemp.toFixed(0)}</div>
          <div className="system-unit">°C</div>
        </SystemCard>
        
        <SystemCard status={pilotState.hyperdriveStatus === 'ready' ? 'good' : 'warning'}>
          <h4>Hyperdrive</h4>
          <div className="system-value" style={{ fontSize: '1.2rem' }}>
            {pilotState.hyperdriveStatus.toUpperCase()}
          </div>
        </SystemCard>
      </SystemStatus>

      {/* Flight Instruments */}
      <InstrumentPanel>
        {/* Radio Altimeter */}
        <InstrumentContainer>
          <InstrumentLabel>PROXIMITY</InstrumentLabel>
          <CircularGauge>
            <GaugeDial>
              <GaugeNeedle angle={altitudeAngle} />
              <GaugeValue>{Math.round(pilotState.altitude)}</GaugeValue>
              <GaugeLabel>DISTANCE TO MASS (k)</GaugeLabel>
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

      {/* Navigation Computer */}
      <NavigationComputer>
        <h3>NAVIGATION COMPUTER</h3>
        <div className="nav-info">
          <div className="nav-item">
            <span className="nav-label">TARGET SYSTEM:</span>
            <span className="nav-value">{pilotState.navigationComputer.targetSystem}</span>
          </div>
          <div className="nav-item">
            <span className="nav-label">JUMP DISTANCE:</span>
            <span className="nav-value">{pilotState.navigationComputer.jumpDistance} parsecs</span>
          </div>
          <div className="nav-item">
            <span className="nav-label">CURRENT SPEED:</span>
            <span className="nav-value">{pilotState.speed}% sublight</span>
          </div>
          <div className="nav-item">
            <span className="nav-label">ETA:</span>
            <span className="nav-value">
              {pilotState.navigationComputer.eta > 0 ? `${pilotState.navigationComputer.eta}s` : 'N/A'}
            </span>
          </div>
        </div>
      </NavigationComputer>

      {/* Hyperdrive Panel */}
      <HyperdrivePanel status={pilotState.hyperdriveStatus}>
        <h3>HYPERDRIVE SYSTEM</h3>
        <StatusValue size="medium">
          {pilotState.hyperdriveStatus.toUpperCase()}
        </StatusValue>
        <div style={{ margin: '20px 0' }}>
          <MacroButton 
            onClick={initiateHyperdrive}
            variant={
              pilotState.hyperdriveStatus !== 'ready' ? 'disabled' :
              pilotState.fuelLevel < 20 ? 'danger' : 'success'
            }
            disabled={pilotState.hyperdriveStatus !== 'ready' || pilotState.fuelLevel < 20}
          >
            {pilotState.hyperdriveStatus === 'ready' ? 
              (pilotState.fuelLevel < 20 ? 'INSUFFICIENT FUEL' : '🚀 JUMP TO HYPERSPACE') :
             pilotState.hyperdriveStatus === 'charging' ? '⚡ CHARGING HYPERDRIVE...' :
             pilotState.hyperdriveStatus === 'jumping' ? '🌟 JUMPING...' : 
             '🔄 HYPERDRIVE COOLDOWN'}
          </MacroButton>
        </div>
      </HyperdrivePanel>

      {/* Advanced Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '30px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--starwars-blue)', marginBottom: '15px' }}>AUTOPILOT</h4>
          <ToggleSwitch active={pilotState.autopilot} onClick={toggleAutopilot}>
            {pilotState.autopilot ? 'ENGAGED' : 'MANUAL'}
          </ToggleSwitch>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--starwars-blue)', marginBottom: '15px' }}>EMERGENCY POWER</h4>
          <ToggleSwitch active={pilotState.emergencyPower} onClick={toggleEmergencyPower}>
            {pilotState.emergencyPower ? 'ACTIVE' : 'STANDBY'}
          </ToggleSwitch>
        </div>
      </div>

      {/* Enhanced Macro Buttons */}
      <MacroButtons>
        <MacroButton onClick={() => setSpeed(-15)} variant="warning">
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
        <MacroButton onClick={evasiveManeuvers} variant="warning">
          ⚡ EVASIVE MANEUVERS
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

      {/* Hidden audio element for weapon sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/weapon.mp3" type="audio/mpeg" />
      </audio>
    </Container>
  );
};

export default PilotStation;