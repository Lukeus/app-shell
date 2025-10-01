/**
 * RepositoryHeader - Repository information header
 */

import React from 'react';
import type { GitRepository } from '../types';
import * as path from 'path';

interface RepositoryHeaderProps {
  repository: GitRepository;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const RepositoryHeader: React.FC<RepositoryHeaderProps> = ({
  repository,
  isRefreshing,
  onRefresh,
}) => {
  const handlePush = () => {
    appShell.commands.executeCommand('git.push');
  };

  const handlePull = () => {
    appShell.commands.executeCommand('git.pull');
  };

  const handleSync = () => {
    // Pull then push
    appShell.commands
      .executeCommand('git.pull')
      .then(() => {
        appShell.commands.executeCommand('git.push');
      })
      .catch(console.error);
  };

  const handleBranchClick = () => {
    // Show branch picker
    appShell.commands.executeCommand('git.switchBranch');
  };

  return (
    <div className="repository-header border-b border-gray-200 p-3 bg-gray-50">
      {/* Repository Name and Path */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <div>
            <h3 className="font-medium text-gray-900">{repository.name}</h3>
            <p className="text-xs text-gray-500 truncate" title={repository.path}>
              {path.basename(path.dirname(repository.path))} / {path.basename(repository.path)}
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Branch and Status Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Branch */}
          <button
            onClick={handleBranchClick}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            title="Switch Branch"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 3C4.9 3 4 3.9 4 5s.9 2 2 2c.8 0 1.5-.5 1.8-1.2L11 7.2c.4.4.9.8 1.4.8.6 0 1.1-.3 1.4-.8L17 5.8c.3.7 1 1.2 1.8 1.2 1.1 0 2-.9 2-2s-.9-2-2-2c-.8 0-1.5.5-1.8 1.2L13.8 2.8c-.4-.4-.9-.8-1.4-.8-.6 0-1.1.3-1.4.8L7.8 4.2C7.5 3.5 6.8 3 6 3zm6 2c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zM6 19c-1.1 0-2 .9-2 2s.9 2 2 2c.8 0 1.5-.5 1.8-1.2l3.2-1.4c.4.4.9.8 1.4.8.6 0 1.1-.3 1.4-.8l3.2 1.4c.3.7 1 1.2 1.8 1.2 1.1 0 2-.9 2-2s-.9-2-2-2c-.8 0-1.5.5-1.8 1.2l-3.2-1.4c-.4-.4-.9-.8-1.4-.8-.6 0-1.1.3-1.4.8L7.8 18.8c-.3.7-1 1.2-1.8 1.2zm6-2c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z" />
            </svg>
            <span>{repository.branch}</span>
          </button>

          {/* Ahead/Behind Status */}
          {(repository.status.ahead > 0 || repository.status.behind > 0) && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {repository.status.ahead > 0 && (
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14l5-5 5 5H7z" />
                  </svg>
                  <span>{repository.status.ahead}</span>
                </span>
              )}
              {repository.status.behind > 0 && (
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                  <span>{repository.status.behind}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Pull Button */}
          <button
            onClick={handlePull}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Pull"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
          </button>

          {/* Push Button */}
          <button
            onClick={handlePush}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Push"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Sync (Pull + Push)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
