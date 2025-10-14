import { describe, it, expect } from 'vitest';
import { sanitizeLyricsForAudio, estimateAudioSize } from '../src/audioGen';

describe('audioGen helpers', () => {
  it('sanitizeLyricsForAudio removes special chars and trims whitespace', () => {
    const input = " Hello!! $$ This\t is\n a\n\t test — song 🎵 ";
    const out = sanitizeLyricsForAudio(input);
    // Em dashes and emoji are removed by sanitizer
    expect(out).toBe('Hello!! This is a test song');
  });

  it('estimateAudioSize approximates MP3 size at 128kbps', () => {
    const thirtySec = estimateAudioSize(30);
    // 30s * 128kbps ~= 480,000 bytes; allow small delta
    expect(thirtySec).toBeGreaterThan(450_000);
    expect(thirtySec).toBeLessThan(520_000);
  });
});
