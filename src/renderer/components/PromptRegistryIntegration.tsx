import React, { useState } from 'react';
import { Prompt } from '../../schemas';
import { useAppContext } from '../context/AppContext';
import { PromptExecutionDialog } from './prompts/PromptExecutionDialog';

interface PromptRegistryIntegrationProps {
  children?: React.ReactNode;
}

export const PromptRegistryIntegration: React.FC<PromptRegistryIntegrationProps> = ({
  children,
}) => {
  const { dispatch } = useAppContext();
  const [executionDialog, setExecutionDialog] = useState<{
    prompt: Prompt;
    isOpen: boolean;
  } | null>(null);

  const handlePromptExecute = (prompt: Prompt) => {
    setExecutionDialog({
      prompt,
      isOpen: true,
    });
  };

  const handlePromptEdit = (prompt: Prompt) => {
    // Create a new Monaco editor tab with the prompt content
    const promptFileName = `${prompt.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md`;

    // Generate markdown content for the prompt
    const frontmatter = generatePromptFrontmatter(prompt);
    const fullContent = `---\n${frontmatter}\n---\n\n${prompt.content.content}`;

    dispatch({
      type: 'OPEN_FILE',
      payload: {
        path: `prompt:${prompt.id}`,
        name: promptFileName,
        content: fullContent,
        language: 'markdown',
        isDirty: false,
      },
    });

    // Set as active file
    dispatch({
      type: 'SET_ACTIVE_FILE',
      payload: `prompt:${prompt.id}`,
    });
  };

  const generatePromptFrontmatter = (prompt: Prompt): string => {
    const metadata = {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags,
      inputType: prompt.inputType,
      outputFormat: prompt.outputFormat,
      version: prompt.version,
      difficulty: prompt.difficulty,
      estimatedTime: prompt.estimatedTime,
      author: prompt.author,
    };

    return Object.entries(metadata)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.map(item => `"${item}"`).join(', ')}]`;
        }
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');
  };

  const handleExecutePrompt = async (
    prompt: Prompt,
    variables: Record<string, string>,
    inputContent?: string
  ) => {
    try {
      // Build the final prompt with variable substitution
      let finalPrompt = prompt.content.content;

      // Replace variables
      Object.entries(variables).forEach(([name, value]) => {
        const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
        finalPrompt = finalPrompt.replace(regex, value);
      });

      // Handle input content if provided
      if (inputContent && finalPrompt.includes('{{input}}')) {
        finalPrompt = finalPrompt.replace(/\{\{input\}\}/g, inputContent);
      }

      // Create a new editor tab with the executed prompt
      const outputFileName = `${prompt.name}_output_${new Date().getTime()}.${getOutputExtension(prompt.outputFormat)}`;

      // For now, just show the processed prompt
      // In a full implementation, this would send to an AI service
      const outputContent = `# Prompt Execution Result\n\n**Prompt:** ${prompt.name}\n**Executed at:** ${new Date().toISOString()}\n\n## Variables Used:\n${Object.entries(
        variables
      )
        .map(([key, value]) => `- **${key}**: ${value}`)
        .join(
          '\n'
        )}\n\n${inputContent ? `## Input Content:\n${inputContent}\n\n` : ''}## Processed Prompt:\n\n${finalPrompt}\n\n---\n\n*Note: In a full implementation, this would be sent to an AI service for processing.*`;

      dispatch({
        type: 'OPEN_FILE',
        payload: {
          path: `prompt-output:${prompt.id}:${Date.now()}`,
          name: outputFileName,
          content: outputContent,
          language: prompt.outputFormat === 'json' ? 'json' : 'markdown',
          isDirty: false,
        },
      });

      dispatch({
        type: 'SET_ACTIVE_FILE',
        payload: `prompt-output:${prompt.id}:${Date.now()}`,
      });

      // Record usage
      await window.electronAPI?.recordPromptUsage?.(prompt.id);
    } catch (error) {
      console.error('Failed to execute prompt:', error);
      throw error;
    }
  };

  const getOutputExtension = (outputFormat: string): string => {
    switch (outputFormat) {
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'csv':
        return 'csv';
      case 'code':
        return 'txt';
      default:
        return 'md';
    }
  };

  const handleCloseExecutionDialog = () => {
    setExecutionDialog(null);
  };

  return (
    <>
      {/* Pass handlers to children via context or props */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onPromptExecute: handlePromptExecute,
            onPromptEdit: handlePromptEdit,
          } as any);
        }
        return child;
      })}

      {/* Execution Dialog */}
      {executionDialog && (
        <PromptExecutionDialog
          prompt={executionDialog.prompt}
          isOpen={executionDialog.isOpen}
          onClose={handleCloseExecutionDialog}
          onExecute={handleExecutePrompt}
        />
      )}
    </>
  );
};
