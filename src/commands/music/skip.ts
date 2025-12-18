import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
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

    await player.stopTrack();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00ff00')
          .setDescription('⏭️ Skipped the current track')
      ]
    });
  }
};

export default command;
