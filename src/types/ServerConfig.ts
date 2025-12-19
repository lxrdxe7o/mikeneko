/**
 * Server Configuration Interface
 * Defines per-guild settings for moderation and customization
 */

export interface ServerConfig {
  guildId: string;

  // DJ Role System
  djRoleId?: string;
  requireDJRole: boolean;

  // Channel Restrictions
  allowedChannels: string[];
  blockedChannels: string[];

  // Limits
  volumeLimit: number;
  maxQueueSize: number;
  maxSongDuration: number; // in seconds

  // Cooldowns
  commandCooldown: number; // in milliseconds

  // Vote Skip
  voteSkipThreshold: number; // percentage (0-100)

  // User Restrictions
  restrictedUsers: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CONFIG: Omit<ServerConfig, 'guildId' | 'createdAt' | 'updatedAt'> = {
  requireDJRole: false,
  allowedChannels: [],
  blockedChannels: [],
  volumeLimit: 100,
  maxQueueSize: 100,
  maxSongDuration: 600, // 10 minutes
  commandCooldown: 3000, // 3 seconds
  voteSkipThreshold: 50, // 50%
  restrictedUsers: []
};

export enum PermissionLevel {
  EVERYONE = 0,
  DJ = 1,
  MODERATOR = 2,
  ADMINISTRATOR = 3,
  OWNER = 4
}
