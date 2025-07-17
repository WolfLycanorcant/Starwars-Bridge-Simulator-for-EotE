import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

/**
 * WEAPONS STATION EXAMPLE
 * 
 * This example demonstrates a comprehensive weapons control interface
 * for Star Wars Edge of the Empire campaigns
 * 
 * Features:
 * - Real-time targeting system with radar display
 * - Primary and secondary weapon controls
 * - Torpedo/missile management
 * - Shield monitoring and control
 * - Heat management system
 * - Audio feedback for weapon firing
 * - Lock-on targeting mechanics
 * 
 * Usage in Edge of the Empire campaigns:
 * - Use during space combat encounters
 * - Enhance gunnery skill checks with visual feedback
 * - Create tension during weapon overheating
 * - Coordinate with pilot and engineering stations
 */

// Types for weapons station state
interface WeaponsState {
  targeting: {
    currentTarget: Target | null;
    availableTargets: Target[];
    lockStatus: 'none' | 'acquiring' | 'locked' | 'lost';
    lockStrength: number;
    scanRange: number;
  };
  weapons: {
    primaryWeapons: WeaponSystem[];
    secondaryWeapons: WeaponSystem[];
    torpedoes: TorpedoSystem;
    powerLevel: number;
    heatLevel: number;
    firingMode: 'manual' | 'auto' | 'burst';
  };
  shields: {
    frontShield: number;
    rearShield: number;
    leftShield: number;
    rightShield: number;
    shieldBalance: 'balanced' | 'forward' | 'aft' | 'port' | 'starboard';
  };
  combatStatus: 'standby' | 'yellow' | 'red' | 'engaged';
}

interface Target {
  id: string;
  type: 'ship' | 'station' | 'asteroid';
  classification: string;
  distance: number;
  bearing: number;
  threat: 'none' | 'low' | 'medium' | 'high' | 'critical';
  shields: number;
  hull: number;
  size: 'small' | 'medium' | 'large' | 'capital';
}

interface WeaponSystem {
  id: string;
  name: string;
  type: 'laser' | 'ion' | 'plasma';
  damage: number;
  range: number;
  accuracy: number;
  chargeLevel: number;
  cooldown: number;
  status: 'ready' | 'charging' | 'cooling' | 'damaged';
}

interface TorpedoSystem {
  protonTorpedoes: number;
  concussionMissiles: number;
  ionTorpedoes: number;
  maxProton: number;
  maxConcussion: number;
  maxIon: number;
  selectedType: 'proton' | 'concussion' | 'ion';
}

// Animation keyframes
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

const lockPulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
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

const TargetBlip = styled.div<{ x: number; y: number; threat: string; selected?: boolean }>`
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
  cursor: pointer;
  
  ${props => props.selected && css`
    animation: ${lockPulse} 1s infinite;
    border: 2px solid var(--weapon-red);
    width: 12px;
    height: 12px;
  `}
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.5);
  }
`;

const WeaponStatus = styled.div<{ status: string }>`
  font-size: 1.5em;
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
  width: 250px;
  height: 180px;
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
    animation: ${alertBlink} 1s infinite;
    border-color: var(--weapon-red);
  `}
  
  ${props => props.position === 'front' && css`
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 15px;
    border-radius: 8px 8px 0 0;
  `}
  
  ${props => props.position === 'rear' && css`
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 15px;
    border-radius: 0 0 8px 8px;
  `}
  
  ${props => props.position === 'left' && css`
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 15px;
    height: 60px;
    border-radius: 8px 0 0 8px;
  `}
  
  ${props => props.position === 'right' && css`
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 15px;
    height: 60px;
    border-radius: 0 8px 8px 0;
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
  padding: 18px 25px;
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
    
    &:hover {
      background: ${props => 
        props.variant === 'torpedo' ? 'var(--weapon-orange)' :
        props.variant === 'secondary' ? 'var(--weapon-yellow)' :
        props.variant === 'emergency' ? 'var(--weapon-red)' :
        'var(--weapon-green)'
      };
      color: #000;
      box-shadow: none;
    }
  }
`;

const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 30px 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
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

const TorpedoSelector = styled.select`
  background: var(--bg-dark);
  color: var(--weapon-orange);
  border: 2px solid var(--weapon-orange);
  padding: 8px;
  border-radius: 4px;
  font-family: inherit;
  width: 100%;
  margin-top: 10px;
  
  option {
    background: var(--bg-dark);
    color: var(--weapon-orange);
  }
`;

// Unique Weapons Database (sample from vehicle files)
const SAMPLE_UNIQUE_WEAPONS = [
  { key: 'LASERMED', name: 'Medium Laser Cannon', type: 'Energy Weapon', damage: 6, critical: 3, range: 'Close', qualities: ['LINKED 3'], price: 2000, rarity: 4 },
  { key: 'TURBOLT', name: 'Light Turbolaser', type: 'Energy Weapon', damage: 9, critical: 3, range: 'Long', qualities: ['BREACH 2', 'SLOW FIRING 1'], price: 15000, rarity: 7, restricted: true },
  { key: 'IONMED', name: 'Medium Ion Cannon', type: 'Energy Weapon', damage: 6, critical: 4, range: 'Long', qualities: ['ION'], price: 3500, rarity: 5 },
  { key: 'CML', name: 'Concussion Missile Launcher', type: 'Vehicle', damage: 6, critical: 3, range: 'Short', qualities: ['BLAST 4', 'BREACH 4', 'GUIDED 3', 'LIMITEDAMMO 12'], price: 6000, rarity: 5 },
  { key: 'PTL', name: 'Proton Torpedo Launcher', type: 'Vehicle', damage: 8, critical: 2, range: 'Short', qualities: ['BLAST 6', 'BREACH 6', 'GUIDED 2', 'LIMITEDAMMO 6', 'LINKED 1'], price: 8000, rarity: 6, restricted: true },
  { key: 'BLASTCANHVY', name: 'Heavy Blaster Cannon', type: 'Energy Weapon', damage: 8, critical: 3, range: 'Long', qualities: ['PIERCE 1'], price: 4500, rarity: 6 },
  { key: 'LASERQUAD', name: 'Quad Laser Cannon', type: 'Energy Weapon', damage: 5, critical: 3, range: 'Close', qualities: ['ACCURATE 1', 'LINKED 3'], price: 3000, rarity: 5 },
  { key: 'ANTIAIR', name: 'Anti-Air Rockets', type: 'Vehicle', damage: 4, critical: 3, range: 'Long', qualities: ['BLAST 2', 'GUIDED 2', 'LIMITEDAMMO 8'], price: 2500, rarity: 4 }
];

// Dropdown styled components
const WeaponDropdownContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const DropdownPanel = styled.div`
  background: var(--panel-bg);
  padding: 15px;
  border: 2px solid var(--weapon-blue);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  min-width: 300px;
`;

const DropdownLabel = styled.label`
  color: var(--weapon-blue);
  font-weight: bold;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  display: block;
`;

const WeaponSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-dark);
  border: 2px solid var(--weapon-blue);
  border-radius: 4px;
  color: var(--weapon-yellow);
  font-family: 'Orbitron', monospace;
  font-size: 0.9em;
  
  &:focus {
    outline: none;
    border-color: var(--weapon-red);
    box-shadow: 0 0 10px rgba(255, 0, 64, 0.3);
  }
  
  option {
    background: var(--bg-dark);
    color: var(--weapon-yellow);
    padding: 8px;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 10px;
  background: var(--weapon-green);
  border: 2px solid var(--weapon-blue);
  border-radius: 4px;
  color: #000;
  font-family: 'Orbitron', sans-serif;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--weapon-blue);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const RemoveButton = styled(AddButton)`
  background: var(--weapon-red);
  
  &:hover {
    background: var(--weapon-orange);
    box-shadow: 0 4px 12px rgba(255, 136, 0, 0.4);
  }
`;

// Main Component
const WeaponsStationExample: React.FC = () => {
  // Dropdown panel state for collapsible functionality
  const [dropdownPositions, setDropdownPositions] = useState({
    addWeaponPanel: { x: 20, y: 20, zIndex: 1000 },
    removeWeaponPanel: { x: 20, y: 200, zIndex: 1000 }
  });
  const [dropdownCollapsed, setDropdownCollapsed] = useState({
    addWeaponPanel: false,
    removeWeaponPanel: false
  });
  const [selectedWeaponToAdd, setSelectedWeaponToAdd] = useState('');
  const [dynamicWeaponModules, setDynamicWeaponModules] = useState([]);

  // Dropdown functions
  const toggleDropdownCollapse = (panelId: string) => {
    setDropdownCollapsed(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  const handleDropdownMouseDown = (e: React.MouseEvent, panelId: string) => {
    if (dropdownCollapsed[panelId]) return; // Don't drag when collapsed
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    // Simple drag implementation for example
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      
      const boundedX = Math.max(0, Math.min(window.innerWidth - 300, newX));
      const boundedY = Math.max(0, Math.min(window.innerHeight - 200, newY));
      
      setDropdownPositions(prev => ({
        ...prev,
        [panelId]: { ...prev[panelId], x: boundedX, y: boundedY }
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const [weaponsState, setWeaponsState] = useState<WeaponsState>({
    targeting: {
      currentTarget: null,
      availableTargets: [
        {
          id: 'target1',
          type: 'ship',
          classification: 'Imperial Cruiser',
          distance: 2500,
          bearing: 45,
          threat: 'high',
          shields: 85,
          hull: 92,
          size: 'large'
        },
        {
          id: 'target2',
          type: 'ship',
          classification: 'TIE Fighter',
          distance: 800,
          bearing: 120,
          threat: 'medium',
          shields: 0,
          hull: 100,
          size: 'small'
        },
        {
          id: 'target3',
          type: 'station',
          classification: 'Asteroid Base',
          distance: 5000,
          bearing: 270,
          threat: 'critical',
          shields: 100,
          hull: 100,
          size: 'capital'
        }
      ],
      lockStatus: 'none',
      lockStrength: 0,
      scanRange: 5000
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
        selectedType: 'proton'
      },
      powerLevel: 100,
      heatLevel: 0,
      firingMode: 'manual'
    },
    shields: {
      frontShield: 100,
      rearShield: 100,
      leftShield: 100,
      rightShield: 100,
      shieldBalance: 'balanced'
    },
    combatStatus: 'standby'
  });

  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        
        newState.weapons.secondaryWeapons = prev.weapons.secondaryWeapons.map(weapon => ({
          ...weapon,
          cooldown: Math.max(0, weapon.cooldown - 1),
          status: weapon.cooldown > 0 ? 'cooling' : 'ready'
        }));
        
        // Heat dissipation
        newState.weapons.heatLevel = Math.max(0, prev.weapons.heatLevel - 2);
        
        // Shield regeneration (slow)
        newState.shields.frontShield = Math.min(100, prev.shields.frontShield + 0.5);
        newState.shields.rearShield = Math.min(100, prev.shields.rearShield + 0.5);
        newState.shields.leftShield = Math.min(100, prev.shields.leftShield + 0.5);
        newState.shields.rightShield = Math.min(100, prev.shields.rightShield + 0.5);
        
        // Simulate target movement
        newState.targeting.availableTargets = prev.targeting.availableTargets.map(target => ({
          ...target,
          bearing: (target.bearing + (Math.random() - 0.5) * 5) % 360,
          distance: Math.max(500, target.distance + (Math.random() - 0.5) * 100)
        }));
        
        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const enableAudio = () => {
    if (!audioEnabled) {
      setAudioEnabled(true);
      console.log('Weapons: Audio enabled');
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
      
      if (audioRef.current) {
        audioRef.current.volume = 0.7;
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      // Simulate damage to target
      setTimeout(() => {
        setWeaponsState(prev => ({
          ...prev,
          targeting: {
            ...prev.targeting,
            currentTarget: prev.targeting.currentTarget ? {
              ...prev.targeting.currentTarget,
              shields: Math.max(0, prev.targeting.currentTarget.shields - 15),
              hull: prev.targeting.currentTarget.shields > 15 ? prev.targeting.currentTarget.hull : 
                    Math.max(0, prev.targeting.currentTarget.hull - 10)
            } : null
          }
        }));
      }, 500);
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
            status: 'cooling'
          })),
          heatLevel: Math.min(100, prev.weapons.heatLevel + 25)
        }
      }));
      
      // Ion weapons disable shields
      setTimeout(() => {
        setWeaponsState(prev => ({
          ...prev,
          targeting: {
            ...prev.targeting,
            currentTarget: prev.targeting.currentTarget ? {
              ...prev.targeting.currentTarget,
              shields: Math.max(0, prev.targeting.currentTarget.shields - 30)
            } : null
          }
        }));
      }, 500);
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
      
      // Torpedoes do massive damage
      setTimeout(() => {
        setWeaponsState(prev => ({
          ...prev,
          targeting: {
            ...prev.targeting,
            currentTarget: prev.targeting.currentTarget ? {
              ...prev.targeting.currentTarget,
              shields: Math.max(0, prev.targeting.currentTarget.shields - 40),
              hull: prev.targeting.currentTarget.shields > 40 ? prev.targeting.currentTarget.hull : 
                    Math.max(0, prev.targeting.currentTarget.hull - 35)
            } : null
          }
        }));
      }, 1000);
    }
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
  };

  const emergencyReset = () => {
    setWeaponsState(prev => ({
      ...prev,
      weapons: {
        ...prev.weapons,
        heatLevel: 0,
        primaryWeapons: prev.weapons.primaryWeapons.map(w => ({ ...w, cooldown: 0, status: 'ready' })),
        secondaryWeapons: prev.weapons.secondaryWeapons.map(w => ({ ...w, cooldown: 0, status: 'ready' }))
      }
    }));
  };

  return (
    <Container onClick={enableAudio}>
      <StationHeader>WEAPONS CONTROL</StationHeader>
      
      <MainGrid>
        {/* Left Panel - Weapons Status */}
        <LeftPanel>
          <WeaponCard>
            <h3>Primary Weapons</h3>
            {weaponsState.weapons.primaryWeapons.map(weapon => (
              <div key={weapon.id} style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--weapon-green)', fontWeight: 'bold', fontSize: '0.9em' }}>
                  {weapon.name}
                </div>
                <WeaponStatus status={weapon.status}>
                  {weapon.status.toUpperCase()}
                </WeaponStatus>
                <ChargeBar level={weapon.chargeLevel} maxLevel={100} />
                <div style={{ fontSize: '0.8em', color: '#ccc' }}>
                  DMG: {weapon.damage} | RNG: {weapon.range}m | ACC: {weapon.accuracy}%
                </div>
              </div>
            ))}
          </WeaponCard>
          
          <WeaponCard>
            <h3>Secondary Weapons</h3>
            {weaponsState.weapons.secondaryWeapons.map(weapon => (
              <div key={weapon.id} style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--weapon-yellow)', fontWeight: 'bold', fontSize: '0.9em' }}>
                  {weapon.name}
                </div>
                <WeaponStatus status={weapon.status}>
                  {weapon.status.toUpperCase()}
                </WeaponStatus>
                <ChargeBar level={weapon.chargeLevel} maxLevel={100} />
                <div style={{ fontSize: '0.8em', color: '#ccc' }}>
                  Ion Damage - Disables Shields
                </div>
              </div>
            ))}
          </WeaponCard>
          
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
            
            <TorpedoSelector
              value={weaponsState.weapons.torpedoes.selectedType}
              onChange={(e) => setWeaponsState(prev => ({
                ...prev,
                weapons: {
                  ...prev.weapons,
                  torpedoes: {
                    ...prev.weapons.torpedoes,
                    selectedType: e.target.value as 'proton' | 'concussion' | 'ion'
                  }
                }
              }))}
            >
              <option value="proton">Proton Torpedo</option>
              <option value="concussion">Concussion Missile</option>
              <option value="ion">Ion Torpedo</option>
            </TorpedoSelector>
          </TorpedoPanel>
        </LeftPanel>

        {/* Center Panel - Targeting Display */}
        <CenterPanel>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--weapon-blue)', margin: '0 0 10px 0' }}>
              TARGETING SYSTEM
            </h3>
            <div style={{ color: 'var(--weapon-yellow)', fontSize: '1.1em' }}>
              {weaponsState.targeting.currentTarget ? 
                `Target: ${weaponsState.targeting.currentTarget.classification}` : 
                'No Target Selected'
              }
            </div>
            <div style={{ 
              color: weaponsState.targeting.lockStatus === 'locked' ? 'var(--weapon-green)' : 
                     weaponsState.targeting.lockStatus === 'acquiring' ? 'var(--weapon-yellow)' : 
                     'var(--weapon-orange)',
              fontSize: '1.1em',
              fontWeight: 'bold'
            }}>
              Lock Status: {weaponsState.targeting.lockStatus.toUpperCase()}
            </div>
          </div>
          
          <TargetingDisplay>
            <RadarSweep scanning={true} />
            
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
            
            {/* Center crosshairs */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '20px',
              height: '2px',
              background: 'var(--weapon-blue)',
              transform: 'translate(-50%, -50%)'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '2px',
              height: '20px',
              background: 'var(--weapon-blue)',
              transform: 'translate(-50%, -50%)'
            }} />
            
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
                  selected={weaponsState.targeting.currentTarget?.id === target.id}
                  onClick={() => acquireTarget(target)}
                />
              );
            })}
          </TargetingDisplay>
          
          {weaponsState.targeting.currentTarget && (
            <div style={{
              background: 'var(--panel-bg)',
              padding: '15px',
              borderRadius: '8px',
              border: '2px solid var(--weapon-blue)',
              marginTop: '20px',
              minWidth: '300px'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span>Hull: <span style={{ color: weaponsState.targeting.currentTarget.hull < 50 ? 'var(--weapon-red)' : 'var(--weapon-green)' }}>
                    {weaponsState.targeting.currentTarget.hull}%
                  </span></span>
                  <span>Shields: <span style={{ color: weaponsState.targeting.currentTarget.shields < 50 ? 'var(--weapon-orange)' : 'var(--weapon-blue)' }}>
                    {weaponsState.targeting.currentTarget.shields}%
                  </span></span>
                </div>
              </div>
            </div>
          )}
        </CenterPanel>

        {/* Right Panel - Shields & System Status */}
        <RightPanel>
          <WeaponCard>
            <h3>Shield Status</h3>
            <ShieldDisplay>
              <ShieldSection strength={weaponsState.shields.frontShield} position="front" />
              <ShieldSection strength={weaponsState.shields.rearShield} position="rear" />
              <ShieldSection strength={weaponsState.shields.leftShield} position="left" />
              <ShieldSection strength={weaponsState.shields.rightShield} position="right" />
              
              <div style={{ textAlign: 'center', color: 'var(--shield-blue)' }}>
                <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                  {weaponsState.shields.shieldBalance.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.8em' }}>
                  Shield Configuration
                </div>
              </div>
            </ShieldDisplay>
            
            <FireButton onClick={toggleShieldBalance} style={{ marginTop: '15px', width: '100%', fontSize: '0.9em' }}>
              Adjust Shield Balance
            </FireButton>
          </WeaponCard>
          
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
            
            <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#ccc' }}>
              Firing Mode: {weaponsState.weapons.firingMode.toUpperCase()}
            </div>
          </WeaponCard>
        </RightPanel>
      </MainGrid>

      {/* Fire Control */}
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
          ⚡ Fire Ion Cannons
        </FireButton>
        
        <FireButton 
          variant="torpedo"
          onClick={fireTorpedo}
          disabled={weaponsState.targeting.lockStatus !== 'locked' || 
                   weaponsState.weapons.torpedoes[`${weaponsState.weapons.torpedoes.selectedType}Torpedoes` as keyof TorpedoSystem] === 0}
        >
          🚀 Launch {weaponsState.weapons.torpedoes.selectedType.toUpperCase()}
        </FireButton>
        
        <FireButton 
          variant="emergency"
          onClick={emergencyReset}
        >
          🛑 Emergency Reset
        </FireButton>
      </ControlGrid>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/laser.mp3" type="audio/mpeg" />
      </audio>
    </Container>
  );
};

export default WeaponsStationExample;