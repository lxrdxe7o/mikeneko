import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Command, ExtendedClient } from "../../types/Command";
import { QueueManager } from "../../utils/QueueManager";
import { DatabaseManager } from "../../database/DatabaseManager";
import { checkDJPermission } from "../../middleware/permissions";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a specific song from the queue (DJ only)")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Position in queue (1 = first song)")
        .setRequired(true)
        .setMinValue(1),
    ) as SlashCommandBuilder,

  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
  ): Promise<void> {
    const db = (client as any).database as DatabaseManager;
    const config = db.getServerConfig(interaction.guildId!);

    // Check DJ permission
    const hasPermission = await checkDJPermission(interaction, config);

    if (!hasPermission) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ You need DJ permissions to use this command!"),
        ],
        ephemeral: true,
      });
      return;
    }

    const queueManager = (client as any).queueManager as QueueManager;
    const position = interaction.options.getInteger("position", true) - 1; // Convert to 0-indexed

    const removed = queueManager.remove(interaction.guildId!, position);

    if (!removed) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(
              "❌ Invalid position! Use `/queue` to see available positions.",
            ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#00ff00")
          .setDescription(
            `✅ Removed from queue:\n**[${removed.track.info.title}](${removed.track.info.uri})**`,
          ),
      ],
    });
  },
};

export default command;
