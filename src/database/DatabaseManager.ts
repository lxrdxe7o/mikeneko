import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ServerConfig, DEFAULT_CONFIG } from '../types/ServerConfig';

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string = './data/bot.db') {
    // Create database connection
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Initialize schema
    this.initializeSchema();

    console.log('✅ Database initialized successfully');
  }

  private initializeSchema(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    this.db.exec(schema);
  }

  /**
   * Get server configuration, creating default if not exists
   */
  getServerConfig(guildId: string): ServerConfig {
    const config = this.db
      .prepare(
        `SELECT * FROM server_configs WHERE guild_id = ?`
      )
      .get(guildId) as any;

    if (!config) {
      return this.createDefaultConfig(guildId);
    }

    // Get allowed channels
    const allowedChannels = this.db
      .prepare(`SELECT channel_id FROM allowed_channels WHERE guild_id = ?`)
      .all(guildId) as Array<{ channel_id: string }>;

    // Get blocked channels
    const blockedChannels = this.db
      .prepare(`SELECT channel_id FROM blocked_channels WHERE guild_id = ?`)
      .all(guildId) as Array<{ channel_id: string }>;

    // Get restricted users
    const restrictedUsers = this.db
      .prepare(`SELECT user_id FROM restricted_users WHERE guild_id = ?`)
      .all(guildId) as Array<{ user_id: string }>;

    return {
      guildId: config.guild_id,
      djRoleId: config.dj_role_id || undefined,
      requireDJRole: Boolean(config.require_dj_role),
      allowedChannels: allowedChannels.map(c => c.channel_id),
      blockedChannels: blockedChannels.map(c => c.channel_id),
      volumeLimit: config.volume_limit,
      maxQueueSize: config.max_queue_size,
      maxSongDuration: config.max_song_duration,
      commandCooldown: config.command_cooldown,
      voteSkipThreshold: config.vote_skip_threshold,
      restrictedUsers: restrictedUsers.map(u => u.user_id),
      createdAt: new Date(config.created_at),
      updatedAt: new Date(config.updated_at)
    };
  }

  /**
   * Create default configuration for a guild
   */
  private createDefaultConfig(guildId: string): ServerConfig {
    this.db
      .prepare(
        `INSERT INTO server_configs (guild_id) VALUES (?)`
      )
      .run(guildId);

    return {
      guildId,
      ...DEFAULT_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update DJ role
   */
  setDJRole(guildId: string, roleId: string | null): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET dj_role_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(roleId, guildId);
  }

  /**
   * Set DJ role requirement
   */
  setRequireDJRole(guildId: string, required: boolean): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET require_dj_role = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(required ? 1 : 0, guildId);
  }

  /**
   * Add channel to whitelist
   */
  addAllowedChannel(guildId: string, channelId: string): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `INSERT OR IGNORE INTO allowed_channels (guild_id, channel_id)
         VALUES (?, ?)`
      )
      .run(guildId, channelId);
  }

  /**
   * Remove channel from whitelist
   */
  removeAllowedChannel(guildId: string, channelId: string): void {
    this.db
      .prepare(
        `DELETE FROM allowed_channels
         WHERE guild_id = ? AND channel_id = ?`
      )
      .run(guildId, channelId);
  }

  /**
   * Clear all allowed channels
   */
  clearAllowedChannels(guildId: string): void {
    this.db
      .prepare(`DELETE FROM allowed_channels WHERE guild_id = ?`)
      .run(guildId);
  }

  /**
   * Add channel to blacklist
   */
  addBlockedChannel(guildId: string, channelId: string): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `INSERT OR IGNORE INTO blocked_channels (guild_id, channel_id)
         VALUES (?, ?)`
      )
      .run(guildId, channelId);
  }

  /**
   * Remove channel from blacklist
   */
  removeBlockedChannel(guildId: string, channelId: string): void {
    this.db
      .prepare(
        `DELETE FROM blocked_channels
         WHERE guild_id = ? AND channel_id = ?`
      )
      .run(guildId, channelId);
  }

  /**
   * Set volume limit
   */
  setVolumeLimit(guildId: string, limit: number): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET volume_limit = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(limit, guildId);
  }

  /**
   * Set max queue size
   */
  setMaxQueueSize(guildId: string, size: number): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET max_queue_size = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(size, guildId);
  }

  /**
   * Set max song duration
   */
  setMaxSongDuration(guildId: string, duration: number): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET max_song_duration = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(duration, guildId);
  }

  /**
   * Set command cooldown
   */
  setCommandCooldown(guildId: string, cooldown: number): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET command_cooldown = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(cooldown, guildId);
  }

  /**
   * Set vote skip threshold
   */
  setVoteSkipThreshold(guildId: string, threshold: number): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `UPDATE server_configs
         SET vote_skip_threshold = ?, updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = ?`
      )
      .run(threshold, guildId);
  }

  /**
   * Add restricted user
   */
  addRestrictedUser(
    guildId: string,
    userId: string,
    restrictedBy: string,
    reason?: string
  ): void {
    this.ensureConfigExists(guildId);

    this.db
      .prepare(
        `INSERT OR REPLACE INTO restricted_users
         (guild_id, user_id, restricted_by, reason)
         VALUES (?, ?, ?, ?)`
      )
      .run(guildId, userId, restrictedBy, reason || null);
  }

  /**
   * Remove restricted user
   */
  removeRestrictedUser(guildId: string, userId: string): void {
    this.db
      .prepare(
        `DELETE FROM restricted_users
         WHERE guild_id = ? AND user_id = ?`
      )
      .run(guildId, userId);
  }

  /**
   * Get restricted user info
   */
  getRestrictedUser(
    guildId: string,
    userId: string
  ): { reason?: string; restrictedBy: string; restrictedAt: Date } | null {
    const result = this.db
      .prepare(
        `SELECT reason, restricted_by, restricted_at
         FROM restricted_users
         WHERE guild_id = ? AND user_id = ?`
      )
      .get(guildId, userId) as any;

    if (!result) return null;

    return {
      reason: result.reason || undefined,
      restrictedBy: result.restricted_by,
      restrictedAt: new Date(result.restricted_at)
    };
  }

  /**
   * Log command usage
   */
  logCommand(guildId: string, userId: string, commandName: string): void {
    this.db
      .prepare(
        `INSERT INTO command_logs (guild_id, user_id, command_name)
         VALUES (?, ?, ?)`
      )
      .run(guildId, userId, commandName);
  }

  /**
   * Reset server config to defaults
   */
  resetServerConfig(guildId: string): void {
    // Delete all related data
    this.db.prepare(`DELETE FROM allowed_channels WHERE guild_id = ?`).run(guildId);
    this.db.prepare(`DELETE FROM blocked_channels WHERE guild_id = ?`).run(guildId);
    this.db.prepare(`DELETE FROM restricted_users WHERE guild_id = ?`).run(guildId);
    this.db.prepare(`DELETE FROM server_configs WHERE guild_id = ?`).run(guildId);

    // Recreate with defaults
    this.createDefaultConfig(guildId);
  }

  /**
   * Ensure config exists for guild
   */
  private ensureConfigExists(guildId: string): void {
    const exists = this.db
      .prepare(`SELECT 1 FROM server_configs WHERE guild_id = ?`)
      .get(guildId);

    if (!exists) {
      this.createDefaultConfig(guildId);
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    console.log('🔒 Database connection closed');
  }
}
