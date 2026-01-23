import { Client } from "discord.js";
import { Shoukaku, Connectors, NodeOption, LoadType, Track } from "shoukaku";
import { config } from "../config/environment";

export interface SearchResponse {
  tracks: Track[];
  loadType: LoadType;
}

export class LavalinkManager {
  public shoukaku: Shoukaku;

  constructor(client: Client) {
    const nodes: NodeOption[] = [
      {
        name: "main-node",
        url: `${config.lavalink.host}:${config.lavalink.port}`,
        auth: config.lavalink.password,
        secure: config.lavalink.secure,
      },
    ];

    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
      reconnectInterval: 5000,
      reconnectTries: 100,
      restTimeout: 60000,
      moveOnDisconnect: false,
      userAgent: "DiscordMusicBot/1.0.0",

    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.shoukaku.on("ready", (name: string) => {
      console.log(`✅ Lavalink node "${name}" is ready!`);
    });

    this.shoukaku.on("error", (name: string, error: Error) => {
      console.error(`❌ Lavalink node "${name}" encountered an error:`, error);
    });

    this.shoukaku.on("close", (name: string, code: number, reason: string) => {
      console.warn(
        `⚠️  Lavalink node "${name}" closed. Code: ${code}, Reason: ${reason}`,
      );
    });

    this.shoukaku.on("disconnect", (name: string, count: number) => {
      console.warn(
        `🔌 Lavalink node "${name}" disconnected. Retry count: ${count}`,
      );
    });

    this.shoukaku.on(
      "reconnecting",
      (name: string, reconnectAttempt: number, timeout: number) => {
        console.log(
          `🔄 Reconnecting to Lavalink node "${name}"... Attempt: ${reconnectAttempt}, Timeout: ${timeout}ms`,
        );
      },
    );

    this.shoukaku.on("debug", (name: string, info: string) => {
      console.log(`🐛 [${name}] ${info}`);
    });
  }

  public getNode() {
    const node = this.shoukaku.getIdealNode();
    if (!node) {
      throw new Error("No Lavalink nodes are available");
    }
    return node;
  }

  public async search(query: string): Promise<SearchResponse | null> {
    const node = this.getNode();

    let searchQuery = query;
    if (!query.startsWith("http")) {
      searchQuery = `ytsearch:${query}`;
    }

    console.log(`[DEBUG] Searching Lavalink with query: ${searchQuery}`);
    const result = await node.rest.resolve(searchQuery);

    if (!result) {
      console.log(`[DEBUG] No result from Lavalink for query: ${searchQuery}`);
      return null;
    }

    // Convert the new Shoukaku response format to our SearchResponse
    let tracks: Track[] = [];

    switch (result.loadType) {
      case LoadType.TRACK:
        tracks = [result.data];
        break;
      case LoadType.SEARCH:
        tracks = result.data;
        break;
      case LoadType.PLAYLIST:
        tracks = result.data.tracks;
        break;
      case LoadType.EMPTY:
        console.log(`[DEBUG] Lavalink returned EMPTY loadType`);
        return null;
      case LoadType.ERROR:
        console.error(`[DEBUG] Lavalink returned ERROR loadType`, result.data);
        return null;
    }

    if (tracks.length === 0) {
      console.log(`[DEBUG] No tracks found in result`);
      return null;
    }

    console.log(`[DEBUG] Found ${tracks.length} tracks. First track: ${tracks[0].info.title}`);
    return { tracks, loadType: result.loadType };
  }
}
