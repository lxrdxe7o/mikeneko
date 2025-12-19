import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';
import { VoteManager } from '../../utils/VoteManager';
import { DatabaseManager } from '../../database/DatabaseManager';
import { checkDJPermission } from '../../middleware/permissions';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('forceskip')
    .setDescription('Skip the current track (DJ only)') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const member = interaction.member as GuildMember;
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

    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You must be in a voice channel!')
        ],
        ephemeral: true
      });
      return;
    }

    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;
    const voteManager = (client as any).voteManager as VoteManager;
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

    // Clear votes and skip
    voteManager.clearVotes(interaction.guildId!);
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
