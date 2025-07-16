import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { initializeDatabase, closeDatabaseConnections } from './config/database';
import { SocketHandlers } from './socket/socketHandlers';

async function startServer() {
  try {
    // Initialize database connections
    await initializeDatabase();

    // Create Express app
    const app = express();
    const server = createServer(app);

    // Configure middleware
    app.use(helmet());
    app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files for test client
    app.use('/test', express.static('public'));
    
    // Serve static files
    app.use(express.static('public'));

    // Basic health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
      });
    });

    // API routes placeholder
    app.get('/api/sessions', (req, res) => {
      res.json({ message: 'Sessions API endpoint - coming soon' });
    });

    // Socket.IO setup
    const io = new Server(server, {
      cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize socket handlers
    const socketHandlers = new SocketHandlers(io);

    // Handle socket connections
    io.on('connection', (socket) => {
      socketHandlers.handleConnection(socket);
    });

    // Start server
    server.listen(config.server.port, () => {
      console.log(`🚀 Star Destroyer Bridge Simulator Server`);
      console.log(`📡 Server running on port ${config.server.port}`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
      console.log(`⚡ WebSocket ready for connections`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close server
        server.close(() => {
          console.log('📡 HTTP server closed');
        });

        // Close Socket.IO
        io.close(() => {
          console.log('⚡ Socket.IO server closed');
        });

        // Close database connections
        await closeDatabaseConnections();

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();