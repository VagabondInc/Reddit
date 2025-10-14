import { Devvit, useState, SettingScope, useAsync, useInterval } from '@devvit/public-api';
import { KiroHooks } from './kiroHooks.js';
import { LyricEngine } from './lyricEngine.js';

// Configure Devvit plugins
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// Global app settings
Devvit.addSettings([
  {
    type: 'string',
    name: 'SEGMIND_API_KEY',
    label: 'Segmind API Key',
    scope: SettingScope.App,
    isSecret: true,
  },
  {
    type: 'string',
    name: 'SERVER_BASE_URL',
    label: 'Server Base URL (Vercel) — e.g. https://karma-karaoke.vercel.app',
    scope: SettingScope.App,
  },
]);

// Temporary admin form to configure Segmind key when Devvit settings are unavailable.
const segmindForm = Devvit.createForm(
  {
    title: 'Configure Segmind',
    acceptLabel: 'Save',
    cancelLabel: 'Cancel',
    fields: [
      {
        type: 'string',
        name: 'apiKey',
        label: 'Segmind API Key',
      },
    ],
  },
  async (event, context) => {
    const apiKey = (event.values?.apiKey ?? '').toString().trim();
    if (!apiKey) {
      context.ui.showToast('No key entered.');
      return;
    }
    await context.redis.set('secret:SEGMIND_API_KEY', apiKey);
    context.ui.showToast('Segmind API key saved for this app.');
  }
);
Devvit.addMenuItem({
  label: 'Configure Segmind API Key',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    try {
      context.ui.showForm(segmindForm);
    } catch (e) {
      context.ui.showToast('Unable to show config form.');
    }
  },
});

// Custom Post Type: Karma Karaoke
Devvit.addCustomPostType({
  name: 'Karma Karaoke',
  description: 'A collaborative lyric-writing game with AI-generated songs',
  render: (context) => {
    const [now, setNow] = useState(Date.now());
    const postId = (context as any).postData?.id as string | undefined;

    // Drive a 1s tick to update countdown
    const ticker = useInterval(() => {
      setNow(Date.now());
    }, 1000);
    ticker.start();

    // Load round state for this post (created when the round was posted)
    const { data: round } = useAsync(async () => {
      if (!postId) return undefined;
      const data = await context.redis.get(`round:${postId}`);
      return data ? JSON.parse(data as string) : undefined;
    });

    // Compute remaining time
    let timeLeft = '';
    if (round?.endTime) {
      const ms = Math.max(0, round.endTime - now);
      const s = Math.floor(ms / 1000);
      const hh = Math.floor(s / 3600).toString().padStart(2, '0');
      const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
      const ss = Math.floor(s % 60).toString().padStart(2, '0');
      timeLeft = `${hh}:${mm}:${ss}`;
    }

    return (
      <vstack padding="large" gap="large" alignment="center middle">
        <image url="https://www.karma-karaoke.lol/karma-karaoke-logo-full.png" imageWidth={192} imageHeight={192} description="Karma Karaoke" />

        <vstack gap="small" alignment="center middle">
          <text size="large" color="neutral-content-weak">Round #1</text>
        </vstack>

        {/* CTA pill */}
        <vstack
          padding="medium"
          cornerRadius="full"
          backgroundColor="neutral-background-strong"
          alignment="center middle"
        >
          <text size="large" weight="bold" color="neutral-content-strong">
            Make a Song About Your Least Favorite Subreddit
          </text>
        </vstack>

        {/* Bulleted rules + countdown */}
        <vstack padding="small" gap="small" alignment="start middle">
          <hstack gap="small" alignment="start middle">
            <text>💬</text>
            <text size="small" color="neutral-content-weak">Submit lyrics in comments (one line per comment)</text>
          </hstack>
          <hstack gap="small" alignment="start middle">
            <text>⬆️</text>
            <text size="small" color="neutral-content-weak">Upvote your favorites</text>
          </hstack>
          <hstack gap="small" alignment="start middle">
            <text>⏰</text>
            <text size="small" color="neutral-content-weak">
              {timeLeft ? `Ends in ${timeLeft}` : 'Calculating end time…'}
            </text>
          </hstack>
        </vstack>

        {/* Show play link when server has published the video */}
        {round?.videoPostUrl ? (
          <vstack gap="small" alignment="center middle">
            <button appearance="primary" onPress={() => context.ui.navigateTo(round.videoPostUrl!)}>
              ▶️ Play Final Song on Reddit
            </button>
          </vstack>
        ) : (
          <text size="small" color="neutral-content-weak">Powered by Devvit & Kiro</text>
        )}
      </vstack>
    );
  },
});

// Menu action to create a new Karma Karaoke round
Devvit.addMenuItem({
  label: 'Create Karma Karaoke Round',
  location: 'subreddit',
  onPress: async (_event, context) => {
  const { reddit, ui, redis } = context;

    const subreddit = await reddit.getCurrentSubreddit();
  const post = await reddit.submitPost({
      title: '🎤 Karma Karaoke Round #1 – Make a Song About Your Least Favorite Subreddit',
      subredditName: subreddit.name,
      preview: (
        <vstack padding="medium" alignment="center middle">
          <text size="large">🎤 Karma Karaoke</text>
          <text>Loading…</text>
        </vstack>
      ),
    });

    // Initialize and persist round state (24h window)
    const start = Date.now();
    const end = start + 24 * 60 * 60 * 1000;
    const round = {
      prompt: 'Make a Song About Your Least Favorite Subreddit',
      roundNumber: 1,
      status: 'active',
      startTime: start,
      endTime: end,
      subredditName: subreddit.name,
    };
    await redis.set(`round:${post.id}`, JSON.stringify(round));

    ui.showToast(`Created Karma Karaoke round!`);
    ui.navigateTo(post);
  },
});

export default Devvit;

// Moderator menu: Force generate (calls server) on a specific post
Devvit.addMenuItem({
  label: 'Reveal Song (Generate Video)',
  location: 'post',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    try {
      const postId = (event as any).postId ?? (context as any).postId;
      if (!postId) {
        context.ui.showToast('No post id available');
        return;
      }
      const engine = new LyricEngine(context.redis, context.reddit);
      const hooks = new KiroHooks(engine);
      await hooks.onRoundEnd(postId, context as any);
      context.ui.showToast('Generation started');
    } catch (e) {
      context.ui.showToast('Failed to start generation');
    }
  },
});
