import { describe, it, expect } from 'vitest';
import { parseStartCommand } from '../src/lyricEngine';

describe('parseStartCommand', () => {
  it('parses explicit minute countdown', () => {
    expect(parseStartCommand('!karma-karaoke start 90')).toEqual({ isStart: true, minutes: 90 });
  });

  it('parses start with default duration', () => {
    expect(parseStartCommand('!karma-karaoke start')).toEqual({ isStart: true });
  });

  it('ignores unrelated comments', () => {
    expect(parseStartCommand('hello world')).toEqual({ isStart: false });
  });
});
