import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  AutocompleteInteraction
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Map<string, Command>;
}
