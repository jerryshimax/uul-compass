/**
 * One-shot full reindex of the UUL Brain folder.
 * Run this:
 *   - after first-time setup
 *   - after bulk content migrations
 *   - after embedding model changes
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

import { indexFile, type IndexerOpts } from "./indexer";

const INDEXABLE_EXTENSIONS = new Set([".md", ".markdown", ".txt"]);

async function walk(dir: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    // Skip hidden, obsidian cache, node_modules
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;

    if (entry.isDirectory()) {
      await walk(full, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (INDEXABLE_EXTENSIONS.has(ext)) results.push(full);
    }
  }
  return results;
}

export async function fullReindex(opts: IndexerOpts) {
  console.log(`[full-reindex] scanning ${opts.brainRoot}`);
  const files = await walk(opts.brainRoot);
  console.log(`[full-reindex] found ${files.length} files to index`);

  let indexed = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of files) {
    try {
      const result = await indexFile(filePath, opts);
      if (result.indexed) indexed++;
      else skipped++;
    } catch (err) {
      errors++;
      console.error(`[full-reindex] error on ${filePath}:`, (err as Error).message);
    }
  }

  console.log(
    `[full-reindex] done. indexed=${indexed} skipped=${skipped} errors=${errors}`,
  );
}

if (require.main === module) {
  const brainRoot = process.env.COMPASS_BRAIN_PATH;
  const entityId = process.env.ENTITY_ID;
  const dryRun = process.env.DRY_RUN === "1";

  if (!brainRoot || !entityId) {
    console.error("Required env: COMPASS_BRAIN_PATH, ENTITY_ID");
    process.exit(1);
  }

  fullReindex({ brainRoot, entityId, dryRun }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
