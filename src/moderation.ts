/**
 * Content moderation utilities for Karma Karaoke
 * Ensures safe and appropriate lyric submissions
 */

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  flags?: string[];
}

export class ContentModerator {
  // Common profanity patterns (expandable)
  private readonly PROFANITY_PATTERNS = [
    /\b(fuck|shit|bitch|asshole|cunt|dick|pussy)\b/gi,
  ];

  // Spam patterns
  private readonly SPAM_PATTERNS = [
    /(.)\1{10,}/, // Repeated characters
    /\b(buy|sell|click|subscribe|follow)\b.*\b(now|here|link)\b/i,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
  ];

  // Harmful content patterns
  private readonly HARMFUL_PATTERNS = [
    /\b(kill|murder|suicide|self-harm|die)\b/gi,
    /\b(nazi|hitler|holocaust)\b/gi,
    /\b(terrorist|terrorism|bomb)\b/gi,
  ];

  // Slur detection (basic list - should be expanded)
  private readonly SLUR_PATTERNS = [
    /\b(n[i1]gg[ae]r|f[a4]gg[o0]t|tr[a4]nny|ret[a4]rd)\b/gi,
  ];

  /**
   * Main moderation check for lyric submissions
   */
  moderateLyric(content: string): ModerationResult {
    const flags: string[] = [];

    // Check for profanity (allow minimal usage)
    const profanityCount = this.countMatches(content, this.PROFANITY_PATTERNS);
    if (profanityCount > 2) {
      flags.push('excessive-profanity');
    }

    // Check for slurs (zero tolerance)
    if (this.hasMatch(content, this.SLUR_PATTERNS)) {
      return {
        approved: false,
        reason: 'Content contains prohibited slurs',
        flags: ['slur'],
      };
    }

    // Check for harmful content
    if (this.hasMatch(content, this.HARMFUL_PATTERNS)) {
      return {
        approved: false,
        reason: 'Content contains harmful or violent language',
        flags: ['harmful-content'],
      };
    }

    // Check for spam
    if (this.hasMatch(content, this.SPAM_PATTERNS)) {
      return {
        approved: false,
        reason: 'Content appears to be spam',
        flags: ['spam'],
      };
    }

    // Check length
    if (content.length < 10) {
      return {
        approved: false,
        reason: 'Lyric too short (minimum 10 characters)',
        flags: ['too-short'],
      };
    }

    if (content.length > 200) {
      return {
        approved: false,
        reason: 'Lyric too long (maximum 200 characters)',
        flags: ['too-long'],
      };
    }

    // Check for URLs
    if (this.containsUrl(content)) {
      return {
        approved: false,
        reason: 'URLs not allowed in lyrics',
        flags: ['url'],
      };
    }

    // Check for excessive caps (shouting)
    if (this.isExcessiveCaps(content)) {
      flags.push('excessive-caps');
    }

    // Approve with warnings if any flags
    return {
      approved: true,
      flags: flags.length > 0 ? flags : undefined,
    };
  }

  /**
   * Rate limit check for user submissions
   */
  checkRateLimit(
    userId: string,
    recentSubmissions: Map<string, number[]>
  ): ModerationResult {
    const now = Date.now();
    const userTimes = recentSubmissions.get(userId) || [];

    // Remove submissions older than 1 hour
    const recentTimes = userTimes.filter(time => now - time < 60 * 60 * 1000);

    // Max 5 submissions per hour
    if (recentTimes.length >= 5) {
      return {
        approved: false,
        reason: 'Rate limit exceeded (max 5 per hour)',
        flags: ['rate-limit'],
      };
    }

    return { approved: true };
  }

  /**
   * Check for duplicate or similar submissions
   */
  checkDuplicate(
    newLyric: string,
    existingLyrics: string[],
    similarityThreshold: number = 0.8
  ): ModerationResult {
    const normalized = this.normalize(newLyric);

    for (const existing of existingLyrics) {
      const similarity = this.calculateSimilarity(normalized, this.normalize(existing));
      if (similarity > similarityThreshold) {
        return {
          approved: false,
          reason: 'Similar lyric already submitted',
          flags: ['duplicate'],
        };
      }
    }

    return { approved: true };
  }

  /**
   * Helper: Check if content matches any pattern
   */
  private hasMatch(content: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Helper: Count total matches across all patterns
   */
  private countMatches(content: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Helper: Check if content contains URLs
   */
  private containsUrl(content: string): boolean {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|\S+\.(com|net|org|io|co))/gi;
    return urlPattern.test(content);
  }

  /**
   * Helper: Check for excessive caps
   */
  private isExcessiveCaps(content: string): boolean {
    if (content.length < 20) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const ratio = capsCount / content.length;
    return ratio > 0.6;
  }

  /**
   * Helper: Normalize text for comparison
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Helper: Calculate similarity between two strings (Levenshtein-like)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Helper: Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Pre-defined prompt templates (safe and fun)
 */
export const SAFE_PROMPTS = [
  'Make a Song About Your Least Favorite Subreddit',
  'Write Lyrics About Monday Morning',
  'Create a Song About Your Pet',
  'Make a Parody About Cooking Disasters',
  'Write a Song About Video Game Rage Quits',
  'Create Lyrics About Coffee Addiction',
  'Make a Song About Traffic Jams',
  'Write a Parody About Bad WiFi',
  'Create a Song About Procrastination',
  'Make Lyrics About Awkward Zoom Calls',
];

/**
 * Get a random safe prompt
 */
export function getRandomPrompt(): string {
  return SAFE_PROMPTS[Math.floor(Math.random() * SAFE_PROMPTS.length)];
}
