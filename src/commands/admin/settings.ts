import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { DatabaseManager } from '../../database/DatabaseManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure server music bot settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View current server settings')
    )
    .addSubcommandGroup(group =>
      group
        .setName('dj')
        .setDescription('DJ role settings')
        .addSubcommand(sub =>
          sub
            .setName('set')
            .setDescription('Set the DJ role')
            .addRoleOption(option =>
              option
                .setName('role')
                .setDescription('The DJ role')
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('remove')
            .setDescription('Remove DJ role requirement')
        )
        .addSubcommand(sub =>
          sub
            .setName('require')
            .setDescription('Toggle DJ role requirement')
            .addBooleanOption(option =>
              option
                .setName('enabled')
                .setDescription('Require DJ role for commands')
                .setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('channels')
        .setDescription('Channel restrictions')
        .addSubcommand(sub =>
          sub
            .setName('add')
            .setDescription('Add channel to whitelist')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('Channel to allow')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('remove')
            .setDescription('Remove channel from whitelist')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('Channel to remove')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('clear')
            .setDescription('Clear all channel restrictions')
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('limits')
        .setDescription('Set usage limits')
        .addSubcommand(sub =>
          sub
            .setName('volume')
            .setDescription('Set maximum volume')
            .addIntegerOption(option =>
              option
                .setName('max')
                .setDescription('Maximum volume (1-200)')
                .setMinValue(1)
                .setMaxValue(200)
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('duration')
            .setDescription('Set maximum song duration')
            .addIntegerOption(option =>
              option
                .setName('seconds')
                .setDescription('Maximum duration in seconds')
                .setMinValue(60)
                .setMaxValue(7200)
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('queue')
            .setDescription('Set maximum queue size')
            .addIntegerOption(option =>
              option
                .setName('size')
                .setDescription('Maximum songs in queue')
                .setMinValue(1)
                .setMaxValue(500)
                .setRequired(true)
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('voteskip')
        .setDescription('Set vote skip threshold')
        .addIntegerOption(option =>
          option
            .setName('threshold')
            .setDescription('Percentage required to skip (1-100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('cooldown')
        .setDescription('Set command cooldown')
        .addIntegerOption(option =>
          option
            .setName('seconds')
            .setDescription('Cooldown in seconds')
            .setMinValue(0)
            .setMaxValue(60)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Reset all settings to defaults')
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const db = (client as any).database as DatabaseManager;
    const guildId = interaction.guildId!;

    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    // View settings
    if (subcommand === 'view') {
      const config = db.getServerConfig(guildId);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🎛️ Server Settings - ${interaction.guild?.name}`)
        .addFields(
          {
            name: '👔 DJ Role',
            value: config.djRoleId
              ? `<@&${config.djRoleId}> ${config.requireDJRole ? '(Required)' : '(Optional)'}`
              : 'Not set',
            inline: true
          },
          {
            name: '📢 Channels',
            value: config.allowedChannels.length > 0
              ? config.allowedChannels.map(id => `<#${id}>`).join(', ')
              : 'All channels allowed',
            inline: true
          },
          {
            name: '🔊 Volume Limit',
            value: `${config.volumeLimit}%`,
            inline: true
          },
          {
            name: '⏱️ Max Duration',
            value: formatDuration(config.maxSongDuration),
            inline: true
          },
          {
            name: '📋 Max Queue',
            value: `${config.maxQueueSize} songs`,
            inline: true
          },
          {
            name: '🗳️ Vote Skip',
            value: `${config.voteSkipThreshold}% required`,
            inline: true
          },
          {
            name: '⏲️ Cooldown',
            value: `${config.commandCooldown / 1000}s`,
            inline: true
          },
          {
            name: '🚫 Restricted Users',
            value: config.restrictedUsers.length > 0
              ? `${config.restrictedUsers.length} user(s)`
              : 'None',
            inline: true
          }
        )
        .setFooter({ text: 'Use /settings <option> to modify' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // DJ settings
    if (subcommandGroup === 'dj') {
      if (subcommand === 'set') {
        const role = interaction.options.getRole('role', true);
        db.setDJRole(guildId, role.id);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(`✅ DJ role set to ${role}`)
          ]
        });
      } else if (subcommand === 'remove') {
        db.setDJRole(guildId, null);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription('✅ DJ role removed')
          ]
        });
      } else if (subcommand === 'require') {
        const enabled = interaction.options.getBoolean('enabled', true);
        db.setRequireDJRole(guildId, enabled);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(
                `✅ DJ role requirement ${enabled ? 'enabled' : 'disabled'}`
              )
          ]
        });
      }
      return;
    }

    // Channel settings
    if (subcommandGroup === 'channels') {
      if (subcommand === 'add') {
        const channel = interaction.options.getChannel('channel', true);
        db.addAllowedChannel(guildId, channel.id);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(`✅ Added ${channel} to allowed channels`)
          ]
        });
      } else if (subcommand === 'remove') {
        const channel = interaction.options.getChannel('channel', true);
        db.removeAllowedChannel(guildId, channel.id);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(`✅ Removed ${channel} from allowed channels`)
          ]
        });
      } else if (subcommand === 'clear') {
        db.clearAllowedChannels(guildId);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription('✅ Cleared all channel restrictions')
          ]
        });
      }
      return;
    }

    // Limits
    if (subcommandGroup === 'limits') {
      if (subcommand === 'volume') {
        const max = interaction.options.getInteger('max', true);
        db.setVolumeLimit(guildId, max);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(`✅ Maximum volume set to **${max}%**`)
          ]
        });
      } else if (subcommand === 'duration') {
        const seconds = interaction.options.getInteger('seconds', true);
        db.setMaxSongDuration(guildId, seconds);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(
                `✅ Maximum song duration set to **${formatDuration(seconds)}**`
              )
          ]
        });
      } else if (subcommand === 'queue') {
        const size = interaction.options.getInteger('size', true);
        db.setMaxQueueSize(guildId, size);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff00')
              .setDescription(`✅ Maximum queue size set to **${size} songs**`)
          ]
        });
      }
      return;
    }

    // Vote skip threshold
    if (subcommand === 'voteskip') {
      const threshold = interaction.options.getInteger('threshold', true);
      db.setVoteSkipThreshold(guildId, threshold);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`✅ Vote skip threshold set to **${threshold}%**`)
        ]
      });
      return;
    }

    // Cooldown
    if (subcommand === 'cooldown') {
      const seconds = interaction.options.getInteger('seconds', true);
      db.setCommandCooldown(guildId, seconds * 1000);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`✅ Command cooldown set to **${seconds} seconds**`)
        ]
      });
      return;
    }

    // Reset
    if (subcommand === 'reset') {
      db.resetServerConfig(guildId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription('✅ All settings reset to defaults')
        ]
      });
      return;
    }
  }
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export default command;
