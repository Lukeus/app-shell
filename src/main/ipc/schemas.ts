import { z } from 'zod';
import { SettingsValue } from '../../schemas';

// Common primitive schemas
const nonEmptyString = z.string().min(1, 'Value cannot be empty');

// Settings
export const SettingsGetSchema = z.object({ key: nonEmptyString });
export const SettingsSetSchema = z.object({
  key: nonEmptyString,
  value: z.any() as z.ZodType<SettingsValue>,
});
export const SettingsGetAllSchema = z.object({});

// Terminal
export const TerminalCreateSchema = z.object({
  cwd: z.string().optional(),
  shell: z.string().optional(),
  cols: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional(),
});

// FileSystem (read operations first phase)
export const FileReadFileSchema = z.object({ path: nonEmptyString });
export const FileReadFileTextSchema = z.object({
  path: nonEmptyString,
  encoding: z.string().optional(),
});

// FileSystem mutating operations (Phase 2)
export const FileWriteFileSchema = z.object({
  path: nonEmptyString,
  data: z.instanceof(Uint8Array),
});
export const FileWriteFileTextSchema = z.object({
  path: nonEmptyString,
  content: z.string(),
  encoding: z.string().optional(),
});
export const FileCreateDirectorySchema = z.object({ path: nonEmptyString });
export const FileDeleteFileSchema = z.object({ path: nonEmptyString });
export const FileDeleteDirectorySchema = z.object({ path: nonEmptyString });
export const FileExistsSchema = z.object({ path: nonEmptyString });
export const FileStatSchema = z.object({ path: nonEmptyString });
export const FileReadDirectorySchema = z.object({ path: nonEmptyString });
export const FileGetFileTreeSchema = z.object({
  rootPath: nonEmptyString,
  depth: z.number().int().nonnegative().optional(),
});
export const FileRenameSchema = z.object({ oldPath: nonEmptyString, newPath: nonEmptyString });
export const FileCopyFileSchema = z.object({
  sourcePath: nonEmptyString,
  targetPath: nonEmptyString,
});
export const FileJoinPathSchema = z.object({ segments: z.array(nonEmptyString).min(1) });
export const FileResolvePathSchema = z.object({ path: nonEmptyString });
export const FileRelativePathSchema = z.object({ from: nonEmptyString, to: nonEmptyString });

// Platform / App info (no payload)
export const EmptyPayloadSchema = z.object({});

export type SettingsGetInput = z.infer<typeof SettingsGetSchema>;
export type SettingsSetInput = z.infer<typeof SettingsSetSchema>;
export type TerminalCreateInput = z.infer<typeof TerminalCreateSchema>;
// Terminal operations (remaining)
export const TerminalWriteSchema = z.object({ terminalId: nonEmptyString, data: z.string() });
export const TerminalResizeSchema = z.object({
  terminalId: nonEmptyString,
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});
export const TerminalKillSchema = z.object({ terminalId: nonEmptyString });

// Extension management
export const ExtensionEnableSchema = z.object({ extensionId: nonEmptyString });
export const ExtensionDisableSchema = z.object({ extensionId: nonEmptyString });
export const ExtensionInstallSchema = z.object({ extensionPath: nonEmptyString });
export const ExtensionUninstallSchema = z.object({ extensionId: nonEmptyString });

// Theme management
export const ThemeApplySchema = z.object({ themeId: nonEmptyString });

// Command execution (critical for security)
export const CommandExecuteSchema = z.object({
  commandId: nonEmptyString,
  args: z.array(z.any()).optional(),
});

// Marketplace operations
export const MarketplaceSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});
export const MarketplaceGetPluginSchema = z.object({ pluginId: nonEmptyString });
export const MarketplaceInstallSchema = z.object({
  pluginId: nonEmptyString,
  version: z.string().optional(),
});
export const MarketplaceUninstallSchema = z.object({ pluginId: nonEmptyString });
export const MarketplaceUpdateSchema = z.object({ pluginId: nonEmptyString });
export const MarketplaceGetStatusSchema = z.object({ pluginId: nonEmptyString });

// Dialog operations
export const ShowOpenDialogSchema = z.object({ options: z.any() }); // Could be more specific
export const ShowSaveDialogSchema = z.object({ options: z.any() });

// Spec Kit workspaces
export const SpecKitWorkspaceKeySchema = z.object({
  org: nonEmptyString,
  repo: nonEmptyString,
  feature: nonEmptyString,
});

const SpecKitPromptMessageSchema = z
  .object({
    id: nonEmptyString,
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
    createdAt: nonEmptyString,
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const SpecKitSpecRevisionSchema = z
  .object({
    id: nonEmptyString,
    summary: z.string().optional(),
    createdAt: nonEmptyString,
    author: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const SpecKitPatchPointerSchema = z
  .object({
    id: nonEmptyString,
    description: z.string().optional(),
    path: nonEmptyString,
    createdAt: nonEmptyString,
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const SpecKitWorkspaceMetadataSchema = z
  .object({
    promptHistory: z.array(SpecKitPromptMessageSchema),
    specRevisions: z.array(SpecKitSpecRevisionSchema),
    generatedPatchPointers: z.array(SpecKitPatchPointerSchema),
  })
  .passthrough();

const SpecKitWorkspaceMetadataInputSchema = z
  .object({
    promptHistory: z.array(SpecKitPromptMessageSchema).optional(),
    specRevisions: z.array(SpecKitSpecRevisionSchema).optional(),
    generatedPatchPointers: z.array(SpecKitPatchPointerSchema).optional(),
  })
  .passthrough();

export const SpecKitListWorkspacesSchema = z.object({});

export const SpecKitCreateWorkspaceSchema = z.object({
  key: SpecKitWorkspaceKeySchema,
  title: z.string().optional(),
  description: z.string().optional(),
  metadata: SpecKitWorkspaceMetadataInputSchema.optional(),
});

export const SpecKitGetWorkspaceSchema = z.object({
  key: SpecKitWorkspaceKeySchema,
});

export const SpecKitUpdateWorkspaceMetadataSchema = z.object({
  key: SpecKitWorkspaceKeySchema,
  metadata: SpecKitWorkspaceMetadataSchema,
});

export const SpecKitArchiveWorkspaceSchema = z.object({
  key: SpecKitWorkspaceKeySchema,
  archived: z.boolean().optional(),
});

export const SpecKitSelectWorkspaceSchema = z.object({
  key: SpecKitWorkspaceKeySchema,
});

export const SpecKitGetCurrentWorkspaceSchema = z.object({});

export type FileReadFileInput = z.infer<typeof FileReadFileSchema>;
export type FileReadFileTextInput = z.infer<typeof FileReadFileTextSchema>;
export type CommandExecuteInput = z.infer<typeof CommandExecuteSchema>;
