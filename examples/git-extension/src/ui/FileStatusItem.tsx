/**
 * FileStatusItem - Individual file status item in the source control view
 */

import React from 'react';
import { SourceControlResource } from '../services/source-control-provider';
import * as path from 'path';

interface FileStatusItemProps {
  resource: SourceControlResource;
  isSelected: boolean;
  onAction: (action: string, resourceUri: string) => void;
  onToggleSelection: (resourceUri: string) => void;
}

export const FileStatusItem: React.FC<FileStatusItemProps> = ({
  resource,
  isSelected,
  onAction,
  onToggleSelection,
}) => {
  const fileName = path.basename(resource.resourceUri);
  const filePath = path.dirname(resource.resourceUri);
  const { decorations } = resource;

  const getStatusIcon = (iconPath: string) => {
    switch (iconPath) {
      case 'modified':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'added':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        );
      case 'deleted':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        );
      case 'renamed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'untracked':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'conflicted':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
    }
  };

  const handleClick = () => {
    onAction('openFile', resource.resourceUri);
  };

  const handleDoubleClick = () => {
    onAction('openDiff', resource.resourceUri);
  };

  const handleStageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction('stage', resource.resourceUri);
  };

  const handleUnstageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction('unstage', resource.resourceUri);
  };

  const handleDiscardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction('discard', resource.resourceUri);
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(resource.resourceUri);
  };

  return (
    <div
      className={`file-status-item flex items-center p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={decorations.tooltip}
    >
      {/* Selection Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelection(resource.resourceUri)}
        className="mr-2 cursor-pointer"
        onClick={handleSelectionClick}
      />

      {/* Status Icon */}
      <div className="mr-2 flex-shrink-0" style={{ color: decorations.color }}>
        {getStatusIcon(decorations.iconPath || 'modified')}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium truncate ${
            decorations.strikeThrough ? 'line-through' : ''
          } ${decorations.faded ? 'opacity-60' : ''}`}
        >
          {fileName}
        </div>
        {filePath !== '.' && <div className="text-xs text-gray-500 truncate">{filePath}</div>}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Stage/Unstage Button */}
        <button
          onClick={resource.resourceUri.includes('staged') ? handleUnstageClick : handleStageClick}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={resource.resourceUri.includes('staged') ? 'Unstage' : 'Stage'}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {resource.resourceUri.includes('staged') ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            )}
          </svg>
        </button>

        {/* Discard Button */}
        <button
          onClick={handleDiscardClick}
          className="p-1 rounded hover:bg-red-200 text-red-600 transition-colors"
          title="Discard Changes"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>

        {/* Open Diff Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onAction('openDiff', resource.resourceUri);
          }}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Open Changes"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
