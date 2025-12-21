import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
} from "discord.js";
import { Command, ExtendedClient } from "../../types/Command";
import { LavalinkManager } from "../../manager/LavalinkManager";
import { QueueManager } from "../../utils/QueueManager";
import { DatabaseManager } from "../../database/DatabaseManager";
import { VoteManager } from "../../utils/VoteManager";
import {
  checkChannelPermission,
  checkUserRestriction,
} from "../../middleware/permissions";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or add it to the queue")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name, URL (YouTube, Spotify, Deezer, etc.)")
        .setRequired(true),
    ) as SlashCommandBuilder,

  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
  ): Promise<void> {
    const db = (client as any).database as DatabaseManager;
    const config = db.getServerConfig(interaction.guildId!);

    // Check channel restrictions
    const channelAllowed = await checkChannelPermission(interaction, config);
    if (!channelAllowed) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(
              "❌ Music commands are not allowed in this channel!",
            ),
        ],
        ephemeral: true,
      });
      return;
    }

    // Check user restrictions
    const userAllowed = await checkUserRestriction(interaction, config);
    if (!userAllowed) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ You are restricted from using this bot!"),
        ],
        ephemeral: true,
      });
      return;
    }

    // Defer the reply immediately
    console.log(`[DEBUG] Deferring reply for ${interaction.id}`);
    await interaction.deferReply();
    console.log(`[DEBUG] Deferred reply for ${interaction.id}`);

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    // Check if user is in a voice channel
    if (!voiceChannel) {
      console.log(`[DEBUG] User not in voice channel`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ You must be in a voice channel to play music!"),
        ],
      });
      return;
    }

    // Check if bot has permissions
    const permissions = voiceChannel.permissionsFor(client.user!);
    if (!permissions?.has(["Connect", "Speak"])) {
      console.log(`[DEBUG] Bot missing permissions`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(
              "❌ I need permissions to join and speak in your voice channel!",
            ),
        ],
      });
      return;
    }

    const query = interaction.options.getString("query", true);
    console.log(`[DEBUG] Query: ${query}`);
    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;
    const queueManager = (client as any).queueManager as QueueManager;
    const voteManager = (client as any).voteManager as VoteManager;

    try {
      // Search for the track
      console.log(`[DEBUG] Searching for track...`);
      const searchResult = await lavalinkManager.search(query);
      console.log(`[DEBUG] Search result:`, JSON.stringify(searchResult));

      if (!searchResult || !searchResult.tracks.length) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setDescription("❌ No results found for your query!"),
          ],
        });
        return;
      }

      const track = searchResult.tracks[0];

      // Check duration limit
      if (
        !track.info.isStream &&
        track.info.length > config.maxSongDuration * 1000
      ) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setDescription(
                `❌ Song exceeds maximum duration limit of ${Math.floor(config.maxSongDuration / 60)} minutes!`,
              ),
          ],
        });
        return;
      }

      // Check queue size limit
      if (queueManager.getSize(interaction.guildId!) >= config.maxQueueSize) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setDescription(
                `❌ Queue is full! Maximum size: ${config.maxQueueSize} songs.`,
              ),
          ],
        });
        return;
      }

      // Get or create player
      let player = lavalinkManager.shoukaku.players.get(interaction.guildId!);

      if (!player) {
        // Create new player and join voice channel
        player = await lavalinkManager.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId!,
          channelId: voiceChannel.id,
          shardId: 0,
          deaf: true,
        });

        // Set up player event listeners
        player.on("start", () => {
          console.log(`🎵 Started playing in guild ${interaction.guildId}`);
        });

        player.on("end", async () => {
          console.log(`⏹️ Playback ended in guild ${interaction.guildId}`);

          // Clear votes for next track
          voteManager.clearVotes(interaction.guildId!);

          // Play next track from queue
          const nextTrack = queueManager.getNext(interaction.guildId!);
          if (nextTrack && player) {
            queueManager.setNowPlaying(interaction.guildId!, nextTrack);
            await player.playTrack({
              track: { encoded: nextTrack.track.encoded },
            });
          } else {
            queueManager.setNowPlaying(interaction.guildId!, null);
          }
        });

        player.on("closed", (reason) => {
          console.log(
            `🔒 Player closed in guild ${interaction.guildId}:`,
            reason,
          );
          queueManager.clear(interaction.guildId!);
          voteManager.clearVotes(interaction.guildId!);
        });

        player.on("exception", (error) => {
          console.error(
            `⚠️ Player exception in guild ${interaction.guildId}:`,
            error,
          );
        });
      }

      // If nothing is playing (according to our Queue Manager), start playback
      console.log(`[DEBUG] Checking QueueManager for active track...`);
      if (!queueManager.getNowPlaying(interaction.guildId!)) {
        const queueTrack = {
          track,
          requestedBy: interaction.user.id,
          addedAt: new Date(),
        };
        queueManager.setNowPlaying(interaction.guildId!, queueTrack);
        await player.playTrack({ track: { encoded: track.encoded } });

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🎵 Now Playing")
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .addFields(
            {
              name: "👤 Artist",
              value: track.info.author || "Unknown",
              inline: true,
            },
            {
              name: "⏱️ Duration",
              value: track.info.isStream
                ? "🔴 LIVE"
                : formatDuration(track.info.length),
              inline: true,
            },
            {
              name: "🎧 Requested by",
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
          );

        if (track.info.artworkUrl) {
          embed.setThumbnail(track.info.artworkUrl);
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        // Add to queue
        const position = queueManager.addTrack(
          interaction.guildId!,
          track,
          interaction.user.id,
        );

        const embed = new EmbedBuilder()
          .setColor("#ffa500")
          .setTitle("➕ Added to Queue")
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .addFields(
            {
              name: "👤 Artist",
              value: track.info.author || "Unknown",
              inline: true,
            },
            {
              name: "⏱️ Duration",
              value: track.info.isStream
                ? "🔴 LIVE"
                : formatDuration(track.info.length),
              inline: true,
            },
            {
              name: "📍 Position",
              value: `${position} in queue`,
              inline: true,
            },
            {
              name: "🎧 Requested by",
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
          );

        if (track.info.artworkUrl) {
          embed.setThumbnail(track.info.artworkUrl);
        }

        await interaction.editReply({ embeds: [embed] });
      }

      // Log command usage
      db.logCommand(interaction.guildId!, interaction.user.id, "play");
    } catch (error) {
      console.error("Error in play command:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(
              "❌ An error occurred while trying to play the track!",
            ),
        ],
      });
    }
  },
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default command;
