import { ipcMain, BrowserWindow } from 'electron';
import { z } from 'zod';
import { Logger } from '../logger';
import { LogLevel } from '../../types';
import PromptRegistryService from '../prompt-registry-service';
import { RateLimiter, DEFAULT_RATE_LIMITS } from './rate-limiter';
import {
  validatePromptSearchQuery,
  validatePromptImportOptions,
  validatePromptExportOptions,
  validatePrompt,
} from '../../schemas';

// IPC channel definitions
export const PROMPT_REGISTRY_CHANNELS = {
  // Query operations
  SEARCH_PROMPTS: 'prompt-registry:search-prompts',
  GET_PROMPT: 'prompt-registry:get-prompt',
  GET_ALL_PROMPTS: 'prompt-registry:get-all-prompts',
  GET_PROMPTS_BY_CATEGORY: 'prompt-registry:get-prompts-by-category',
  GET_CATEGORIES: 'prompt-registry:get-categories',
  GET_RECENT_PROMPTS: 'prompt-registry:get-recent-prompts',
  GET_FAVORITE_PROMPTS: 'prompt-registry:get-favorite-prompts',

  // Mutation operations
  ADD_PROMPT: 'prompt-registry:add-prompt',
  UPDATE_PROMPT: 'prompt-registry:update-prompt',
  DELETE_PROMPT: 'prompt-registry:delete-prompt',
  TOGGLE_FAVORITE: 'prompt-registry:toggle-favorite',
  RECORD_USAGE: 'prompt-registry:record-usage',

  // Import/Export operations
  IMPORT_FROM_FABRIC: 'prompt-registry:import-from-fabric',
  EXPORT_PROMPTS: 'prompt-registry:export-prompts',
  CREATE_BACKUP: 'prompt-registry:create-backup',

  // Configuration
  GET_CONFIG: 'prompt-registry:get-config',
  UPDATE_CONFIG: 'prompt-registry:update-config',

  // File system operations
  SELECT_IMPORT_SOURCE: 'prompt-registry:select-import-source',
  SELECT_EXPORT_TARGET: 'prompt-registry:select-export-target',

  // Events
  PROMPT_ADDED: 'prompt-registry:prompt-added',
  PROMPT_UPDATED: 'prompt-registry:prompt-updated',
  PROMPT_REMOVED: 'prompt-registry:prompt-removed',
  IMPORT_COMPLETED: 'prompt-registry:import-completed',
  EXPORT_COMPLETED: 'prompt-registry:export-completed',
} as const;

// Request/Response schemas for validation
const SearchPromptsRequestSchema = z.object({
  query: z.any(), // Will be validated by validatePromptSearchQuery
});

const GetPromptRequestSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
});

const GetPromptsByCategoryRequestSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
});

const AddPromptRequestSchema = z.object({
  prompt: z.any(), // Will be validated by validatePrompt
});

const UpdatePromptRequestSchema = z.object({
  prompt: z.any(), // Will be validated by validatePrompt
});

const DeletePromptRequestSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
});

const ToggleFavoriteRequestSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
});

const RecordUsageRequestSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
});

const ImportFromFabricRequestSchema = z.object({
  options: z.any(), // Will be validated by validatePromptImportOptions
});

const ExportPromptsRequestSchema = z.object({
  options: z.any(), // Will be validated by validatePromptExportOptions
});

const UpdateConfigRequestSchema = z.object({
  config: z.record(z.string(), z.unknown()),
});

const SelectImportSourceRequestSchema = z.object({
  title: z.string().optional(),
  filters: z.array(z.object({
    name: z.string(),
    extensions: z.array(z.string()),
  })).optional(),
});

const SelectExportTargetRequestSchema = z.object({
  title: z.string().optional(),
  defaultPath: z.string().optional(),
});

export class PromptRegistryIPCManager {
  private logger: Logger;
  private promptRegistryService: PromptRegistryService;
  private rateLimiter: RateLimiter;

  constructor(promptRegistryService: PromptRegistryService) {
    this.logger = new Logger('PromptRegistryIPCManager', LogLevel.Info);
    this.promptRegistryService = promptRegistryService;
    
    // Create rate limiter for prompt operations
    this.rateLimiter = new RateLimiter();

    this.setupEventForwarding();
  }

  registerHandlers(): void {
    this.logger.info('Registering prompt registry IPC handlers...');

    // Query operations
    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.SEARCH_PROMPTS,
      SearchPromptsRequestSchema,
      this.handleSearchPrompts.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_PROMPT,
      GetPromptRequestSchema,
      this.handleGetPrompt.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_ALL_PROMPTS,
      z.object({}),
      this.handleGetAllPrompts.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_PROMPTS_BY_CATEGORY,
      GetPromptsByCategoryRequestSchema,
      this.handleGetPromptsByCategory.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_CATEGORIES,
      z.object({}),
      this.handleGetCategories.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_RECENT_PROMPTS,
      z.object({}),
      this.handleGetRecentPrompts.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_FAVORITE_PROMPTS,
      z.object({}),
      this.handleGetFavoritePrompts.bind(this),
      'read'
    );

    // Mutation operations
    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.ADD_PROMPT,
      AddPromptRequestSchema,
      this.handleAddPrompt.bind(this),
      'write'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.UPDATE_PROMPT,
      UpdatePromptRequestSchema,
      this.handleUpdatePrompt.bind(this),
      'write'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.DELETE_PROMPT,
      DeletePromptRequestSchema,
      this.handleDeletePrompt.bind(this),
      'write'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.TOGGLE_FAVORITE,
      ToggleFavoriteRequestSchema,
      this.handleToggleFavorite.bind(this),
      'write'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.RECORD_USAGE,
      RecordUsageRequestSchema,
      this.handleRecordUsage.bind(this),
      'write'
    );

    // Import/Export operations
    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.IMPORT_FROM_FABRIC,
      ImportFromFabricRequestSchema,
      this.handleImportFromFabric.bind(this),
      'filesystem'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.EXPORT_PROMPTS,
      ExportPromptsRequestSchema,
      this.handleExportPrompts.bind(this),
      'filesystem'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.CREATE_BACKUP,
      z.object({}),
      this.handleCreateBackup.bind(this),
      'filesystem'
    );

    // Configuration
    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.GET_CONFIG,
      z.object({}),
      this.handleGetConfig.bind(this),
      'read'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.UPDATE_CONFIG,
      UpdateConfigRequestSchema,
      this.handleUpdateConfig.bind(this),
      'write'
    );

    // File system operations
    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.SELECT_IMPORT_SOURCE,
      SelectImportSourceRequestSchema,
      this.handleSelectImportSource.bind(this),
      'filesystem'
    );

    this.registerHandler(
      PROMPT_REGISTRY_CHANNELS.SELECT_EXPORT_TARGET,
      SelectExportTargetRequestSchema,
      this.handleSelectExportTarget.bind(this),
      'filesystem'
    );

    this.logger.info('Prompt registry IPC handlers registered successfully');
  }

  private registerHandler<T extends z.ZodSchema>(
    channel: string,
    schema: T,
    handler: (data: z.infer<T>, event: Electron.IpcMainInvokeEvent) => Promise<any>,
    _capability: 'read' | 'write' | 'filesystem'
  ): void {
    ipcMain.handle(channel, async (event, data) => {
      try {
        // Rate limiting
        const rateLimitKey = `prompt-registry:${event.sender.id}`;
        if (!this.rateLimiter.isAllowed(rateLimitKey, DEFAULT_RATE_LIMITS.settings)) {
          throw new Error('Rate limit exceeded. Please slow down your requests.');
        }

        // TODO: Add capability validation when implemented

        // Input validation
        const validatedData = schema.parse(data);

        // Execute handler
        const result = await handler(validatedData, event);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        this.logger.error(`Error handling ${channel}:`, error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    });
  }

  private setupEventForwarding(): void {
    // Forward service events to renderer processes
    this.promptRegistryService.on('prompt-added', (prompt) => {
      this.broadcastEvent(PROMPT_REGISTRY_CHANNELS.PROMPT_ADDED, prompt);
    });

    this.promptRegistryService.on('prompt-updated', (prompt) => {
      this.broadcastEvent(PROMPT_REGISTRY_CHANNELS.PROMPT_UPDATED, prompt);
    });

    this.promptRegistryService.on('prompt-removed', (id) => {
      this.broadcastEvent(PROMPT_REGISTRY_CHANNELS.PROMPT_REMOVED, id);
    });

    this.promptRegistryService.on('import-completed', (result) => {
      this.broadcastEvent(PROMPT_REGISTRY_CHANNELS.IMPORT_COMPLETED, result);
    });

    this.promptRegistryService.on('export-completed', (result) => {
      this.broadcastEvent(PROMPT_REGISTRY_CHANNELS.EXPORT_COMPLETED, result);
    });
  }

  private broadcastEvent(channel: string, data: any): void {
    // Send to all renderer processes
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
      }
    });
  }

  // Handler implementations

  private async handleSearchPrompts(data: z.infer<typeof SearchPromptsRequestSchema>): Promise<any> {
    const query = validatePromptSearchQuery(data.query);
    return await this.promptRegistryService.searchPrompts(query);
  }

  private async handleGetPrompt(data: z.infer<typeof GetPromptRequestSchema>): Promise<any> {
    return await this.promptRegistryService.getPromptById(data.id);
  }

  private async handleGetAllPrompts(): Promise<any> {
    return await this.promptRegistryService.getAllPrompts();
  }

  private async handleGetPromptsByCategory(data: z.infer<typeof GetPromptsByCategoryRequestSchema>): Promise<any> {
    return await this.promptRegistryService.getPromptsByCategory(data.categoryId);
  }

  private async handleGetCategories(): Promise<any> {
    return await this.promptRegistryService.getAllCategories();
  }

  private async handleGetRecentPrompts(): Promise<any> {
    return await this.promptRegistryService.getRecentlyUsedPrompts();
  }

  private async handleGetFavoritePrompts(): Promise<any> {
    return await this.promptRegistryService.getFavoritePrompts();
  }

  private async handleAddPrompt(data: z.infer<typeof AddPromptRequestSchema>): Promise<any> {
    const prompt = validatePrompt(data.prompt);
    await this.promptRegistryService.addPrompt(prompt);
    return { success: true };
  }

  private async handleUpdatePrompt(data: z.infer<typeof UpdatePromptRequestSchema>): Promise<any> {
    const prompt = validatePrompt(data.prompt);
    await this.promptRegistryService.updatePrompt(prompt);
    return { success: true };
  }

  private async handleDeletePrompt(data: z.infer<typeof DeletePromptRequestSchema>): Promise<any> {
    await this.promptRegistryService.deletePrompt(data.id);
    return { success: true };
  }

  private async handleToggleFavorite(data: z.infer<typeof ToggleFavoriteRequestSchema>): Promise<any> {
    const isFavorite = await this.promptRegistryService.toggleFavorite(data.id);
    return { isFavorite };
  }

  private async handleRecordUsage(data: z.infer<typeof RecordUsageRequestSchema>): Promise<any> {
    await this.promptRegistryService.recordUsage(data.id);
    return { success: true };
  }

  private async handleImportFromFabric(data: z.infer<typeof ImportFromFabricRequestSchema>): Promise<any> {
    const options = validatePromptImportOptions(data.options);
    return await this.promptRegistryService.importFromFabric(options);
  }

  private async handleExportPrompts(data: z.infer<typeof ExportPromptsRequestSchema>): Promise<any> {
    const options = validatePromptExportOptions(data.options);
    return await this.promptRegistryService.exportPrompts(options);
  }

  private async handleCreateBackup(): Promise<any> {
    const backupPath = await this.promptRegistryService.createBackup();
    return { backupPath };
  }

  private async handleGetConfig(): Promise<any> {
    return await this.promptRegistryService.getConfig();
  }

  private async handleUpdateConfig(data: z.infer<typeof UpdateConfigRequestSchema>): Promise<any> {
    await this.promptRegistryService.updateConfig(data.config);
    return { success: true };
  }

  private async handleSelectImportSource(
    data: z.infer<typeof SelectImportSourceRequestSchema>,
    event: Electron.IpcMainInvokeEvent
  ): Promise<any> {
    const { dialog } = await import('electron');
    
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
      title: data.title || 'Select Import Source',
      properties: ['openFile', 'openDirectory'],
      filters: data.filters || [
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    return result;
  }

  private async handleSelectExportTarget(
    data: z.infer<typeof SelectExportTargetRequestSchema>,
    event: Electron.IpcMainInvokeEvent
  ): Promise<any> {
    const { dialog } = await import('electron');
    
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
      title: data.title || 'Select Export Target Directory',
      defaultPath: data.defaultPath,
      properties: ['openDirectory', 'createDirectory'],
    });

    return result;
  }

  unregisterHandlers(): void {
    this.logger.info('Unregistering prompt registry IPC handlers...');

    // Remove all handlers for prompt registry channels
    Object.values(PROMPT_REGISTRY_CHANNELS).forEach(channel => {
      ipcMain.removeAllListeners(channel);
    });

    // Remove service event listeners
    this.promptRegistryService.removeAllListeners();

    this.logger.info('Prompt registry IPC handlers unregistered');
  }
}