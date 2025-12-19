import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';
import { DatabaseManager } from '../../database/DatabaseManager';
import { checkChannelPermission, checkUserRestriction, checkDJPermission } from '../../middleware/permissions';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the player volume')
    .addIntegerOption(option =>
      option
        .setName('level')
        .setDescription('Volume level (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ) as SlashCommandBuilder,

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
            .setDescription('❌ You need DJ permissions to change the volume!')
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

    const volume = interaction.options.getInteger('level', true);

    // Enforce server volume limit
    if (volume > config.volumeLimit) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`❌ Volume cannot exceed the server limit of **${config.volumeLimit}%**!`)
        ],
        ephemeral: true
      });
      return;
    }

    await player.setGlobalVolume(volume);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00ff00')
          .setDescription(`🔊 Volume set to **${volume}%**`)
      ]
    });

    // Log command usage
    db.logCommand(interaction.guildId!, interaction.user.id, 'volume');
  }
};

export default command;
