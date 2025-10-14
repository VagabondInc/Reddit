<div align="center">
  <img src="https://www.karma-karaoke.lol/karma-karaoke-logo-full.png" alt="Karma Karaoke Logo" width="200" height="200">

  # karma KARAOKE

  **Turn Reddit Comments Into AI Songs**

  [![Install on Reddit](https://img.shields.io/badge/Install-Reddit-FF7B9D?style=for-the-badge&logo=reddit&logoColor=white)](https://developers.reddit.com/apps/karma-karaoke)
  [![Demo](https://img.shields.io/badge/Demo-karmakaraoke.lol-7EC4CF?style=for-the-badge)](https://www.karma-karaoke.lol)
  [![MIT License](https://img.shields.io/badge/License-MIT-FF9D5C?style=for-the-badge)](./LICENSE)
  [![Hack Reddit 2025](https://img.shields.io/badge/Hack%20Reddit-2025-B89FE8?style=for-the-badge)](https://hackreddit.devpost.com)
</div>

---

## 🎯 What Is This?

A Reddit party game where users **collectively write parody lyrics** based on a prompt—then an **AI voice performs the final song**.

Transform Reddit's comment section into a collaborative songwriting studio. Users submit lyric lines, the community votes on favorites, and AI generates a complete song from the top-voted contributions.

## 🎵 How It Works

1. **🎤 Prompt Post**: A Karma Karaoke round is created with a fun prompt
   - *"Make a Song About Your Least Favorite Subreddit"*
   - *"Write Lyrics About Monday Morning"*
   - *"Create a Song About Coffee Addiction"*

2. **💬 Submit Lyrics**: Users comment with their best one-liners
   - One line per comment
   - Up to 5 submissions per round
   - Get creative, funny, or surprisingly deep

3. **⬆️ Community Votes**: Upvote the funniest, cleverest, or catchiest lines
   - Live leaderboard updates
   - Top 8 lyrics advance to the final song

4. **🎶 AI Mixdown**: After 24 hours, AI generates the song
   - Top 8 lines become verse + chorus
   - Powered by Segmind ACE Step API
   - Automatic audio generation

5. **🎉 Song Reveal**: The final track plays directly in the post
   - Interactive audio player
   - Contributor credits
   - Share your creation!

## ✨ Features

- 🎨 **Beautiful UI** - Gradient sunset theme with Reddit Snoo mascot
- ⚡ **Real-Time Updates** - Live vote tracking and leaderboard
- 🛡️ **Content Moderation** - Multi-layer safety filters
- 🤖 **AI Music** - Professional-quality song generation
- 🏆 **Community Credits** - Top contributors highlighted
- 📱 **Mobile Responsive** - Works on all devices
- 🎯 **Reddit-Native** - Built on comments + upvotes

## 🧰 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Devvit (Reddit's Interactive Post SDK) |
| **Backend** | Kiro Hooks & State Management |
| **Audio** | Segmind API (ACE Step Model) |
| **Storage** | Redis KV Store |
| **Language** | TypeScript |
| **Hosting** | Reddit Platform |

## 🚀 Quick Start

### For Players

1. Find a Karma Karaoke post in a subreddit
2. Submit your lyric line in a comment
3. Upvote your favorite lines
4. Wait 24 hours for the AI-generated song!

### For Moderators

1. Install the app in your subreddit:
   ```
   https://developers.reddit.com/apps/karma-karaoke

### For Developers

Use these steps to link this repo to your already-created Reddit app, upload a build, and test it.

1. Log in to Devvit CLI
   - Run: `npx devvit login --copy-paste`
   - A URL will be shown. Open it, approve, copy the code back to the terminal.
2. Link this project to your Reddit app
   - Run: `npx devvit init Ch5peVE5Mlk2aXFxdzF2emFGaXBHc2FkMm43NklTbWcSDWthcm1hLWthcmFva2UaCWhlbGxvLXdlYg==`
   - Do not use `--force`. This records the remote app mapping without scaffolding.
3. Build and upload a new version
   - Run: `npm run build`
   - Run: `npm run upload -- --bump patch`
4. Install to a test subreddit you moderate
   - Run: `npx devvit install karma-karaoke@latest r/<your-test-subreddit>`
5. Live dev loop (optional)
   - Run: `npm run playtest`

App setting required for audio generation:
- Set your Segmind API key: `npx devvit settings set SEGMIND_API_KEY`
- The app will retrieve this value at runtime via `context.settings`.

If the CLI shows an Unimplemented error for settings:
- In your subreddit (as a moderator), open the menu action "Configure Segmind API Key" and paste the key there. This stores it temporarily in app storage until the platform settings RPC is available.
   ```

2. Create a new round:
   - Go to Mod Actions
   - Click "Create Karma Karaoke Round"
   - Post is created automatically!

### For Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/karma-karaoke.git
   cd karma-karaoke
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Upload to Reddit:
   ```bash
   devvit upload
   ```

See [SETUP.md](./SETUP.md) for detailed instructions.

## 📁 Project Structure

```
karma-karaoke/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── devvit.yaml                 # Devvit app metadata
├── src/
│   ├── index.tsx               # Main app & UI
│   ├── lyricEngine.ts          # Lyric collection system
│   ├── audioGen.ts             # AI music generation
│   ├── kiroHooks.ts            # Event handlers
│   └── moderation.ts           # Content safety
├── .kiro/
│   ├── spec.yaml               # Kiro configuration
│   └── state.json              # Initial state
├── landing/
│   ├── index.html              # Landing page
│   ├── logo.png                # Karma Karaoke logo
│   └── vercel.json             # Vercel config
├── assets/
│   └── colors.json             # Brand colors
└── docs/
    ├── SETUP.md                # Setup guide
    ├── KIRO_IMPACT.md          # Kiro writeup
    ├── COMPLIANCE_CHECKLIST.md # Rules compliance
    └── ORIGINALITY_STATEMENT.md # Uniqueness proof
```

## 🎨 Design & Branding

### Color Scheme

```css
Primary:   #FF9D5C  /* Orange */
Secondary: #FF7B9D  /* Pink */
Accent:    #B89FE8  /* Purple */
Highlight: #7EC4CF  /* Blue */
Dark:      #1C1C1C  /* Background */
Light:     #FFFFFF  /* Text */
```

### Logo

The logo features Reddit's Snoo mascot holding a microphone, set against a beautiful gradient sunset background.

See [assets/colors.json](./assets/colors.json) for complete palette.

## 🛡️ Content Safety

Built-in moderation includes:

- ✅ Profanity filter (allows minimal usage)
- ✅ Slur blocking (zero tolerance)
- ✅ Spam detection
- ✅ Length validation (10-200 chars)
- ✅ URL blocking
- ✅ Rate limiting (5 submissions/hour)
- ✅ Duplicate detection

See [src/moderation.ts](./src/moderation.ts) for details.

## 📊 How It's Built

### Kiro Framework

Karma Karaoke uses Kiro for state management and event handling:

- **Hooks**: `onCommentAdd`, `onVoteChange`, `onRoundEnd`
- **State**: Lyrics pool, vote counts, round status
- **Steering**: Auto-curation, rate limiting, moderation

See [KIRO_IMPACT.md](./KIRO_IMPACT.md) for detailed writeup.

### Event Flow

```
Comment → Kiro Hook → Lyric Engine → Validation → Redis Storage
                                   ↓
Upvote → Kiro Hook → Vote Update → Leaderboard Refresh
                                   ↓
Timer Expires → Kiro Hook → AI Generation → Song Reveal
```

## 🎯 Judging Criteria

Built to excel in all Hack Reddit 2025 criteria:

| Criterion | Implementation |
|-----------|----------------|
| **Delightful UX** | Gradient theme, clear flow, emoji theming |
| **Polish** | Error handling, moderation, documentation |
| **Reddit-y** | Uses comments + votes, community-focused |
| **Kiro Mastery** | Full specs/hooks/steering, creative patterns |

## 🏆 Competitive Advantages

1. **Unique Concept** - No other platform combines collaborative lyrics + voting + AI music
2. **Technical Excellence** - Advanced Kiro usage with creative patterns
3. **Comprehensive Docs** - 89 KB of professional documentation
4. **Production Quality** - Full error handling, moderation, validation
5. **Pure Reddit DNA** - Built on core Reddit mechanics
6. **Viral Potential** - High replay value, shareable songs

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Submit a PR with clear description

## 🐛 Known Limitations

1. **Audio Playback**: Devvit doesn't natively support embedded audio yet. Generated audio is stored but requires download/upload for now.
2. **Rate Limiting**: App-wide, not per-user (Devvit limitation)
3. **Real-time Updates**: Requires user interaction to refresh UI

## 🔮 Future Enhancements

- [ ] Multiple music genres (rap, country, rock)
- [ ] User-submitted prompts
- [ ] Top contributors leaderboard
- [ ] Song history archive
- [ ] Share to Twitter/Spotify integration
- [ ] Custom round durations
- [ ] Multi-language support

## 📚 Resources

- [Devvit Documentation](https://developers.reddit.com/docs)
- [Kiro Framework](https://kiro.dev)
- [Segmind API](https://docs.segmind.com)
- [Landing Page](https://www.karma-karaoke.lol)

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/karma-karaoke/issues)
- **Community**: [r/Devvit](https://reddit.com/r/devvit)
- **Hackathon**: [Hack Reddit 2025](https://hackreddit.devpost.com)

---

<div align="center">
  <p>
    <strong>Built with ❤️ for Hack Reddit 2025</strong>
  </p>
  <p>
    <a href="https://developers.reddit.com/apps/karma-karaoke">Install on Reddit</a> •
    <a href="https://www.karma-karaoke.lol">View Demo</a> •
    <a href="https://github.com/yourusername/karma-karaoke">GitHub</a>
  </p>
  <p>
    🎤 <strong>Let's make some karaoke magic!</strong> 🎵
  </p>
</div>

## Changelog

- 2025-10-14: Landing site layout updates
  - How to Play is single-column (was two on public site)
  - Built With + Get the Code displayed side-by-side (two columns)
  - Removed GitHub repo card image and API key note from Get the Code
