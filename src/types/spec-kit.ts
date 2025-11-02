export type SpecKitPipelineStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface SpecKitPipelineState {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  status: SpecKitPipelineStatus;
  updatedAt: number;
}

export interface SpecKitWorkspace {
  id: string;
  name: string;
  description?: string;
  lastModified: number;
  pipeline: SpecKitPipelineState;
  tags?: string[];
}

export interface SpecKitState {
  workspaces: SpecKitWorkspace[];
  activeWorkspaceId: string | null;
  lastBroadcast: number;
}

export const createEmptySpecKitState = (): SpecKitState => ({
  workspaces: [],
  activeWorkspaceId: null,
  lastBroadcast: Date.now(),
});
