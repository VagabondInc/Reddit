import { RedisClient } from '@devvit/public-api';

export interface AudioGenerationRequest {
  lyrics: string;
  prompt: string;
  style?: string;
}

export interface AudioGenerationResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

export class AudioGenerator {
  private readonly SEGMIND_API_URL = 'https://api.segmind.com/v1/ace-step-audio';
  private readonly API_KEY: string;

  constructor(
    private redis: RedisClient,
    apiKey: string
  ) {
    this.API_KEY = apiKey;
  }

  /**
   * Generates audio from lyrics using Segmind ACE Step API
   */
  async generateSong(
    postId: string,
    lyrics: string,
    prompt: string
  ): Promise<AudioGenerationResponse> {
    try {
      // Format the prompt for music generation
      const musicPrompt = this.formatMusicPrompt(lyrics, prompt);

      // Call Segmind API
      const response = await fetch(this.SEGMIND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          prompt: musicPrompt,
          duration: 30, // 30 second clip
          guidance_scale: 7.5,
          num_inference_steps: 50,
          seed: Math.floor(Math.random() * 1000000),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Segmind API error:', error);
        return {
          success: false,
          error: `API error: ${response.status}`,
        };
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      // Store in Redis
      const audioKey = `audio:${postId}`;
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await this.redis.set(audioKey, base64Audio, { expiration: expirationDate });

      return {
        success: true,
        audioUrl: audioKey, // In production, would be uploaded to media storage
      };
    } catch (error) {
      console.error('Audio generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Formats lyrics and prompt into an optimized music generation prompt
   */
  private formatMusicPrompt(lyrics: string, gamePrompt: string): string {
    // Create a music-friendly description
    const style = 'upbeat pop song with catchy melody and humor';

    return `
Create a ${style} based on this theme: "${gamePrompt}"

Lyrics:
${lyrics}

Make it fun, energetic, and memorable with clear vocals.
`.trim();
  }

  /**
   * Retrieves generated audio from storage
   */
  async getAudio(postId: string): Promise<string | null> {
    const audioKey = `audio:${postId}`;
    const audio = await this.redis.get(audioKey);
    return audio;
  }

  /**
   * Generates a text-to-speech preview (fallback if music API fails)
   */
  async generateTTSPreview(lyrics: string): Promise<AudioGenerationResponse> {
    // Fallback: Simple TTS for testing
    // In production, could use a TTS API like ElevenLabs or Play.ht
    return {
      success: false,
      error: 'TTS fallback not implemented - music generation required',
    };
  }

  /**
   * Checks if audio generation is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const testResponse = await fetch(this.SEGMIND_API_URL, {
        method: 'HEAD',
        headers: {
          'x-api-key': this.API_KEY,
        },
      });
      return testResponse.ok || testResponse.status === 405; // HEAD might not be allowed
    } catch {
      return false;
    }
  }

  /**
   * Estimates generation time based on duration
   */
  estimateGenerationTime(duration: number): number {
    // Rough estimate: 2-3 seconds per second of audio
    return duration * 2.5;
  }

  /**
   * Creates a shareable audio URL (for production)
   */
  async createShareableUrl(postId: string): Promise<string | null> {
    // In production, would upload to Reddit media or external CDN
    // For now, returns a placeholder
    const audio = await this.getAudio(postId);
    if (!audio) return null;

    // This would be replaced with actual media upload
    return `https://example.com/karma-karaoke/${postId}.mp3`;
  }

  /**
   * Clears audio data for a post
   */
  async clearAudio(postId: string): Promise<void> {
    await this.redis.del(`audio:${postId}`);
  }
}

/**
 * Helper function to convert lyrics to a music-friendly format
 */
export function sanitizeLyricsForAudio(lyrics: string): string {
  return lyrics
    .replace(/[^\w\s.,!?'-]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Estimates audio file size for bandwidth planning
 */
export function estimateAudioSize(durationSeconds: number): number {
  // MP3 at 128kbps
  const kbps = 128;
  const bytes = (durationSeconds * kbps * 1000) / 8;
  return Math.round(bytes);
}
