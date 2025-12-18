import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused track') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
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

    if (!player.paused) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ffa500')
            .setDescription('⚠️ The player is not paused!')
        ],
        ephemeral: true
      });
      return;
    }

    player.setPaused(false);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00ff00')
          .setDescription('▶️ Resumed playback')
      ]
    });
  }
};

export default command;
