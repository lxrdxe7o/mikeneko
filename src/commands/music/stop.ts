import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';
import { DatabaseManager } from '../../database/DatabaseManager';
import { QueueManager } from '../../utils/QueueManager';
import { VoteManager } from '../../utils/VoteManager';
import { checkChannelPermission, checkUserRestriction, checkDJPermission } from '../../middleware/permissions';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and disconnect the bot') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const db = (client as any).database as DatabaseManager;
    const config = db.getServerConfig(interaction.guildId!);

    // Check channel permissions
    if (!await checkChannelPermission(interaction, config)) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You cannot use music commands in this channel!')
        ],
        ephemeral: true
      });
      return;
    }

    // Check user restrictions
    if (!await checkUserRestriction(interaction, config)) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You are restricted from using music commands!')
        ],
        ephemeral: true
      });
      return;
    }

    // Check DJ permissions
    if (!await checkDJPermission(interaction, config)) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You need DJ permissions to stop playback!')
        ],
        ephemeral: true
      });
      return;
    }

    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;
    const player = lavalinkManager.shoukaku.players.get(interaction.guildId!);

    if (!player) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ Nothing is currently playing!')
        ],
        ephemeral: true
      });
      return;
    }

    // Clear queue and votes
    const queueManager = (client as any).queueManager as QueueManager;
    const voteManager = (client as any).voteManager as VoteManager;

    queueManager.clearQueue(interaction.guildId!);
    voteManager.clearVotes(interaction.guildId!);

    await lavalinkManager.shoukaku.leaveChannel(interaction.guildId!);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00ff00')
          .setDescription('⏹️ Stopped playback and disconnected')
      ]
    });

    // Log command usage
    db.logCommand(interaction.guildId!, interaction.user.id, 'stop');
  }
};

export default command;
