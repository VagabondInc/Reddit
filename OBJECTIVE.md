Your task is to build the following:

Karma Karaoke

🎯 Goal

A Reddit party game where users collectively write parody lyrics based on a prompt—then an AI voice performs the final song.

⸻

🎵 Core Concept

Every interactive post represents a song round.
Redditors submit lyric lines in comments; the community upvotes favorites.
At round’s end, the highest-voted lines are stitched into a chorus and verse layout.
A text-to-music API (Segmind API using the ACE Step model) renders a short clip played back in-post.

⸻

🧩 Gameplay Loop
	1.	Prompt Post:
“🎤 Karma Karaoke Round #1 – Make a Song About Your Least Favorite Subreddit”
	2.	Users Submit Lyrics:
Each comment = one line.
	3.	Community Votes:
Top lines auto-selected via Kiro hook.
	4.	AI Mixdown:
Kiro calls Segmind API (ACE Step Endpoint) → MP3 clip.
	5.	Reveal Post:
Interactive button plays final song; credits top contributors.

⸻

🧠 Technical Architecture

Component	Tech
Frontend	Devvit Interactive Audio Post
Backend	Kiro hooks (onCommentAdd, onRoundEnd)
Audio Generation	Segmind API (ACE Step Audio)
Storage	Reddit KV or Kiro adapter
Moderation	Reddit API automod filter + safe-lyrics check


⸻

📁 Repository Structure

/karma-karaoke
 ├─ README.md
 ├─ /src
 │   ├─ index.ts          # Interactive UI
 │   ├─ lyricEngine.ts    # Aggregates comment data
 │   ├─ audioGen.ts       # Calls AI music API
 │   └─ kiroHooks.ts      # Handles vote + round logic
 ├─ /.kiro
 │   ├─ spec.yaml
 │   └─ state.json
 ├─ /assets
 │   └─ logo.png


⸻

🧰 Kiro Integration
	•	Specs: lyricsPool, voteCount, roundTimer.
	•	Hooks: onCommentAdd (collects lines), onRoundEnd (triggers audio generation).
	•	Steering: Auto-curation of best lines; timed round resets.

⸻

🎛️ UX Highlights
	•	Live lyric leaderboard auto-refreshes with vote counts.
	•	“Play Final Song” button embedded audio player.
	•	Contributor flair (“Top Lyricist”).

⸻

🧩 Scoring Target

Criterion	Implementation Highlight
Delightful UX	Interactive music playback + social humor
Polish	Round-based system feels complete + tested
Reddit-y	Built entirely on upvotes and comments
Kiro Dev Exp	Timed hooks + state tracking show Kiro mastery


⸻

📺 Demo Video Outline (≤ 3 min)
	1.	Intro to concept + prompt setup.
	2.	Show live comment submission and voting.
	3.	Kiro dashboard triggering AI song generation.
	4.	Reveal post plays final clip.
	5.	End with credits + “Join Next Round” CTA.

⸻

🏁 Deliverables
	•	Public Reddit Post link with interactive audio.
	•	Demo video (YouTube or Vimeo ≤ 3 min).
	•	Public repo with OSI license + README and .kiro folder.