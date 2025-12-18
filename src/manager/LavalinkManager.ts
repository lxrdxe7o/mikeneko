import { Client } from 'discord.js';
import { Shoukaku, Connectors, NodeOption } from 'shoukaku';
import { config } from '../config/environment';

export class LavalinkManager {
  public shoukaku: Shoukaku;
  private client: Client;

  constructor(client: Client) {
    this.client = client;

    const nodes: NodeOption[] = [
      {
        name: 'main-node',
        url: `${config.lavalink.host}:${config.lavalink.port}`,
        auth: config.lavalink.password,
        secure: config.lavalink.secure
      }
    ];

    this.shoukaku = new Shoukaku(
      new Connectors.DiscordJS(client),
      nodes,
      {
        reconnectInterval: 5000,
        reconnectTries: 3,
        restTimeout: 60000,
        moveOnDisconnect: false,
        userAgent: 'DiscordMusicBot/1.0.0',
        structures: {
          rest: undefined,
          player: undefined
        }
      }
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.shoukaku.on('ready', (name: string) => {
      console.log(`✅ Lavalink node "${name}" is ready!`);
    });

    this.shoukaku.on('error', (name: string, error: Error) => {
      console.error(`❌ Lavalink node "${name}" encountered an error:`, error);
    });

    this.shoukaku.on('close', (name: string, code: number, reason: string) => {
      console.warn(`⚠️  Lavalink node "${name}" closed. Code: ${code}, Reason: ${reason}`);
    });

    this.shoukaku.on('disconnect', (name: string, count: number) => {
      console.warn(`🔌 Lavalink node "${name}" disconnected. Retry count: ${count}`);
    });

    this.shoukaku.on('reconnecting', (name: string, reconnectAttempt: number, timeout: number) => {
      console.log(`🔄 Reconnecting to Lavalink node "${name}"... Attempt: ${reconnectAttempt}, Timeout: ${timeout}ms`);
    });

    this.shoukaku.on('debug', (name: string, info: string) => {
      console.log(`🐛 [${name}] ${info}`);
    });
  }

  public getNode() {
    const node = this.shoukaku.getIdealNode();
    if (!node) {
      throw new Error('No Lavalink nodes are available');
    }
    return node;
  }

  public async search(query: string) {
    const node = this.getNode();

    let searchQuery = query;
    if (!query.startsWith('http')) {
      searchQuery = `ytsearch:${query}`;
    }

    const result = await node.rest.resolve(searchQuery);

    if (!result || !result.tracks.length) {
      return null;
    }

    return result;
  }
}
