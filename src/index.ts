import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { config } from "./config/environment";
import { Command, ExtendedClient } from "./types/Command";
import { LavalinkManager } from "./manager/LavalinkManager";
import { VoteManager } from "./utils/VoteManager";
import { CooldownManager } from "./utils/CooldownManager";
import { QueueManager } from "./utils/QueueManager";

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
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
    } else if ((file.name.endsWith(".js") || file.name.endsWith(".ts")) && !file.name.endsWith(".d.ts")) {
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
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  console.log(`🤖 Bot ID: ${readyClient.user.id}`);
  console.log(`🌐 Serving ${readyClient.guilds.cache.size} guild(s)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Initialize Lavalink Manager
  // Set bot activity
  readyClient.user.setPresence({
    activities: [{ name: "🎵 Music with /play", type: 2 }],
    status: "online",
  });

  console.log("✅ Bot is ready!");
});

// Initialize Lavalink Manager
console.log("🔄 Initializing Lavalink connection...");
const lavalinkManager = new LavalinkManager(client);
(client as any).lavalinkManager = lavalinkManager;

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  console.log(`[DEBUG] Interaction received: ${interaction.id} type=${interaction.type}`);
  if (!interaction.isChatInputCommand()) return;

  console.log(`[DEBUG] Handling command: ${interaction.commandName}`);
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`⚠️  Command not found in collection: ${interaction.commandName}`);
    console.log(`[DEBUG] Available commands: ${Array.from(client.commands.keys()).join(", ")}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(
      `❌ Error executing command ${interaction.commandName}:`,
      error,
    );

    const errorMessage = {
      content: "❌ An error occurred while executing this command!",
      ephemeral: true,
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
    console.error(
      `❌ Error in autocomplete for ${interaction.commandName}:`,
      error,
    );
  }
});

// Error handling
process.on("unhandledRejection", (error: Error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught exception:", error);
  // Don't exit on Discord API errors - they are recoverable
  if ((error as any).code && String((error as any).code).startsWith("10")) {
    console.log("⚠️  Discord API error (interaction timeout) - continuing...");
    return;
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  client.destroy();
  process.exit(0);
});

// Load commands
console.log("🔄 Loading commands...");
const commandsPath = join(__dirname, "commands");
loadCommands(commandsPath);
console.log(`✅ Loaded ${client.commands.size} command(s)\n`);

// Login to Discord
console.log("🔄 Connecting to Discord...");
client.login(config.discord.token);
