# 🚀 Star Wars Bridge Simulator for Edge of the Empire

A real-time multiplayer bridge simulation game designed for Star Wars: Edge of the Empire RPG campaigns. Players take on different crew roles aboard starships, managing systems, coordinating operations, and experiencing immersive space adventures with their RPG group.

![Bridge Simulator](https://img.shields.io/badge/Status-Active%20Development-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Players](https://img.shields.io/badge/Players-1--8-orange)
![Platform](https://img.shields.io/badge/Platform-Web-lightgrey)

## 🎮 Game Overview

Enhance your Star Wars: Edge of the Empire RPG sessions with an interactive bridge simulator. Players can take control of various starship stations, manage ship systems in real-time, and experience immersive space adventures that complement your tabletop campaigns.

### 🎯 Key Features

- **RPG Integration**: Designed specifically for Edge of the Empire campaigns
- **Real-time Multiplayer**: Multiple players can operate different ship stations
- **Comprehensive Vehicle Database**: 400+ vehicles from the Star Wars universe
- **Interactive Stations**: Engineering, Communications, and more bridge positions
- **Power Distribution**: Realistic ship system management
- **Helper Tools**: Extensive utilities for GMs and players
- **Web-Based**: Runs in any modern web browser
- **Example Components**: Ready-to-use station interfaces

## 🛸 Available Stations

### ⚡ Engineering Station
- **Power Distribution**: Manage power allocation across all ship systems
- **System Diagnostics**: Real-time monitoring of ship health and performance
- **Damage Control**: Coordinate repair operations and emergency protocols
- **Resource Management**: Monitor fuel, ammunition, and consumables
- **Emergency Systems**: Hull breach protocols, emergency power, life support

### 📡 Communications Station
- **Long-Range Communications**: Contact other ships and stations
- **Signal Analysis**: Monitor and decrypt enemy transmissions
- **Sensor Coordination**: Manage sensor arrays and data sharing
- **Emergency Beacons**: Distress signals and status reports
- **Information Warfare**: Electronic countermeasures and jamming

### 🎲 Game Master Station
- **Campaign Integration**: Tools designed for Edge of the Empire GMs
- **Vehicle Management**: Access to comprehensive vehicle database
- **Scenario Control**: Create dynamic space encounters
- **System Events**: Introduce malfunctions, hazards, and complications
- **Narrative Tools**: Guide story progression and player interactions

## 🚀 Vehicle Database

This simulator includes an extensive database of **400+ vehicles** from the Star Wars universe, specifically formatted for Edge of the Empire campaigns:

### Vehicle Categories
- **Starfighters**: X-Wings, TIE Fighters, A-Wings, and more
- **Freighters**: YT-1300s, Ghtroc 720s, and various cargo ships
- **Capital Ships**: Star Destroyers, Mon Calamari Cruisers, Corvettes
- **Speeders**: Landspeeders, Airspeeders, and Speeder Bikes
- **Walkers**: AT-ATs, AT-STs, and specialized Imperial walkers
- **Unique Vessels**: Famous ships like the Ghost, Millennium Falcon variants

### Vehicle Data Includes
- Complete stat blocks for Edge of the Empire
- Weapon systems and defensive capabilities
- Crew requirements and passenger capacity
- Hyperdrive ratings and sublight speeds
- Customization options and modifications

## 🛠️ Helper Tools

### Power Distribution System
- Interactive power management interface
- Real-time system monitoring
- Emergency power protocols
- Visual power flow diagrams

### Instrument Panels
- Customizable ship interfaces
- Sensor displays and readouts
- Navigation computers
- Weapon targeting systems

### Vehicle Actions
- Pre-configured maneuvers and actions
- Combat options and special abilities
- Environmental hazard responses
- Emergency procedures

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and npm
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)
- **Git** for cloning the repository

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/WolfLycanorcant/Starwars-Bridge-Simulator-for-EotE.git
   cd Starwars-Bridge-Simulator-for-EotE
   ```

2. **Install Server Dependencies**
   ```bash
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the Application**
   ```bash
   # Windows - Use the provided batch file
   run.bat
   
   # Or manually start both server and client:
   # Terminal 1 - Start the server
   npm run server:dev
   
   # Terminal 2 - Start the client
   cd client
   npm start
   ```

5. **Access the Application**
   - **Client**: Open your browser to `http://localhost:3000`
   - **Server**: Backend runs on `http://localhost:5000`
   - Select your station and begin your adventure!

### Alternative: Development Mode
```bash
# Start both server and client simultaneously
npm run dev
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
- **Express.js** web framework
- **Socket.IO** for real-time communication
- **PostgreSQL** for data persistence (optional)
- **RESTful API** design

### Frontend Stack
- **React** 19+ with TypeScript
- **Styled Components** for component styling
- **Socket.IO Client** for real-time updates
- **Responsive Design** for multiple screen sizes
- **Modern React Hooks** and functional components

### Project Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── stations/   # Station-specific components
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── App.tsx         # Main application component
│   └── package.json        # Client dependencies
├── src/                    # Backend server code
│   ├── server/             # Server implementation
│   └── shared/             # Shared types and utilities
├── database/               # Database initialization scripts
├── helpers/                # Utility tools and resources
│   ├── Vehicles/           # 400+ vehicle XML files
│   ├── Vehicle Actions/    # Action definitions
│   └── Power_Distribution_Only/  # Power system tools
├── examples/               # Example station implementations
└── package.json            # Server dependencies
```

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

- **Issues**: [GitHub Issues](https://github.com/WolfLycanorcant/Starwars-Bridge-Simulator-for-EotE/issues)
- **Discussions**: [GitHub Discussions](https://github.com/WolfLycanorcant/Starwars-Bridge-Simulator-for-EotE/discussions)
- **Repository**: [Main Repository](https://github.com/WolfLycanorcant/Starwars-Bridge-Simulator-for-EotE)

## 🎲 Edge of the Empire Integration

This simulator is specifically designed to enhance your **Star Wars: Edge of the Empire** RPG sessions:

### For Game Masters
- Use the comprehensive vehicle database during space encounters
- Create dynamic ship-to-ship combat scenarios
- Manage multiple player ships with realistic system management
- Add immersive elements to hyperspace travel and exploration

### For Players
- Experience your character's piloting and technical skills in real-time
- Coordinate with your crew during intense space battles
- Make meaningful decisions about power allocation and system management
- Feel the tension of managing a damaged ship in hostile space

### Campaign Enhancement
- **Space Combat**: Turn abstract dice rolls into interactive experiences
- **Ship Management**: Give Engineering and Piloting skills real meaning
- **Team Coordination**: Encourage roleplay through station-based cooperation
- **Narrative Immersion**: Create memorable moments through system failures and heroic repairs

---

**May the Force be with you, and may your hyperdrive never fail when you need it most.** 🌟

*Ready to take your Edge of the Empire campaign to the stars?*