/**
 * Queue Manager
 * Manages music queue for each guild
 */

import { Track } from 'shoukaku';

export interface QueueTrack {
  track: Track;
  requestedBy: string; // User ID
  addedAt: Date;
}

export class QueueManager {
  private queues: Map<string, QueueTrack[]> = new Map();
  private nowPlaying: Map<string, QueueTrack | null> = new Map();

  /**
   * Add track to queue
   */
  addTrack(guildId: string, track: Track, requestedBy: string): number {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, []);
    }

    const queue = this.queues.get(guildId)!;
    const queueTrack: QueueTrack = {
      track,
      requestedBy,
      addedAt: new Date()
    };

    queue.push(queueTrack);
    return queue.length;
  }

  /**
   * Add multiple tracks to queue
   */
  addTracks(guildId: string, tracks: Track[], requestedBy: string): number {
    for (const track of tracks) {
      this.addTrack(guildId, track, requestedBy);
    }
    return this.getQueue(guildId).length;
  }

  /**
   * Get next track from queue
   */
  getNext(guildId: string): QueueTrack | null {
    const queue = this.queues.get(guildId);
    if (!queue || queue.length === 0) {
      return null;
    }

    return queue.shift()!;
  }

  /**
   * Get current queue
   */
  getQueue(guildId: string): QueueTrack[] {
    return this.queues.get(guildId) || [];
  }

  /**
   * Get queue size
   */
  getSize(guildId: string): number {
    return this.getQueue(guildId).length;
  }

  /**
   * Clear entire queue
   */
  clear(guildId: string): void {
    this.queues.delete(guildId);
    this.nowPlaying.delete(guildId);
  }

  /**
   * Remove track at specific position
   */
  remove(guildId: string, position: number): QueueTrack | null {
    const queue = this.queues.get(guildId);
    if (!queue || position < 0 || position >= queue.length) {
      return null;
    }

    const removed = queue.splice(position, 1);
    return removed[0] || null;
  }

  /**
   * Move track from one position to another
   */
  move(guildId: string, from: number, to: number): boolean {
    const queue = this.queues.get(guildId);
    if (!queue || from < 0 || from >= queue.length || to < 0 || to >= queue.length) {
      return false;
    }

    const track = queue.splice(from, 1)[0];
    queue.splice(to, 0, track);
    return true;
  }

  /**
   * Shuffle the queue
   */
  shuffle(guildId: string): boolean {
    const queue = this.queues.get(guildId);
    if (!queue || queue.length === 0) {
      return false;
    }

    // Fisher-Yates shuffle
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    return true;
  }

  /**
   * Set now playing track
   */
  setNowPlaying(guildId: string, track: QueueTrack | null): void {
    this.nowPlaying.set(guildId, track);
  }

  /**
   * Get now playing track
   */
  getNowPlaying(guildId: string): QueueTrack | null {
    return this.nowPlaying.get(guildId) || null;
  }

  /**
   * Get total duration of queue
   */
  getTotalDuration(guildId: string): number {
    const queue = this.getQueue(guildId);
    return queue.reduce((total, item) => total + (item.track.info.length || 0), 0);
  }

  /**
   * Check if queue is empty
   */
  isEmpty(guildId: string): boolean {
    return this.getSize(guildId) === 0;
  }

  /**
   * Get queue with pagination
   */
  getPage(guildId: string, page: number, pageSize: number = 10): {
    tracks: QueueTrack[];
    totalPages: number;
    currentPage: number;
    totalTracks: number;
  } {
    const queue = this.getQueue(guildId);
    const totalTracks = queue.length;
    const totalPages = Math.ceil(totalTracks / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const tracks = queue.slice(start, end);

    return {
      tracks,
      totalPages,
      currentPage,
      totalTracks
    };
  }
}
