import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Song name, URL (YouTube, Spotify, Deezer, etc.)')
        .setRequired(true)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    // Defer the reply immediately
    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    // Check if user is in a voice channel
    if (!voiceChannel) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You must be in a voice channel to play music!')
        ]
      });
      return;
    }

    // Check if bot has permissions
    const permissions = voiceChannel.permissionsFor(client.user!);
    if (!permissions?.has(['Connect', 'Speak'])) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ I need permissions to join and speak in your voice channel!')
        ]
      });
      return;
    }

    const query = interaction.options.getString('query', true);
    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;

    try {
      // Search for the track
      const searchResult = await lavalinkManager.search(query);

      if (!searchResult || !searchResult.tracks.length) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff0000')
              .setDescription('❌ No results found for your query!')
          ]
        });
        return;
      }

      // Get or create player
      let player = lavalinkManager.shoukaku.players.get(interaction.guildId!);

      if (!player) {
        // Create new player and join voice channel
        const node = lavalinkManager.getNode();
        player = await node.joinChannel({
          guildId: interaction.guildId!,
          channelId: voiceChannel.id,
          shardId: 0,
          deaf: true
        });

        // Set up player event listeners
        player.on('start', () => {
          console.log(`🎵 Started playing in guild ${interaction.guildId}`);
        });

        player.on('end', () => {
          console.log(`⏹️ Playback ended in guild ${interaction.guildId}`);
        });

        player.on('closed', (reason) => {
          console.log(`🔒 Player closed in guild ${interaction.guildId}:`, reason);
        });

        player.on('exception', (error) => {
          console.error(`⚠️ Player exception in guild ${interaction.guildId}:`, error);
        });
      }

      const track = searchResult.tracks[0];

      // If nothing is playing, start playback
      if (!player.track) {
        await player.playTrack({ track: track.encoded });

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎵 Now Playing')
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .addFields(
            { name: '👤 Artist', value: track.info.author || 'Unknown', inline: true },
            {
              name: '⏱️ Duration',
              value: track.info.isStream
                ? '🔴 LIVE'
                : formatDuration(track.info.length),
              inline: true
            }
          );

        if (track.info.artworkUrl) {
          embed.setThumbnail(track.info.artworkUrl);
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        // Add to queue (implement queue system as needed)
        const embed = new EmbedBuilder()
          .setColor('#ffa500')
          .setTitle('➕ Added to Queue')
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .addFields(
            { name: '👤 Artist', value: track.info.author || 'Unknown', inline: true },
            {
              name: '⏱️ Duration',
              value: track.info.isStream
                ? '🔴 LIVE'
                : formatDuration(track.info.length),
              inline: true
            }
          );

        if (track.info.artworkUrl) {
          embed.setThumbnail(track.info.artworkUrl);
        }

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in play command:', error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ An error occurred while trying to play the track!')
        ]
      });
    }
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
