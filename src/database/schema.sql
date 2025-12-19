-- Server Configurations
CREATE TABLE IF NOT EXISTS server_configs (
  guild_id TEXT PRIMARY KEY,
  dj_role_id TEXT,
  volume_limit INTEGER DEFAULT 100,
  max_queue_size INTEGER DEFAULT 100,
  max_song_duration INTEGER DEFAULT 600,
  command_cooldown INTEGER DEFAULT 3000,
  vote_skip_threshold INTEGER DEFAULT 50,
  require_dj_role BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Allowed Channels (Whitelist)
CREATE TABLE IF NOT EXISTS allowed_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id) ON DELETE CASCADE,
  UNIQUE(guild_id, channel_id)
);

-- Blocked Channels (Blacklist)
CREATE TABLE IF NOT EXISTS blocked_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id) ON DELETE CASCADE,
  UNIQUE(guild_id, channel_id)
);

-- Restricted Users
CREATE TABLE IF NOT EXISTS restricted_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT,
  restricted_by TEXT NOT NULL,
  restricted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id) ON DELETE CASCADE,
  UNIQUE(guild_id, user_id)
);

-- Command Usage Logs (Optional, for analytics)
CREATE TABLE IF NOT EXISTS command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  command_name TEXT NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowed_channels_guild ON allowed_channels(guild_id);
CREATE INDEX IF NOT EXISTS idx_blocked_channels_guild ON blocked_channels(guild_id);
CREATE INDEX IF NOT EXISTS idx_restricted_users_guild ON restricted_users(guild_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_guild ON command_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_executed_at ON command_logs(executed_at);
