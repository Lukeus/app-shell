/**
 * CommitBox - Commit message input and commit button
 */

import React, { useState, useRef, useEffect } from 'react';

interface CommitBoxProps {
  commitMessage: string;
  onCommitMessageChange: (message: string) => void;
  onCommit: () => void;
  disabled?: boolean;
}

export const CommitBox: React.FC<CommitBoxProps> = ({
  commitMessage,
  onCommitMessageChange,
  onCommit,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (commitMessage.trim() && !disabled) {
        onCommit();
      }
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      textareaRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!commitMessage.trim()) {
      setIsExpanded(false);
    }
  };

  const handleCommit = () => {
    if (commitMessage.trim() && !disabled) {
      onCommit();
      setIsExpanded(false);
    }
  };

  return (
    <div className="commit-box border-b border-gray-200 p-3 bg-white">
      <div className="space-y-2">
        {/* Commit Message Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={commitMessage}
            onChange={e => onCommitMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Commit message (Ctrl+Enter to commit)"
            disabled={disabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md resize-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
              isExpanded ? 'h-20' : 'h-10'
            }`}
            style={{ minHeight: isExpanded ? '80px' : '40px' }}
          />

          {/* Character Count */}
          {isExpanded && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {commitMessage.length}
            </div>
          )}
        </div>

        {/* Commit Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Commit Type Dropdown */}
            <select
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
              onChange={e => {
                const prefix = e.target.value;
                if (prefix && !commitMessage.startsWith(prefix)) {
                  onCommitMessageChange(prefix + ': ' + commitMessage.replace(/^[^:]*: /, ''));
                }
              }}
            >
              <option value="">Type</option>
              <option value="feat">feat</option>
              <option value="fix">fix</option>
              <option value="docs">docs</option>
              <option value="style">style</option>
              <option value="refactor">refactor</option>
              <option value="test">test</option>
              <option value="chore">chore</option>
            </select>

            {/* Commit Info */}
            <span className="text-xs text-gray-500">
              {commitMessage.trim() ? '✓ Ready' : 'Enter message'}
            </span>
          </div>

          {/* Commit Button */}
          <div className="flex items-center space-x-2">
            {isExpanded && (
              <button
                onClick={() => {
                  onCommitMessageChange('');
                  setIsExpanded(false);
                }}
                disabled={disabled}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}

            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || disabled}
              className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Commit</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        {isExpanded && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div className="flex items-center justify-between">
              <span>
                💡 <strong>Ctrl+Enter</strong> to commit
              </span>
              <span>
                <strong>Esc</strong> to collapse
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
