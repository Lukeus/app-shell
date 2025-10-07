import React, { useState, useEffect, useMemo } from 'react';
import { Prompt, PromptVariable } from '../../../schemas';
import { useAppContext } from '../../context/AppContext';

interface PromptExecutionDialogProps {
  prompt: Prompt;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (prompt: Prompt, variables: Record<string, string>, inputContent?: string) => void;
}

interface VariableInputProps {
  variable: PromptVariable;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const VariableInput: React.FC<VariableInputProps> = ({
  variable,
  value,
  onChange,
  error,
}) => {
  const renderInput = () => {
    switch (variable.type) {
      case 'multiline':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.description}
            className={`w-full px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-fg border rounded-md resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-vscode-accent-blue ${
              error ? 'border-red-500' : 'border-vscode-input-border'
            }`}
            rows={4}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.description}
            min={variable.validation?.min}
            max={variable.validation?.max}
            className={`w-full px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-fg border rounded-md focus:outline-none focus:ring-2 focus:ring-vscode-accent-blue ${
              error ? 'border-red-500' : 'border-vscode-input-border'
            }`}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value === 'true'}
                onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
                className="rounded border border-vscode-input-border bg-vscode-input-bg"
              />
              <span className="text-sm text-vscode-fg-secondary">{variable.label}</span>
            </label>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-fg border rounded-md focus:outline-none focus:ring-2 focus:ring-vscode-accent-blue ${
              error ? 'border-red-500' : 'border-vscode-input-border'
            }`}
          >
            <option value="">Select {variable.label}</option>
            {variable.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.description}
            minLength={variable.validation?.minLength}
            maxLength={variable.validation?.maxLength}
            pattern={variable.validation?.pattern}
            className={`w-full px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-fg border rounded-md focus:outline-none focus:ring-2 focus:ring-vscode-accent-blue ${
              error ? 'border-red-500' : 'border-vscode-input-border'
            }`}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-vscode-fg-primary mb-1">
        {variable.label}
        {variable.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {renderInput()}
      {variable.description && variable.type !== 'boolean' && (
        <p className="mt-1 text-xs text-vscode-fg-muted">{variable.description}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export const PromptExecutionDialog: React.FC<PromptExecutionDialogProps> = ({
  prompt,
  isOpen,
  onClose,
  onExecute,
}) => {
  const { state } = useAppContext();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [inputContent, setInputContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // Initialize variables with default values
  useEffect(() => {
    if (isOpen) {
      const initialVariables: Record<string, string> = {};
      prompt.content.variables.forEach(variable => {
        initialVariables[variable.name] = variable.defaultValue || '';
      });

      // Auto-populate from context if possible
      // TODO: Integrate with editor state when available
      // if (prompt.inputType === 'selection' && state.editor?.activeFile) {
      //   // Get selected text from Monaco Editor
      //   initialVariables.selectedText = getSelectedText();
      // }
      // 
      // if (prompt.inputType === 'file' && state.editor?.activeFile) {
      //   initialVariables.activeFile = state.editor.activeFile;
      // }

      setVariables(initialVariables);
      setInputContent('');
      setErrors({});
      setPreviewContent('');
    }
  }, [isOpen, prompt]);

  // Generate preview when variables change
  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [variables, inputContent, isOpen]);

  const validateVariable = (variable: PromptVariable, value: string): string | null => {
    if (variable.required && !value.trim()) {
      return `${variable.label} is required`;
    }

    if (value) {
      const validation = variable.validation;
      if (validation) {
        if (variable.type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return `${variable.label} must be a number`;
          }
          if (validation.min !== undefined && numValue < validation.min) {
            return `${variable.label} must be at least ${validation.min}`;
          }
          if (validation.max !== undefined && numValue > validation.max) {
            return `${variable.label} must be at most ${validation.max}`;
          }
        } else {
          if (validation.minLength && value.length < validation.minLength) {
            return `${variable.label} must be at least ${validation.minLength} characters`;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            return `${variable.label} must be at most ${validation.maxLength} characters`;
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            return `${variable.label} format is invalid`;
          }
        }
      }
    }

    return null;
  };

  const validateAllVariables = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    prompt.content.variables.forEach(variable => {
      const error = validateVariable(variable, variables[variable.name] || '');
      if (error) {
        newErrors[variable.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const generatePreview = () => {
    let preview = prompt.content.content;

    // Replace variables in the preview
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      preview = preview.replace(regex, value || `{{${name}}}`);
    });

    // Handle input content replacement if needed
    if (inputContent && preview.includes('{{input}}')) {
      preview = preview.replace(/\{\{input\}\}/g, inputContent);
    }

    setPreviewContent(preview);
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this variable if it now validates
    const variable = prompt.content.variables.find(v => v.name === name);
    if (variable && errors[name]) {
      const error = validateVariable(variable, value);
      if (!error) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleExecute = async () => {
    if (!validateAllVariables()) {
      return;
    }

    setIsExecuting(true);
    try {
      await onExecute(prompt, variables, inputContent || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to execute prompt:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const needsInputContent = useMemo(() => {
    return ['text', 'markdown', 'code', 'clipboard', 'selection'].includes(prompt.inputType);
  }, [prompt.inputType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vscode-border">
          <div>
            <h2 className="text-lg font-semibold text-vscode-fg-primary">
              Execute Prompt: {prompt.name}
            </h2>
            <p className="text-sm text-vscode-fg-muted mt-1">
              {prompt.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-vscode-fg-muted hover:text-vscode-fg-primary hover:bg-vscode-bg-quaternary"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input Variables */}
            <div>
              <h3 className="text-sm font-semibold text-vscode-fg-primary mb-3">
                Variables
              </h3>

              {prompt.content.variables.length > 0 ? (
                prompt.content.variables.map(variable => (
                  <VariableInput
                    key={variable.name}
                    variable={variable}
                    value={variables[variable.name] || ''}
                    onChange={(value) => handleVariableChange(variable.name, value)}
                    error={errors[variable.name]}
                  />
                ))
              ) : (
                <p className="text-sm text-vscode-fg-muted">
                  This prompt doesn't require any variables.
                </p>
              )}

              {/* Input content for certain input types */}
              {needsInputContent && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-vscode-fg-primary mb-1">
                    Input Content
                  </label>
                  <textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder="Enter the content to process..."
                    className="w-full px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded-md resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-vscode-accent-blue"
                    rows={6}
                  />
                  <p className="mt-1 text-xs text-vscode-fg-muted">
                    This content will be processed by the prompt
                  </p>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div>
              <h3 className="text-sm font-semibold text-vscode-fg-primary mb-3">
                Preview
              </h3>
              <div className="bg-vscode-bg-tertiary border border-vscode-border rounded-md p-3 text-sm">
                <pre className="whitespace-pre-wrap text-vscode-fg-secondary font-mono text-xs leading-relaxed">
                  {previewContent || 'Preview will appear here...'}
                </pre>
              </div>
              
              {/* Prompt metadata */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-4 text-xs text-vscode-fg-muted">
                  <span>📝 {prompt.inputType}</span>
                  <span>📄 {prompt.outputFormat}</span>
                  {prompt.difficulty && (
                    <span className="capitalize">🎯 {prompt.difficulty}</span>
                  )}
                </div>
                
                {prompt.estimatedTime && (
                  <div className="text-xs text-vscode-fg-muted">
                    ⏱️ Estimated time: {prompt.estimatedTime}
                  </div>
                )}

                {prompt.content.examples && prompt.content.examples.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-vscode-fg-primary cursor-pointer">
                      💡 Examples
                    </summary>
                    <div className="mt-2 space-y-2">
                      {prompt.content.examples.map((example, index) => (
                        <div key={index} className="bg-vscode-bg-quaternary p-2 rounded text-xs">
                          <div className="font-medium text-vscode-fg-primary">{example.title}</div>
                          {example.description && (
                            <div className="text-vscode-fg-muted mt-1">{example.description}</div>
                          )}
                          <div className="mt-2">
                            <div className="text-vscode-fg-muted">Input:</div>
                            <div className="font-mono text-xs bg-vscode-bg-tertiary p-1 rounded mt-1">
                              {JSON.stringify(example.input, null, 2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-vscode-border">
          <div className="flex items-center gap-2 text-xs text-vscode-fg-muted">
            {prompt.content.variables.length > 0 && (
              <span>🔧 {prompt.content.variables.length} variables</span>
            )}
            {Object.keys(errors).length > 0 && (
              <span className="text-red-400">
                ⚠️ {Object.keys(errors).length} validation errors
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-vscode-bg-quaternary text-vscode-fg-secondary hover:bg-vscode-bg-primary rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting || Object.keys(errors).length > 0}
              className="px-4 py-2 text-sm bg-vscode-accent-blue text-white hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <span className="flex items-center gap-2">
                  <span>⏳</span>
                  Executing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>▶️</span>
                  Execute
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};