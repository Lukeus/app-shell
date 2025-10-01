/**
 * SourceControlView - Main source control panel component
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SourceControlProvider,
  SourceControlResourceGroup,
} from '../services/source-control-provider';
import { GitRepository, GitStatus, appShell } from '../types';
import { FileStatusItem } from './FileStatusItem';
import { CommitBox } from './CommitBox';
import { RepositoryHeader } from './RepositoryHeader';

interface SourceControlViewProps {
  sourceControlProvider: SourceControlProvider;
}

export const SourceControlView: React.FC<SourceControlViewProps> = ({ sourceControlProvider }) => {
  const [repository, setRepository] = useState<GitRepository | null>(null);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [resourceGroups, setResourceGroups] = useState<SourceControlResourceGroup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await sourceControlProvider.refresh();
      setRepository(sourceControlProvider.getRepository());
      setStatus(sourceControlProvider.getStatus());
      setResourceGroups(sourceControlProvider.getResourceGroups());
    } catch (error) {
      console.error('Failed to refresh source control data:', error);
      appShell.window.showErrorMessage('Failed to refresh Git status');
    } finally {
      setIsRefreshing(false);
    }
  }, [sourceControlProvider]);

  useEffect(() => {
    // Initial load
    refreshData();

    // Subscribe to changes
    const disposable = sourceControlProvider.onDidChangeResources(groups => {
      setResourceGroups(groups);
      setRepository(sourceControlProvider.getRepository());
      setStatus(sourceControlProvider.getStatus());
    });

    // Listen for Git events
    const handleGitStatusChanged = () => {
      refreshData();
    };

    appShell.events.on('git.statusChanged', handleGitStatusChanged);

    return () => {
      disposable.dispose();
      // Note: App Shell events don't have a standard off method
    };
  }, [sourceControlProvider, refreshData]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      appShell.window.showWarningMessage('Please enter a commit message');
      return;
    }

    try {
      await sourceControlProvider.commit(commitMessage.trim());
      setCommitMessage('');
      appShell.window.showInformationMessage('Changes committed successfully');
    } catch (error) {
      console.error('Commit failed:', error);
      appShell.window.showErrorMessage(
        `Commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleStageAll = async () => {
    try {
      await sourceControlProvider.stageAll();
    } catch (error) {
      console.error('Stage all failed:', error);
      appShell.window.showErrorMessage('Failed to stage all changes');
    }
  };

  const handleUnstageAll = async () => {
    try {
      await sourceControlProvider.unstageAll();
    } catch (error) {
      console.error('Unstage all failed:', error);
      appShell.window.showErrorMessage('Failed to unstage all changes');
    }
  };

  const handleRefresh = () => {
    refreshData();
  };

  const handleFileAction = async (action: string, resourceUri: string) => {
    try {
      switch (action) {
        case 'stage':
          await sourceControlProvider.stageResource(resourceUri);
          break;
        case 'unstage':
          await sourceControlProvider.unstageResource(resourceUri);
          break;
        case 'discard':
          const confirmed = await appShell.window.showQuickPick(['Yes', 'No'], {
            placeholder: `Discard changes in ${resourceUri}?`,
          });
          if (confirmed === 'Yes') {
            await sourceControlProvider.discardChanges(resourceUri);
          }
          break;
        case 'openFile':
          await appShell.commands.executeCommand('openFile', resourceUri);
          break;
        case 'openDiff':
          await appShell.commands.executeCommand('git.openDiff', resourceUri);
          break;
      }
    } catch (error) {
      console.error(`File action ${action} failed:`, error);
      appShell.window.showErrorMessage(`Failed to ${action} file`);
    }
  };

  const toggleFileSelection = (resourceUri: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(resourceUri)) {
      newSelection.delete(resourceUri);
    } else {
      newSelection.add(resourceUri);
    }
    setSelectedFiles(newSelection);
  };

  if (!repository) {
    return (
      <div className="source-control-view p-4">
        <div className="text-center text-gray-500">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Git Repository</h3>
          <p className="text-sm mb-4">
            Open a folder with a Git repository or initialize a new one.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => appShell.commands.executeCommand('git.init')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Initialize Repository
            </button>
            <button
              onClick={() => appShell.commands.executeCommand('git.clone')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clone Repository
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasStagedChanges = (status?.staged?.length ?? 0) > 0;
  const hasUnstagedChanges = (status?.unstaged.length || 0) + (status?.untracked.length || 0) > 0;

  return (
    <div className="source-control-view h-full flex flex-col">
      {/* Repository Header */}
      <RepositoryHeader
        repository={repository}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Actions Bar */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex space-x-2">
          <button
            onClick={handleStageAll}
            disabled={!hasUnstagedChanges || isRefreshing}
            className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Stage All Changes"
          >
            Stage All
          </button>
          <button
            onClick={handleUnstageAll}
            disabled={!hasStagedChanges || isRefreshing}
            className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Unstage All Changes"
          >
            Unstage All
          </button>
        </div>
      </div>

      {/* Commit Box */}
      {hasStagedChanges && (
        <CommitBox
          commitMessage={commitMessage}
          onCommitMessageChange={setCommitMessage}
          onCommit={handleCommit}
          disabled={isRefreshing}
        />
      )}

      {/* File Groups */}
      <div className="flex-1 overflow-y-auto">
        {resourceGroups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p>No changes detected</p>
          </div>
        ) : (
          resourceGroups.map(group => (
            <div key={group.id} className="border-b border-gray-100 last:border-b-0">
              <div className="sticky top-0 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                {group.label}
              </div>
              <div className="divide-y divide-gray-100">
                {group.resources.map(resource => (
                  <FileStatusItem
                    key={resource.resourceUri}
                    resource={resource}
                    isSelected={selectedFiles.has(resource.resourceUri)}
                    onAction={handleFileAction}
                    onToggleSelection={toggleFileSelection}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
