import type { VercelRequest, VercelResponse } from '@vercel/node';
import Snoowrap from 'snoowrap';
import { titleFromPrompt } from '../lib/utils.js';

type GenerateBody = {
  postId?: string;
  subreddit: string;
  prompt: string;
  lyrics: string;
  topUser?: string;
};

type SunoCreateResponse = {
  id?: string;
  task_id?: string;
  data?: {
    id?: string;
    task_id?: string;
  };
};

type SunoStatusResponse = {
  status?: string;
  audio_url?: string;
  data?: {
    status?: string;
    audio_url?: string;
    clips?: Array<{ audio_url?: string }>;
  };
};

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function sunoCreateSong(prompt: string, lyrics: string): Promise<string> {
  const baseUrl = process.env.SUNO_BASE_URL || 'https://api.sunoapi.org';
  const apiKey = assertEnv('SUNO_API_KEY');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      custom_mode: true,
      prompt,
      lyrics,
      model: process.env.SUNO_MODEL || 'v4',
      instrumental: false,
    }),
  });

  if (!response.ok) throw new Error(`Suno create failed: ${response.status}`);
  const json = (await response.json()) as SunoCreateResponse;
  const id = json.id || json.task_id || json.data?.id || json.data?.task_id;
  if (!id) throw new Error('Suno create returned no task id');
  return id;
}

async function sunoWaitForAudio(taskId: string): Promise<string> {
  const baseUrl = process.env.SUNO_BASE_URL || 'https://api.sunoapi.org';
  const apiKey = assertEnv('SUNO_API_KEY');

  for (let i = 0; i < 40; i++) {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/generate/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) throw new Error(`Suno status failed: ${response.status}`);
    const json = (await response.json()) as SunoStatusResponse;

    const status = json.status || json.data?.status;
    const audioUrl = json.audio_url || json.data?.audio_url || json.data?.clips?.[0]?.audio_url;
    if (audioUrl) return audioUrl;
    if (status === 'failed' || status === 'error') {
      throw new Error('Suno generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  throw new Error('Timed out waiting for Suno audio URL');
}

async function submitSongPost(subreddit: string, title: string, body: string): Promise<string> {
  const reddit = new Snoowrap({
    userAgent: assertEnv('REDDIT_USER_AGENT'),
    clientId: assertEnv('REDDIT_CLIENT_ID'),
    clientSecret: assertEnv('REDDIT_CLIENT_SECRET'),
    username: assertEnv('REDDIT_USERNAME'),
    password: assertEnv('REDDIT_PASSWORD'),
  });

  const sub = await reddit.getSubreddit(subreddit);
  const post = await sub.submitSelfpost({ title, text: body });
  return `https://www.reddit.com${post.permalink}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const body = (req.body || {}) as GenerateBody;
    if (!body.subreddit || !body.prompt || !body.lyrics) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    const sunoPrompt = `A funny community anthem. First verse roasts u/${body.topUser || 'Anonymous'} and the rest uses verbatim comment lyrics.`;
    const taskId = await sunoCreateSong(sunoPrompt, body.lyrics);
    const audioUrl = await sunoWaitForAudio(taskId);

    const title = `🎶 Karma Karaoke: ${titleFromPrompt(body.prompt)}`;
    const text = [
      `Generated with Suno from top-karma comments in the source thread.`,
      '',
      `🎧 Listen: ${audioUrl}`,
      '',
      '---',
      'Lyrics used:',
      body.lyrics,
    ].join('\n');

    const songPostUrl = await submitSongPost(body.subreddit, title, text);
    return res.status(200).json({ ok: true, songPostUrl, audioUrl });
  } catch (error: any) {
    console.error('Generate API error', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Internal error' });
  }
}
