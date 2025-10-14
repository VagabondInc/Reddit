import { Devvit, useState } from '@devvit/public-api';

// Configure Devvit plugins
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
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
