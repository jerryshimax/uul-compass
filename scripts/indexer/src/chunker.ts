/**
 * Markdown-aware chunker.
 *
 * Strategy:
 *   1. Parse front matter (YAML) — skip it from body; attach to metadata
 *   2. Walk the document by headings — each heading starts a new logical section
 *   3. Within a section, split by paragraph boundaries
 *   4. Accumulate paragraphs into chunks up to MAX_CHUNK_TOKENS (rough estimate:
 *      4 chars per token)
 *   5. Each chunk retains its heading breadcrumb (H1 > H2 > H3) as metadata
 *      so the AI can cite "in the meeting note section 'Decisions'..."
 *
 * Rough token estimate: 1 token ≈ 4 characters of English text.
 * Chinese and other languages may differ; the embedding model handles it.
 */

import type { Chunk } from "./types";

const DEFAULT_MAX_CHUNK_TOKENS = 500;
const CHARS_PER_TOKEN_ESTIMATE = 4;

export function chunkMarkdown(
  body: string,
  opts: { maxChunkTokens?: number } = {},
): Chunk[] {
  const maxChars = (opts.maxChunkTokens ?? DEFAULT_MAX_CHUNK_TOKENS) * CHARS_PER_TOKEN_ESTIMATE;

  // Strip YAML frontmatter if present (between leading `---` lines)
  const bodyNoFrontmatter = body.replace(/^---\n[\s\S]*?\n---\n/, "");

  const lines = bodyNoFrontmatter.split("\n");

  const chunks: Chunk[] = [];
  const headingStack: string[] = [];

  let buffer: string[] = [];
  let bufferStartLine = 0;
  let chunkIndex = 0;

  const flush = (endLine: number) => {
    const text = buffer.join("\n").trim();
    if (!text) {
      buffer = [];
      return;
    }
    chunks.push({
      text,
      chunkIndex: chunkIndex++,
      metadata: {
        heading: headingStack[headingStack.length - 1],
        headingPath: [...headingStack],
        startLine: bufferStartLine,
        endLine,
      },
    });
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      if (buffer.length > 0) flush(i - 1);

      const depth = headingMatch[1].length;
      const text = headingMatch[2].trim();

      headingStack.length = depth - 1;
      headingStack[depth - 1] = text;

      buffer.push(line);
      bufferStartLine = i;
      continue;
    }

    if (buffer.length === 0) bufferStartLine = i;
    buffer.push(line);

    const currentSize = buffer.reduce((s, l) => s + l.length + 1, 0);
    if (currentSize >= maxChars) {
      flush(i);
    }
  }

  if (buffer.length > 0) flush(lines.length - 1);

  return chunks;
}

export function chunkPlainText(
  body: string,
  opts: { maxChunkTokens?: number } = {},
): Chunk[] {
  const maxChars = (opts.maxChunkTokens ?? DEFAULT_MAX_CHUNK_TOKENS) * CHARS_PER_TOKEN_ESTIMATE;

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buffer: string[] = [];
  let bufferSize = 0;
  let chunkIndex = 0;

  for (const p of paragraphs) {
    if (bufferSize + p.length > maxChars && buffer.length > 0) {
      chunks.push({
        text: buffer.join("\n\n"),
        chunkIndex: chunkIndex++,
        metadata: {},
      });
      buffer = [];
      bufferSize = 0;
    }
    buffer.push(p);
    bufferSize += p.length + 2;
  }

  if (buffer.length > 0) {
    chunks.push({
      text: buffer.join("\n\n"),
      chunkIndex: chunkIndex++,
      metadata: {},
    });
  }

  return chunks;
}
