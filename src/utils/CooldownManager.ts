/**
 * Cooldown Manager
 * Prevents command spam by enforcing per-user cooldowns
 */

export interface CooldownResult {
  onCooldown: boolean;
  remaining: number; // seconds remaining
}

export class CooldownManager {
  private cooldowns: Map<string, Map<string, number>> = new Map();

  /**
   * Check if a user is on cooldown for a command
   * @param userId - Discord user ID
   * @param commandName - Name of the command
   * @param cooldownMs - Cooldown duration in milliseconds
   * @returns Object with cooldown status and remaining time
   */
  checkCooldown(
    userId: string,
    commandName: string,
    cooldownMs: number
  ): CooldownResult {
    const now = Date.now();

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const commandCooldowns = this.cooldowns.get(commandName)!;
    const expirationTime = commandCooldowns.get(userId);

    if (expirationTime && now < expirationTime) {
      return {
        onCooldown: true,
        remaining: Math.ceil((expirationTime - now) / 1000)
      };
    }

    // Set new cooldown
    commandCooldowns.set(userId, now + cooldownMs);

    // Clean up expired cooldowns after setting new one
    this.cleanup(commandName);

    return { onCooldown: false, remaining: 0 };
  }

  /**
   * Clear cooldown for a specific user and command
   */
  clearCooldown(userId: string, commandName: string): void {
    const commandCooldowns = this.cooldowns.get(commandName);
    if (commandCooldowns) {
      commandCooldowns.delete(userId);
    }
  }

  /**
   * Clear all cooldowns for a user across all commands
   */
  clearUserCooldowns(userId: string): void {
    for (const [, commandCooldowns] of this.cooldowns) {
      commandCooldowns.delete(userId);
    }
  }

  /**
   * Clear all cooldowns for a command
   */
  clearCommandCooldowns(commandName: string): void {
    this.cooldowns.delete(commandName);
  }

  /**
   * Remove expired cooldowns to prevent memory leaks
   */
  private cleanup(commandName: string): void {
    const now = Date.now();
    const commandCooldowns = this.cooldowns.get(commandName);

    if (!commandCooldowns) return;

    for (const [userId, expirationTime] of commandCooldowns.entries()) {
      if (now >= expirationTime) {
        commandCooldowns.delete(userId);
      }
    }

    // Remove command entry if no cooldowns remain
    if (commandCooldowns.size === 0) {
      this.cooldowns.delete(commandName);
    }
  }

  /**
   * Get time remaining on cooldown (in seconds)
   */
  getTimeRemaining(userId: string, commandName: string): number {
    const commandCooldowns = this.cooldowns.get(commandName);
    if (!commandCooldowns) return 0;

    const expirationTime = commandCooldowns.get(userId);
    if (!expirationTime) return 0;

    const remaining = Math.ceil((expirationTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }
}
