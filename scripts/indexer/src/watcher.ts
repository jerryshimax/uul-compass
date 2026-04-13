/**
 * Long-running chokidar watcher for the UUL Brain folder.
 * Debounces rapid writes (editors tend to emit multiple change events per save).
 */

// David: install `chokidar`
// import * as chokidar from "chokidar";
import * as path from "node:path";

import { indexFile, removeFile, type IndexerOpts } from "./indexer";
import { extractFile } from "./extractor";

const DEBOUNCE_MS = 2000;

type WatcherOpts = IndexerOpts & {
  ignored?: (string | RegExp)[];
};

export async function startWatcher(opts: WatcherOpts) {
  const ignored = opts.ignored ?? [
    /(^|[\\/])\..*/, // dotfiles
    /node_modules/,
    /\.obsidian\/cache/, // obsidian local cache
    /\.DS_Store/,
  ];

  console.log(`[watcher] starting on ${opts.brainRoot}`);
  console.log(`[watcher] entity ${opts.entityId}`);

  // David: uncomment after `npm install chokidar`
  //
  // const watcher = chokidar.watch(opts.brainRoot, {
  //   ignored,
  //   persistent: true,
  //   ignoreInitial: true,
  //   awaitWriteFinish: {
  //     stabilityThreshold: 500,
  //     pollInterval: 100,
  //   },
  // });
  //
  // const pending = new Map<string, NodeJS.Timeout>();
  //
  // const schedule = (filePath: string, action: "upsert" | "delete") => {
  //   const existing = pending.get(filePath);
  //   if (existing) clearTimeout(existing);
  //   pending.set(
  //     filePath,
  //     setTimeout(async () => {
  //       pending.delete(filePath);
  //       try {
  //         if (action === "delete") {
  //           const sourceId = path.relative(opts.brainRoot, filePath);
  //           // guess source type from path; the extractor normally does this
  //           await removeFile(sourceId, "brain_file", opts);
  //         } else {
  //           await indexFile(filePath, opts);
  //         }
  //       } catch (err) {
  //         console.error(`[watcher] error on ${filePath}:`, (err as Error).message);
  //       }
  //     }, DEBOUNCE_MS),
  //   );
  // };
  //
  // watcher
  //   .on("add", (p) => schedule(p, "upsert"))
  //   .on("change", (p) => schedule(p, "upsert"))
  //   .on("unlink", (p) => schedule(p, "delete"));
  //
  // console.log("[watcher] watching for changes. Ctrl+C to stop.");

  console.warn("[watcher] stubbed — install chokidar and uncomment.");
}

// CLI entry point
if (require.main === module) {
  const brainRoot = process.env.COMPASS_BRAIN_PATH;
  const entityId = process.env.ENTITY_ID;

  if (!brainRoot || !entityId) {
    console.error("Required env: COMPASS_BRAIN_PATH, ENTITY_ID");
    process.exit(1);
  }

  startWatcher({ brainRoot, entityId }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
