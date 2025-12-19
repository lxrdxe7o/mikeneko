import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ServerConfig, PermissionLevel } from '../types/ServerConfig';

/**
 * Permission Middleware
 * Handles permission checking for commands
 */

export async function checkDJPermission(
  interaction: ChatInputCommandInteraction,
  config: ServerConfig
): Promise<boolean> {
  const member = interaction.member as GuildMember;

  // Server owner always has permission
  if (member.id === interaction.guild?.ownerId) return true;

  // Administrator bypass
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  // Check if alone in voice channel (bot doesn't count)
  const voiceChannel = member.voice.channel;
  if (voiceChannel && voiceChannel.members.filter(m => !m.user.bot).size === 1) {
    return true;
  }

  // If DJ role not required, allow everyone
  if (!config.requireDJRole) return true;

  // Check DJ role
  if (config.djRoleId && member.roles.cache.has(config.djRoleId)) {
    return true;
  }

  // Check voice channel permissions (Manage Channels or Move Members)
  if (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.MoveMembers)
  ) {
    return true;
  }

  return false;
}

export async function checkChannelPermission(
  interaction: ChatInputCommandInteraction,
  config: ServerConfig
): Promise<boolean> {
  const channelId = interaction.channelId;

  // Check whitelist (if configured, only these channels allowed)
  if (config.allowedChannels.length > 0) {
    return config.allowedChannels.includes(channelId);
  }

  // Check blacklist
  if (config.blockedChannels.includes(channelId)) {
    return false;
  }

  return true;
}

export async function checkUserRestriction(
  interaction: ChatInputCommandInteraction,
  config: ServerConfig
): Promise<boolean> {
  return !config.restrictedUsers.includes(interaction.user.id);
}

export function getUserPermissionLevel(member: GuildMember, config: ServerConfig): PermissionLevel {
  // Server owner
  if (member.id === member.guild.ownerId) {
    return PermissionLevel.OWNER;
  }

  // Administrator
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return PermissionLevel.ADMINISTRATOR;
  }

  // Moderator (has moderation permissions)
  if (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers)
  ) {
    return PermissionLevel.MODERATOR;
  }

  // DJ role
  if (config.djRoleId && member.roles.cache.has(config.djRoleId)) {
    return PermissionLevel.DJ;
  }

  // Voice channel permissions
  if (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.MoveMembers)
  ) {
    return PermissionLevel.DJ;
  }

  return PermissionLevel.EVERYONE;
}
