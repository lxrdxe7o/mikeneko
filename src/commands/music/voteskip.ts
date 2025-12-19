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

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('voteskip')
    .setDescription('Vote to skip the current track') as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('❌ You must be in a voice channel to vote!')
        ],
        ephemeral: true
      });
      return;
    }

    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;
    const voteManager = (client as any).voteManager as VoteManager;
    const db = (client as any).database as DatabaseManager;

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

    // Add vote
    const voted = voteManager.addVote(interaction.guildId!, interaction.user.id);

    if (!voted) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ffa500')
            .setDescription('⚠️ You have already voted to skip!')
        ],
        ephemeral: true
      });
      return;
    }

    // Get config for threshold
    const config = db.getServerConfig(interaction.guildId!);

    // Count members in voice channel (excluding bots)
    const voiceMembers = voiceChannel.members.filter(m => !m.user.bot).size;
    const currentVotes = voteManager.getVoteCount(interaction.guildId!);
    const requiredVotes = voteManager.getRequiredVotes(voiceMembers, config.voteSkipThreshold);

    // Check if threshold met
    if (voteManager.checkThreshold(interaction.guildId!, voiceMembers, config.voteSkipThreshold)) {
      // Skip the track
      await player.stopTrack();
      voteManager.clearVotes(interaction.guildId!);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('⏭️ Vote Skip Passed')
            .setDescription(`Vote to skip passed! **${currentVotes}/${requiredVotes}** votes reached.`)
        ]
      });
    } else {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🗳️ Vote Registered')
            .setDescription(
              `**${currentVotes}/${requiredVotes}** votes to skip\n` +
              `${requiredVotes - currentVotes} more vote(s) needed`
            )
        ]
      });
    }
  }
};

export default command;
