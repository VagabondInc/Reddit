import { describe, it, expect } from 'vitest';
import { titleFromPrompt } from '../lib/utils';

describe('titleFromPrompt', () => {
  it('converts "Make a Song About X" to "My X"', () => {
    expect(titleFromPrompt('Make a Song About Coffee Addiction')).toBe('My Coffee Addiction');
  });

  it('preserves other prompts', () => {
    expect(titleFromPrompt('Your Least Favorite Subreddit Song')).toBe('Your Least Favorite Subreddit Song');
  });
});

