/**
 * Extract text + frontmatter from a file on disk.
 *
 * Markdown: read as UTF-8, parse frontmatter
 * PDF / DOCX / XLSX: stubbed — David: install `pdf-parse`, `mammoth`,
 * `xlsx` and wire up when needed.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IndexableDocument, SourceType } from "./types";

export async function extractFile(
  filePath: string,
  brainRoot: string,
): Promise<IndexableDocument | null> {
  const ext = path.extname(filePath).toLowerCase();
  const stats = await fs.stat(filePath);

  const sourceId = path.relative(brainRoot, filePath);
  const title = path.basename(filePath, ext);

  const common = {
    sourceId,
    title,
    path: filePath,
    metadata: {
      lastModifiedAt: stats.mtime,
      sizeBytes: stats.size,
      mimeType: guessMime(ext),
    },
  };

  switch (ext) {
    case ".md":
    case ".markdown": {
      const body = await fs.readFile(filePath, "utf-8");
      const frontmatter = parseFrontmatter(body);
      return {
        ...common,
        sourceType: routeSourceType(sourceId, "brain_file"),
        body,
        metadata: { ...common.metadata, frontmatter },
      };
    }

    case ".txt": {
      const body = await fs.readFile(filePath, "utf-8");
      return {
        ...common,
        sourceType: "brain_file",
        body,
      };
    }

    case ".pdf":
    case ".docx":
    case ".xlsx":
      // TODO: install pdf-parse / mammoth / xlsx and extract
      console.warn(`[extractor] skipping ${ext}, not implemented: ${sourceId}`);
      return null;

    default:
      return null;
  }
}

function guessMime(ext: string): string {
  return {
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".txt": "text/plain",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }[ext] ?? "application/octet-stream";
}

function routeSourceType(sourceId: string, fallback: SourceType): SourceType {
  const lower = sourceId.toLowerCase();
  if (lower.startsWith("brain/")) return "brain_file";
  if (lower.startsWith("decks/")) return "decks_pdf";
  if (lower.startsWith("research/")) return "research_doc";
  if (lower.startsWith("meetings/")) return "meeting_recording";
  if (lower.startsWith("legal/")) return "legal_contract";
  if (lower.startsWith("finance/")) return "finance_spreadsheet";
  if (lower.startsWith("operations/")) return "operations_sop";
  return fallback;
}

/**
 * Parse YAML frontmatter (between leading `---` lines) from a markdown string.
 * Returns an empty object if no frontmatter present.
 * Minimal parser — handles flat key: value pairs only.
 */
function parseFrontmatter(body: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(body);
  if (!match) return {};

  const result: Record<string, unknown> = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const kvMatch = /^(\w[\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kvMatch) continue;
    const [, key, rawValue] = kvMatch;
    const trimmed = rawValue.trim();
    if (!trimmed) continue;

    const value = trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    result[key] = value;
  }

  return result;
}
