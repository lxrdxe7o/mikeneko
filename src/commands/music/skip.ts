import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';
import { DatabaseManager } from '../../database/DatabaseManager';
import { checkChannelPermission, checkUserRestriction } from '../../middleware/permissions';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track') as SlashCommandBuilder,

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

    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;
    const player = lavalinkManager.shoukaku.players.get(interaction.guildId!);

    if (!player || !player.track) {
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

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Skip Options Available')
          .setDescription(
            '**Vote Skip System:**\n' +
            '• Use `/voteskip` to vote to skip the current track\n' +
            '• Requires a percentage of listeners to agree\n\n' +
            '**Force Skip (DJ Only):**\n' +
            '• Use `/forceskip` to instantly skip without voting\n' +
            '• Requires DJ permissions'
          )
      ],
      ephemeral: true
    });

    // Log command usage
    db.logCommand(interaction.guildId!, interaction.user.id, 'skip');
  }
};

export default command;
