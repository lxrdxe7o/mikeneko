import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { QueueManager } from '../../utils/QueueManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the music queue')
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('Page number')
        .setMinValue(1)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const queueManager = (client as any).queueManager as QueueManager;
    const page = interaction.options.getInteger('page') || 1;

    const nowPlaying = queueManager.getNowPlaying(interaction.guildId!);

    if (!nowPlaying && queueManager.isEmpty(interaction.guildId!)) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ The queue is empty!')
        ],
        ephemeral: true
      });
      return;
    }

    const queueData = queueManager.getPage(interaction.guildId!, page, 10);
    const totalDuration = queueManager.getTotalDuration(interaction.guildId!);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`🎵 Music Queue (Page ${queueData.currentPage}/${queueData.totalPages || 1})`);

    // Now playing section
    if (nowPlaying) {
      embed.addFields({
        name: 'Now Playing',
        value: `🔊 **[${nowPlaying.track.info.title}](${nowPlaying.track.info.uri})**\n` +
               `👤 Requested by <@${nowPlaying.requestedBy}> | ⏱️ ${formatDuration(nowPlaying.track.info.length)}`,
        inline: false
      });
    }

    // Queue section
    if (queueData.tracks.length > 0) {
      const queueList = queueData.tracks
        .map((item, index) => {
          const position = (queueData.currentPage - 1) * 10 + index + 1;
          return `**${position}.** [${item.track.info.title}](${item.track.info.uri})\n` +
                 `👤 <@${item.requestedBy}> | ⏱️ ${formatDuration(item.track.info.length)}`;
        })
        .join('\n\n');

      embed.addFields({
        name: 'Up Next',
        value: queueList,
        inline: false
      });
    }

    // Footer with stats
    embed.setFooter({
      text: `Total: ${queueData.totalTracks} song(s) | Duration: ${formatDuration(totalDuration)}`
    });

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
