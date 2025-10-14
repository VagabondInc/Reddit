/*
  Vercel serverless function: Orchestrates final song generation and publishing
  - Creates a short loopable video prompt via OpenAI (configurable model)
  - Generates a 10s video loop with Segmind WAN 2.2 T2V
  - Generates audio track from lyrics with Segmind ACE Step (or accepts provided audioUrl)
  - Muxes audio + looped video to full-length MP4 using ffmpeg-static
  - Uploads the MP4 as a native Reddit video post and returns the post URL

  Environment variables (set in Vercel Project Settings):
  - OPENAI_API_KEY
  - OPENAI_MODEL (e.g. gpt-5-nano)
  - SEGMIND_API_KEY
  - WAN_MODEL_ID (default: wan-2.2-t2v-fast)
  - REDDIT_CLIENT_ID
  - REDDIT_CLIENT_SECRET
  - REDDIT_USERNAME
  - REDDIT_PASSWORD
  - REDDIT_USER_AGENT (e.g. KarmaKaraokeBot/1.0 by u/yourname)
*/

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import Snoowrap from 'snoowrap';
import { titleFromPrompt } from '../lib/utils.js';

type GenerateBody = {
  postId?: string;
  subreddit: string;
  prompt: string; // e.g. "Make a Song About Your Least Favorite Subreddit"
  lyrics: string;
  audioUrl?: string; // optional pre-generated audio URL
};

const WAN_T2V_URL = 'https://api.segmind.com/v1/wan-2.2-t2v-fast';
const ACE_AUDIO_URL = 'https://api.segmind.com/v1/ace-step-audio';

function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function createVideoPrompt(lyrics: string, prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey: assertEnv('OPENAI_API_KEY') });
  const model = process.env.OPENAI_MODEL || 'gpt-5-nano';
  const sys = `You write terse, vivid 10-second loop video scene prompts for a music clip. Keep it SFW. Avoid text-on-screen. Describe seamless loopable motion.`;
  const user = `Theme: ${prompt}\n\nLyrics (top lines):\n${lyrics}\n\nReturn one line describing a loopable 10s scene (no camera jargon).`;

  // Use Chat Completions for broad compatibility
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    temperature: 0.8,
    max_tokens: 120,
  });
  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('OpenAI returned empty content');
  return content;
}

async function segmindT2V(prompt: string): Promise<Buffer> {
  const res = await fetch(WAN_T2V_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': assertEnv('SEGMIND_API_KEY'),
    },
    body: JSON.stringify({
      seed: null,
      prompt,
      go_fast: true,
      num_frames: 81,
      resolution: '480p',
      aspect_ratio: '16:9',
      frames_per_second: 16,
    }),
  });
  if (!res.ok) throw new Error(`Segmind T2V failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function segmindAudio(lyrics: string, prompt: string): Promise<Buffer> {
  const musicPrompt = `Create an upbeat pop song with catchy melody and humor based on: "${prompt}"\n\nLyrics:\n${lyrics}\n\nReturn a 30-second track with clear vocals.`;
  const res = await fetch(ACE_AUDIO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': assertEnv('SEGMIND_API_KEY'),
    },
    body: JSON.stringify({
      prompt: musicPrompt,
      duration: 30,
      guidance_scale: 7.5,
      num_inference_steps: 50,
      seed: Math.floor(Math.random() * 1e6),
    }),
  });
  if (!res.ok) throw new Error(`Segmind audio failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function muxLoopedVideoWithAudio(videoBuf: Buffer, audioBuf: Buffer): Promise<string> {
  if (!ffmpegPath) throw new Error('ffmpeg-static path not found');
  (ffmpeg as any).setFfmpegPath(ffmpegPath);

  const tmpDir = '/tmp/karma-karaoke';
  await fs.mkdir(tmpDir, { recursive: true });
  const videoIn = path.join(tmpDir, 'in_video.mp4');
  const audioIn = path.join(tmpDir, 'in_audio.mp3');
  const outPath = path.join(tmpDir, 'out_mux.mp4');
  await fs.writeFile(videoIn, videoBuf);
  await fs.writeFile(audioIn, audioBuf);

  // Loop the 10s video to the audio duration using -stream_loop -1 and -shortest
  await new Promise<void>((resolve, reject) => {
    (ffmpeg as any)()
      .input(videoIn)
      .inputOptions(['-stream_loop', '-1'])
      .input(audioIn)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-shortest', '-movflags', '+faststart'])
      .output(outPath)
      .on('error', reject)
      .on('end', () => resolve())
      .run();
  });
  return outPath;
}

async function submitRedditVideo(subreddit: string, title: string, videoPath: string): Promise<string> {
  const r = new Snoowrap({
    userAgent: assertEnv('REDDIT_USER_AGENT'),
    clientId: assertEnv('REDDIT_CLIENT_ID'),
    clientSecret: assertEnv('REDDIT_CLIENT_SECRET'),
    username: assertEnv('REDDIT_USERNAME'),
    password: assertEnv('REDDIT_PASSWORD'),
  });
  const sub = await r.getSubreddit(subreddit);
  const submission = await (sub as any).submitVideo({
    title,
    videoFile: videoPath,
  });
  return `https://www.reddit.com${submission.permalink}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
    const body = (req.body || {}) as GenerateBody;
    const { subreddit, prompt, lyrics } = body;
    if (!subreddit || !prompt || !lyrics) return res.status(400).json({ ok: false, error: 'Missing fields' });

    // 1) Create a loopable scene prompt
    const scene = await createVideoPrompt(lyrics, prompt);

    // 2) Generate 10s video loop
    const video10s = await segmindT2V(scene);

    // 3) Generate audio track (or fetch provided)
    const audio = body.audioUrl
      ? Buffer.from(await (await fetch(body.audioUrl)).arrayBuffer())
      : await segmindAudio(lyrics, prompt);

    // 4) Mux looped video with audio
    const finalPath = await muxLoopedVideoWithAudio(video10s, audio);

    // 5) Post to Reddit as native video
    const title = titleFromPrompt(prompt);
    const url = await submitRedditVideo(subreddit, title, finalPath);

    return res.status(200).json({ ok: true, videoPostUrl: url });
  } catch (err: any) {
    console.error('Generate API error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Internal error' });
  }
}
