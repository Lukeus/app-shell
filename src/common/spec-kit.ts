export interface SpecKitWorkspaceKey {
  org: string;
  repo: string;
  feature: string;
}

export type SpecKitWorkspaceId = string;

export type SpecKitPromptRole = 'system' | 'user' | 'assistant';

export interface SpecKitPromptMessage {
  id: string;
  role: SpecKitPromptRole;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SpecKitSpecRevision {
  id: string;
  summary?: string;
  createdAt: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

export interface SpecKitGeneratedPatchPointer {
  id: string;
  description?: string;
  path: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SpecKitWorkspaceMetadata {
  promptHistory: SpecKitPromptMessage[];
  specRevisions: SpecKitSpecRevision[];
  generatedPatchPointers: SpecKitGeneratedPatchPointer[];
  [key: string]: unknown;
}

export interface SpecKitWorkspace {
  id: SpecKitWorkspaceId;
  key: SpecKitWorkspaceKey;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  metadata: SpecKitWorkspaceMetadata;
}

export interface CreateSpecKitWorkspaceInput {
  key: SpecKitWorkspaceKey;
  title?: string;
  description?: string;
  metadata?: Partial<SpecKitWorkspaceMetadata>;
}

export interface UpdateSpecKitWorkspaceMetadataInput {
  key: SpecKitWorkspaceKey;
  metadata: SpecKitWorkspaceMetadata;
}

export interface ArchiveSpecKitWorkspaceInput {
  key: SpecKitWorkspaceKey;
  archived?: boolean;
}

export interface SpecKitWorkspaceSelectionState {
  currentWorkspaceId: SpecKitWorkspaceId | null;
}
