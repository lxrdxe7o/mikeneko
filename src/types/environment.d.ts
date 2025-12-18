declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string;
      DISCORD_CLIENT_ID: string;
      LAVALINK_HOST: string;
      LAVALINK_PORT: string;
      LAVALINK_PASSWORD: string;
      LAVALINK_SECURE: string;
    }
  }
}

export {};
