import { TriggerContext, Comment, Post } from '@devvit/public-api';
import { LyricEngine } from './lyricEngine.js';
import { AudioGenerator } from './audioGen.js';

export interface RoundState {
  prompt: string;
  roundNumber: number;
  status: 'active' | 'generating' | 'completed';
  startTime: number;
  endTime: number;
  audioUrl?: string;
}

export class KiroHooks {
  private lyricEngine: LyricEngine;
  private audioGenerator: AudioGenerator;

  // Round duration in milliseconds (default: 24 hours)
  private readonly ROUND_DURATION = 24 * 60 * 60 * 1000;

  constructor(
    lyricEngine: LyricEngine,
    audioGenerator: AudioGenerator
  ) {
    this.lyricEngine = lyricEngine;
    this.audioGenerator = audioGenerator;
  }

  /**
   * Hook: Triggered when a new comment is added to a Karma Karaoke post
   */
  async onCommentAdd(comment: Comment, context: TriggerContext): Promise<void> {
    try {
      const postId = comment.postId;
      const { redis } = context;

      // Get current round state
      const roundKey = `round:${postId}`;
      const roundData = await redis.get(roundKey);

      if (!roundData) {
        console.log('No active round found for post:', postId);
        return;
      }

      const round: RoundState = JSON.parse(roundData);

      // Only collect lyrics if round is active
      if (round.status !== 'active') {
        console.log('Round is not active, ignoring comment');
        return;
      }

      // Check if round has expired
      if (Date.now() > round.endTime) {
        console.log('Round has expired, triggering completion');
        await this.onRoundEnd(postId, context);
        return;
      }

      // Collect the lyric
      const success = await this.lyricEngine.collectLyric(comment, postId);

      if (success) {
        console.log(`Collected lyric from ${comment.authorName}: "${comment.body}"`);

        // Update vote counts periodically
        await this.lyricEngine.updateVotes(postId);
      }
    } catch (error) {
      console.error('Error in onCommentAdd hook:', error);
    }
  }

  /**
   * Hook: Triggered when a comment receives upvotes
   */
  async onVoteChange(comment: Comment, context: TriggerContext): Promise<void> {
    try {
      const postId = comment.postId;

      // Update vote counts for the round
      await this.lyricEngine.updateVotes(postId);

      console.log(`Updated votes for post ${postId}`);
    } catch (error) {
      console.error('Error in onVoteChange hook:', error);
    }
  }

  /**
   * Hook: Triggered when a round ends (either by timer or manually)
   */
  async onRoundEnd(postId: string, context: TriggerContext): Promise<void> {
    try {
      const { redis, reddit } = context;
      const roundKey = `round:${postId}`;
      const roundData = await redis.get(roundKey);

      if (!roundData) {
        console.log('No round data found');
        return;
      }

      const round: RoundState = JSON.parse(roundData);

      // Prevent duplicate processing
      if (round.status !== 'active') {
        console.log('Round already processed');
        return;
      }

      // Update status to generating
      round.status = 'generating';
      await redis.set(roundKey, JSON.stringify(round));

      console.log('Starting audio generation for round', round.roundNumber);

      // Final vote update
      await this.lyricEngine.updateVotes(postId);

      // Get formatted lyrics
      const lyrics = await this.lyricEngine.formatSongLyrics(postId);

      if (lyrics.includes('Not enough lyrics')) {
        console.log('Insufficient lyrics for song generation');
        round.status = 'completed';
        await redis.set(roundKey, JSON.stringify(round));
        return;
      }

      // Generate audio
      const result = await this.audioGenerator.generateSong(
        postId,
        lyrics,
        round.prompt
      );

      if (result.success) {
        round.status = 'completed';
        round.audioUrl = result.audioUrl;
        await redis.set(roundKey, JSON.stringify(round));

        // Get contributors
        const contributors = await this.lyricEngine.getContributors(postId);

        // Post a completion comment
        await reddit.submitComment({
          id: postId,
          text: `🎉 **Song Complete!**\n\nThanks to our lyricists: ${contributors.join(', ')}\n\nClick the "Play Final Song" button above to hear your creation!`,
        });

        console.log('Round completed successfully');
      } else {
        console.error('Audio generation failed:', result.error);
        round.status = 'active'; // Revert to active for retry
        await redis.set(roundKey, JSON.stringify(round));
      }
    } catch (error) {
      console.error('Error in onRoundEnd hook:', error);
    }
  }

  /**
   * Hook: Scheduled task to check for expired rounds
   */
  async checkExpiredRounds(context: TriggerContext): Promise<void> {
    try {
      const { redis } = context;

      // In production, would scan all active rounds
      // For now, this is a placeholder for the scheduler
      console.log('Checking for expired rounds...');

      // This would be called by a Devvit scheduler
      // Example: Devvit.addSchedulerJob({ cron: '0 * * * *', handler: checkExpiredRounds })
    } catch (error) {
      console.error('Error checking expired rounds:', error);
    }
  }

  /**
   * Creates a new round
   */
  async createRound(
    postId: string,
    prompt: string,
    roundNumber: number,
    context: TriggerContext
  ): Promise<void> {
    const { redis } = context;

    const round: RoundState = {
      prompt,
      roundNumber,
      status: 'active',
      startTime: Date.now(),
      endTime: Date.now() + this.ROUND_DURATION,
    };

    await redis.set(`round:${postId}`, JSON.stringify(round));
    console.log(`Created round ${roundNumber} for post ${postId}`);
  }

  /**
   * Gets current round state
   */
  async getRoundState(postId: string, context: TriggerContext): Promise<RoundState | null> {
    const { redis } = context;
    const data = await redis.get(`round:${postId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Manually triggers round completion (for testing)
   */
  async forceRoundEnd(postId: string, context: TriggerContext): Promise<void> {
    console.log('Force ending round:', postId);
    await this.onRoundEnd(postId, context);
  }
}

/**
 * Helper: Calculates time remaining in a round
 */
export function getRoundTimeRemaining(round: RoundState): number {
  const remaining = round.endTime - Date.now();
  return Math.max(0, remaining);
}

/**
 * Helper: Formats time remaining as a human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
