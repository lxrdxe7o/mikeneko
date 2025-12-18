import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

interface Config {
  discord: {
    token: string;
    clientId: string;
  };
  lavalink: {
    host: string;
    port: number;
    password: string;
    secure: boolean;
  };
}

function validateEnv(): void {
  const required = [
    'DISCORD_TOKEN',
    'DISCORD_CLIENT_ID',
    'LAVALINK_HOST',
    'LAVALINK_PORT',
    'LAVALINK_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

export const config: Config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!
  },
  lavalink: {
    host: process.env.LAVALINK_HOST!,
    port: parseInt(process.env.LAVALINK_PORT!, 10),
    password: process.env.LAVALINK_PASSWORD!,
    secure: process.env.LAVALINK_SECURE === 'true'
  }
};
