import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { io, Socket } from 'socket.io-client';

// Types for weapons station
interface WeaponsState {
  targeting: {
    currentTarget: Target | null;
    availableTargets: Target[];
    lockStatus: 'none' | 'acquiring' | 'locked' | 'lost';
    lockStrength: number;
    scanRange: number;
    scanMode: 'passive' | 'active' | 'deep';
  };
  weapons: {
    primaryWeapons: WeaponSystem[];
    secondaryWeapons: WeaponSystem[];
    torpedoes: TorpedoSystem;
    powerLevel: number;
    heatLevel: number;
    autoDefense: boolean;
    firingMode: 'manual' | 'auto' | 'burst';
  };
  shields: {
    frontShield: number;
    rearShield: number;
    leftShield: number;
    rightShield: number;
    shieldBalance: 'balanced' | 'forward' | 'aft' | 'port' | 'starboard';
    regenerationRate: number;
    overload: boolean;
  };
  alert: string;
  combatStatus: 'standby' | 'yellow' | 'red' | 'engaged';
}

interface Target {
  id: string;
  type: 'ship' | 'station' | 'asteroid' | 'debris';
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  size: 'small' | 'medium' | 'large' | 'capital';
  threat: 'none' | 'low' | 'medium' | 'high' | 'critical';
  shields: number;
  hull: number;
  distance: number;
  bearing: number;
  signature: number;
  classification: string;
}

interface WeaponSystem {
  id: string;
  name: string;
  type: 'laser' | 'ion' | 'plasma' | 'particle';
  damage: number;
  range: number;
  accuracy: number;
  chargeLevel: number;
  cooldown: number;
  ammunition: number;
  maxAmmo: number;
  status: 'ready' | 'charging' | 'cooling' | 'damaged' | 'offline';
}

interface TorpedoSystem {
  protonTorpedoes: number;
  concussionMissiles: number;
  ionTorpedoes: number;
  maxProton: number;
  maxConcussion: number;
  maxIon: number;
  tubeStatus: ('ready' | 'loading' | 'armed' | 'damaged')[];
  selectedType: 'proton' | 'concussion' | 'ion';
}

interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
}

interface ModulePosition {
  x: number;
  y: number;
  zIndex: number;
}

// Animations
const targetScan = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const weaponCharge = keyframes`
  0% { box-shadow: 0 0 5px var(--weapon-color); }
  50% { box-shadow: 0 0 20px var(--weapon-color), 0 0 30px var(--weapon-color); }
  100% { box-shadow: 0 0 5px var(--weapon-color); }
`;

const alertBlink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const shieldFlicker = keyframes`
  0% { opacity: 0.8; }
  25% { opacity: 1; }
  50% { opacity: 0.6; }
  75% { opacity: 0.9; }
  100% { opacity: 0.8; }
`;

// Styled Components
const Container = styled.div`
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #2a0a0a 100%);
  color: #fff;
  font-family: 'Orbitron', 'Courier New', monospace;
  min-height: 100vh;
  padding: 20px;
  
  --weapon-red: #ff0040;
  --weapon-orange: #ff8c00;
  --weapon-yellow: #ffff00;
  --weapon-green: #00ff41;
  --weapon-blue: #00d4ff;
  --shield-blue: #0080ff;
  --bg-dark: #0a0a0a;
  --text-light: #ffffff;
  --panel-bg: rgba(40, 10, 10, 0.8);
`;

const StationHeader = styled.h1`
  text-align: center;
  font-size: 2.8rem;
  margin-bottom: 30px;
  color: var(--weapon-red);
  text-shadow: 0 0 15px var(--weapon-red);
  letter-spacing: 4px;
  font-weight: 300;
  
  &::before, &::after {
    content: '▲▲▲';
    margin: 0 20px;
    color: var(--weapon-orange);
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

const WeaponCard = styled.div<{ status?: string; alert?: string }>`
  background: var(--panel-bg);
  padding: 20px;
  border: 2px solid var(--weapon-red);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  position: relative;
  
  ${props => props.alert === 'critical' && css`
    border-color: var(--weapon-red);
    animation: ${alertBlink} 1.5s infinite;
  `}
  
  ${props => props.status === 'charging' && css`
    animation: ${weaponCharge} 2s infinite;
  `}
  
  h3 {
    margin: 0 0 15px 0;
    color: var(--weapon-red);
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const TargetingDisplay = styled.div`
  width: 400px;
  height: 400px;
  background: radial-gradient(circle at center, #000428 0%, #004e92 100%);
  border: 3px solid var(--weapon-blue);
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 
    inset 0 0 30px rgba(0, 212, 255, 0.3),
    0 0 20px rgba(0, 212, 255, 0.2);
`;

const RadarSweep = styled.div<{ scanning: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 200px;
  background: linear-gradient(0deg, transparent, var(--weapon-green));
  transform-origin: bottom center;
  transform: translate(-50%, -100%);
  
  ${props => props.scanning && css`
    animation: ${targetScan} 3s linear infinite;
  `}
`;

const TargetBlip = styled.div<{ x: number; y: number; threat: string }>`
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => 
    props.threat === 'critical' ? 'var(--weapon-red)' :
    props.threat === 'high' ? 'var(--weapon-orange)' :
    props.threat === 'medium' ? 'var(--weapon-yellow)' :
    'var(--weapon-green)'
  };
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px currentColor;
  animation: ${alertBlink} 2s infinite;
`;

const WeaponStatus = styled.div<{ status: string }>`
  font-size: 1.8em;
  font-weight: bold;
  margin: 10px 0;
  text-align: center;
  
  ${props => props.status === 'ready' && css`
    color: var(--weapon-green);
  `}
  
  ${props => props.status === 'charging' && css`
    color: var(--weapon-yellow);
    animation: ${alertBlink} 1s infinite;
  `}
  
  ${props => props.status === 'cooling' && css`
    color: var(--weapon-orange);
  `}
  
  ${props => props.status === 'damaged' && css`
    color: var(--weapon-red);
    animation: ${alertBlink} 0.5s infinite;
  `}
`;

const ChargeBar = styled.div<{ level: number; maxLevel: number }>`
  width: 100%;
  height: 20px;
  background: #333;
  border: 2px solid var(--weapon-blue);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  margin: 10px 0;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => (props.level / props.maxLevel) * 100}%;
    background: linear-gradient(90deg, 
      var(--weapon-red) 0%, 
      var(--weapon-orange) 50%, 
      var(--weapon-green) 100%
    );
    transition: width 0.3s ease;
  }
`;

const ShieldDisplay = styled.div`
  width: 300px;
  height: 200px;
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--shield-blue);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShieldSection = styled.div<{ strength: number; position: string }>`
  position: absolute;
  background: rgba(0, 128, 255, ${props => props.strength / 100 * 0.6});
  border: 2px solid var(--shield-blue);
  
  ${props => props.strength < 25 && css`
    animation: ${shieldFlicker} 1s infinite;
    border-color: var(--weapon-red);
  `}
  
  ${props => props.position === 'front' && css`
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 20px;
    border-radius: 10px 10px 0 0;
  `}
  
  ${props => props.position === 'rear' && css`
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 20px;
    border-radius: 0 0 10px 10px;
  `}
  
  ${props => props.position === 'left' && css`
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 80px;
    border-radius: 10px 0 0 10px;
  `}
  
  ${props => props.position === 'right' && css`
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 80px;
    border-radius: 0 10px 10px 0;
  `}
`;

const FireButton = styled.button<{ variant?: 'primary' | 'secondary' | 'torpedo' | 'emergency' }>`
  background: ${props => 
    props.variant === 'torpedo' ? 'var(--weapon-orange)' :
    props.variant === 'secondary' ? 'var(--weapon-yellow)' :
    props.variant === 'emergency' ? 'var(--weapon-red)' :
    'var(--weapon-green)'
  };
  color: #000;
  border: 3px solid var(--weapon-red);
  padding: 20px 25px;
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: 'Orbitron', sans-serif;
  position: relative;
  
  &:hover {
    background: var(--weapon-red);
    color: #fff;
    transform: scale(1.05);
    box-shadow: 0 0 25px var(--weapon-red);
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

const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 30px 0;
`;

const TorpedoPanel = styled.div`
  background: var(--panel-bg);
  padding: 20px;
  border: 2px solid var(--weapon-orange);
  border-radius: 12px;
  
  h3 {
    color: var(--weapon-orange);
    margin: 0 0 15px 0;
    text-align: center;
  }
`;

const TorpedoCount = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 1.1em;
  
  .type {
    color: var(--weapon-orange);
    font-weight: bold;
  }
  
  .count {
    color: var(--weapon-yellow);
  }
`;

// Draggable Module Components
const DraggableModule = styled.div<{ position: ModulePosition; isDragging: boolean }>`
  position: fixed;
  left: ${props => props.position.x}px;
  top: ${props => props.position.y}px;
  z-index: ${props => props.position.zIndex};
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  user-select: none;
  transition: ${props => props.isDragging ? 'none' : 'all 0.2s ease'};
  
  ${props => props.isDragging && css`
    transform: scale(1.02);
    box-shadow: 0 10px 30px rgba(255, 0, 64, 0.4);
  `}
`;

const DragHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(90deg, transparent, rgba(255, 0, 64, 0.2), transparent);
  border-bottom: 1px solid var(--weapon-red);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  color: var(--weapon-red);
  opacity: 0.3;
  transition: opacity 0.3s ease;
  z-index: 10;
  
  &:hover {
    opacity: 1;
    background: linear-gradient(90deg, transparent, rgba(255, 0, 64, 0.4), transparent);
  }
  
  &:active {
    cursor: grabbing;
    opacity: 1;
  }
  
  &::before {
    content: '⋮⋮⋮ DRAG ⋮⋮⋮';
    letter-spacing: 1px;
    font-weight: bold;
  }
`;

const ModuleWrapper = styled.div`
  position: relative;
  
  &:hover ${DragHandle} {
    opacity: 0.7;
  }
`;

// Main Component
const WeaponsStation: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [weaponsState, setWeaponsState] = useState<WeaponsState>({
    targeting: {
      currentTarget: null,
      availableTargets: [],
      lockStatus: 'none',
      lockStrength: 0,
      scanRange: 5000,
      scanMode: 'passive'
    },
    weapons: {
      primaryWeapons: [
        {
          id: 'laser1',
          name: 'Forward Laser Cannon',
          type: 'laser',
          damage: 8,
          range: 3000,
          accuracy: 85,
          chargeLevel: 100,
          cooldown: 0,
          ammunition: -1,
          maxAmmo: -1,
          status: 'ready'
        },
        {
          id: 'laser2',
          name: 'Dorsal Laser Cannon',
          type: 'laser',
          damage: 8,
          range: 3000,
          accuracy: 85,
          chargeLevel: 100,
          cooldown: 0,
          ammunition: -1,
          maxAmmo: -1,
          status: 'ready'
        }
      ],
      secondaryWeapons: [
        {
          id: 'ion1',
          name: 'Ion Cannon',
          type: 'ion',
          damage: 6,
          range: 2500,
          accuracy: 75,
          chargeLevel: 100,
          cooldown: 0,
          ammunition: 50,
          maxAmmo: 50,
          status: 'ready'
        }
      ],
      torpedoes: {
        protonTorpedoes: 8,
        concussionMissiles: 12,
        ionTorpedoes: 4,
        maxProton: 8,
        maxConcussion: 12,
        maxIon: 4,
        tubeStatus: ['ready', 'ready'],
        selectedType: 'proton'
      },
      powerLevel: 100,
      heatLevel: 0,
      autoDefense: false,
      firingMode: 'manual'
    },
    shields: {
      frontShield: 100,
      rearShield: 100,
      leftShield: 100,
      rightShield: 100,
      shieldBalance: 'balanced',
      regenerationRate: 2,
      overload: false
    },
    alert: 'normal',
    combatStatus: 'standby'
  });

  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Drag and drop state
  const [modulePositions, setModulePositions] = useState<{ [key: string]: ModulePosition }>({
    primaryWeapons: { x: 50, y: 100, zIndex: 1 },
    secondaryWeapons: { x: 50, y: 350, zIndex: 1 },
    torpedoPanel: { x: 50, y: 600, zIndex: 1 },
    targetingDisplay: { x: window.innerWidth / 2 - 200, y: 150, zIndex: 1 },
    shieldDisplay: { x: window.innerWidth - 350, y: 100, zIndex: 1 },
    systemStatus: { x: window.innerWidth - 350, y: 400, zIndex: 1 }
  });
  
  const [dragState, setDragState] = useState<{ [key: string]: DragState }>({});
  const [highestZIndex, setHighestZIndex] = useState(10);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, moduleId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setDragState(prev => ({
      ...prev,
      [moduleId]: {
        isDragging: true,
        dragOffset: { x: startX, y: startY },
        startPosition: { x: e.clientX, y: e.clientY }
      }
    }));
    
    // Bring to front
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    setModulePositions(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], zIndex: newZIndex }
    }));
  }, [highestZIndex]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    Object.entries(dragState).forEach(([moduleId, state]) => {
      if (state.isDragging) {
        const newX = e.clientX - state.dragOffset.x;
        const newY = e.clientY - state.dragOffset.y;
        
        // Keep modules within screen bounds
        const boundedX = Math.max(0, Math.min(window.innerWidth - 300, newX));
        const boundedY = Math.max(0, Math.min(window.innerHeight - 200, newY));
        
        setModulePositions(prev => ({
          ...prev,
          [moduleId]: { ...prev[moduleId], x: boundedX, y: boundedY }
        }));
      }
    });
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key] = { ...newState[key], isDragging: false };
      });
      return newState;
    });
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    const params = new URLSearchParams(window.location.search);
    const room = params.get('room') || 'default';
    
    newSocket.emit('join', { room, station: 'weapons' });

    newSocket.on('state_update', (state: WeaponsState) => {
      setWeaponsState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Simulate weapon systems and targeting
  useEffect(() => {
    const interval = setInterval(() => {
      setWeaponsState(prev => {
        const newState = { ...prev };
        
        // Weapon cooldowns
        newState.weapons.primaryWeapons = prev.weapons.primaryWeapons.map(weapon => ({
          ...weapon,
          cooldown: Math.max(0, weapon.cooldown - 1),
          status: weapon.cooldown > 0 ? 'cooling' : 'ready'
        }));
        
        // Heat dissipation
        newState.weapons.heatLevel = Math.max(0, prev.weapons.heatLevel - 2);
        
        // Shield regeneration
        if (!prev.shields.overload) {
          newState.shields.frontShield = Math.min(100, prev.shields.frontShield + prev.shields.regenerationRate);
          newState.shields.rearShield = Math.min(100, prev.shields.rearShield + prev.shields.regenerationRate);
          newState.shields.leftShield = Math.min(100, prev.shields.leftShield + prev.shields.regenerationRate);
          newState.shields.rightShield = Math.min(100, prev.shields.rightShield + prev.shields.regenerationRate);
        }
        
        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const enableAudio = () => {
    if (!audioEnabled) {
      setAudioEnabled(true);
    }
  };

  const emitAction = (action: string, value?: any) => {
    if (socket) {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room') || 'default';
      socket.emit('player_action', { room, action, value });
    }
  };

  const firePrimaryWeapons = () => {
    if (weaponsState.targeting.currentTarget && weaponsState.targeting.lockStatus === 'locked') {
      setWeaponsState(prev => ({
        ...prev,
        weapons: {
          ...prev.weapons,
          primaryWeapons: prev.weapons.primaryWeapons.map(weapon => ({
            ...weapon,
            cooldown: 3,
            status: 'cooling'
          })),
          heatLevel: Math.min(100, prev.weapons.heatLevel + 15)
        }
      }));
      
      emitAction('fire_primary_weapons', { targetId: weaponsState.targeting.currentTarget.id });
      
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  };

  const fireSecondaryWeapons = () => {
    if (weaponsState.targeting.currentTarget && weaponsState.targeting.lockStatus === 'locked') {
      setWeaponsState(prev => ({
        ...prev,
        weapons: {
          ...prev.weapons,
          secondaryWeapons: prev.weapons.secondaryWeapons.map(weapon => ({
            ...weapon,
            cooldown: 5,
            ammunition: Math.max(0, weapon.ammunition - 1),
            status: 'cooling'
          })),
          heatLevel: Math.min(100, prev.weapons.heatLevel + 25)
        }
      }));
      
      emitAction('fire_secondary_weapons', { targetId: weaponsState.targeting.currentTarget.id });
    }
  };

  const fireTorpedo = () => {
    const torpedoType = weaponsState.weapons.torpedoes.selectedType;
    const currentCount = weaponsState.weapons.torpedoes[`${torpedoType}Torpedoes` as keyof TorpedoSystem] as number;
    
    if (currentCount > 0 && weaponsState.targeting.currentTarget) {
      setWeaponsState(prev => ({
        ...prev,
        weapons: {
          ...prev.weapons,
          torpedoes: {
            ...prev.weapons.torpedoes,
            [`${torpedoType}Torpedoes`]: currentCount - 1
          }
        }
      }));
      
      emitAction('fire_torpedo', { 
        type: torpedoType,
        targetId: weaponsState.targeting.currentTarget.id 
      });
    }
  };

  const acquireTarget = (target: Target) => {
    setWeaponsState(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        currentTarget: target,
        lockStatus: 'acquiring',
        lockStrength: 0
      }
    }));
    
    // Simulate lock acquisition
    setTimeout(() => {
      setWeaponsState(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          lockStatus: 'locked',
          lockStrength: 100
        }
      }));
    }, 2000);
    
    emitAction('acquire_target', { targetId: target.id });
  };

  const toggleShieldBalance = () => {
    const balances: WeaponsState['shields']['shieldBalance'][] = ['balanced', 'forward', 'aft', 'port', 'starboard'];
    const currentIndex = balances.indexOf(weaponsState.shields.shieldBalance);
    const nextBalance = balances[(currentIndex + 1) % balances.length];
    
    setWeaponsState(prev => ({
      ...prev,
      shields: {
        ...prev.shields,
        shieldBalance: nextBalance
      }
    }));
    
    emitAction('adjust_shields', { balance: nextBalance });
  };

  return (
    <Container onClick={enableAudio}>
      <StationHeader>WEAPONS CONTROL</StationHeader>
      
      {/* Draggable Primary Weapons Module */}
      <DraggableModule 
        position={modulePositions.primaryWeapons}
        isDragging={dragState.primaryWeapons?.isDragging || false}
      >
        <ModuleWrapper>
          <DragHandle onMouseDown={(e) => handleMouseDown(e, 'primaryWeapons')} />
          <WeaponCard>
            <h3>Primary Weapons</h3>
            {weaponsState.weapons.primaryWeapons.map(weapon => (
              <div key={weapon.id} style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--weapon-green)', fontWeight: 'bold' }}>
                  {weapon.name}
                </div>
                <WeaponStatus status={weapon.status}>
                  {weapon.status.toUpperCase()}
                </WeaponStatus>
                <ChargeBar level={weapon.chargeLevel} maxLevel={100} />
                <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                  Damage: {weapon.damage} | Range: {weapon.range}m | Accuracy: {weapon.accuracy}%
                </div>
              </div>
            ))}
          </WeaponCard>
        </ModuleWrapper>
      </DraggableModule>

      {/* Draggable Secondary Weapons Module */}
      <DraggableModule 
        position={modulePositions.secondaryWeapons}
        isDragging={dragState.secondaryWeapons?.isDragging || false}
      >
        <ModuleWrapper>
          <DragHandle onMouseDown={(e) => handleMouseDown(e, 'secondaryWeapons')} />
          <WeaponCard>
            <h3>Secondary Weapons</h3>
            {weaponsState.weapons.secondaryWeapons.map(weapon => (
              <div key={weapon.id} style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--weapon-yellow)', fontWeight: 'bold' }}>
                  {weapon.name}
                </div>
                <WeaponStatus status={weapon.status}>
                  {weapon.status.toUpperCase()}
                </WeaponStatus>
                <ChargeBar level={weapon.chargeLevel} maxLevel={100} />
                <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                  Ammo: {weapon.ammunition}/{weapon.maxAmmo}
                </div>
              </div>
            ))}
          </WeaponCard>
        </ModuleWrapper>
      </DraggableModule>

      {/* Draggable Torpedo Panel Module */}
      <DraggableModule 
        position={modulePositions.torpedoPanel}
        isDragging={dragState.torpedoPanel?.isDragging || false}
      >
        <ModuleWrapper>
          <DragHandle onMouseDown={(e) => handleMouseDown(e, 'torpedoPanel')} />
          <TorpedoPanel>
            <h3>Torpedo Bay</h3>
            <TorpedoCount>
              <span className="type">Proton Torpedoes:</span>
              <span className="count">{weaponsState.weapons.torpedoes.protonTorpedoes}/{weaponsState.weapons.torpedoes.maxProton}</span>
            </TorpedoCount>
            <TorpedoCount>
              <span className="type">Concussion Missiles:</span>
              <span className="count">{weaponsState.weapons.torpedoes.concussionMissiles}/{weaponsState.weapons.torpedoes.maxConcussion}</span>
            </TorpedoCount>
            <TorpedoCount>
              <span className="type">Ion Torpedoes:</span>
              <span className="count">{weaponsState.weapons.torpedoes.ionTorpedoes}/{weaponsState.weapons.torpedoes.maxIon}</span>
            </TorpedoCount>
          </TorpedoPanel>
        </ModuleWrapper>
      </DraggableModule>

      {/* Draggable Targeting Display Module */}
      <DraggableModule 
        position={modulePositions.targetingDisplay}
        isDragging={dragState.targetingDisplay?.isDragging || false}
      >
        <ModuleWrapper>
          <DragHandle onMouseDown={(e) => handleMouseDown(e, 'targetingDisplay')} />
          <div style={{ 
            background: 'var(--panel-bg)', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '2px solid var(--weapon-blue)' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--weapon-blue)', margin: '0 0 10px 0' }}>
                TARGETING SYSTEM
              </h3>
              <div style={{ color: 'var(--weapon-yellow)' }}>
                {weaponsState.targeting.currentTarget ? 
                  `Target: ${weaponsState.targeting.currentTarget.classification}` : 
                  'No Target Selected'
                }
              </div>
              <div style={{ color: weaponsState.targeting.lockStatus === 'locked' ? 'var(--weapon-green)' : 'var(--weapon-orange)' }}>
                Lock Status: {weaponsState.targeting.lockStatus.toUpperCase()}
              </div>
            </div>
            
            <TargetingDisplay>
              <RadarSweep scanning={weaponsState.targeting.scanMode === 'active'} />
              
              {/* Range rings */}
              {[25, 50, 75].map(radius => (
                <div
                  key={radius}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: `${radius * 2}%`,
                    height: `${radius * 2}%`,
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
              
              {/* Target blips */}
              {weaponsState.targeting.availableTargets.map(target => {
                const angle = (target.bearing * Math.PI) / 180;
                const distance = Math.min(target.distance / weaponsState.targeting.scanRange, 1);
                const x = 50 + (distance * 40 * Math.cos(angle));
                const y = 50 + (distance * 40 * Math.sin(angle));
                
                return (
                  <TargetBlip
                    key={target.id}
                    x={x}
                    y={y}
                    threat={target.threat}
                    onClick={() => acquireTarget(target)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
              
              {/* Current target indicator */}
              {weaponsState.targeting.currentTarget && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '20px',
                    height: '20px',
                    border: '2px solid var(--weapon-red)',
                    transform: 'translate(-50%, -50%)',
                    animation: `${alertBlink} 1s infinite`
                  }}
                />
              )}
            </TargetingDisplay>
            
            {weaponsState.targeting.currentTarget && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid var(--weapon-blue)',
                marginTop: '20px'
              }}>
                <h4 style={{ color: 'var(--weapon-blue)', margin: '0 0 10px 0' }}>
                  Target Information
                </h4>
                <div style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                  <div>Classification: {weaponsState.targeting.currentTarget.classification}</div>
                  <div>Distance: {weaponsState.targeting.currentTarget.distance.toFixed(0)}m</div>
                  <div>Bearing: {weaponsState.targeting.currentTarget.bearing.toFixed(0)}°</div>
                  <div>Size: {weaponsState.targeting.currentTarget.size}</div>
                  <div style={{ color: weaponsState.targeting.currentTarget.threat === 'critical' ? 'var(--weapon-red)' : 'var(--weapon-yellow)' }}>
                    Threat Level: {weaponsState.targeting.currentTarget.threat.toUpperCase()}
                  </div>
                  <div>Hull: {weaponsState.targeting.currentTarget.hull}%</div>
                  <div>Shields: {weaponsState.targeting.currentTarget.shields}%</div>
                </div>
              </div>
            )}
          </div>
        </ModuleWrapper>
      </DraggableModule>

      {/* Draggable Shield Display Module */}
      <DraggableModule 
        position={modulePositions.shieldDisplay}
        isDragging={dragState.shieldDisplay?.isDragging || false}
      >
        <ModuleWrapper>
          <DragHandle onMouseDown={(e) => handleMouseDown(e, 'shieldDisplay')} />
          <WeaponCard>
            <h3>Shield Status</h3>
            <ShieldDisplay>
              <ShieldSection strength={weaponsState.shields.frontShield} position="front" />
              <ShieldSection strength={weaponsState.shields.rearShield} position="rear" />
              <ShieldSection strength={weaponsState.shields.leftShield} position="left" />
              <ShieldSection strength={weaponsState.shields.rightShield} position="right" />
              
              <div style={{ textAlign: 'center', color: 'var(--shield-blue)' }}>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                  {weaponsState.shields.shieldBalance.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.9em' }}>
                  Regen: {weaponsState.shields.regenerationRate}/sec
                </div>
              </div>
            </ShieldDisplay>
            
            <FireButton onClick={toggleShieldBalance} style={{ marginTop: '15px', width: '100%' }}>
              Adjust Shield Balance
            </FireButton>
          </WeaponCard>
        </ModuleWrapper>
      </DraggableModule>

      {/* Draggable System Status Module */}
      <DraggableModule 
        position={modulePositions.systemStatus}
        isDragging={dragState.systemStatus?.isDragging || false}
      >
        <ModuleWrapper>
          <DragHandle onMouseDown={(e) => handleMouseDown(e, 'systemStatus')} />
          <WeaponCard>
            <h3>System Status</h3>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Weapon Power:</span>
                <span style={{ color: 'var(--weapon-green)' }}>{weaponsState.weapons.powerLevel}%</span>
              </div>
              <ChargeBar level={weaponsState.weapons.powerLevel} maxLevel={100} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Heat Level:</span>
                <span style={{ color: weaponsState.weapons.heatLevel > 75 ? 'var(--weapon-red)' : 'var(--weapon-yellow)' }}>
                  {weaponsState.weapons.heatLevel}%
                </span>
              </div>
              <ChargeBar level={weaponsState.weapons.heatLevel} maxLevel={100} />
            </div>
            
            <div style={{ color: 'var(--weapon-blue)', textAlign: 'center', marginTop: '20px' }}>
              Combat Status: <span style={{ 
                color: weaponsState.combatStatus === 'engaged' ? 'var(--weapon-red)' : 'var(--weapon-yellow)' 
              }}>
                {weaponsState.combatStatus.toUpperCase()}
              </span>
            </div>
          </WeaponCard>
        </ModuleWrapper>
      </DraggableModule>

      {/* Fixed Fire Control Panel */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}>
        <ControlGrid>
          <FireButton 
            variant="primary"
            onClick={firePrimaryWeapons}
            disabled={weaponsState.targeting.lockStatus !== 'locked' || weaponsState.weapons.heatLevel > 90}
          >
            🔥 Fire Primary Weapons
          </FireButton>
          
          <FireButton 
            variant="secondary"
            onClick={fireSecondaryWeapons}
            disabled={weaponsState.targeting.lockStatus !== 'locked' || weaponsState.weapons.heatLevel > 90}
          >
            ⚡ Fire Secondary Weapons
          </FireButton>
          
          <FireButton 
            variant="torpedo"
            onClick={fireTorpedo}
            disabled={weaponsState.targeting.lockStatus !== 'locked' || 
                     weaponsState.weapons.torpedoes[`${weaponsState.weapons.torpedoes.selectedType}Torpedoes` as keyof TorpedoSystem] === 0}
          >
            🚀 Launch Torpedo
          </FireButton>
          
          <FireButton 
            variant="emergency"
            onClick={() => {
              setWeaponsState(prev => ({
                ...prev,
                weapons: {
                  ...prev.weapons,
                  heatLevel: 0,
                  primaryWeapons: prev.weapons.primaryWeapons.map(w => ({ ...w, cooldown: 0, status: 'ready' })),
                  secondaryWeapons: prev.weapons.secondaryWeapons.map(w => ({ ...w, cooldown: 0, status: 'ready' }))
                }
              }));
              emitAction('emergency_weapon_reset');
            }}
          >
            🛑 Emergency Reset
          </FireButton>
        </ControlGrid>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/laser.mp3" type="audio/mpeg" />
      </audio>
    </Container>
  );
};

export default WeaponsStation;