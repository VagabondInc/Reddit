# AGENTS.md

## Stack & Versions
- Language(s): (detect from manifests/lockfiles)
- Framework(s): (name + exact version)
- Key libraries: (name + exact version)
- Source of truth: lockfiles/manifests (pnpm-lock.yaml, package-lock.json, poetry.lock, Pipfile.lock, Cargo.lock, etc.)

## Docs Lock (via context7)
_For each dependency you touch, refresh via **context7** and record below **before** coding._
| dependency | version | doc URL | checked_at (UTC) | notes |
|------------|---------|---------|------------------|-------|
| devvit (@devvit/public-api, CLI) | 0.12.1 | https://context7.dev/reddit/devvit | 2025-10-14 04:12:13 UTC | Reviewed CLI init, upload, settings APIs |
| vitest | 2.1.9 | https://context7.dev/vitest-dev/vitest | 2025-10-14 04:12:13 UTC | Added minimal unit tests |
| openai (Node SDK) | 4.59.0 | https://context7.dev/openai/openai-node | 2025-10-14 05:03:00 UTC | Using chat.completions for prompt gen |
| snoowrap | 1.23.0 | https://context7.dev/not-an-aardvark/snoowrap | 2025-10-14 05:03:00 UTC | Submit native Reddit video |
| ffmpeg-static | 5.2.0 | https://context7.dev/descriptinc/ffmpeg-ffprobe-static | 2025-10-14 05:03:00 UTC | Static ffmpeg binary on Vercel |
| fluent-ffmpeg | 2.1.2 | https://context7.dev/fluent-ffmpeg/node-fluent-ffmpeg | 2025-10-14 05:03:00 UTC | Mux looped video + audio |

## MCP Usage Matrix
- **context7**: authoritative docs, migrations, deprecations. Use **before any coding**; update Docs Lock.
- **GitHub**: read/write repo ops (search/tree/blame, issues/PRs/branches/commits/CI). Also used to commit `README.md` & `AGENTS.md` updates **before and after** every action.
- **Stripe**: test-mode customers/prices/payments/setup intents/webhooks; simulate events; verify idempotency keys; never expose secrets; document live rollout separately.
- **Hugging Face**: model/dataset/Space selection; record **model card + license + exact revision/SHA** in Docs Lock; deterministic seeds for tests (when available).
- **Apify**: run actors; fetch datasets; define/validate stable schemas; capture dataset contracts for integration tests; mind rate limits/robots/TOS.

## Policies
- **Tests Always**: new code → new tests; touching untested legacy → add **characterization tests first**.
- **No mock data/simulation/shortcuts/truncation**. Provide real test-mode or local fixtures; justify any unavoidable placeholders with a removal plan.
- **Pre/Post Doc Sync**: `README.md` & `AGENTS.md` must be updated **immediately before** and **immediately after** each action.
- **Security**: no secrets in code/logs; validate inputs; escape outputs; least privilege; record secret names (not values) and where they are supplied.

### Secrets Inventory
- `SEGMIND_API_KEY` — scope: Devvit global app setting; source of truth: Reddit Devvit settings; set via `npx devvit settings set SEGMIND_API_KEY` by app owner. No value stored in repo.
  - Temporary fallback: if settings RPC is unavailable, mods can save the key via the in-app menu "Configure Segmind API Key"; stored in app Redis under `secret:SEGMIND_API_KEY`. Replace with proper app setting once platform supports it.
- **Performance**: avoid N+1; protect hot paths; add micro-benchmarks when perf is a goal.
- **Compliance/Licensing**: record licenses (esp. HF models/datasets) and constraints; ensure compatible usage.

## Quality Gates (commands; adapt to project)
```bash
npm run lint && npm run typecheck && npm run format:check
npm test && npm run test:integration && npm run test:e2e
npm run build
npm audit || true
```

## Operational Runbook
- Migrations: idempotent `up`/`down`, pre/post validation, backfill strategy, rollback steps.
- Seeding: deterministic seeds; data shape documented.
- Smoke checks: endpoints/CLI/cron; health/readiness probes.

## Contribution Workflow
- Branch naming, PR template, review gates (security/perf/accessibility where relevant), release tagging, changelog policy.

---

## Doc Sync Log
- 2025-10-14 (UTC): Updated landing/public layout — How to Play to single column; Built With + Get the Code to two-column; removed GitHub card and API key note.
- 2025-10-14 (UTC): Added Vercel server (`api/generate.ts`) and dependencies (openai, snoowrap, ffmpeg-static, fluent-ffmpeg). Recorded Docs Lock.

- 2026-04-07 (UTC): Switched gameplay to comment-initiated countdown and Suno-based song post pipeline.
