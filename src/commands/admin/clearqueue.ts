import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { QueueManager } from '../../utils/QueueManager';
import { DatabaseManager } from '../../database/DatabaseManager';
import { checkDJPermission } from '../../middleware/permissions';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Clear all songs from the queue (DJ only)') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const db = (client as any).database as DatabaseManager;
    const config = db.getServerConfig(interaction.guildId!);

    // Check DJ permission
    const hasPermission = await checkDJPermission(interaction, config);

    if (!hasPermission) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You need DJ permissions to use this command!')
        ],
        ephemeral: true
      });
      return;
    }

    const queueManager = (client as any).queueManager as QueueManager;
    const queueSize = queueManager.getSize(interaction.guildId!);

    if (queueSize === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ffa500')
            .setDescription('⚠️ The queue is already empty!')
        ],
        ephemeral: true
      });
      return;
    }

    queueManager.clear(interaction.guildId!);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00ff00')
          .setDescription(`✅ Cleared **${queueSize}** song(s) from the queue`)
      ]
    });
  }
};

export default command;
