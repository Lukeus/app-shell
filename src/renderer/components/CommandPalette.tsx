import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Command } from '../../types';

interface CommandPaletteItem extends Command {
  score?: number;
  highlighted?: string;
}

interface CommandPaletteProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isVisible, onClose }) => {
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<CommandPaletteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load commands from main process
  const loadCommands = useCallback(async () => {
    setIsLoading(true);
    try {
      const availableCommands = (await window.electronAPI?.getAllCommands()) || [];
      setCommands(availableCommands);
    } catch (error) {
      console.error('Failed to load commands:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize commands when component mounts
  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isVisible]);

  // Fuzzy search scoring
  const fuzzyScore = useCallback((query: string, command: Command): number => {
    const searchText =
      `${command.title} ${command.category || ''} ${command.command}`.toLowerCase();
    const queryChars = query.split('');
    let score = 0;
    let lastIndex = -1;
    let consecutiveBonus = 0;

    for (const char of queryChars) {
      const index = searchText.indexOf(char, lastIndex + 1);
      if (index === -1) return 0;

      // Base score for character match
      score += 1;

      // Bonus for consecutive characters
      if (index === lastIndex + 1) {
        consecutiveBonus++;
        score += consecutiveBonus;
      } else {
        consecutiveBonus = 0;
      }

      // Bonus for word boundary matches
      if (index === 0 || searchText[index - 1] === ' ') {
        score += 2;
      }

      lastIndex = index;
    }

    // Normalize score by search text length
    return score / searchText.length;
  }, []);

  // Highlight matching characters
  const highlightMatch = useCallback((command: Command, query: string): string => {
    const title = command.title;
    const lowerTitle = title.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let result = '';
    let lastIndex = 0;
    let queryIndex = 0;

    for (let i = 0; i < lowerTitle.length && queryIndex < lowerQuery.length; i++) {
      if (lowerTitle[i] === lowerQuery[queryIndex]) {
        if (i > lastIndex) {
          result += title.substring(lastIndex, i);
        }
        result += `<mark class="bg-vscode-accent text-white px-0.5 rounded-sm">${title[i]}</mark>`;
        lastIndex = i + 1;
        queryIndex++;
      }
    }

    if (lastIndex < title.length) {
      result += title.substring(lastIndex);
    }

    return result;
  }, []);

  // Filter commands based on query
  useEffect(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      // Show all commands when no query
      const allCommands = commands.slice(0, 50).map(cmd => ({ ...cmd }));
      setFilteredCommands(allCommands);
    } else {
      // Fuzzy search implementation
      const scoredCommands = commands
        .map(command => {
          const score = fuzzyScore(trimmedQuery, command);
          if (score > 0.3) {
            return {
              ...command,
              score,
              highlighted: highlightMatch(command, trimmedQuery),
            } as CommandPaletteItem;
          }
          return null;
        })
        .filter((item): item is CommandPaletteItem => item !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 50);

      setFilteredCommands(scoredCommands);
    }

    setSelectedIndex(0);
  }, [query, commands, fuzzyScore, highlightMatch]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          event.preventDefault();
          executeSelected();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands.length, onClose]
  );

  // Execute selected command
  const executeSelected = useCallback(() => {
    const selectedCommand = filteredCommands[selectedIndex];
    if (!selectedCommand) return;

    // Execute command first
    window.electronAPI?.executeCommand(selectedCommand.command);

    // Then close palette
    onClose();
  }, [filteredCommands, selectedIndex, onClose]);

  // Handle command click
  const handleCommandClick = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      executeSelected();
    },
    [executeSelected]
  );

  // Handle mouse hover
  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-vscode-bg-secondary border border-vscode-border rounded-lg shadow-2xl overflow-hidden transform transition-all duration-200 ease-out animate-slideDown">
        {/* Input */}
        <div className="border-b border-vscode-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="w-full px-6 py-4 bg-transparent text-vscode-fg-primary text-base placeholder-vscode-fg-muted focus:outline-none"
          />
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-vscode-border scrollbar-track-transparent"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-vscode-fg-muted">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-vscode-accent border-t-transparent"></div>
              <span className="ml-3">Loading commands...</span>
            </div>
          ) : filteredCommands.length === 0 ? (
            <div className="py-12 px-6 text-center text-vscode-fg-muted">
              {query.trim() ? 'No commands found' : 'No commands available'}
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={`${command.command}-${index}`}
                className={`px-6 py-3 cursor-pointer border-l-3 transition-colors duration-150 ${
                  index === selectedIndex
                    ? 'bg-vscode-accent border-l-vscode-accent text-white'
                    : 'border-l-transparent hover:bg-vscode-hover'
                }`}
                onClick={() => handleCommandClick(index)}
                onMouseEnter={() => handleMouseEnter(index)}
              >
                <div
                  className="font-medium text-sm mb-1"
                  dangerouslySetInnerHTML={{
                    __html: command.highlighted || command.title,
                  }}
                />
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span className="text-vscode-fg-muted">{command.category || 'General'}</span>
                  <span className="font-mono text-vscode-fg-muted">{command.command}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default CommandPalette;
