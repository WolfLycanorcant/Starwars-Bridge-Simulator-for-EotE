# 🚀 Imperial Star Destroyer Bridge Simulator

A real-time multiplayer bridge simulation game inspired by Star Wars, where players take on different crew roles aboard an Imperial Star Destroyer. Experience authentic bridge operations with immersive interfaces, real-time communication, and tactical gameplay.

![Bridge Simulator](https://img.shields.io/badge/Status-Complete-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Players](https://img.shields.io/badge/Players-1--8-orange)
![Platform](https://img.shields.io/badge/Platform-Web-lightgrey)

## 🎮 Game Overview

Command an Imperial Star Destroyer with up to 8 players, each manning critical bridge stations. Coordinate with your crew to manage ship systems, engage in combat, navigate through space, and complete missions in this immersive Star Wars experience.

### 🎯 Key Features

- **Real-time Multiplayer**: Up to 8 players can join simultaneously
- **Authentic Bridge Stations**: 6 specialized crew positions plus Game Master
- **Immersive UI**: Star Wars-themed interfaces with animations and sound effects
- **Advanced Systems**: Realistic ship management with power distribution, damage control, and tactical operations
- **Mission System**: Dynamic scenarios and objectives
- **Voice Communication**: Built-in voice chat support
- **Cross-Platform**: Runs in any modern web browser

## 🛸 Bridge Stations

### 👨‍✈️ Command Station
- **Mission Overview**: Track objectives and mission status
- **Tactical Display**: Real-time 3D space visualization
- **Crew Management**: Monitor crew status and efficiency
- **Strategic Controls**: Battle stations, general quarters, command overrides
- **Fleet Coordination**: Communicate with other Imperial vessels

### 🧭 Navigation Station (Pilot)
- **Hyperspace Navigation**: Calculate and execute hyperspace jumps
- **Sublight Maneuvering**: Precise ship movement and positioning
- **Sensor Management**: Long-range and tactical sensors
- **Proximity Alerts**: Asteroid fields, enemy contacts, spatial anomalies
- **Autopilot Systems**: Automated navigation assistance

### 🔫 Weapons Station (Gunner)
- **Turbolaser Batteries**: Multiple weapon systems with targeting
- **Missile Systems**: Proton torpedoes, concussion missiles, ion torpedoes
- **Targeting Computer**: Advanced targeting with lock-on capabilities
- **Fire Control**: Coordinated weapon strikes and salvos
- **Defensive Systems**: Point-defense against incoming threats

### ⚡ Engineering Station
- **Power Distribution**: Manage power allocation across all ship systems
- **Damage Control**: Coordinate repair operations and emergency protocols
- **System Diagnostics**: Real-time monitoring of all ship systems
- **Environmental Controls**: Life support, artificial gravity, atmosphere
- **Emergency Systems**: Hull breach protocols, emergency power, abandon ship

### 📡 Communications Station
- **Subspace Communications**: Long-range Imperial network connectivity
- **Encryption Systems**: Secure communications with encryption keys
- **Signal Analysis**: Monitor enemy communications and jamming
- **Emergency Beacons**: Distress signals and status reports
- **Multi-Channel Management**: Coordinate multiple communication channels

### 🎲 Game Master Station
- **Scenario Control**: Create and manage dynamic missions
- **Environmental Hazards**: Control space weather, anomalies, and obstacles
- **Enemy AI**: Manage hostile forces and their behaviors
- **System Failures**: Introduce realistic malfunctions and emergencies
- **Narrative Control**: Guide story progression and player interactions

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and npm
- **Docker** and Docker Compose
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/star-destroyer-bridge-sim.git
   cd star-destroyer-bridge-sim
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Start the Simulation**
   ```bash
   # Windows
   run.bat
   
   # Linux/Mac
   chmod +x run.sh && ./run.sh
   ```

4. **Access the Bridge**
   - Open your browser to `http://localhost:3000`
   - Create or join a session
   - Select your bridge station
   - Begin your mission!

### Docker Deployment

```bash
docker-compose up -d
```

## 🎯 How to Play

### Creating a Session
1. Navigate to the lobby screen
2. Enter a unique **Session ID** (e.g., "bridge-alpha-1")
3. Choose your **Bridge Station**
4. Enter your **Player Name**
5. Click **"JOIN BRIDGE"**

### Station Selection
- **Commander**: Overall mission control and tactical oversight
- **Pilot**: Navigation and ship movement
- **Gunner**: Weapons systems and combat operations
- **Engineer**: Power management and damage control
- **Communications**: Information warfare and fleet coordination
- **Game Master**: Scenario control and narrative guidance

### Gameplay Tips
- **Communicate**: Use voice chat or text messages to coordinate
- **Monitor Systems**: Keep an eye on ship status and power levels
- **Follow Orders**: Command structure matters in crisis situations
- **Stay Alert**: Space is dangerous - threats can appear suddenly
- **Work Together**: Success requires teamwork and coordination

## 🛠️ Technical Architecture

### Backend Stack
- **Node.js** with TypeScript
- **Socket.IO** for real-time communication
- **PostgreSQL** for persistent data
- **Redis** for session management
- **Docker** for containerization

### Frontend Stack
- **React** with TypeScript
- **Styled Components** for theming
- **Socket.IO Client** for real-time updates
- **Responsive Design** for multiple screen sizes

### Key Systems
- **Real-time State Management**: Synchronized game state across all clients
- **Power Distribution System**: Realistic resource management mechanics
- **Damage Control**: Dynamic system failures and repair mechanics
- **Communication Networks**: Multi-channel encrypted communications
- **Mission Framework**: Flexible scenario and objective system

## 🎨 Customization

### Adding New Stations
1. Create station component in `client/src/components/stations/`
2. Add station type to `shared/types/index.ts`
3. Update `BridgeInterface.tsx` routing
4. Implement server-side handlers in `socketHandlers.ts`

### Creating Scenarios
1. Add scenario data to `database/init.sql`
2. Implement scenario logic in `GameStateService.ts`
3. Create mission objectives and events
4. Test with Game Master controls

### Custom Themes
- Modify styled-components in station files
- Update color schemes in CSS variables
- Add new animations and effects
- Customize sound effects and audio

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://bridge_user:bridge_password@localhost:5432/bridge_simulator
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Game Settings
MAX_PLAYERS_PER_SESSION=8
SESSION_TIMEOUT_MINUTES=120
VOICE_CHAT_ENABLED=true
```

### Game Balance
- Adjust power distribution limits in `GameStateService.ts`
- Modify weapon damage and cooldowns
- Configure repair times and crew efficiency
- Set hyperspace jump calculations

## 🎵 Audio & Effects

### Sound System
- **Weapon Fire**: Turbolaser and missile launch sounds
- **Alerts**: Critical system warnings and alarms
- **Ambient**: Bridge background noise and engine hum
- **Communications**: Incoming message notifications
- **Environmental**: Hyperspace jump and explosion effects

### Visual Effects
- **Scanning Lines**: Animated radar sweeps on displays
- **Status Indicators**: Color-coded system health displays
- **Alert Animations**: Pulsing warnings for critical systems
- **Particle Effects**: Weapon fire and explosion graphics
- **HUD Elements**: Targeting reticles and navigation aids

## 🚨 Troubleshooting

### Common Issues

**Connection Problems**
- Check if backend server is running on port 5000
- Verify WebSocket connections aren't blocked by firewall
- Ensure Redis and PostgreSQL are accessible

**Performance Issues**
- Reduce visual effects in browser settings
- Close unnecessary browser tabs
- Check network latency to server

**Audio Problems**
- Click anywhere on page to enable audio (browser security)
- Check browser audio permissions
- Verify audio files are accessible

**Session Issues**
- Use unique session IDs
- Check if session has expired
- Verify maximum player limit not exceeded

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development DEBUG=bridge:* npm run server:dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Maintain responsive design principles

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Star Wars Universe**: Inspiration for the Imperial Star Destroyer setting
- **Bridge Simulator Community**: Feedback and testing support
- **Open Source Libraries**: React, Socket.IO, and all dependencies
- **Contributors**: Everyone who helped make this project possible

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-username/star-destroyer-bridge-sim/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/star-destroyer-bridge-sim/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/star-destroyer-bridge-sim/discussions)
- **Discord**: [Community Server](https://discord.gg/your-server)

---

**May the Force be with you, Commander.** 🌟

*Ready to command your Star Destroyer? The galaxy awaits your orders.*