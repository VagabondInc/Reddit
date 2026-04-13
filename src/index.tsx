import { Devvit, useState, SettingScope, useAsync, useInterval } from '@devvit/public-api';
import { KiroHooks } from './kiroHooks.js';
import { LyricEngine } from './lyricEngine.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

Devvit.addSettings([
  {
    type: 'string',
    name: 'SERVER_BASE_URL',
    label: 'Server Base URL (Vercel) — e.g. https://karma-karaoke.vercel.app',
    scope: SettingScope.App,
  },
  {
    type: 'number',
    name: 'DEFAULT_ROUND_MINUTES',
    label: 'Default countdown minutes',
    defaultValue: 60,
    scope: SettingScope.App,
  },
]);

Devvit.addCustomPostType({
  name: 'Karma Karaoke',
  description: 'Comment-triggered countdown + top-karma lyrics into a Suno song',
  render: (context) => {
    const [now, setNow] = useState(Date.now());
    const postId = (context as any).postData?.id as string | undefined;

    const ticker = useInterval(() => {
      setNow(Date.now());
    }, 1000);
    ticker.start();

    const { data: round } = useAsync(async () => {
      if (!postId) return undefined;
      const data = await context.redis.get(`round:${postId}`);
      return data ? JSON.parse(data as string) : undefined;
    });

    let timeLeft = 'No active countdown';
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
        <text size="xxlarge" weight="bold">🎤 Karma Karaoke</text>
        <text size="medium" color="neutral-content-weak">Start in comments with: !karma-karaoke start 60</text>
        <text size="large">Countdown: {timeLeft}</text>
        <text size="small" color="neutral-content-weak">When time expires, top-karma comments become lyrics. Verse 1 roasts the top poster.</text>

        {round?.songPostUrl ? (
          <button appearance="primary" onPress={() => context.ui.navigateTo(round.songPostUrl!)}>🎶 Open Song Post</button>
        ) : null}
      </vstack>
    );
  },
});

Devvit.addMenuItem({
  label: 'Create Karma Karaoke Post',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const subreddit = await context.reddit.getCurrentSubreddit();
    const post = await context.reddit.submitPost({
      title: '🎤 Karma Karaoke — Start by commenting !karma-karaoke start <minutes>',
      subredditName: subreddit.name,
      preview: (
        <vstack padding="medium" alignment="center middle">
          <text size="large">🎤 Karma Karaoke</text>
          <text>Comment: !karma-karaoke start 60</text>
        </vstack>
      ),
    });

    context.ui.showToast('Karaoke post created. Start it in comments!');
    context.ui.navigateTo(post);
  },
});

Devvit.addTrigger({
  event: 'CommentSubmit',
  onEvent: async (event, context) => {
    const comment = await context.reddit.getCommentById((event as any).comment.id);
    const engine = new LyricEngine(context.redis, context.reddit);
    const hooks = new KiroHooks(engine);
    await hooks.onCommentAdd(comment, context as any);
  },
});

Devvit.addMenuItem({
  label: 'Reveal Song Now',
  location: 'post',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    const postId = (event as any).postId ?? (context as any).postId;
    if (!postId) {
      context.ui.showToast('No post id');
      return;
    }
    const engine = new LyricEngine(context.redis, context.reddit);
    const hooks = new KiroHooks(engine);
    await hooks.forceRoundEnd(postId, context as any);
    context.ui.showToast('Generation queued.');
  },
});

export default Devvit;
