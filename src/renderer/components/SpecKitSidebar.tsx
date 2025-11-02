import React, { useMemo } from 'react';
import { useSpecKit } from '../context/SpecKitContext';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../utils/date';

const statusStyles: Record<string, string> = {
  running: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
  paused: 'bg-amber-500/10 text-amber-200 border-amber-500/40',
  idle: 'bg-slate-500/10 text-slate-200 border-slate-500/40',
  completed: 'bg-indigo-500/10 text-indigo-200 border-indigo-500/40',
};

const statusLabels: Record<string, string> = {
  running: 'In Progress',
  paused: 'Paused',
  idle: 'Ready',
  completed: 'Completed',
};

export const SpecKitSidebar: React.FC = () => {
  const { state, isLoading, switchWorkspace, resumePipeline, saveContext } = useSpecKit();
  const { showToast } = useToast();

  const sortedWorkspaces = useMemo(() => {
    return [...state.workspaces].sort((a, b) => b.lastModified - a.lastModified);
  }, [state.workspaces]);

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      const nextState = await switchWorkspace(workspaceId);
      if (!nextState) return;
      const workspace = nextState.workspaces.find(ws => ws.id === workspaceId);
      if (workspace) {
        showToast({
          title: `Switched to ${workspace.name}`,
          description: `Focused on "${workspace.pipeline.currentStep}"`,
          intent: 'success',
        });
      }
    } catch (error) {
      showToast({
        title: 'Failed to switch workspace',
        description: error instanceof Error ? error.message : 'Unknown error',
        intent: 'error',
      });
    }
  };

  const handleResumePipeline = async (workspaceId: string) => {
    try {
      const nextState = await resumePipeline(workspaceId);
      if (!nextState) return;
      const workspace = nextState.workspaces.find(ws => ws.id === workspaceId);
      if (workspace) {
        showToast({
          title: 'Pipeline resumed',
          description: `${workspace.name} is running step "${workspace.pipeline.currentStep}"`,
          intent: 'success',
        });
      }
    } catch (error) {
      showToast({
        title: 'Failed to resume pipeline',
        description: error instanceof Error ? error.message : 'Unknown error',
        intent: 'error',
      });
    }
  };

  const handleSaveContext = async (workspaceId: string) => {
    try {
      const nextState = await saveContext(workspaceId);
      if (!nextState) return;
      const workspace = nextState.workspaces.find(ws => ws.id === workspaceId);
      if (workspace) {
        showToast({
          title: 'Context saved',
          description: `${workspace.name} synced just now`,
          intent: 'info',
        });
      }
    } catch (error) {
      showToast({
        title: 'Failed to save context',
        description: error instanceof Error ? error.message : 'Unknown error',
        intent: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-vscode-bg-tertiary rounded" />
        <div className="h-4 bg-vscode-bg-tertiary rounded w-5/6" />
        <div className="h-4 bg-vscode-bg-tertiary rounded w-2/3" />
      </div>
    );
  }

  if (!sortedWorkspaces.length) {
    return (
      <div className="p-6 text-sm text-vscode-fg-secondary">
        No Spec Kit workspaces found. Create one to start tracking your pipeline.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 text-sm">
      <section className="space-y-2">
        <h3 className="text-xs uppercase tracking-wide text-vscode-fg-tertiary">Workspaces</h3>
        <div className="flex flex-col gap-3">
          {sortedWorkspaces.map(workspace => {
            const isActive = workspace.id === state.activeWorkspaceId;
            const statusClass = statusStyles[workspace.pipeline.status] || statusStyles.idle;
            const statusLabel = statusLabels[workspace.pipeline.status] || 'Active';
            const progress = workspace.pipeline.totalSteps
              ? Math.min(100, Math.round((workspace.pipeline.completedSteps / workspace.pipeline.totalSteps) * 100))
              : 0;

            return (
              <div
                key={workspace.id}
                className={`rounded-md border border-vscode-border bg-vscode-bg-primary/60 transition hover:border-vscode-accent ${
                  isActive ? 'ring-1 ring-vscode-accent border-vscode-accent' : ''
                }`}
              >
                <button
                  className="w-full text-left px-3 pt-3"
                  onClick={() => handleSwitchWorkspace(workspace.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-vscode-fg-primary">{workspace.name}</div>
                      {workspace.description ? (
                        <p className="text-xs text-vscode-fg-tertiary mt-0.5">{workspace.description}</p>
                      ) : null}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </button>

                <div className="px-3 pb-3 space-y-3">
                  <div className="flex items-center justify-between text-xs text-vscode-fg-tertiary">
                    <span>
                      Step {workspace.pipeline.completedSteps} of {workspace.pipeline.totalSteps}{' '}
                      · {workspace.pipeline.currentStep}
                    </span>
                    <span>{formatRelativeTime(workspace.lastModified)}</span>
                  </div>

                  <div className="h-1.5 rounded bg-vscode-bg-tertiary overflow-hidden">
                    <div
                      className="h-full bg-vscode-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex gap-2">
                    {workspace.pipeline.status === 'paused' ? (
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-vscode-border bg-vscode-bg-secondary px-2 py-1 text-xs font-medium text-vscode-fg-primary hover:border-vscode-accent"
                        onClick={() => handleResumePipeline(workspace.id)}
                      >
                        ▶ Resume
                      </button>
                    ) : null}
                    <button
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-vscode-border bg-vscode-bg-secondary px-2 py-1 text-xs font-medium text-vscode-fg-primary hover:border-vscode-accent"
                      onClick={() => handleSaveContext(workspace.id)}
                    >
                      💾 Save Context
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
