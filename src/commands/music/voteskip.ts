import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';
import { VoteManager } from '../../utils/VoteManager';

// Default vote skip threshold (50%)
const VOTE_SKIP_THRESHOLD = 50;

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

    // Count members in voice channel (excluding bots)
    const voiceMembers = voiceChannel.members.filter(m => !m.user.bot).size;
    const currentVotes = voteManager.getVoteCount(interaction.guildId!);
    const requiredVotes = voteManager.getRequiredVotes(voiceMembers, VOTE_SKIP_THRESHOLD);

    // Check if threshold met
    if (voteManager.checkThreshold(interaction.guildId!, voiceMembers, VOTE_SKIP_THRESHOLD)) {
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
