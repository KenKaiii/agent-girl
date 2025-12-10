/**
 * Website Clone Module - Type Definitions
 */

export interface CloneOptions {
  url: string;
  outputDir?: string;
  maxDepth?: number;
  jsRender?: boolean;
  scrollToBottom?: boolean;
  timeout?: number;
  userAgent?: string;
}

export interface CloneResult {
  success: boolean;
  url: string;
  outputDir: string;
  htmlDir: string;
  filesDownloaded: number;
  duration: number;
  errors?: string[];
}

export interface SanitizeResult {
  fixed: number;
  files: string[];
}

export interface ServerInfo {
  pid: number;
  port: number;
  url: string;
  htmlDir: string;
}

export interface CompareResult {
  similarity: number;
  diffImage?: string;
  sections?: SectionComparison[];
}

export interface SectionComparison {
  name: string;
  similarity: number;
  originalScreenshot: string;
  cloneScreenshot: string;
  diffImage?: string;
}

export interface CloneJob {
  id: string;
  url: string;
  status: 'pending' | 'cloning' | 'flattening' | 'sanitizing' | 'serving' | 'complete' | 'error';
  progress: number;
  outputDir?: string;
  server?: ServerInfo;
  result?: CloneResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CloneEventData {
  status?: CloneJob['status'];
  progress?: number;
  server?: ServerInfo;
  result?: CloneResult;
  error?: string;
  [key: string]: unknown;
}

export interface CloneEvent {
  type: 'progress' | 'status' | 'complete' | 'error';
  jobId: string;
  data: CloneEventData;
}
