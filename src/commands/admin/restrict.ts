import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import { Command, ExtendedClient } from '../../types/Command';
import { DatabaseManager } from '../../database/DatabaseManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('restrict')
    .setDescription('Manage user restrictions for the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Restrict a user from using the bot')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to restrict')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for restriction')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove restriction from a user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to unrestrict')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all restricted users')
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    const db = (client as any).database as DatabaseManager;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason');

      // Prevent restricting server owner or bot itself
      if (user.id === interaction.guild?.ownerId) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff0000')
              .setDescription('❌ Cannot restrict the server owner!')
          ],
          ephemeral: true
        });
        return;
      }

      if (user.bot) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff0000')
              .setDescription('❌ Cannot restrict bots!')
          ],
          ephemeral: true
        });
        return;
      }

      db.addRestrictedUser(
        interaction.guildId!,
        user.id,
        interaction.user.id,
        reason || undefined
      );

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ User Restricted')
            .setDescription(`${user} has been restricted from using the bot`)
            .addFields(
              { name: 'Reason', value: reason || 'No reason provided', inline: false },
              { name: 'Restricted by', value: `<@${interaction.user.id}>`, inline: true }
            )
        ]
      });
    } else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user', true);

      db.removeRestrictedUser(interaction.guildId!, user.id);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`✅ Removed restriction from ${user}`)
        ]
      });
    } else if (subcommand === 'list') {
      const config = db.getServerConfig(interaction.guildId!);

      if (config.restrictedUsers.length === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#0099ff')
              .setDescription('ℹ️ No users are currently restricted')
          ],
          ephemeral: true
        });
        return;
      }

      const userList = await Promise.all(
        config.restrictedUsers.map(async (userId) => {
          const restrictionInfo = db.getRestrictedUser(interaction.guildId!, userId);
          const user = await client.users.fetch(userId).catch(() => null);

          return `**${user?.tag || 'Unknown User'}** (${userId})\n` +
                 `Reason: ${restrictionInfo?.reason || 'No reason'}\n` +
                 `By: <@${restrictionInfo?.restrictedBy}>\n` +
                 `Date: ${restrictionInfo?.restrictedAt.toLocaleDateString()}`;
        })
      );

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Restricted Users')
        .setDescription(userList.join('\n\n'))
        .setFooter({ text: `Total: ${config.restrictedUsers.length} user(s)` });

      await interaction.reply({ embeds: [embed] });
    }
  }
};

export default command;
