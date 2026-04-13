/**
 * Embedder — batched OpenAI `text-embedding-3-small` client.
 *
 * Uses direct OpenAI SDK (not AI Gateway — Gateway is for text/image generation).
 * Batches up to 100 inputs per request for throughput.
 */

// David: install `openai` and uncomment imports
// import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // TODO: uncomment after `npm install openai`
  //
  // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  //
  // const results: number[][] = [];
  // for (let i = 0; i < texts.length; i += BATCH_SIZE) {
  //   const batch = texts.slice(i, i + BATCH_SIZE);
  //   const response = await client.embeddings.create({
  //     model: EMBEDDING_MODEL,
  //     input: batch,
  //   });
  //   for (const item of response.data) {
  //     results[i + item.index] = item.embedding;
  //   }
  // }
  // return results;

  console.warn("[embedder] stubbed — install openai and uncomment.");
  return texts.map(() => new Array(EMBEDDING_DIMENSIONS).fill(0));
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
