# Server Moderation Features - Implementation Plan

## 🎯 Overview

This document outlines the plan for adding comprehensive server moderation features to the Discord Lavalink Music Bot. These features will allow server administrators to control bot usage, prevent abuse, and customize behavior per server.

---

## 🏗️ Architecture Design

### 1. Permission System

**Objective**: Implement a flexible permission system for controlling command access.

#### Components:
- **Permission Levels**:
  - `EVERYONE` - All server members
  - `DJ` - Users with DJ role or voice channel permissions
  - `MODERATOR` - Users with server moderation permissions
  - `ADMINISTRATOR` - Users with administrator permissions
  - `OWNER` - Server owner only

- **Configuration Storage**:
  ```typescript
  interface ServerConfig {
    guildId: string;
    djRoleId?: string;
    allowedChannels?: string[];
    blockedChannels?: string[];
    volumeLimit: number;
    maxQueueSize: number;
    maxSongDuration: number; // in seconds
    commandCooldown: number; // in milliseconds
    voteSkipThreshold: number; // percentage (0-100)
    restrictedUsers: string[]; // user IDs
    requireDJRole: boolean;
  }
  ```

- **Database Options**:
  - JSON file storage (simple, for small bots)
  - SQLite (recommended for production)
  - PostgreSQL/MySQL (for large-scale deployments)

#### Implementation Files:
```
src/
├── config/
│   └── permissions.ts      # Permission level definitions
├── database/
│   ├── DatabaseManager.ts  # Database abstraction layer
│   └── models/
│       └── ServerConfig.ts # Server configuration model
└── middleware/
    └── permissions.ts      # Permission checking middleware
```

---

## 🎵 Feature Specifications

### 2. DJ Role System

**Description**: Restrict certain music commands to users with a designated DJ role or specific permissions.

**Commands Requiring DJ Permission**:
- `/skip` (unless vote skip passes)
- `/stop`
- `/volume`
- `/seek`
- `/loop`
- `/shuffle`
- `/clear` (clear queue)

**Bypass Conditions**:
- User is alone with bot in voice channel
- User has "Manage Channels" or "Move Members" permissions
- User is server administrator
- DJ role requirement is disabled

**Implementation**:
```typescript
// src/middleware/permissions.ts
export async function checkDJPermission(
  interaction: ChatInputCommandInteraction,
  config: ServerConfig
): Promise<boolean> {
  const member = interaction.member as GuildMember;

  // Server owner always has permission
  if (member.id === interaction.guild?.ownerId) return true;

  // Administrator bypass
  if (member.permissions.has('Administrator')) return true;

  // Check if alone in voice channel
  const voiceChannel = member.voice.channel;
  if (voiceChannel && voiceChannel.members.size === 2) return true;

  // Check DJ role
  if (config.djRoleId && member.roles.cache.has(config.djRoleId)) {
    return true;
  }

  // Check voice channel permissions
  if (member.permissions.has(['ManageChannels', 'MoveMembers'])) {
    return true;
  }

  return false;
}
```

---

### 3. Vote Skip System

**Description**: Allow non-DJ users to vote for skipping the current track.

**Features**:
- Configurable vote threshold (default 50%)
- Vote tracking per track
- Reset votes when track changes
- Visual feedback showing vote count

**Commands**:
- `/voteskip` - Vote to skip current track
- `/forceskip` - DJ/Admin only, skip immediately

**Implementation**:
```typescript
// src/utils/VoteManager.ts
export class VoteManager {
  private votes: Map<string, Set<string>> = new Map();

  addVote(guildId: string, userId: string): boolean {
    if (!this.votes.has(guildId)) {
      this.votes.set(guildId, new Set());
    }

    const guildVotes = this.votes.get(guildId)!;
    if (guildVotes.has(userId)) return false;

    guildVotes.add(userId);
    return true;
  }

  checkThreshold(
    guildId: string,
    voiceChannelSize: number,
    threshold: number
  ): boolean {
    const votes = this.votes.get(guildId)?.size || 0;
    const required = Math.ceil((voiceChannelSize - 1) * (threshold / 100));
    return votes >= required;
  }

  clearVotes(guildId: string): void {
    this.votes.delete(guildId);
  }
}
```

---

### 4. Admin Commands

**Description**: Powerful commands for server administrators to manage the music player.

**New Commands**:

| Command | Permission | Description |
|---------|------------|-------------|
| `/forceskip` | DJ/Moderator | Skip without voting |
| `/forcestop` | DJ/Moderator | Stop and clear queue |
| `/clearqueue` | DJ/Moderator | Remove all songs from queue |
| `/remove <position>` | DJ/Moderator | Remove specific song from queue |
| `/move <from> <to>` | DJ/Moderator | Reorder queue |
| `/shuffle` | DJ/Moderator | Shuffle the queue |
| `/lock` | Administrator | Lock music commands to current voice channel |
| `/unlock` | Administrator | Unlock music commands |

---

### 5. Channel Restrictions

**Description**: Limit bot usage to specific channels.

**Features**:
- Whitelist mode: Bot only works in allowed channels
- Blacklist mode: Bot works everywhere except blocked channels
- Per-server configuration

**Commands**:
- `/settings channels add <channel>` - Add channel to whitelist
- `/settings channels remove <channel>` - Remove from whitelist
- `/settings channels clear` - Clear all restrictions
- `/settings channels mode <whitelist|blacklist>` - Set mode

**Implementation**:
```typescript
// Middleware check
export async function checkChannelPermission(
  interaction: ChatInputCommandInteraction,
  config: ServerConfig
): Promise<boolean> {
  const channelId = interaction.channelId;

  // Check whitelist
  if (config.allowedChannels && config.allowedChannels.length > 0) {
    return config.allowedChannels.includes(channelId);
  }

  // Check blacklist
  if (config.blockedChannels && config.blockedChannels.includes(channelId)) {
    return false;
  }

  return true;
}
```

---

### 6. Volume & Duration Limits

**Description**: Prevent abuse by limiting volume and song duration.

**Configuration**:
```typescript
interface Limits {
  maxVolume: number;        // 1-200 (default: 100)
  maxSongDuration: number;  // seconds (default: 600 = 10 min)
  maxQueueSize: number;     // songs (default: 100)
}
```

**Enforcement**:
- Volume command rejects values above limit
- Play command rejects songs exceeding duration limit
- Queue automatically prevents adding beyond max size

**Commands**:
- `/settings limits volume <max>` - Set max volume
- `/settings limits duration <seconds>` - Set max song duration
- `/settings limits queue <size>` - Set max queue size

---

### 7. Command Cooldowns

**Description**: Prevent command spam with per-user cooldowns.

**Features**:
- Configurable cooldown per command
- Bypass for DJ/Admins
- User-friendly cooldown messages

**Implementation**:
```typescript
// src/utils/CooldownManager.ts
export class CooldownManager {
  private cooldowns: Map<string, Map<string, number>> = new Map();

  checkCooldown(
    userId: string,
    commandName: string,
    cooldownMs: number
  ): { onCooldown: boolean; remaining: number } {
    const now = Date.now();

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const commandCooldowns = this.cooldowns.get(commandName)!;
    const expirationTime = commandCooldowns.get(userId);

    if (expirationTime && now < expirationTime) {
      return {
        onCooldown: true,
        remaining: Math.ceil((expirationTime - now) / 1000)
      };
    }

    commandCooldowns.set(userId, now + cooldownMs);
    return { onCooldown: false, remaining: 0 };
  }
}
```

---

### 8. Settings Command

**Description**: Centralized command for server configuration.

**Subcommands**:
```
/settings view                         - Show current settings
/settings dj role <role>              - Set DJ role
/settings dj remove                    - Remove DJ role requirement
/settings channels add <channel>       - Add to whitelist
/settings channels remove <channel>    - Remove from whitelist
/settings channels clear               - Clear all restrictions
/settings limits volume <max>          - Set volume limit
/settings limits duration <seconds>    - Set max song duration
/settings limits queue <size>          - Set max queue size
/settings voteskip threshold <%>       - Set vote skip threshold
/settings cooldown <seconds>           - Set command cooldown
/settings reset                        - Reset to defaults
```

**Visual Feedback**:
```
🎛️ Server Settings - MyServer

DJ Role: @DJ
Allowed Channels: #music, #lounge
Volume Limit: 100
Max Song Duration: 10 minutes
Max Queue Size: 50
Vote Skip Threshold: 50%
Command Cooldown: 3 seconds

Use /settings <option> to modify
```

---

### 9. Enhanced Queue Management

**Description**: Advanced queue manipulation commands.

**New Commands**:

```typescript
// /queue - Show current queue with pagination
// /remove <position> - Remove song at position
// /move <from> <to> - Move song in queue
// /shuffle - Randomize queue order
// /clear - Clear entire queue (DJ only)
```

**Queue Display**:
```
🎵 Music Queue (Page 1/3)

Now Playing:
🔊 Never Gonna Give You Up - Rick Astley [3:32]
   Requested by @User1

Up Next:
1. Bohemian Rhapsody - Queen [5:55] | @User2
2. Stairway to Heaven - Led Zeppelin [8:02] | @User3
3. Hotel California - Eagles [6:30] | @User1

Total: 25 songs | Duration: 1h 23m

Use /queue page <number> to see more
```

---

### 10. User Restriction System

**Description**: Ban specific users from using the bot.

**Commands**:
- `/restrict add <user> [reason]` - Ban user from bot
- `/restrict remove <user>` - Unban user
- `/restrict list` - Show restricted users

**Implementation**:
```typescript
// Middleware check
export async function checkUserRestriction(
  interaction: ChatInputCommandInteraction,
  config: ServerConfig
): Promise<boolean> {
  return !config.restrictedUsers.includes(interaction.user.id);
}
```

---

## 🗄️ Database Schema

### SQLite Schema (Recommended)

```sql
-- Server configurations
CREATE TABLE server_configs (
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

-- Allowed channels (whitelist)
CREATE TABLE allowed_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id) ON DELETE CASCADE,
  UNIQUE(guild_id, channel_id)
);

-- Blocked channels (blacklist)
CREATE TABLE blocked_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id) ON DELETE CASCADE,
  UNIQUE(guild_id, channel_id)
);

-- Restricted users
CREATE TABLE restricted_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT,
  restricted_by TEXT NOT NULL,
  restricted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id) ON DELETE CASCADE,
  UNIQUE(guild_id, user_id)
);

-- Command usage logs (optional, for analytics)
CREATE TABLE command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  command_name TEXT NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Set up SQLite database integration
- [ ] Create DatabaseManager class
- [ ] Implement ServerConfig model
- [ ] Create permission checking middleware
- [ ] Add settings command with basic functionality

### Phase 2: DJ System (Week 1-2)
- [ ] Implement DJ role checking
- [ ] Add DJ requirement to existing commands
- [ ] Create bypass logic (alone in VC, permissions)
- [ ] Update command permissions

### Phase 3: Vote Skip (Week 2)
- [ ] Create VoteManager utility
- [ ] Implement /voteskip command
- [ ] Add /forceskip command (DJ only)
- [ ] Add vote tracking UI

### Phase 4: Admin Commands (Week 2-3)
- [ ] Implement /clearqueue command
- [ ] Add /remove command with position selection
- [ ] Create /move command for queue reordering
- [ ] Implement /shuffle command
- [ ] Add /lock and /unlock commands

### Phase 5: Restrictions (Week 3)
- [ ] Implement channel whitelist/blacklist
- [ ] Add volume and duration limits
- [ ] Create user restriction system
- [ ] Add restriction management commands

### Phase 6: Cooldowns & Polish (Week 3-4)
- [ ] Implement CooldownManager
- [ ] Add cooldowns to all commands
- [ ] Create enhanced queue display
- [ ] Add pagination to queue command
- [ ] Implement settings view command

### Phase 7: Testing & Documentation (Week 4)
- [ ] Unit tests for permission system
- [ ] Integration tests for moderation features
- [ ] Update README with moderation guide
- [ ] Create admin setup guide
- [ ] Add configuration examples

---

## 🔧 Technical Considerations

### Dependencies to Add:
```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2"  // SQLite database
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8"
  }
}
```

### Environment Variables:
```env
DATABASE_PATH=./data/bot.db
DEFAULT_VOLUME_LIMIT=100
DEFAULT_MAX_QUEUE_SIZE=100
DEFAULT_MAX_SONG_DURATION=600
DEFAULT_COMMAND_COOLDOWN=3000
DEFAULT_VOTE_SKIP_THRESHOLD=50
```

### Error Handling:
- Graceful fallbacks for missing database
- Default configurations for new servers
- User-friendly error messages
- Permission denial messages with helpful hints

---

## 📊 Success Metrics

- [ ] All commands have appropriate permission checks
- [ ] Vote skip system works reliably
- [ ] Settings persist across bot restarts
- [ ] Channel restrictions prevent unauthorized usage
- [ ] Cooldowns prevent spam effectively
- [ ] User restrictions work as expected
- [ ] Queue management commands function correctly
- [ ] No performance degradation with database

---

## 🚀 Future Enhancements

1. **Web Dashboard**: Browser-based configuration UI
2. **Playlist Management**: Save and load custom playlists
3. **Auto-Moderation**: Automatic restrictions based on behavior
4. **Audit Logs**: Track all moderation actions
5. **Role-Based Queues**: Priority queuing for certain roles
6. **Scheduled Events**: Auto-play music at specific times
7. **Multi-Language Support**: Localization for commands
8. **Premium Features**: Tiered feature access

---

## 📖 Documentation Plan

### Admin Guide Topics:
1. Initial Setup
2. Setting Up DJ Role
3. Configuring Channel Restrictions
4. Setting Volume and Duration Limits
5. Managing Vote Skip
6. Handling User Restrictions
7. Queue Management Best Practices
8. Troubleshooting Common Issues

### User Guide Topics:
1. Basic Commands
2. Voting to Skip
3. Queue Management
4. Understanding Restrictions
5. FAQ

---

## ⚡ Quick Start Commands for Admins

```bash
# Set up DJ role
/settings dj role @DJ

# Restrict to music channels only
/settings channels add #music
/settings channels add #lounge

# Set reasonable limits
/settings limits volume 150
/settings limits duration 900  # 15 minutes
/settings limits queue 50

# Configure vote skip
/settings voteskip threshold 60  # 60% required

# View all settings
/settings view
```

---

**Document Version**: 1.0
**Last Updated**: 2024-12-19
**Status**: Planning Phase
