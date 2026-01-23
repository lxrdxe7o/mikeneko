import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Command, ExtendedClient } from "../../types/Command";
import { QueueManager } from "../../utils/QueueManager";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a specific song from the queue")
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
