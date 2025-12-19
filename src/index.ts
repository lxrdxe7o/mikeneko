import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from './config/environment';
import { Command, ExtendedClient } from './types/Command';
import { LavalinkManager } from './manager/LavalinkManager';
import { DatabaseManager } from './database/DatabaseManager';
import { VoteManager } from './utils/VoteManager';
import { CooldownManager } from './utils/CooldownManager';
import { QueueManager } from './utils/QueueManager';

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
}) as ExtendedClient;

// Initialize command collection
client.commands = new Collection();

// Load commands dynamically
function loadCommands(dir: string): void {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(dir, file.name);

    if (file.isDirectory()) {
      loadCommands(filePath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
      const command: Command = require(filePath).default;

      if (!command || !command.data) {
        console.warn(`⚠️  Skipping ${filePath}: No command data found`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    }
  }
}

// Ensure data directory exists
const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = join(dataDir, 'bot.db');
const database = new DatabaseManager(dbPath);
(client as any).database = database;

// Initialize vote manager
const voteManager = new VoteManager();
(client as any).voteManager = voteManager;

// Initialize cooldown manager
const cooldownManager = new CooldownManager();
(client as any).cooldownManager = cooldownManager;

// Initialize queue manager
const queueManager = new QueueManager();
(client as any).queueManager = queueManager;

// Bot ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  console.log(`🤖 Bot ID: ${readyClient.user.id}`);
  console.log(`🌐 Serving ${readyClient.guilds.cache.size} guild(s)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Initialize Lavalink Manager
  console.log('🔄 Initializing Lavalink connection...');
  const lavalinkManager = new LavalinkManager(client);
  (client as any).lavalinkManager = lavalinkManager;

  // Set bot activity
  readyClient.user.setPresence({
    activities: [{ name: '🎵 Music with /play', type: 2 }],
    status: 'online'
  });

  console.log('✅ Bot is ready!');
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`⚠️  Command not found: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Error executing command ${interaction.commandName}:`, error);

    const errorMessage = {
      content: '❌ An error occurred while executing this command!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle autocomplete interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isAutocomplete()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command || !command.autocomplete) {
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    console.error(`❌ Error in autocomplete for ${interaction.commandName}:`, error);
  }
});

// Error handling
process.on('unhandledRejection', (error: Error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  database.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  database.close();
  client.destroy();
  process.exit(0);
});

// Load commands
console.log('🔄 Loading commands...');
const commandsPath = join(__dirname, 'commands');
loadCommands(commandsPath);
console.log(`✅ Loaded ${client.commands.size} command(s)\n`);

// Login to Discord
console.log('🔄 Connecting to Discord...');
client.login(config.discord.token);
