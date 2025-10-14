import { Comment, RedditAPIClient } from '@devvit/public-api';
import { RedisClient } from '@devvit/public-api';

export interface LyricLine {
  line: string;
  author: string;
  votes: number;
  commentId: string;
  timestamp: number;
}

export class LyricEngine {
  constructor(
    private redis: RedisClient,
    private reddit: RedditAPIClient
  ) {}

  /**
   * Collects and validates a lyric line from a comment
   */
  async collectLyric(comment: Comment, postId: string): Promise<boolean> {
    const line = comment.body.trim();

    // Validation rules
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

    // Store in Redis
    const key = `lyrics:${postId}`;
    const existing = await this.redis.get(key);
    const lyrics: LyricLine[] = existing ? JSON.parse(existing) : [];

    // Check for duplicates
    const isDuplicate = lyrics.some(l => l.commentId === lyric.commentId);
    if (isDuplicate) {
      return false;
    }

    lyrics.push(lyric);
    await this.redis.set(key, JSON.stringify(lyrics));

    return true;
  }

  /**
   * Updates vote counts for all lyrics in a round
   */
  async updateVotes(postId: string): Promise<void> {
    const key = `lyrics:${postId}`;
    const stored = await this.redis.get(key);

    if (!stored) return;

    const lyrics: LyricLine[] = JSON.parse(stored);

    // Fetch updated scores from Reddit
    for (const lyric of lyrics) {
      try {
        const comment = await this.reddit.getCommentById(lyric.commentId);
        lyric.votes = comment.score;
      } catch (error) {
        console.error(`Failed to update votes for ${lyric.commentId}:`, error);
      }
    }

    // Sort by votes descending
    lyrics.sort((a, b) => b.votes - a.votes);

    await this.redis.set(key, JSON.stringify(lyrics));
  }

  /**
   * Gets the top N lyrics for a round
   */
  async getTopLyrics(postId: string, count: number = 8): Promise<LyricLine[]> {
    const key = `lyrics:${postId}`;
    const stored = await this.redis.get(key);

    if (!stored) return [];

    const lyrics: LyricLine[] = JSON.parse(stored);
    return lyrics.slice(0, count);
  }

  /**
   * Formats top lyrics into a song structure (verse-chorus-verse)
   */
  async formatSongLyrics(postId: string): Promise<string> {
    const topLyrics = await this.getTopLyrics(postId, 8);

    if (topLyrics.length < 4) {
      return 'Not enough lyrics submitted for this round.';
    }

    // Structure: Verse (4 lines) + Chorus (4 lines)
    const verse = topLyrics.slice(0, 4).map(l => l.line).join('\n');
    const chorus = topLyrics.slice(4, 8).map(l => l.line).join('\n');

    return `[Verse]\n${verse}\n\n[Chorus]\n${chorus}`;
  }

  /**
   * Validates if a comment is a valid lyric submission
   */
  private isValidLyric(line: string): boolean {
    // Must be between 10 and 200 characters
    if (line.length < 10 || line.length > 200) {
      return false;
    }

    // Must not contain URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (urlPattern.test(line)) {
      return false;
    }

    // Must not be all caps (shouting)
    if (line === line.toUpperCase() && line.length > 20) {
      return false;
    }

    // Basic profanity filter (can be expanded)
    const profanityPattern = /\b(fuck|shit|damn)\b/gi;
    const profanityCount = (line.match(profanityPattern) || []).length;
    if (profanityCount > 2) {
      return false;
    }

    return true;
  }

  /**
   * Gets all contributors for a round
   */
  async getContributors(postId: string): Promise<string[]> {
    const topLyrics = await this.getTopLyrics(postId, 8);
    const contributors = [...new Set(topLyrics.map(l => l.author))];
    return contributors;
  }

  /**
   * Clears lyrics for a round (for testing or reset)
   */
  async clearRound(postId: string): Promise<void> {
    await this.redis.del(`lyrics:${postId}`);
    await this.redis.del(`round:${postId}`);
  }
}
