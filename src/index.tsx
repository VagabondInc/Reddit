import { Devvit, useState, SettingScope } from '@devvit/public-api';

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
    const [counter] = useState(0);

    return (
      <vstack padding="large" gap="medium" alignment="center middle">
        <text size="xxlarge" weight="bold">🎤 Karma Karaoke</text>
        <text size="medium">Round #1</text>

        <vstack
          backgroundColor="neutral-background-weak"
          padding="medium"
          cornerRadius="medium"
        >
          <text size="large" weight="bold">
            Make a Song About Your Least Favorite Subreddit
          </text>
        </vstack>

        <vstack padding="small" gap="small">
          <text size="small" color="neutral-content-weak">
            💬 Submit lyrics in comments (one line per comment)
          </text>
          <text size="small" color="neutral-content-weak">
            ⬆️ Upvote your favorites
          </text>
          <text size="small" color="neutral-content-weak">
            ⏰ Round ends in 24 hours
          </text>
        </vstack>

        <text size="small" color="neutral-content-weak">
          Powered by Devvit & Kiro
        </text>
      </vstack>
    );
  },
});

// Menu action to create a new Karma Karaoke round
Devvit.addMenuItem({
  label: 'Create Karma Karaoke Round',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: '🎤 Karma Karaoke Round #1 – Make a Song About Your Least Favorite Subreddit',
      subredditName: subreddit.name,
      preview: (
        <vstack padding="medium" alignment="center middle">
          <text size="large">🎤 Karma Karaoke</text>
          <text>Loading...</text>
        </vstack>
      ),
    });

    ui.showToast(`Created Karma Karaoke round!`);
    ui.navigateTo(post);
  },
});

export default Devvit;
