-- Migration: Add vector(1536) column + HNSW index to ai_embeddings
--
-- Runs AFTER the auto-generated AI tables migration (0003_*).
-- pgvector extension must be enabled first (see 0002_pgvector.sql).

ALTER TABLE ai_embeddings ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for cosine similarity (recommended for OpenAI text-embedding-3-small)
-- m=16, ef_construction=64 are good defaults for ~100K-1M embeddings
CREATE INDEX IF NOT EXISTS ai_embeddings_vec_hnsw_idx
  ON ai_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
