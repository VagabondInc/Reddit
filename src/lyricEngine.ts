import { Comment, RedditAPIClient } from '@devvit/public-api';
import { RedisClient } from '@devvit/public-api';

export interface LyricLine {
  line: string;
  author: string;
  votes: number;
  commentId: string;
  timestamp: number;
}

export interface SongPayload {
  lyrics: string;
  topUser: string;
  topCommentAuthor: string;
  commentsUsed: LyricLine[];
}

export class LyricEngine {
  constructor(
    private redis: RedisClient,
    private reddit: RedditAPIClient
  ) {}

  async collectLyric(comment: Comment, postId: string): Promise<boolean> {
    const line = comment.body.trim();

    if (!this.isValidLyric(line)) {
      return false;
    }

    const lyric: LyricLine = {
      line,
      author: comment.authorName || 'Anonymous',
      votes: comment.score,
      commentId: comment.id,
      timestamp: Date.now(),
    };

    const key = `lyrics:${postId}`;
    const existing = await this.redis.get(key);
    const lyrics: LyricLine[] = existing ? JSON.parse(existing) : [];

    const isDuplicate = lyrics.some((l) => l.commentId === lyric.commentId);
    if (isDuplicate) {
      return false;
    }

    lyrics.push(lyric);
    await this.redis.set(key, JSON.stringify(lyrics));

    return true;
  }

  async updateVotes(postId: string): Promise<void> {
    const key = `lyrics:${postId}`;
    const stored = await this.redis.get(key);

    if (!stored) return;

    const lyrics: LyricLine[] = JSON.parse(stored);

    for (const lyric of lyrics) {
      try {
        const comment = await this.reddit.getCommentById(lyric.commentId);
        lyric.votes = comment.score;
      } catch (error) {
        console.error(`Failed to update votes for ${lyric.commentId}:`, error);
      }
    }

    lyrics.sort((a, b) => b.votes - a.votes || a.timestamp - b.timestamp);

    await this.redis.set(key, JSON.stringify(lyrics));
  }

  async getTopLyrics(postId: string, count: number = 12): Promise<LyricLine[]> {
    const key = `lyrics:${postId}`;
    const stored = await this.redis.get(key);

    if (!stored) return [];

    const lyrics: LyricLine[] = JSON.parse(stored);
    return lyrics.slice(0, count);
  }

  async buildSongPayload(postId: string): Promise<SongPayload | null> {
    const topLyrics = await this.getTopLyrics(postId, 12);
    if (topLyrics.length < 3) {
      return null;
    }

    const topComment = topLyrics[0];
    const topUser = topComment.author || 'Anonymous';
    const roast = [
      `[Verse 1 - Roast of u/${topUser}]`,
      `u/${topUser} posts hot takes like it's a full-time chore,`,
      `farming karma with confidence, but we all wanted more,`,
      `you won the thread tonight, now take this playful L,`,
      `your username is in the spotlight and the comments ring the bell.`,
      '',
      '[Verse 2+ - Top Comment Lyrics (verbatim)]',
    ];

    const verbatimLines = topLyrics.map((line) => line.line);
    return {
      lyrics: [...roast, ...verbatimLines].join('\n'),
      topUser,
      topCommentAuthor: topUser,
      commentsUsed: topLyrics,
    };
  }

  private isValidLyric(line: string): boolean {
    if (line.length < 6 || line.length > 240) {
      return false;
    }

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (urlPattern.test(line)) {
      return false;
    }

    return true;
  }

  async getContributors(postId: string): Promise<string[]> {
    const topLyrics = await this.getTopLyrics(postId, 12);
    const contributors = [...new Set(topLyrics.map((l) => l.author))];
    return contributors;
  }

  async clearRound(postId: string): Promise<void> {
    await this.redis.del(`lyrics:${postId}`);
    await this.redis.del(`round:${postId}`);
  }
}

export function parseStartCommand(body: string): { isStart: boolean; minutes?: number } {
  const normalized = body.trim().toLowerCase();
  const m = normalized.match(/^!karma-karaoke\s+start(?:\s+(\d{1,4}))?$/);
  if (!m) return { isStart: false };
  const raw = m[1] ? Number(m[1]) : undefined;
  if (!raw || Number.isNaN(raw)) return { isStart: true };
  return { isStart: true, minutes: raw };
}
