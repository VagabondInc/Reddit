import { TriggerContext, Comment } from '@devvit/public-api';
import { LyricEngine, parseStartCommand } from './lyricEngine.js';

export interface RoundState {
  prompt: string;
  roundNumber: number;
  status: 'active' | 'generating' | 'completed';
  startTime: number;
  endTime: number;
  subredditName?: string;
  songPostUrl?: string;
  startedBy?: string;
  durationMinutes?: number;
}

export class KiroHooks {
  private lyricEngine: LyricEngine;

  constructor(lyricEngine: LyricEngine) {
    this.lyricEngine = lyricEngine;
  }

  async onCommentAdd(comment: Comment, context: TriggerContext): Promise<void> {
    try {
      const postId = comment.postId;
      const { redis } = context;

      const startCmd = parseStartCommand(comment.body || '');
      if (startCmd.isStart) {
        const existing = await redis.get(`round:${postId}`);
        if (existing) {
          return;
        }

        const fallbackMins = Number((await context.settings.get('DEFAULT_ROUND_MINUTES')) || 60);
        const requested = startCmd.minutes ?? fallbackMins;
        const bounded = Math.max(1, Math.min(24 * 60, requested));
        await this.createRound(
          postId,
          'Karma Karaoke thread song',
          1,
          bounded,
          comment.authorName || 'Anonymous',
          context
        );
        await context.reddit.submitComment({
          id: postId,
          text: `🎤 Karma Karaoke started by u/${comment.authorName || 'Anonymous'}! Countdown: **${bounded} minute(s)**. Submit lyric comments now.`,
        });
        return;
      }

      const roundData = await redis.get(`round:${postId}`);
      if (!roundData) {
        return;
      }

      const round: RoundState = JSON.parse(roundData);
      if (round.status !== 'active') return;

      if (Date.now() > round.endTime) {
        await this.onRoundEnd(postId, context);
        return;
      }

      const success = await this.lyricEngine.collectLyric(comment, postId);
      if (success) {
        await this.lyricEngine.updateVotes(postId);
      }
    } catch (error) {
      console.error('Error in onCommentAdd hook:', error);
    }
  }

  async onRoundEnd(postId: string, context: TriggerContext): Promise<void> {
    try {
      const { redis } = context;
      const roundKey = `round:${postId}`;
      const roundData = await redis.get(roundKey);

      if (!roundData) return;

      const round: RoundState = JSON.parse(roundData);
      if (round.status !== 'active') return;

      round.status = 'generating';
      await redis.set(roundKey, JSON.stringify(round));

      await this.lyricEngine.updateVotes(postId);
      const songPayload = await this.lyricEngine.buildSongPayload(postId);

      if (!songPayload) {
        round.status = 'completed';
        await redis.set(roundKey, JSON.stringify(round));
        await context.reddit.submitComment({
          id: postId,
          text: 'Not enough lyric comments to generate a song yet. Need at least 3 valid comments.',
        });
        return;
      }

      const serverBase = (await context.settings.get('SERVER_BASE_URL')) as string | undefined;
      if (!serverBase) {
        round.status = 'active';
        await redis.set(roundKey, JSON.stringify(round));
        return;
      }

      const subredditName = round.subredditName || (await context.reddit.getCurrentSubreddit()).name;
      const resp = await (context as any).http.fetch(`${serverBase.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          subreddit: subredditName,
          prompt: round.prompt,
          lyrics: songPayload.lyrics,
          topUser: songPayload.topUser,
        }),
      });

      if (!resp.ok) {
        round.status = 'active';
        await redis.set(roundKey, JSON.stringify(round));
        return;
      }

      const data = (await resp.json()) as { ok: boolean; songPostUrl?: string };
      if (!data.ok || !data.songPostUrl) {
        round.status = 'active';
        await redis.set(roundKey, JSON.stringify(round));
        return;
      }

      round.status = 'completed';
      round.songPostUrl = data.songPostUrl;
      await redis.set(roundKey, JSON.stringify(round));

      const contributors = await this.lyricEngine.getContributors(postId);
      await context.reddit.submitComment({
        id: postId,
        text: `🎶 Song posted! Roast target: u/${songPayload.topUser}. Contributors: ${contributors.join(', ')}. Listen here: ${data.songPostUrl}`,
      });
    } catch (error) {
      console.error('Error in onRoundEnd hook:', error);
    }
  }

  async createRound(
    postId: string,
    prompt: string,
    roundNumber: number,
    durationMinutes: number,
    startedBy: string,
    context: TriggerContext
  ): Promise<void> {
    const { redis } = context;
    const start = Date.now();

    const round: RoundState = {
      prompt,
      roundNumber,
      status: 'active',
      startTime: start,
      endTime: start + durationMinutes * 60 * 1000,
      startedBy,
      durationMinutes,
    };

    await redis.set(`round:${postId}`, JSON.stringify(round));
  }

  async forceRoundEnd(postId: string, context: TriggerContext): Promise<void> {
    await this.onRoundEnd(postId, context);
  }
}

export function getRoundTimeRemaining(round: RoundState): number {
  const remaining = round.endTime - Date.now();
  return Math.max(0, remaining);
}

export function formatTimeRemaining(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
