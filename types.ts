
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface HistoryItem {
    id: string;
    prompt: string;
    timestamp: number;
    version: number;
}

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  status: 'streaming' | 'complete' | 'error';
  errorMessage?: string;
  history?: HistoryItem[];
}

export interface SavedArtifact extends Artifact {
    prompt: string;
    timestamp: number;
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts: Artifact[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    picture?: string;
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }

export interface ProjectFile {
    name: string;
    content?: string;
    children?: ProjectFile[];
}
