import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from './config/environment';
import { Command } from './types/Command';

async function deployCommands(): Promise<void> {
  const commands: any[] = [];
  const commandsPath = join(__dirname, 'commands');

  // Recursively load all command files
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

        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
      }
    }
  }

  try {
    console.log('🔄 Loading commands...');
    loadCommands(commandsPath);

    console.log(`📦 Found ${commands.length} command(s)`);
    console.log('🚀 Registering commands with Discord API...');

    const rest = new REST().setToken(config.discord.token);

    const data = await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: commands }
    ) as any[];

    console.log(`✅ Successfully registered ${data.length} application command(s)!`);
    console.log('\nRegistered commands:');
    data.forEach(cmd => console.log(`  - /${cmd.name}`));

  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
}

deployCommands();
