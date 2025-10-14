# Sunova Visualize – Engineering Handbook

## Overview

- **Purpose**: Sunova Visualize turns an artist’s audio into a production-ready music video plan. The React SPA handles onboarding, project management, and editor tooling, while Supabase Edge Functions orchestrate OpenAI-powered concept ideation, Whisper transcription, structured storyboard generation, Segmind renders, and Stripe credit purchases.
- **High-level architecture**:
  - Vite + React 18 client served on Vercel. State is driven by TanStack Query, React Router, and Shadcn UI components.
  - Supabase (Postgres, Auth, Storage, Edge Functions) provides persistence for projects, media, credits, and runs server-side calls to OpenAI, Segmind, and Stripe.
  - Client-side audio analysis (tempo, key, beats) runs locally via `ClientAudioAnalyzer`; heavy AI calls route through Supabase functions to keep keys server-side.
  - Stripe Checkout/ webhook flow tops up user credits that gate expensive AI generations.
- Voice-first ideation uses the OpenAI Realtime API with a bespoke `RealtimeVoiceChat` WebRTC wrapper.

## Current Work Plan

- ✅ Refined the `scene-breakdown` Edge function with planning heuristics, minimum/maximum scene targets, and an automated retry when the model collapses multi-location stories into a single scene so long-form narratives break into distinct locations.
- ✅ Hardened Segmind webhook/task matching so generated media surfaces in editors and admin dashboards even when Segmind omits `task_id`, and restored admin visibility into `generation_tasks` via new RLS policy coverage + helper tests.
- ✅ Validated the audio upload → timeline export path by auditing `timelineExport.ts`, ensuring FFmpeg receives the original audio container metadata, and backfilling unit tests that assert the correct file staging and command invocation.
- **Primary entry points**:
  - `src/main.tsx` bootstraps the SPA.
  - React Router mounts marketing pages (`Index`), auth (`Auth`), dashboard (`Dashboard`), and production tools (`VideoEditorPage`, `StoryboardPage`).
  - Supabase Edge Functions (`supabase/functions/*/index.ts`) expose HTTP handlers invoked from the client via `supabase.functions.invoke`.

## Karma Karaoke Implementation Plan (pre-change 2025-10-14 00:32 UTC)

- Replace the placeholder audio adapter with a Segmind Ace Step Music client that submits `genres`, stitched lyrics, deterministic `seed`, and configurable runtime options.
- Update Kiro `onRoundEnd` flow to persist Segmind request metadata (URL, duration, contributors) and expose surfaced errors gracefully to the UI model.
- Revise Vitest coverage to mock the Segmind client, validating parameter construction, error propagation, and round summary formatting.
- Ensure environment variables/secret naming are documented for the new API key and sync README + function map after implementation.

## Karma Karaoke Implementation Summary (post-change 2025-10-14 00:50 UTC)

- Replaced the Karma Karaoke audio adapter with a Segmind Ace Step Music client that posts stitched lyrics, genre presets, and deterministic seeds, returning data-URL encoded MP3 clips.
- Expanded round configuration/state to capture Segmind-specific tuning (genres, optional strength/shift/steps/cfg, deterministic seeds) and persisted clip duration metadata to KV + Devvit models.
- Updated tests, schema, and documentation to validate Segmind payload formation, ensure binary responses are handled safely, and surface the new configuration knobs to operators.

## Directory & File Tree (with roles)

```
.
├── package.json / package-lock.json      # npm workspace definition and locked dependency graph
├── vite.config.ts                        # Vite + SWC + manual chunking + lovable tagger
├── src/
│   ├── App.tsx                           # Query client, routing, auth provider wiring
│   ├── assets/                           # Static imagery (storyboard icons, etc.)
│   ├── components/
│   │   ├── AudioProcessingUI.tsx        # Upload, transcription, concept chat + voice hub
│   │   ├── StoryboardEditor.tsx         # Scene+shot editing, Segmind triggers
│   │   ├── VideoEditor.tsx              # Shot timeline view & regeneration controls
│   │   ├── marketing sections (*.tsx)   # Landing page blocks (Hero, Pricing, etc.)
│   │   └── ui/                          # Shadcn-generated primitives
│   ├── hooks/                           # Auth/user profile, mobile detection, toast bus
│   ├── integrations/supabase/           # Generated typed client + types
│   ├── lib/utils.ts                     # `cn` helper (clsx + twMerge)
│   ├── pages/                           # Route components (Index, Auth, Dashboard, etc.)
│   ├── types/                           # Concept typings + external module shim
│   └── utils/                           # Domain helpers: audio analysis, storyboard math, etc.
├── karma-karaoke/                      # Devvit + Kiro workspace for Karma Karaoke
│   ├── README.md                     # Module-level documentation
│   ├── src/                          # TypeScript sources (engine, hooks, UI model)
│   ├── tests/                        # Vitest specs
│   ├── assets/                       # Branding (logo)
│   └── .kiro/                        # Spec + state bootstrap for Kiro
├── supabase/
│   ├── functions/
│   │   ├── _shared/*.ts                 # CORS + prompt sanitizers shared across functions
│   │   ├── audio-transcription          # Whisper proxy (base64 audio -> transcript cache)
│   │   ├── concept-analysis             # GPT-5 concept chat
│   │   ├── scene-breakdown              # GPT-5 scene list generator
│   │   ├── scene-shot-expansion         # GPT-5 shot planner w/ prompt slots
│   │   ├── segmind-generation           # Segmind workflow invoker/poller
│   │   ├── realtime-voice               # OpenAI Realtime ephemeral key + text chat fallback
│   │   ├── create-checkout-session      # Stripe Checkout session creation
│   │   └── stripe-webhook               # Stripe webhook for credit accrual
│   └── functions/deno.json              # Edge runtime compiler options
├── scripts/                             # Local Node utilities to drive Edge functions
├── public/                              # Static assets served by Vite
├── vitest.setup.ts                      # Testing harness (jsdom + RTL matchers)
└── QA_CHECKLIST.md / app-info.md        # Operational notes
```

## Function Map (exhaustive)

Functions are grouped by module. Each entry lists signature, inputs, outputs, side-effects, and downstream integrations.

### React entry & routing

- `src/App.tsx: App(): JSX.Element`
  - **Inputs**: none (hook-based component).
  - **Outputs**: Renders providers, routers, and route tree.
  - **Side-effects**: Initializes `QueryClient`, mounts global toasters.
  - **Downstream**: `QueryClientProvider`, `BrowserRouter`, `AuthProvider`, route components (`Index`, `Auth`, `Dashboard`, `VideoEditorPage`, `StoryboardPage`, `NotFound`).

### Hooks

- `src/hooks/useAuth.tsx: AuthProvider({ children }: AuthProviderProps): JSX.Element`
  - Inputs: React children.
  - Outputs: Auth context provider.
  - Side-effects: Registers Supabase auth state listener, pulls session on mount.
  - Downstream: `supabase.auth.onAuthStateChange`, `supabase.auth.getSession`, `supabase.auth.signOut` (via returned context).
- `src/hooks/useAuth.tsx: useAuth(): AuthContextType`
  - Inputs: none.
  - Outputs: Auth context (user, session, loading, signOut).
  - Side-effects: Throws if called outside provider.
  - Downstream: none.
- `src/hooks/useUserProfile.ts: handleDuplicateProfile(userId: string): Promise<UserProfile>`
  - Inputs: Supabase user ID.
  - Outputs: Profile row.
  - Side-effects: Queries `user_profiles` table.
  - Downstream: `supabase.from('user_profiles').select(...).maybeSingle()`.
- `src/hooks/useUserProfile.ts: useUserProfile()`
  - Inputs: none (depends on auth context).
  - Outputs: React Query result (profile, isAdmin, status helpers).
  - Side-effects: Creates Supabase row when missing (insert) and handles duplicate via RPC.
  - Downstream: Supabase PostgREST operations on `user_profiles`.
- `src/hooks/use-mobile.tsx: useIsMobile(): boolean`
  - Inputs: none.
  - Outputs: True if viewport width < 768px.
  - Side-effects: Registers `matchMedia` listener.
  - Downstream: DOM APIs.
@@ -102,57 +127,59 @@ Functions are grouped by module. Each entry lists signature, inputs, outputs, si
  - Outputs: none.
  - Side-effects: Schedules toast removal via `setTimeout`.
  - Downstream: `dispatch`.
- `use-toast.ts: reducer(state, action): State`
  - Inputs: toast state + action.
  - Outputs: New state.
  - Side-effects: None (pure) except calling `addToRemoveQueue` for dismiss.
  - Downstream: none.
- `use-toast.ts: dispatch(action)`
  - Inputs: toast action.
  - Outputs: none.
  - Side-effects: Mutates `memoryState`, notifies listeners.
  - Downstream: `reducer`, registered listeners.
- `use-toast.ts: toast(props): { id, dismiss, update }`
  - Inputs: Toast props.
  - Outputs: Control handles for toast instance.
  - Side-effects: Adds toast via `dispatch`.
  - Downstream: `dispatch`.
- `use-toast.ts: useToast()`
  - Inputs: none.
  - Outputs: Toast state + helpers for components.
  - Side-effects: Subscribes to `listeners` array.
  - Downstream: `dispatch`, `toast`.

### Supabase integration

- `src/integrations/supabase/client.ts: supabase = createClient<Database>(...)`
  - Inputs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` envs.
  - Outputs: Typed Supabase client instance.
  - Side-effects: Throws if env vars missing.
  - Downstream: Supabase JS SDK.

### Pages

- `src/pages/Index.tsx: Index(): JSX.Element`
  - Inputs: none.
  - Outputs: Landing page layout.
  - Side-effects: none.
  - Downstream: Marketing components (`Header`, `Hero`, etc.).
- `src/pages/Auth.tsx: Auth(): JSX.Element`
  - Inputs: none.
  - Outputs: Auth UI (sign-in/up tabs).
  - Side-effects: Checks session on mount, listens for auth events.
  - Downstream: `supabase.auth` methods, `toast`.
- `Auth.tsx: validateForm(isSignUp: boolean): boolean`
  - Inputs: boolean toggle.
  - Outputs: Validity flag.
  - Side-effects: Updates `errors` state.
  - Downstream: `zod` schemas.
- `Auth.tsx: handleSignUp(): Promise<void>`
  - Inputs: none (reads state).
  - Outputs: none.
  - Side-effects: Calls `supabase.auth.signUp`, updates loading, shows toasts.
  - Downstream: Supabase Auth.
- `Auth.tsx: handleSignIn(): Promise<void>`
  - Same pattern but calls `signInWithPassword`.
- `Auth.tsx: handleInputChange(field, value)`
  - Inputs: field key, value.
  - Outputs: none.
@@ -209,106 +236,115 @@ Functions are grouped by module. Each entry lists signature, inputs, outputs, si
  - Downstream: `supabase.from`, `supabase.storage.download`, `VideoEditor` component.
  - Additional helpers inside component:
    - `ensureCredits(requiredCredits)` – prevents generation if balance low (unless admin).
    - `saveShots(shots)` – Persists shot edits via Supabase (projects table JSON).
    - `scheduleSave()` – Debounced auto-save handler.
    - `updateShot(updatedShot)` – Mutates `shots` state.
    - `handlePromptChange(shotId, promptType, value)` – Updates shot prompt text.
    - `togglePlayback()` / `handleTimeUpdate()` / `seekToShot()` – Audio playback controls.
    - `handleShotSelect(shotId)` – UI selection.
    - `getCharacterImageForShot(shot)` – Resolves sprite for prompt card.
    - `handleGenerateShot(shot)` / `handleGenerateAllShots()` – Calls `segmind-generation` Edge function and tracks credit spending.
    - `handleFinalize()` – Marks project as ready, updates DB.
    - `handleExportTimeline()` – Serializes timeline to JSON for download or export flow.
- `src/pages/StoryboardPage.tsx: StoryboardPage()`
  - Inputs: router params/auth.
  - Outputs: Suspense-wrapped `StoryboardEditor`.
  - Side-effects: Fetches project, downloads audio, parses stored storyboard.
  - Downstream: Supabase PostgREST + Storage.
- `src/pages/NotFound.tsx: NotFound()`
  - Inputs: none.
  - Outputs: 404 page.
  - Side-effects: Logs missing route via `console.error` in effect.
  - Downstream: `useLocation`.

### Major components

#### `src/components/AudioProcessingUI.tsx`

Top-level component orchestrating upload, transcription, concept chat, and voice mode. Key helpers include:

- `parseConceptPayload(concept: unknown): ConceptPayload | null` – Validates stored concept structure.
- `withTimeout(promise, timeoutMs, message)` – Promise race utility to guard long API calls.
- `getSupabaseEdgeConfig()` – Reads Supabase env vars; throws if missing.
- `assessImageQuality(file)` – Loads image, heuristically scores clarity.
- `extractCharacterAttributes(file, quality)` – Heuristic inference from filename for persona tags.
- Component-level callbacks:
  - `isAnalysisComplete(analysis)` – Verifies audio analysis completeness.
  - `processAudio()` – Uploads audio to storage, hashes file for caching, invokes `audio-transcription` function, runs `ClientAudioAnalyzer`, merges results, and updates Supabase `projects` row.
  - `initializeAudio()` – Sets up `<audio>` element and visualizer canvas.
  - `extractConceptFromConversation(useVoiceTranscript)` / `extractConceptFromVoiceTranscript()` – Calls `concept-analysis` Edge function using chat history, merges concept JSON to state, persists via `persistConceptToProject`.
  - `handleFinalizeConcept()` – Locks in concept, persists, advances wizard.
  - `handleContinueChatting()` – Resets streaming state to stay in chat.
  - `initializeVoiceChat()` – Instantiates `RealtimeVoiceChat` with song metadata and event callbacks.
  - `toggleVoiceMode()` – Switches between text and voice UI.
  - `toggleMute()` – Adjusts Web Audio gain.
  - `parseUserInputToNarrative()` / `parseUserInputToNarrativeAsync()` – Runs lightweight extraction of storyline cues for UX feedback.
  - `processCharacterImages(files)` – Runs quality assessment + maps to chat attachments.
  - `handleImageUpload(event)` / `removeImage(index)` – Manage pending character references.
  - `uploadCharacterImages(projectId)` – Pushes reference images to Supabase storage and updates project metadata.
  - `processSongMetadataUpdates(messageText, options)` – Parses manual metadata edits from chat; normalizes and returns summary plus analysis patch.
  - `handleSendMessage()` – Core chat submit: validates attachments, optionally uploads reference images, streams `realtime-voice` (text mode) SSE response, handles `[END OF CONCEPT]` sentinel via utilities (`appendEndTokenIfMissing`, `containsEndToken`, `stripEndToken`, `normalizeConversationContent`, `shouldTriggerConceptDecision`).
- Component renders upload steps, chat transcript with streaming updates, concept summary, and transitions to storyboard.
- Side-effects: Frequent Supabase RPCs (`functions.invoke`, `storage.upload`), DOM audio context creation, streaming fetch, credit checks.

#### `src/components/StoryboardEditor.tsx`

Manages scenes/shots editing and Segmind calls.

- `assignAccentColor(index)` – Rotating accent palette.
- `ensureCredits(requiredCredits)` – Similar to VideoEditor guard.
- `saveScenes(scenes)` – Persists sanitized scenes via Supabase update.
- `scheduleSceneSave()` – Debounced auto-save for scenes.
- `fetchScenes()` – Calls `scene-breakdown` and `scene-shot-expansion` Edge functions after verifying concept availability, normalizes responses via `sanitizeAndNormalizeScenes` & `sanitizeShots`.
- Playback controls: `togglePlayback`, `handleTimeUpdate`, `handleSceneClick`.
- Scene editing handlers: `updateScene`, `handleScenePromptChange`, `handleAddCharacterToScene`, `handleCharacterInput`, `handleCharacterSubmit`.
- Image management: `handleReferenceImageUpload`, `handleReferenceImageRemove` (Supabase storage round-trip).
- Generation hooks: `handleKeyframeGeneration(scene)` (calls `segmind-generation` for keyframes), `handleGenerateTimeline()` (requests shots, aligns to beats via `alignScenesToBeats`/`alignShotsToBeats`, charges credits), `handleTimelineBack`, `handleTimelineComplete` (notifies parent with `GeneratedShot[]`).
- Side-effects: Supabase PostgREST updates, storage uploads, credit enforcement, toasts.

#### `src/components/VideoEditor.tsx`

Shot timeline/preview component.

- `ensureCredits()`, `saveShots()`, `scheduleSave()` – same responsibilities as page wrapper.
- Prompt editing and playback helpers listed earlier for page.
- `handleGenerateShot(shot)` / `handleGenerateAllShots()` – orchestrate Segmind video generation; handle polling results, storing URLs, deducting credits via `supabase.rpc('spend_credits')` (see utils).
- `handleFinalize()` – Persists final storyboard clips back to project row.
- `handleExportTimeline()` – Uses `timelineExport` util to export structure for downstream tools.
- Side-effects: Supabase updates, toasts, credit deduction.

#### Other components

- Marketing components (`src/components/{Header,Hero,ProcessSection,...}`) each export a stateless function returning JSX. Inputs: optional props (mostly none). Outputs: structured layout. Side-effects: none. Downstream: UI primitives only.
- `LogoHeader`, `ProtectedRoute`, `ConceptStoryboard`, `ShotOptimizer`, etc., are function components with encapsulated logic. Notable functions within `ShotOptimizer`:
  - `generateMockBeatMap()` – Creates synthetic beats for demo mode.
  - `analyzeShots()` – Pipeline using `BeatAnalyzer` and `CostOptimizer` to simulate budgeting.
  - `getMotionColor(level)`, `getContentTypeIcon(type)`, `calculateGenerationCost(duration)` – UI helpers.

### Utilities (`src/utils`)

- `src/lib/utils.ts: cn(...inputs)` – Tailwind/clsx merge helper. Inputs: array of class values; outputs merged string; pure.
- `audioRecorder.ts: AudioRecorder` class
  - Methods: `start()` (requests mic, sets up Web Audio graph); `stop()` (tears down). Side-effects: interacts with `navigator.mediaDevices`, logs if debug.
- `RealtimeVoice.ts: RealtimeVoiceChat` class
  - Constructor wires callbacks, sets initial instructions.
  - `buildInstructions(songData)` – Generates system/developer prompts based on song analysis (pure).
  - `buildInitialMessage()` – Prepares initial `session.create` payload.
  - `connect()` – Fetches ephemeral key via Supabase Edge, opens WebRTC connection to OpenAI Realtime, wires media/DataChannel events. Side-effects: audio context creation, network calls to Supabase + OpenAI.
  - `encodeAudioData(float32)` – Converts PCM to base64 string.
  - `handleMessage(event)` – Dispatches incoming data channel events (transcripts, status, end signals) and routes to UI callbacks; may call `endConversation`.
  - `playAudioDelta(base64)` – Decodes PCM frames and streams via Web Audio.
  - `createWavFromPCM(pcm)` – Utility for audio debugging.
  - `updateSongData(songData)` – Refreshes prompts mid-session and pushes session update over data channel.
  - `sendTextMessage(text)` – Sends text into realtime session.
  - `sendInitialMessage()` – Triggers assistant response when connection ready.
  - `endConversation(source)` – Marks session complete, calls `disconnect`, notifies listeners.
  - `disconnect()` – Closes WebRTC/data channel, cleans audio nodes.
- `beatAnalysis.ts: BeatAnalyzer`
  - `generateShotTimings(totalDuration, targetShotCount)` – Returns beat-aligned shot timing objects.
  - `analyzeShotGrouping(shots, sceneEvents)` – Clusters shots by motion/content to guide cost optimization.
  - Private helpers `analyzeMotionRequirement`, `analyzeContentSimilarity`, `getContentType` support classification.
- `costOptimizer.ts: CostOptimizer`
  - `calculateCostBreakdown(shotGroups, quality)` – Aggregates cost metrics/scoring.
  - `optimizeShotGrouping(shotGroups, maxBudget)` – Applies heuristics to reduce spend.
  - Internal strategies `calculateGenerationCost`, `calculateQualityScore`, `generateRecommendations`, `mergeSimilarGroups`, `optimizeGenerationDurations`, `aggressiveGrouping`.
@@ -325,124 +361,153 @@ Shot timeline/preview component.
  - `mapToSupportedDuration(duration)` – clamps arbitrary seconds to Segmind-supported 5s/10s durations.
  - `buildSegmindGenerationPayload(context, options)` – Shapes request body for segmind-generation Edge function (injects audio, prompts, resolution).
- `conceptDecision.ts`
  - `containsEndToken(content)`, `appendEndTokenIfMissing(content)`, `stripEndToken(content)` – Manage `[END OF CONCEPT]` markers.
  - `normalizeConversationContent(content)` – Cleans streaming chunks.
  - `shouldTriggerConceptDecision(messages)` – Signals when concept ready to persist.
- `projectPersistence.ts`
  - `clone(value)` – JSON deep clone helper.
  - `buildConceptUpdatePayload(concept, analysis)` – Shapes update object for `projects` table.
  - `persistConceptToProject(params)` – Runs Supabase update and returns payload + result.
- `credits.ts`
  - `getGenerationCost(type)` – Returns 0.25 keyframe vs 1.0 video credit cost.
  - `formatCredits(balance)` – Dollar-formatting.
- `songMetadata.ts`
  - Helpers to parse free-form chat text into metadata updates (`extractSongMetadataUpdates`, `normalizeSongMetadataUpdates`).
- `storyboard.ts`
  - `ensureCharacterMention`, `buildCharacterOptions`, `serializeStoryboard`, `hasStoryboardConcept` support editor requirements.
- `timelineExport.ts`
  - `getFfmpegInstance()` / `ensureFfmpegLoaded()` – Lazy-load @ffmpeg/ffmpeg core into browser.
  - `toUint8Array(source)` – Normalizes remote or local assets to byte arrays.
  - `updateProgress(callback, completed, total)` – Reports percentage.
  - `exportTimelineToVideo({ shots, audioFile, onProgress, fileName })` – Concatenates generated MP4 shots with master audio track via WASM FFmpeg, returns downloadable blob. Cleans FFmpeg virtual FS afterward.
- Tests in `src/utils/__tests__` characterize the above helpers.

### Supabase Edge Functions

Each `index.ts` exports a single handler (`serve` or `Deno.serve`). Key helpers noted per module.

- `audio-transcription`
  - Handler parses `{ audio, projectId }` JSON, validates JWT via Supabase Admin client, hashes input for caching, forwards to OpenAI Whisper (`audio/transcriptions`), stores transcript in `audio_transcription_cache`, returns text/duration/segments.
  - Helpers: `createCorsHeaders`, `handleOptions` from `_shared/cors.ts`.
- `concept-analysis`
  - Accepts lyrics, user vision, metadata, conversation history. Builds system/user prompts for GPT-5, calls Chat Completions with streaming JSON instructions, returns conversation plus structured concept JSON.
  - Computes beat stats, merges characters, uses `[END OF CONCEPT]` sentinel.
- `scene-breakdown`
  - Validates concept + analysis, calls GPT-5-nano to produce strict JSON of scenes, uses `_shared/sceneSanitizer` for normalization and `PromptBuilder` for structured prompts.
  - Helper `extractJson` handles fenced JSON responses.
- `scene-shot-expansion`
  - Input: sanitized scenes + analysis; output: ordered shots with prompt slots. Uses OpenAI response-format schema, then `_shared/shotSanitizer` and `PromptBuilder` to ensure consistent prompts.
- `segmind-generation`
  - Handles two modes: initiating workflow (scene image or shot video) and polling completion. Validates credits, extracts URLs from deeply nested responses (`extractMediaFromResponse`), computes costs (constants), and persists results back to Supabase (projects + storage) while recording credit spend via RPCs.
- `storyboard-preview`
  - Lightweight image preview generator. Authenticates user, forwards prompt to Segmind fast workflow, maps result to base64 data URL or direct link.
- `realtime-voice`
  - POST: Builds instructions based on song data, creates OpenAI Realtime client secret (10 min TTL), returns JSON. Text mode path (`textMode` flag) calls `handleTextConversation` (chat completions stream) for fallback.
  - GET: Health check payload for debugging.
- `create-checkout-session`
  - Authenticates requester, validates minimum amount, creates Stripe Checkout Session (2024-11-20 API), returns redirect URL.
- `stripe-webhook`
  - Verifies signature, handles `checkout.session.completed`, credits user via `add_credits` RPC with metadata.

### Shared Edge utilities (`supabase/functions/_shared`)

- `cors.ts: createCorsHeaders(origin)` / `handleOptions(req, headers)` – Centralized CORS allow-list.
- `sceneSanitizer.ts: sanitizeScenes`, `sanitizeAndNormalizeScenes` – Ensures scene IDs/timings consistent.
- `shotSanitizer.ts: sanitizeShots` – Normalizes shot payloads (IDs, times, prompt strings).
- `storyboardQuality.ts` – Duration heuristics for scenes (`resolveSongDuration`, `normalizeSceneTimings`).
- `promptBuilder.ts: PromptBuilder` – 10-slot prompt composer with `render`, `renderImage`, `renderVideo`, `getSlots`; plus `extractPromptSlots` helper.

### Scripts (`scripts/*.js|mjs`)

- `run-functions.mjs` – Local harness that sequentially calls `concept-analysis`, `scene-breakdown`, `scene-shot-expansion` using demo data.
- `poll-response.js`, `test-scene*.js` – Debug utilities for polling Segmind/OpenAI responses.
- Inputs: rely on `.env` Supabase keys; Outputs: console logs; Side-effects: network calls to Supabase Edge Functions.

### Karma Karaoke module

- `karma-karaoke/src/lyricEngine.ts: LyricEngine`
  - **Inputs**: round config, lyric submissions.
  - **Outputs**: Ranked leaderboard, composed chorus/verse selections.
  - **Side-effects**: Mutates in-memory submission map (persisted via serialize/hydrate).
  - **Downstream**: Used by Kiro hooks to power prompt reveal + audio mix.
- `karma-karaoke/src/audioGen.ts: AudioGenerationClient.generateClip(request)`
  - **Inputs**: prompt, lyrics array, voice/style configuration.
  - **Outputs**: Audio URL, provider metadata, ETA.
  - **Side-effects**: Performs authenticated HTTP POST to configured provider.
  - **Downstream**: `onRoundEnd` hook, interactive UI audio button.
- `karma-karaoke/src/kiroHooks.ts`
  - `onCommentAdd(event, context)` – Ingests lyrics, enforces moderation, persists leaderboard snapshot.
  - `onRoundEnd(context)` – Selects winning lines, triggers audio generation, advances state for next round.
  - `getCurrentRound(context)` – Fetches KV snapshot for Devvit renderers.
- `karma-karaoke/src/index.ts`
  - `buildInteractivePostModel(state)` – Shapes KV state into leaderboard/audio view model.
  - `getPlaybackButtonState(model)` – Supplies CTA label + disabled status based on audio readiness.

## End-to-End Flow Chart

```mermaid
flowchart TD
  A[Visitor lands on /] -->|marketing CTAs| B[/auth]
  B -->|Supabase Auth| C[Dashboard]
  C -->|Upload audio| D[Supabase Storage audio-original]
  D -->|invoke audio-transcription| E[Edge: Whisper proxy]
  E -->|transcript| F[AudioProcessingUI]
  F -->|ClientAudioAnalyzer| G{Analysis complete?}
  G -->|no| F
  G -->|yes| H[Concept chat (OpenAI GPT-5 via concept-analysis)]
  H -->|persist concept| I[projects.audio_analysis + concept_notes]
  I -->|User selects storyboard| J[StoryboardPage]
  J -->|invoke scene-breakdown| K[Edge: Scene JSON]
  K -->|invoke scene-shot-expansion| L[Edge: Shot plan]
  L -->|Segmind keyframes/videos?| M{Credits available?}
  M -->|no| C
  M -->|yes| N[segmind-generation workflow]
  N -->|results stored| O[projects.storyboard / storage buckets]
  O -->|Preview & edit| P[VideoEditor / StoryboardEditor]
  P -->|Export/Finalize| Q[Ready for production]
  C -->|Buy credits| R[create-checkout-session → Stripe]
  R --> S[Stripe checkout]
  S -->|Webhook| T[stripe-webhook → add_credits]
  T --> C
  F -->|Voice mode| U[RealtimeVoiceChat → OpenAI Realtime]
```

## Setup / Run / Deploy

- **Prerequisites**: Node 20+, npm 10+, Supabase project with Edge Functions enabled, Stripe test keys, OpenAI & Segmind credentials.
- **Environment variables** (never commit secrets):
  - Frontend (`.env` consumed by Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `OPENAI_API_KEY`, `SEGMIND_API_KEY`, `REPLICATE_API_KEY`, `FALAI_API_KEY`.
  - Supabase Edge (configure via `supabase secrets set`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SEGMIND_*` workflow URLs/secrets.
- **Install**: `npm install` (or `npm ci` for clean environments).
- **Local dev**: `npm run dev` (Vite on `http://localhost:8080`). Use `supabase functions serve --env-file ./supabase/.env` in parallel if testing Edge functions locally.
- **Build**: `npm run build` → outputs to `dist/`.
- **Preview**: `npm run preview` for static preview.
- **Deploy**:
  1. Push frontend to Vercel (configure env vars + build command `npm run build`).
  2. Deploy Edge functions via `supabase functions deploy <name>` after syncing secrets.
  3. Configure Stripe webhook endpoint to point at Supabase function URL.
  4. Update QA checklist after smoke validation.

## Testing

- Unit/integration: `npm test` (Vitest, jsdom environment).
- Linting: `npm run lint` (ESLint flat config).
- Type safety: `npm run typecheck` (tsc `--build`).
- Formatting audit: `npm run format:check` (if configured via package scripts; else use `pnpm exec prettier --check`).
- Build verification: `npm run build` prior to deploy.
- Custom scripts: `node scripts/run-functions.mjs` to smoke AI pipeline (requires valid keys).
- Deterministic seeds: Segmind/OpenAI requests accept optional `seed` parameters—fill when adding tests/fixtures.

## Security

- Secrets live in environment variables only; never re-export values in logs or commits. Audit `.env` before sharing.
- Supabase service role keys limited to Edge runtime; client bundle uses anon key with row-level security enforced.
- Edge functions validate JWTs where user context is required (audio transcription, Segmind, checkout).
- Credit spending guarded server-side via RPCs to prevent client tampering.
- Voice/WebRTC prompts explicitly remind the assistant that no camera access exists to avoid hallucinated capabilities.
- Sanitize and normalize all AI JSON payloads via `_shared` helpers before trusting data.
- Uploaded media stored under user/project scoped prefixes to avoid collisions; filenames sanitized client-side.

## Docs Lock Pointer

- Source of truth and dependency versions are tracked in `AGENTS.md → Docs Lock`. Update that table after running context7 against dependencies you modify.
