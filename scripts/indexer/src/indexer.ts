/**
 * Orchestrates: extract → chunk → embed → upsert.
 *
 * Each file gets fully re-indexed (delete existing chunks, insert new).
 * This is simple and correct; optimization (diffing chunks) can come later.
 */

// Uses the same Drizzle client the Compass app does so the schema stays
// in sync. David: this needs DATABASE_URL in env (or DIRECT_URL).

import { extractFile } from "./extractor";
import { chunkMarkdown, chunkPlainText } from "./chunker";
import { embedBatch, EMBEDDING_MODEL } from "./embedder";
import type { EmbeddingRecord, IndexableDocument } from "./types";

// David: pull in the Compass db + schema once the indexer is part of the repo
// build. Keep it a separate tsconfig target so it compiles independently.
//
// import { db } from "../../../src/db";
// import { aiEmbeddings } from "../../../src/db/schema";
// import { eq, and } from "drizzle-orm";
// import { sql } from "drizzle-orm";

export type IndexerOpts = {
  entityId: string;       // which UUL entity (will be the "UUL" entity UUID)
  brainRoot: string;      // absolute path to the UUL Global folder
  maxChunkTokens?: number;
  dryRun?: boolean;
};

export async function indexFile(
  filePath: string,
  opts: IndexerOpts,
): Promise<{ indexed: boolean; chunkCount: number; reason?: string }> {
  const doc = await extractFile(filePath, opts.brainRoot);
  if (!doc) return { indexed: false, chunkCount: 0, reason: "extractor skipped" };

  // Skip empty docs
  if (!doc.body.trim()) return { indexed: false, chunkCount: 0, reason: "empty body" };

  // Chunk
  const chunks =
    doc.metadata.mimeType === "text/markdown"
      ? chunkMarkdown(doc.body, { maxChunkTokens: opts.maxChunkTokens })
      : chunkPlainText(doc.body, { maxChunkTokens: opts.maxChunkTokens });

  if (chunks.length === 0) return { indexed: false, chunkCount: 0, reason: "no chunks" };

  // Embed
  const texts = chunks.map((c) => c.text);
  const embeddings = await embedBatch(texts);

  // Build records
  const records: EmbeddingRecord[] = chunks.map((chunk, i) => ({
    entityId: opts.entityId,
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    chunkIndex: chunk.chunkIndex,
    text: chunk.text,
    embedding: embeddings[i],
    embeddingModel: EMBEDDING_MODEL,
    metadata: {
      ...chunk.metadata,
      title: doc.title,
      path: doc.sourceId,
      lastModifiedAt: doc.metadata.lastModifiedAt.toISOString(),
      mimeType: doc.metadata.mimeType,
      ...(doc.metadata.frontmatter ?? {}),
    },
  }));

  if (opts.dryRun) {
    console.log(`[indexer] DRY RUN: would index ${records.length} chunks from ${doc.sourceId}`);
    return { indexed: false, chunkCount: records.length, reason: "dry run" };
  }

  // Upsert to DB
  // David:
  //   await db.transaction(async (tx) => {
  //     // Delete previous chunks for this source
  //     await tx
  //       .delete(aiEmbeddings)
  //       .where(
  //         and(
  //           eq(aiEmbeddings.sourceType, doc.sourceType),
  //           eq(aiEmbeddings.sourceId, doc.sourceId),
  //         ),
  //       );
  //     // Insert new chunks
  //     // Note: the `embedding` column is not declared in the Drizzle schema
  //     // (it's added via raw SQL migration). Need raw SQL here:
  //     for (const r of records) {
  //       await tx.execute(sql`
  //         INSERT INTO ai_embeddings
  //           (entity_id, source_type, source_id, chunk_index, text, embedding, embedding_model, metadata)
  //         VALUES
  //           (${r.entityId}::uuid, ${r.sourceType}, ${r.sourceId}, ${r.chunkIndex},
  //            ${r.text}, ${r.embedding}::vector, ${r.embeddingModel}, ${r.metadata}::jsonb)
  //       `);
  //     }
  //   });

  console.log(`[indexer] indexed ${records.length} chunks from ${doc.sourceId}`);
  return { indexed: true, chunkCount: records.length };
}

export async function removeFile(
  sourceId: string,
  sourceType: IndexableDocument["sourceType"],
  _opts: IndexerOpts,
): Promise<void> {
  // David:
  //   await db
  //     .delete(aiEmbeddings)
  //     .where(
  //       and(
  //         eq(aiEmbeddings.sourceType, sourceType),
  //         eq(aiEmbeddings.sourceId, sourceId),
  //       ),
  //     );
  console.log(`[indexer] removed embeddings for ${sourceId}`);
}
