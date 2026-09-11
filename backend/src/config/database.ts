import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { env } from './env';

let mongodInstance: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    let uri = env.MONGODB_URI;

    if (!uri) {
      console.log('No MONGODB_URI provided in environment. Starting persistent embedded MongoDB...');
      const dbPath = path.join(process.cwd(), '.mongodb_data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      uri = mongodInstance.getUri();
      console.log(`Persistent embedded MongoDB running at: ${uri}`);
    }

    await mongoose.connect(uri, {
      autoIndex: true
    });

    console.log(`Connected to MongoDB successfully (${mongoose.connection.host || 'embedded'})`);
  } catch (error) {
    console.error('Initial MongoDB connection failed:', error);

    // Fallback attempt with MongoMemoryServer if external URI failed
    if (!mongodInstance) {
      try {
        console.log('Attempting fallback to embedded MongoMemoryServer...');
        mongodInstance = await MongoMemoryServer.create();
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`Connected to fallback embedded MongoDB at ${fallbackUri}`);
        return;
      } catch (fallbackError) {
        console.error('Fallback MongoMemoryServer failed:', fallbackError);
      }
    }

    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
