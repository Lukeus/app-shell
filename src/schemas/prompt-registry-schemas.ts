import { z } from 'zod';

// Prompt Input Type Schema
export const PromptInputTypeSchema = z.enum([
  'text',
  'markdown',
  'code',
  'url',
  'file',
  'clipboard',
  'selection',
  'none',
]);

// Prompt Output Format Schema
export const PromptOutputFormatSchema = z.enum([
  'text',
  'markdown',
  'json',
  'html',
  'code',
  'csv',
  'mixed',
]);

// Prompt Variable Validation Schema
export const PromptVariableValidationSchema = z.object({
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

// Prompt Variable Schema
export const PromptVariableSchema = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Variable name must be valid identifier'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiline']),
  defaultValue: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: PromptVariableValidationSchema.optional(),
});

// Prompt Example Schema
export const PromptExampleSchema = z.object({
  title: z.string().min(1, 'Example title is required'),
  description: z.string().optional(),
  input: z.record(z.string(), z.string()),
  output: z.string().optional(),
});

// Prompt Content Schema
export const PromptContentSchema = z.object({
  content: z.string().min(1, 'Prompt content is required'),
  variables: z.array(PromptVariableSchema).default([]),
  examples: z.array(PromptExampleSchema).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
});

// Prompt Metadata Schema
export const PromptMetadataSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid prompt ID format'),
  name: z.string().min(1, 'Prompt name is required'),
  description: z.string().min(1, 'Prompt description is required'),
  instructions: z.string().optional(),
  author: z.string().optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning')
    .default('1.0.0'),
  tags: z.array(z.string()).default([]),
  category: z.string().min(1, 'Category is required'),
  inputType: PromptInputTypeSchema.default('text'),
  outputFormat: PromptOutputFormatSchema.default('text'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedTime: z.string().optional(),
  language: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sourceUrl: z.string().url().optional(),
  isBuiltIn: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  usageCount: z.number().min(0).default(0),
  lastUsed: z.string().datetime().optional(),
  filePath: z.string().min(1, 'File path is required'),
});

// Full Prompt Schema
export const PromptSchema = PromptMetadataSchema.extend({
  content: PromptContentSchema,
});

// Prompt Category Schema
export const PromptCategorySchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid category ID format'),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().min(1, 'Category description is required'),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  promptCount: z.number().min(0).default(0),
});

// Prompt Search Query Schema
export const PromptSearchQuerySchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  inputType: PromptInputTypeSchema.optional(),
  outputFormat: PromptOutputFormatSchema.optional(),
  difficulty: z.array(z.enum(['beginner', 'intermediate', 'advanced'])).optional(),
  favoritesOnly: z.boolean().optional(),
  sortBy: z.enum(['name', 'category', 'created', 'modified', 'usage', 'lastUsed']).default('name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(1000).default(50),
});

// Prompt Execution Schema
export const PromptExecutionSchema = z.object({
  promptId: z.string().min(1, 'Prompt ID is required'),
  variables: z.record(z.string(), z.string()).default({}),
  inputContent: z.string().optional(),
  executedAt: z.string().datetime(),
  context: z
    .object({
      activeFile: z.string().optional(),
      selection: z.string().optional(),
      cursorPosition: z
        .object({
          line: z.number().min(0),
          column: z.number().min(0),
        })
        .optional(),
    })
    .default({}),
});

// Prompt Execution Result Schema
export const PromptExecutionResultSchema = z.object({
  execution: PromptExecutionSchema,
  output: z.string(),
  format: PromptOutputFormatSchema,
  executionTime: z.number().min(0),
  success: z.boolean(),
  error: z.string().optional(),
  tokensUsed: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
});

// Prompt Import Options Schema
export const PromptImportOptionsSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  targetCategory: z.string().optional(),
  overwrite: z.boolean().default(false),
  preserveMetadata: z.boolean().default(true),
  variableMapping: z.record(z.string(), z.string()).optional(),
});

// Prompt Import Result Schema
export const PromptImportResultSchema = z.object({
  imported: z.number().min(0),
  skipped: z.number().min(0),
  failed: z.number().min(0),
  importedIds: z.array(z.string()),
  errors: z.array(
    z.object({
      file: z.string(),
      error: z.string(),
    })
  ),
  importTime: z.number().min(0),
});

// Prompt Export Options Schema
export const PromptExportOptionsSchema = z.object({
  promptIds: z.array(z.string()).min(1, 'At least one prompt ID is required'),
  targetDirectory: z.string().min(1, 'Target directory is required'),
  format: z.enum(['fabric', 'markdown', 'json']).default('markdown'),
  includeMetadata: z.boolean().default(true),
  organizeByCategory: z.boolean().default(false),
});

// Prompt Export Result Schema
export const PromptExportResultSchema = z.object({
  exported: z.number().min(0),
  exportPath: z.string(),
  exportedFiles: z.array(z.string()),
  exportTime: z.number().min(0),
});

// Prompt Registry Config Schema
export const PromptRegistryConfigSchema = z.object({
  autoIndex: z.boolean().default(true),
  maxRecentPrompts: z.number().min(1).max(100).default(20),
  enableAnalytics: z.boolean().default(true),
  autoBackupInterval: z.number().min(0).default(0), // 0 disables auto-backup
  maxBackupFiles: z.number().min(1).max(50).default(10),
  enableValidation: z.boolean().default(true),
  defaultAISettings: z
    .object({
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().min(1).max(100000).default(4096),
      model: z.string().optional(),
    })
    .default(() => ({ temperature: 0.7, maxTokens: 4096 })),
});

// Fabric Pattern File Schema (for importing from Fabric patterns)
export const FabricPatternFileSchema = z.object({
  // Fabric patterns are markdown files with potential YAML frontmatter
  content: z.string(),
  variables: z.array(z.string()).optional(), // Variables found in {{variable}} format
  metadata: z.record(z.string(), z.unknown()).optional(), // YAML frontmatter
});

// Type exports
export type PromptInputType = z.infer<typeof PromptInputTypeSchema>;
export type PromptOutputFormat = z.infer<typeof PromptOutputFormatSchema>;
export type PromptVariable = z.infer<typeof PromptVariableSchema>;
export type PromptExample = z.infer<typeof PromptExampleSchema>;
export type PromptContent = z.infer<typeof PromptContentSchema>;
export type PromptMetadata = z.infer<typeof PromptMetadataSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type PromptCategory = z.infer<typeof PromptCategorySchema>;
export type PromptSearchQuery = z.infer<typeof PromptSearchQuerySchema>;
export type PromptExecution = z.infer<typeof PromptExecutionSchema>;
export type PromptExecutionResult = z.infer<typeof PromptExecutionResultSchema>;
export type PromptImportOptions = z.infer<typeof PromptImportOptionsSchema>;
export type PromptImportResult = z.infer<typeof PromptImportResultSchema>;
export type PromptExportOptions = z.infer<typeof PromptExportOptionsSchema>;
export type PromptExportResult = z.infer<typeof PromptExportResultSchema>;
export type PromptRegistryConfig = z.infer<typeof PromptRegistryConfigSchema>;
export type FabricPatternFile = z.infer<typeof FabricPatternFileSchema>;

// Additional type for search results
export interface PromptSearchResult {
  prompts: Prompt[];
  total: number;
  filters: PromptSearchQuery;
  searchTime: number;
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

// Validation functions
export function validatePrompt(data: unknown): Prompt {
  return PromptSchema.parse(data);
}

export function validatePromptMetadata(data: unknown): PromptMetadata {
  return PromptMetadataSchema.parse(data);
}

export function validatePromptCategory(data: unknown): PromptCategory {
  return PromptCategorySchema.parse(data);
}

export function validatePromptSearchQuery(data: unknown): PromptSearchQuery {
  return PromptSearchQuerySchema.parse(data);
}

export function validatePromptExecution(data: unknown): PromptExecution {
  return PromptExecutionSchema.parse(data);
}

export function validatePromptImportOptions(data: unknown): PromptImportOptions {
  return PromptImportOptionsSchema.parse(data);
}

export function validatePromptExportOptions(data: unknown): PromptExportOptions {
  return PromptExportOptionsSchema.parse(data);
}

export function validatePromptRegistryConfig(data: unknown): PromptRegistryConfig {
  return PromptRegistryConfigSchema.parse(data);
}

// Safe parsing functions
export function safeParsePrompt(data: unknown) {
  return PromptSchema.safeParse(data);
}

export function safeParsePromptMetadata(data: unknown) {
  return PromptMetadataSchema.safeParse(data);
}

export function safeParsePromptCategory(data: unknown) {
  return PromptCategorySchema.safeParse(data);
}

export function safeParsePromptSearchQuery(data: unknown) {
  return PromptSearchQuerySchema.safeParse(data);
}

export function safeParsePromptExecution(data: unknown) {
  return PromptExecutionSchema.safeParse(data);
}

export function safeParseFabricPatternFile(data: unknown) {
  return FabricPatternFileSchema.safeParse(data);
}
