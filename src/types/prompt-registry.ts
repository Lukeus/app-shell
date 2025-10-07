/**
 * Prompt Registry Types and Interfaces
 * Based on Fabric's pattern structure with enhanced metadata
 */

export interface PromptMetadata {
  /** Unique identifier for the prompt */
  id: string;
  /** Display name of the prompt */
  name: string;
  /** Brief description of what the prompt does */
  description: string;
  /** Detailed usage instructions */
  instructions?: string;
  /** Author information */
  author?: string;
  /** Version of the prompt */
  version: string;
  /** Tags for categorization and searching */
  tags: string[];
  /** Category for organization */
  category: string;
  /** Expected input type */
  inputType: PromptInputType;
  /** Expected output format */
  outputFormat: PromptOutputFormat;
  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  /** Estimated execution time */
  estimatedTime?: string;
  /** Language or domain specific to this prompt */
  language?: string;
  /** Created timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Source URL if imported */
  sourceUrl?: string;
  /** Whether this is a built-in prompt */
  isBuiltIn: boolean;
  /** Whether this is a favorite */
  isFavorite: boolean;
  /** Usage statistics */
  usageCount: number;
  /** Last used timestamp */
  lastUsed?: string;
  /** File path on disk */
  filePath: string;
}

export interface PromptContent {
  /** The main prompt text with variable placeholders */
  content: string;
  /** Variables that can be substituted in the prompt */
  variables: PromptVariable[];
  /** Examples of how to use this prompt */
  examples?: PromptExample[];
  /** System prompt for AI models */
  systemPrompt?: string;
  /** Temperature setting for AI models */
  temperature?: number;
  /** Max tokens for AI models */
  maxTokens?: number;
}

export interface PromptVariable {
  /** Variable name (used in {{variable}} format) */
  name: string;
  /** Human-readable label */
  label: string;
  /** Description of what this variable should contain */
  description: string;
  /** Type of variable */
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiline';
  /** Default value */
  defaultValue?: string;
  /** Whether this variable is required */
  required: boolean;
  /** For select type, the available options */
  options?: string[];
  /** Validation rules */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface PromptExample {
  /** Example title */
  title: string;
  /** Example description */
  description?: string;
  /** Example input values */
  input: Record<string, string>;
  /** Expected output (optional) */
  output?: string;
}

export interface Prompt extends PromptMetadata {
  /** The actual prompt content and configuration */
  content: PromptContent;
}

export type PromptInputType =
  | 'text' // Plain text input
  | 'markdown' // Markdown formatted text
  | 'code' // Source code
  | 'url' // Web URL
  | 'file' // File path or content
  | 'clipboard' // Clipboard content
  | 'selection' // Selected text from editor
  | 'none'; // No input required

export type PromptOutputFormat =
  | 'text' // Plain text output
  | 'markdown' // Markdown formatted output
  | 'json' // JSON structured output
  | 'html' // HTML output
  | 'code' // Source code output
  | 'csv' // CSV data output
  | 'mixed'; // Mixed format output

export interface PromptCategory {
  /** Category ID */
  id: string;
  /** Display name */
  name: string;
  /** Category description */
  description: string;
  /** Icon for the category */
  icon?: string;
  /** Parent category ID for hierarchical organization */
  parentId?: string;
  /** Number of prompts in this category */
  promptCount: number;
}

export interface PromptSearchQuery {
  /** Search text */
  query?: string;
  /** Filter by categories */
  categories?: string[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by input type */
  inputType?: PromptInputType;
  /** Filter by output format */
  outputFormat?: PromptOutputFormat;
  /** Filter by difficulty */
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  /** Filter by favorites */
  favoritesOnly?: boolean;
  /** Sort criteria */
  sortBy?: 'name' | 'category' | 'created' | 'modified' | 'usage' | 'lastUsed';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Pagination */
  offset?: number;
  limit?: number;
}

export interface PromptSearchResult {
  /** Matching prompts */
  prompts: Prompt[];
  /** Total number of matches (for pagination) */
  total: number;
  /** Applied filters */
  filters: PromptSearchQuery;
  /** Search took how long (ms) */
  searchTime: number;
}

export interface PromptExecution {
  /** Prompt being executed */
  promptId: string;
  /** Values for prompt variables */
  variables: Record<string, string>;
  /** Input content (if applicable) */
  inputContent?: string;
  /** Execution timestamp */
  executedAt: string;
  /** Execution context */
  context: {
    /** File being edited (if applicable) */
    activeFile?: string;
    /** Selected text (if applicable) */
    selection?: string;
    /** Cursor position (if applicable) */
    cursorPosition?: { line: number; column: number };
  };
}

export interface PromptExecutionResult {
  /** Execution details */
  execution: PromptExecution;
  /** Generated output */
  output: string;
  /** Output format */
  format: PromptOutputFormat;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Whether execution was successful */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
  /** Usage statistics */
  tokensUsed?: number;
  /** Cost information */
  cost?: number;
}

export interface PromptRegistry {
  /** All loaded prompts */
  prompts: Map<string, Prompt>;
  /** All available categories */
  categories: Map<string, PromptCategory>;
  /** Search index for fast searching */
  searchIndex: PromptSearchIndex;
  /** Recently used prompts */
  recentlyUsed: string[];
  /** User favorites */
  favorites: Set<string>;
  /** Custom user prompts directory */
  userPromptsPath: string;
  /** Built-in prompts directory */
  builtinPromptsPath: string;
}

export interface PromptSearchIndex {
  /** Text search index */
  textIndex: Map<string, Set<string>>;
  /** Tag index */
  tagIndex: Map<string, Set<string>>;
  /** Category index */
  categoryIndex: Map<string, Set<string>>;
  /** Last rebuild timestamp */
  lastRebuild: string;
}

export interface PromptImportOptions {
  /** Source directory or file to import from */
  source: string;
  /** Target category for imported prompts */
  targetCategory?: string;
  /** Whether to overwrite existing prompts */
  overwrite?: boolean;
  /** Whether to preserve source metadata */
  preserveMetadata?: boolean;
  /** Custom mapping for variable names */
  variableMapping?: Record<string, string>;
}

export interface PromptImportResult {
  /** Number of prompts imported successfully */
  imported: number;
  /** Number of prompts skipped */
  skipped: number;
  /** Number of prompts that failed to import */
  failed: number;
  /** List of imported prompt IDs */
  importedIds: string[];
  /** List of errors encountered */
  errors: Array<{ file: string; error: string }>;
  /** Import took how long (ms) */
  importTime: number;
}

export interface PromptExportOptions {
  /** Prompt IDs to export */
  promptIds: string[];
  /** Target directory for export */
  targetDirectory: string;
  /** Export format */
  format: 'fabric' | 'markdown' | 'json';
  /** Whether to include metadata */
  includeMetadata?: boolean;
  /** Whether to create directory structure by category */
  organizeByCategory?: boolean;
}

export interface PromptExportResult {
  /** Number of prompts exported */
  exported: number;
  /** Export directory */
  exportPath: string;
  /** List of exported files */
  exportedFiles: string[];
  /** Export took how long (ms) */
  exportTime: number;
}

// Event types for prompt registry
export interface PromptRegistryEvents {
  'prompt-added': Prompt;
  'prompt-updated': Prompt;
  'prompt-removed': string;
  'prompt-executed': PromptExecutionResult;
  'category-added': PromptCategory;
  'category-updated': PromptCategory;
  'category-removed': string;
  'search-index-rebuilt': void;
  'import-completed': PromptImportResult;
  'export-completed': PromptExportResult;
}

// Configuration for prompt registry
export interface PromptRegistryConfig {
  /** Enable automatic indexing */
  autoIndex: boolean;
  /** Maximum number of recent prompts to track */
  maxRecentPrompts: number;
  /** Enable usage analytics */
  enableAnalytics: boolean;
  /** Auto-backup interval in minutes (0 to disable) */
  autoBackupInterval: number;
  /** Maximum backup files to keep */
  maxBackupFiles: number;
  /** Enable prompt validation */
  enableValidation: boolean;
  /** Default AI model settings */
  defaultAISettings: {
    temperature: number;
    maxTokens: number;
    model?: string;
  };
}
