<div align="center">

![Header](./assets/header.svg)

</div>

A production-ready, high-performance Discord music bot built with TypeScript, discord.js v14, and Lavalink v4.

## 🚀 Features

- **Slash Commands Only** - Modern Discord interactions API
- **Lavalink v4** - High-quality audio streaming through Shoukaku
- **Multi-Source Support** - YouTube, Spotify, Deezer, SoundCloud, Bandcamp, Twitch
- **TypeScript** - Fully typed codebase with strict type checking
- **Docker Ready** - Complete Docker Compose setup
- **Dynamic Command Loading** - Modular command structure
- **Reconnection Logic** - Automatic Lavalink reconnection handling

## 📁 Project Structure

```
mikeneko/
├── src/
│   ├── commands/
│   │   └── music/
│   │       ├── play.ts          # Main play command
│   │       ├── pause.ts         # Pause playback
│   │       ├── resume.ts        # Resume playback
│   │       ├── stop.ts          # Stop and disconnect
│   │       ├── skip.ts          # Skip current track
│   │       ├── nowplaying.ts    # Show current track
│   │       └── volume.ts        # Adjust volume
│   ├── config/
│   │   └── environment.ts       # Environment configuration
│   ├── manager/
│   │   └── LavalinkManager.ts   # Lavalink connection manager
│   ├── types/
│   │   ├── Command.ts           # Command interface
│   │   └── environment.d.ts     # Environment types
│   ├── deploy-commands.ts       # Command registration script
│   └── index.ts                 # Main entry point
├── docker-compose.yml           # Docker orchestration
├── application.yml              # Lavalink configuration
├── Dockerfile                   # Bot container
├── package.json
├── tsconfig.json
└── .env                         # Environment variables
```

## 🛠️ Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized deployment)
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Spotify Client ID/Secret (optional, for Spotify support)

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mikeneko
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
```

### 4. Configure Lavalink (Optional)

Edit `application.yml` to add Spotify/Deezer credentials:

```yaml
plugins:
  lavasrc:
    spotify:
      clientId: "your_spotify_client_id"
      clientSecret: "your_spotify_client_secret"
```

## 🚀 Running the Bot

### Option 1: Docker (Recommended)

Start both Lavalink and the bot:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f bot
```

Stop services:

```bash
docker-compose down
```

### Option 2: Local Development

**Terminal 1 - Start Lavalink:**

```bash
docker-compose up lavalink
```

**Terminal 2 - Run the Bot:**

```bash
# Build TypeScript
npm run build

# Deploy commands to Discord
npm run deploy

# Start the bot
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## 📝 Command Registration

Before using the bot, register slash commands with Discord:

```bash
npm run deploy
```

This script (`src/deploy-commands.ts`) will:
- Scan all command files in `src/commands/`
- Register them with Discord's API
- Display confirmation of registered commands

## 🎮 Available Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/play <query>` | Play a song or add to queue | `/play Never Gonna Give You Up` |
| `/pause` | Pause the current track | `/pause` |
| `/resume` | Resume playback | `/resume` |
| `/stop` | Stop and disconnect bot | `/stop` |
| `/skip` | Skip current track | `/skip` |
| `/nowplaying` | Show current track info | `/nowplaying` |
| `/volume <level>` | Set volume (1-100) | `/volume 50` |

## 🏗️ Architecture

### Command System

Commands implement the `Command` interface:

```typescript
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
```

### Lavalink Integration

The `LavalinkManager` class handles:
- Node connection and reconnection
- Search functionality
- Player management
- Event handling

### Play Command Flow

1. **Defer Reply** - Immediately defer the interaction
2. **Validation** - Check voice channel and permissions
3. **Search** - Query Lavalink for tracks
4. **Join Channel** - Create player and join voice
5. **Playback** - Start playing or add to queue
6. **Edit Reply** - Update with track information

## 🔧 Configuration

### Discord.js Intents

Required intents are configured in `src/index.ts`:

```typescript
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages
]
```

### Lavalink Sources

Configure audio sources in `application.yml`:

```yaml
lavalink:
  server:
    sources:
      youtube: true
      soundcloud: true
      bandcamp: true
      twitch: true
      vimeo: true
      http: true
```

### Shoukaku Options

Configured in `LavalinkManager.ts`:

```typescript
{
  reconnectInterval: 5000,
  reconnectTries: 3,
  restTimeout: 60000,
  moveOnDisconnect: false
}
```

## 🐛 Debugging

Enable Shoukaku debug logs:

```typescript
this.shoukaku.on('debug', (name: string, info: string) => {
  console.log(`🐛 [${name}] ${info}`);
});
```

View Lavalink logs:

```bash
docker-compose logs -f lavalink
```

## 📊 Production Deployment

### Environment Variables

For production, set secure values:

```env
LAVALINK_PASSWORD=strong_random_password_here
```

### Docker Resources

Adjust Lavalink memory in `docker-compose.yml`:

```yaml
environment:
  - _JAVA_OPTIONS=-Xmx2G  # Increase for more guilds
```

### Error Handling

The bot includes:
- Graceful shutdown handlers (SIGINT, SIGTERM)
- Unhandled rejection/exception logging
- Per-command error boundaries

## 🔐 Bot Permissions

Required OAuth2 scopes:
- `bot`
- `applications.commands`

Required bot permissions:
- View Channels
- Send Messages
- Connect
- Speak

## 📚 Adding New Commands

1. Create a new file in `src/commands/music/`:

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('My command description') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    // Your command logic
  }
};

export default command;
```

2. Rebuild and deploy:

```bash
npm run build
npm run deploy
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [discord.js](https://discord.js.org/) - Discord API wrapper
- [Shoukaku](https://github.com/shipgirlproject/shoukaku) - Lavalink client
- [Lavalink](https://github.com/lavalink-devs/Lavalink) - Audio streaming node
- [LavaSrc](https://github.com/topi314/LavaSrc) - Multi-source plugin

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Read the [discord.js guide](https://discordjs.guide/)
- Read the [Lavalink docs](https://lavalink.dev/)

---

<div align="center">

![Footer](./assets/footer.svg)

</div>
