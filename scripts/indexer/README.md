# UUL Brain Indexer

Local Node service that watches the UUL Brain (and the full `[02] UUL Global/`
folder) for changes and pushes embeddings to Supabase pgvector.

The Compass app at `compass.uulglobal.com` queries pgvector when the AI needs
to answer from UUL's knowledge base — no direct filesystem access in production.

## What it does

1. Watches `$COMPASS_BRAIN_PATH` (defaults to `~/Work/[02] UUL Global/`)
2. On create/change/delete of `*.md` (and later `.pdf`, `.docx`, `.xlsx` via text extraction):
   - Chunks content (markdown-aware: split on headings, paragraphs, max ~500 tokens/chunk)
   - Generates an embedding per chunk via OpenAI `text-embedding-3-small`
   - Upserts into `ai_embeddings` table in Supabase (deletes previous chunks for this file first)
3. On delete: removes all chunks for that file

## Deployment options

| Option | Pros | Cons |
|--------|------|------|
| **Jerry's Mac (cron + launchd)** | Zero infra, works today | Runs only when Mac is on |
| **Small always-on server** (UUL office Mac mini) | 24/7 | Requires hardware |
| **Sync Brain to UUL Google Drive + Vercel Cron** | Cloud-native | Delay + GDrive API limits |

Start with Jerry's Mac. Move to UUL office server when team grows.

## Usage

```bash
cd ~/Ship/uul/compass
npm install
npm run build

# One-shot full reindex
COMPASS_BRAIN_PATH="$HOME/Work/[02] UUL Global" \
OPENAI_API_KEY=sk-... \
DATABASE_URL=postgres://... \
node scripts/indexer/dist/full-reindex.js

# Long-running watcher
node scripts/indexer/dist/watcher.js
```

## Files

- `src/chunker.ts` — splits a document into embedding-friendly chunks
- `src/embedder.ts` — OpenAI client wrapper, batched calls, retry
- `src/extractor.ts` — file-type-specific text extractors
- `src/indexer.ts` — orchestrates: read file → chunk → embed → upsert to DB
- `src/watcher.ts` — chokidar watcher, debounced writes, calls indexer
- `src/full-reindex.ts` — one-shot reindex of the entire folder
- `src/types.ts` — shared types

## Environment variables

```
COMPASS_BRAIN_PATH     # root folder to watch (required)
OPENAI_API_KEY         # for embeddings (required)
DATABASE_URL           # Supabase Postgres connection (required)
ENTITY_CODE=UUL        # which entity to scope embeddings to (default: UUL)
MAX_CHUNK_TOKENS=500   # max tokens per chunk
```

## Incremental vs full reindex

- **Watcher** mode handles deltas — fast, runs continuously
- **Full reindex** is idempotent — safe to re-run anytime
- Deduplication: embeddings are keyed by `(source_type, source_id, chunk_index)`;
  re-indexing deletes previous chunks for a file first, then inserts fresh

## Cost estimate

- UUL Brain at steady state: ~1000 markdown files × ~500 tokens avg × 2 embeddings/file = ~1M tokens
- text-embedding-3-small: $0.10 / 1M tokens
- **Full reindex cost:** ~$0.10 — negligible
- **Delta cost:** essentially zero
