import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Command, ExtendedClient } from "../../types/Command";
import { QueueManager } from "../../utils/QueueManager";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the queue") as SlashCommandBuilder,

  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
  ): Promise<void> {
    const queueManager = (client as any).queueManager as QueueManager;
    const success = queueManager.shuffle(interaction.guildId!);

    if (!success) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ffa500")
            .setDescription("⚠️ The queue is empty or has only one song!"),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#00ff00")
          .setDescription("🔀 Shuffled the queue!"),
      ],
    });
  },
};

export default command;
