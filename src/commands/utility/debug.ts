import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { LavalinkManager } from '../../manager/LavalinkManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Show debug information for the music player'),

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const lavalinkManager = (client as any).lavalinkManager as LavalinkManager;
    const player = lavalinkManager.shoukaku.players.get(interaction.guildId!);
    const node = lavalinkManager.shoukaku.getIdealNode();

    const embed = new EmbedBuilder()
      .setTitle('🔧 Debug Information')
      .setColor('#0099ff')
      .setTimestamp();

    // 1. Player Status
    if (player) {
      embed.addFields({
        name: '🎵 Player Status',
        value: [
          `**Playing:** ${!player.paused}`,
          `**Paused:** ${player.paused}`,
          `**Volume:** ${player.volume}%`,
          `**Position:** ${player.position}ms`,
          `**Track:** ${player.track ? 'Loaded' : 'None'}`,
          `**Guild ID:** ${player.guildId}`,
        ].join('\n'),
        inline: false
      });
    } else {
      embed.addFields({
        name: '🎵 Player Status',
        value: '❌ No active player in this guild',
        inline: false
      });
    }

    // 2. Node Status
    if (node) {
        // Accessing private/internal properties via any to avoid easy TS errors for debug cmd
        const nodeAny = node as any;
      embed.addFields({
        name: '🖥️ Lavalink Node',
        value: [
          `**Name:** ${node.name}`,
          `**State:** ${node.state}`,
          `**URL:** ${nodeAny.url || 'Hidden'}`,
          `**Ping:** ${nodeAny.ping}ms`,
          `**Players:** ${node.stats?.players || 0}`,
          `**Load:** ${(node.stats?.cpu?.systemLoad || 0).toFixed(2)}%`
        ].join('\n'),
        inline: false
      });
    } else {
      embed.addFields({
        name: '🖥️ Lavalink Node',
        value: '❌ No available nodes',
        inline: false
      });
    }

    // 3. Voice Connection (Discord side)
    const voiceState = interaction.guild?.members.me?.voice;
    embed.addFields({
        name: '🔊 Bot Voice State',
        value: [
            `**Channel:** ${voiceState?.channelId ? `<#${voiceState.channelId}>` : 'None'}`,
            `**Deaf:** ${voiceState?.deaf}`,
            `**Mute:** ${voiceState?.mute}`,
            `**Server Deaf:** ${voiceState?.serverDeaf}`,
            `**Server Mute:** ${voiceState?.serverMute}`,
        ].join('\n'),
        inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};

export default command;
