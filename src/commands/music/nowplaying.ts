import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing track') as SlashCommandBuilder,

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

    const queueManager = (client as any).queueManager;
    const currentTrack = queueManager.getNowPlaying(interaction.guildId!);

    if (!currentTrack) {
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

    const trackInfo = currentTrack.track.info;
    const position = player.position;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎵 Now Playing')
      .setDescription(`[${trackInfo.title}](${trackInfo.uri})`)
      .addFields(
        {
          name: '👤 Artist',
          value: trackInfo.author || 'Unknown',
          inline: true
        },
        {
          name: '⏱️ Progress',
          value: `${formatDuration(position)} / ${trackInfo.isStream ? '🔴 LIVE' : formatDuration(trackInfo.length)}`,
          inline: true
        },
        {
          name: '🎧 Requested by',
          value: `<@${currentTrack.requestedBy}>`,
          inline: true
        }
      );

    if (trackInfo.artworkUrl) {
      embed.setThumbnail(trackInfo.artworkUrl);
    }

    await interaction.reply({ embeds: [embed] });
  }
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default command;
