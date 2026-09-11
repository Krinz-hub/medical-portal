import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { seedInitialDataIfEmpty } from './seed/seedData';

const startServer = async () => {
  try {
    await connectDatabase();

    // Auto-seed realistic demo data on first start if database has no users
    await seedInitialDataIfEmpty();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(` Doctor Visibility Backend running on port ${env.PORT} `);
      console.log(` Health check: http://localhost:${env.PORT}/api/health `);
      console.log(` Environment: ${env.NODE_ENV} `);
      console.log(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('Server closed successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
