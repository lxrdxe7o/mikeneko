/**
 * Vote Manager
 * Handles vote tracking for skip votes and other voting features
 */

export class VoteManager {
  private votes: Map<string, Set<string>> = new Map();

  /**
   * Add a vote for a guild
   * @returns true if vote was added, false if user already voted
   */
  addVote(guildId: string, userId: string): boolean {
    if (!this.votes.has(guildId)) {
      this.votes.set(guildId, new Set());
    }

    const guildVotes = this.votes.get(guildId)!;

    // Check if user already voted
    if (guildVotes.has(userId)) {
      return false;
    }

    guildVotes.add(userId);
    return true;
  }

  /**
   * Check if vote threshold has been reached
   * @param voiceChannelSize - Number of users in voice channel (excluding bots)
   * @param threshold - Required percentage (0-100)
   */
  checkThreshold(
    guildId: string,
    voiceChannelSize: number,
    threshold: number
  ): boolean {
    const votes = this.votes.get(guildId)?.size || 0;
    const required = Math.ceil((voiceChannelSize - 1) * (threshold / 100));

    return votes >= required;
  }

  /**
   * Get current vote count for a guild
   */
  getVoteCount(guildId: string): number {
    return this.votes.get(guildId)?.size || 0;
  }

  /**
   * Calculate required votes for threshold
   */
  getRequiredVotes(voiceChannelSize: number, threshold: number): number {
    return Math.ceil((voiceChannelSize - 1) * (threshold / 100));
  }

  /**
   * Clear all votes for a guild
   */
  clearVotes(guildId: string): void {
    this.votes.delete(guildId);
  }

  /**
   * Check if a user has voted
   */
  hasVoted(guildId: string, userId: string): boolean {
    return this.votes.get(guildId)?.has(userId) || false;
  }

  /**
   * Remove a specific user's vote
   */
  removeVote(guildId: string, userId: string): boolean {
    const guildVotes = this.votes.get(guildId);
    if (!guildVotes) return false;

    return guildVotes.delete(userId);
  }
}
