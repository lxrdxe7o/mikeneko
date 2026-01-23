import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Command, ExtendedClient } from "../../types/Command";
import { QueueManager } from "../../utils/QueueManager";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move a song to a different position in the queue")
    .addIntegerOption((option) =>
      option
        .setName("from")
        .setDescription("Current position")
        .setRequired(true)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("New position")
        .setRequired(true)
        .setMinValue(1),
    ) as SlashCommandBuilder,

  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
  ): Promise<void> {
    const queueManager = (client as any).queueManager as QueueManager;
    const from = interaction.options.getInteger("from", true) - 1; // Convert to 0-indexed
    const to = interaction.options.getInteger("to", true) - 1;

    const success = queueManager.move(interaction.guildId!, from, to);

    if (!success) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(
              "❌ Invalid positions! Use `/queue` to see the queue.",
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
            `✅ Moved song from position **${from + 1}** to **${to + 1}**`,
          ),
      ],
    });
  },
};

export default command;
