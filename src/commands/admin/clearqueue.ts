import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Command, ExtendedClient } from "../../types/Command";
import { QueueManager } from "../../utils/QueueManager";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("clearqueue")
    .setDescription("Clear all songs from the queue") as SlashCommandBuilder,

  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
  ): Promise<void> {
    const queueManager = (client as any).queueManager as QueueManager;
    const queueSize = queueManager.getSize(interaction.guildId!);

    if (queueSize === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ffa500")
            .setDescription("⚠️ The queue is already empty!"),
        ],
        ephemeral: true,
      });
      return;
    }

    queueManager.clear(interaction.guildId!);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#00ff00")
          .setDescription(`✅ Cleared **${queueSize}** song(s) from the queue`),
      ],
    });
  },
};

export default command;
