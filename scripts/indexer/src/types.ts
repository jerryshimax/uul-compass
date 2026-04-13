/**
 * UUL Brain Indexer — shared types
 */

export type SourceType =
  | "brain_file"
  | "decks_pdf"
  | "research_doc"
  | "meeting_recording"
  | "legal_contract"
  | "finance_spreadsheet"
  | "operations_sop";

export type Chunk = {
  text: string;
  chunkIndex: number;
  metadata: {
    heading?: string;        // parent heading for this chunk
    headingPath?: string[];  // full breadcrumb of headings
    startLine?: number;
    endLine?: number;
  };
};

export type IndexableDocument = {
  sourceType: SourceType;
  sourceId: string;           // for brain files: relative path from brain root
  title: string;
  path: string;               // absolute filesystem path
  body: string;               // extracted text content
  metadata: {
    lastModifiedAt: Date;
    sizeBytes: number;
    mimeType: string;
    frontmatter?: Record<string, unknown>; // yaml frontmatter from markdown
    [key: string]: unknown;
  };
};

export type EmbeddingRecord = {
  entityId: string;
  sourceType: SourceType;
  sourceId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];         // 1536 floats for text-embedding-3-small
  embeddingModel: string;
  metadata: Record<string, unknown>;
};
