import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  AutocompleteInteraction,
} from "discord.js";

export interface ExtendedClient extends Client {
  commands: Map<string, Command>;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
  ) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
