import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { app } from 'electron';
import { Logger } from './logger';
import {
  Prompt,
  PromptCategory,
  PromptSearchQuery,
  PromptSearchResult,
  PromptImportOptions,
  PromptImportResult,
  PromptExportOptions,
  PromptExportResult,
  PromptRegistryConfig,
  validatePrompt,
  validatePromptRegistryConfig,
  safeParseFabricPatternFile,
} from '../schemas';

interface PromptSearchIndex {
  textIndex: Map<string, Set<string>>;
  tagIndex: Map<string, Set<string>>;
  categoryIndex: Map<string, Set<string>>;
  lastRebuild: string;
}

export class PromptRegistryService extends EventEmitter {
  private logger: Logger;
  private prompts: Map<string, Prompt> = new Map();
  private categories: Map<string, PromptCategory> = new Map();
  private searchIndex: PromptSearchIndex;
  private recentlyUsed: string[] = [];
  private favorites: Set<string> = new Set();
  private config: PromptRegistryConfig;
  private userPromptsPath: string;
  private builtinPromptsPath: string;
  private configPath: string;
  private isInitialized = false;
  private autoBackupTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = new Logger('PromptRegistryService');

    // Set up paths
    const userDataPath = app.getPath('userData');
    this.userPromptsPath = path.join(userDataPath, 'prompts', 'user');
    this.builtinPromptsPath = path.join(userDataPath, 'prompts', 'builtin');
    this.configPath = path.join(userDataPath, 'prompt-registry-config.json');

    // Initialize search index
    this.searchIndex = {
      textIndex: new Map(),
      tagIndex: new Map(),
      categoryIndex: new Map(),
      lastRebuild: new Date().toISOString(),
    };

    // Default configuration
    this.config = {
      autoIndex: true,
      maxRecentPrompts: 20,
      enableAnalytics: true,
      autoBackupInterval: 0,
      maxBackupFiles: 10,
      enableValidation: true,
      defaultAISettings: {
        temperature: 0.7,
        maxTokens: 4096,
      },
    };
  }

  async init(): Promise<void> {
    try {
      this.logger.info('Initializing Prompt Registry Service...');

      // Ensure directories exist
      this.ensureDirectories();

      // Load configuration
      await this.loadConfig();

      // Load built-in prompts and categories
      await this.loadBuiltinPrompts();

      // Load user prompts
      await this.loadUserPrompts();

      // Build search index
      if (this.config.autoIndex) {
        await this.rebuildSearchIndex();
      }

      // Load favorites and recent usage
      await this.loadUserData();

      // Setup auto-backup if enabled
      this.setupAutoBackup();

      this.isInitialized = true;
      this.logger.info('Prompt Registry Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize prompt registry service', error);
      throw error;
    }
  }

  private ensureDirectories(): void {
    const dirs = [
      this.userPromptsPath,
      this.builtinPromptsPath,
      path.dirname(this.configPath),
      path.join(path.dirname(this.configPath), 'backups'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async loadConfig(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = { ...this.config, ...validatePromptRegistryConfig(configData) };
      }
    } catch (error) {
      this.logger.warn('Failed to load prompt registry config, using defaults', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      this.logger.error('Failed to save prompt registry config', error);
    }
  }

  private async loadBuiltinPrompts(): Promise<void> {
    // Create default built-in categories
    const defaultCategories: PromptCategory[] = [
      {
        id: 'general',
        name: 'General',
        description: 'General purpose prompts',
        promptCount: 0,
      },
      {
        id: 'code',
        name: 'Code',
        description: 'Programming and development prompts',
        promptCount: 0,
      },
      {
        id: 'writing',
        name: 'Writing',
        description: 'Content creation and writing prompts',
        promptCount: 0,
      },
      {
        id: 'analysis',
        name: 'Analysis',
        description: 'Data and content analysis prompts',
        promptCount: 0,
      },
    ];

    for (const category of defaultCategories) {
      this.categories.set(category.id, category);
    }

    // Create sample built-in prompts
    const samplePrompts: Partial<Prompt>[] = [
      {
        id: 'summarize',
        name: 'Summarize Content',
        description: 'Create a concise summary of any text content',
        category: 'general',
        tags: ['summary', 'content', 'analysis'],
        inputType: 'text',
        outputFormat: 'markdown',
        difficulty: 'beginner',
        estimatedTime: '1-2 minutes',
        isBuiltIn: true,
        content: {
          content: `# IDENTITY and PURPOSE

You are an expert content summarizer. You take content in and output a concise summary.

# OUTPUT INSTRUCTIONS

- Create a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.
- Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
- Rely strictly on the provided content, without adding any external information.
- Format the summary as a bulleted list of the most important points.
- Use no more than {{max_points}} bullet points.
- Each bullet point should be no more than 15 words.

# INPUT

{{content}}`,
          variables: [
            {
              name: 'content',
              label: 'Content to Summarize',
              description: 'The text content you want to summarize',
              type: 'multiline',
              required: true,
            },
            {
              name: 'max_points',
              label: 'Maximum Points',
              description: 'Maximum number of bullet points in the summary',
              type: 'number',
              defaultValue: '5',
              required: false,
            },
          ],
          examples: [
            {
              title: 'Article Summary',
              description: 'Summarizing a news article',
              input: {
                content: 'A long news article about climate change...',
                max_points: '3',
              },
              output:
                '• Climate change is accelerating faster than predicted\n• New policies are needed to meet emission targets\n• Renewable energy adoption must increase significantly',
            },
          ],
        },
      },
      {
        id: 'explain-code',
        name: 'Explain Code',
        description: 'Analyze and explain code functionality, logic, and best practices',
        category: 'code',
        tags: ['code', 'explanation', 'documentation'],
        inputType: 'code',
        outputFormat: 'markdown',
        difficulty: 'intermediate',
        estimatedTime: '2-3 minutes',
        isBuiltIn: true,
        content: {
          content: `# IDENTITY and PURPOSE

You are an expert software developer and technical writer. You analyze code and explain it clearly.

# OUTPUT INSTRUCTIONS

1. **Overview**: Provide a brief summary of what this code does
2. **Detailed Explanation**: Break down the code line by line or section by section
3. **Key Concepts**: Highlight important programming concepts used
4. **Best Practices**: Note any best practices or potential improvements
5. **Usage Example**: Show how this code might be used (if applicable)

Format your response in clear markdown with appropriate code syntax highlighting.

# INPUT

Language: {{language}}

Code:
\`\`\`
{{code}}
\`\`\``,
          variables: [
            {
              name: 'code',
              label: 'Code to Explain',
              description: 'The source code you want explained',
              type: 'multiline',
              required: true,
            },
            {
              name: 'language',
              label: 'Programming Language',
              description: 'The programming language of the code',
              type: 'text',
              defaultValue: 'javascript',
              required: false,
            },
          ],
        },
      },
    ];

    // Save sample prompts
    for (const promptData of samplePrompts) {
      try {
        const now = new Date().toISOString();
        const fullPrompt: Prompt = {
          id: promptData.id!,
          name: promptData.name!,
          description: promptData.description!,
          category: promptData.category!,
          tags: promptData.tags || [],
          inputType: promptData.inputType || 'text',
          outputFormat: promptData.outputFormat || 'text',
          version: '1.0.0',
          createdAt: now,
          updatedAt: now,
          isBuiltIn: true,
          isFavorite: false,
          usageCount: 0,
          filePath: path.join(this.builtinPromptsPath, `${promptData.id}.md`),
          difficulty: promptData.difficulty,
          estimatedTime: promptData.estimatedTime,
          content: promptData.content!,
        };

        // Save to file system
        await this.savePromptToFile(fullPrompt);
        this.prompts.set(fullPrompt.id, fullPrompt);

        // Update category count
        const category = this.categories.get(fullPrompt.category);
        if (category) {
          category.promptCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to create built-in prompt ${promptData.id}`, error);
      }
    }
  }

  private async loadUserPrompts(): Promise<void> {
    if (!fs.existsSync(this.userPromptsPath)) {
      return;
    }

    try {
      const files = fs.readdirSync(this.userPromptsPath);
      for (const file of files) {
        if (file.endsWith('.md')) {
          try {
            const filePath = path.join(this.userPromptsPath, file);
            const prompt = await this.loadPromptFromFile(filePath);
            if (prompt) {
              this.prompts.set(prompt.id, prompt);

              // Update category count
              const category = this.categories.get(prompt.category);
              if (category) {
                category.promptCount++;
              }
            }
          } catch (error) {
            this.logger.error(`Failed to load user prompt from ${file}`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to load user prompts', error);
    }
  }

  private async loadPromptFromFile(filePath: string): Promise<Prompt | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const prompt = this.parsePromptFromMarkdown(content, filePath);

      if (this.config.enableValidation) {
        return validatePrompt(prompt);
      }

      return prompt;
    } catch (error) {
      this.logger.error(`Failed to parse prompt from ${filePath}`, error);
      return null;
    }
  }

  private parsePromptFromMarkdown(content: string, filePath: string): Prompt {
    // Parse YAML frontmatter and markdown content
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    let metadata: any = {};
    let promptContent = content;

    if (match) {
      try {
        // Parse YAML frontmatter (simplified - would use yaml library in production)
        const yamlContent = match[1];
        metadata = this.parseSimpleYaml(yamlContent);
        promptContent = match[2];
      } catch (error) {
        this.logger.warn(`Failed to parse frontmatter in ${filePath}`, error);
      }
    }

    // Extract variables from content ({{variable}} format)
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let variableMatch;

    while ((variableMatch = variableRegex.exec(promptContent)) !== null) {
      if (!variables.includes(variableMatch[1])) {
        variables.push(variableMatch[1]);
      }
    }

    // Build prompt object
    const now = new Date().toISOString();
    const promptId = metadata.id || path.basename(filePath, '.md');

    return {
      id: promptId,
      name: metadata.name || promptId,
      description: metadata.description || 'No description provided',
      instructions: metadata.instructions,
      author: metadata.author,
      version: metadata.version || '1.0.0',
      tags: Array.isArray(metadata.tags) ? metadata.tags : metadata.tags ? [metadata.tags] : [],
      category: metadata.category || 'general',
      inputType: metadata.inputType || 'text',
      outputFormat: metadata.outputFormat || 'text',
      difficulty: metadata.difficulty,
      estimatedTime: metadata.estimatedTime,
      language: metadata.language,
      createdAt: metadata.createdAt || now,
      updatedAt: metadata.updatedAt || now,
      sourceUrl: metadata.sourceUrl,
      isBuiltIn: filePath.includes(this.builtinPromptsPath),
      isFavorite: false,
      usageCount: 0,
      filePath,
      content: {
        content: promptContent.trim(),
        variables: variables.map(name => ({
          name,
          label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
          description: `Value for ${name}`,
          type: 'text' as const,
          required: true,
        })),
        systemPrompt: metadata.systemPrompt,
        temperature: metadata.temperature,
        maxTokens: metadata.maxTokens,
      },
    };
  }

  private parseSimpleYaml(yamlContent: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yamlContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          let value: any = trimmed.substring(colonIndex + 1).trim();

          // Handle arrays
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value
              .slice(1, -1)
              .split(',')
              .map((item: string) => item.trim().replace(/['"]/g, ''));
          }
          // Handle booleans
          else if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Handle numbers
          else if (!isNaN(Number(value))) value = Number(value);
          // Handle strings (remove quotes)
          else if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          result[key] = value;
        }
      }
    }

    return result;
  }

  private async savePromptToFile(prompt: Prompt): Promise<void> {
    try {
      const frontmatter = this.generateYamlFrontmatter(prompt);
      const fullContent = `---\n${frontmatter}\n---\n\n${prompt.content.content}`;

      fs.writeFileSync(prompt.filePath, fullContent, 'utf8');
    } catch (error) {
      this.logger.error(`Failed to save prompt ${prompt.id} to file`, error);
      throw error;
    }
  }

  private generateYamlFrontmatter(prompt: Prompt): string {
    const metadata = {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags,
      inputType: prompt.inputType,
      outputFormat: prompt.outputFormat,
      version: prompt.version,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
      difficulty: prompt.difficulty,
      estimatedTime: prompt.estimatedTime,
      language: prompt.language,
      author: prompt.author,
      sourceUrl: prompt.sourceUrl,
      instructions: prompt.instructions,
      systemPrompt: prompt.content.systemPrompt,
      temperature: prompt.content.temperature,
      maxTokens: prompt.content.maxTokens,
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
  }

  private async loadUserData(): Promise<void> {
    try {
      const userDataPath = path.join(path.dirname(this.configPath), 'prompt-user-data.json');
      if (fs.existsSync(userDataPath)) {
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        this.recentlyUsed = userData.recentlyUsed || [];
        this.favorites = new Set(userData.favorites || []);

        // Update favorites in prompts
        for (const promptId of this.favorites) {
          const prompt = this.prompts.get(promptId);
          if (prompt) {
            prompt.isFavorite = true;
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to load user data', error);
    }
  }

  private async saveUserData(): Promise<void> {
    try {
      const userDataPath = path.join(path.dirname(this.configPath), 'prompt-user-data.json');
      const userData = {
        recentlyUsed: this.recentlyUsed,
        favorites: Array.from(this.favorites),
      };
      fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    } catch (error) {
      this.logger.error('Failed to save user data', error);
    }
  }

  private setupAutoBackup(): void {
    if (this.config.autoBackupInterval > 0) {
      const intervalMs = this.config.autoBackupInterval * 60 * 1000;
      this.autoBackupTimer = setInterval(() => {
        this.createBackup().catch(error => {
          this.logger.error('Auto-backup failed', error);
        });
      }, intervalMs);
    }
  }

  async rebuildSearchIndex(): Promise<void> {
    const startTime = Date.now();

    this.searchIndex.textIndex.clear();
    this.searchIndex.tagIndex.clear();
    this.searchIndex.categoryIndex.clear();

    for (const [promptId, prompt] of this.prompts) {
      // Index searchable text
      const searchableText = [
        prompt.name,
        prompt.description,
        prompt.instructions || '',
        prompt.content.content,
      ]
        .join(' ')
        .toLowerCase();

      const words = searchableText.split(/\s+/).filter(word => word.length > 2);
      for (const word of words) {
        if (!this.searchIndex.textIndex.has(word)) {
          this.searchIndex.textIndex.set(word, new Set());
        }
        this.searchIndex.textIndex.get(word)!.add(promptId);
      }

      // Index tags
      for (const tag of prompt.tags) {
        const tagLower = tag.toLowerCase();
        if (!this.searchIndex.tagIndex.has(tagLower)) {
          this.searchIndex.tagIndex.set(tagLower, new Set());
        }
        this.searchIndex.tagIndex.get(tagLower)!.add(promptId);
      }

      // Index category
      const categoryLower = prompt.category.toLowerCase();
      if (!this.searchIndex.categoryIndex.has(categoryLower)) {
        this.searchIndex.categoryIndex.set(categoryLower, new Set());
      }
      this.searchIndex.categoryIndex.get(categoryLower)!.add(promptId);
    }

    this.searchIndex.lastRebuild = new Date().toISOString();

    const indexTime = Date.now() - startTime;
    this.logger.info(`Search index rebuilt in ${indexTime}ms for ${this.prompts.size} prompts`);

    this.emit('search-index-rebuilt', undefined);
  }

  // Public API methods

  async searchPrompts(query: PromptSearchQuery): Promise<PromptSearchResult> {
    const startTime = Date.now();

    let matchingIds = new Set<string>();
    let isFirstFilter = true;

    // Text search
    if (query.query) {
      const queryWords = query.query.toLowerCase().split(/\s+/);
      for (const word of queryWords) {
        const matches = this.searchIndex.textIndex.get(word) || new Set();
        if (isFirstFilter) {
          matchingIds = new Set(matches);
          isFirstFilter = false;
        } else {
          matchingIds = new Set([...matchingIds].filter(id => matches.has(id)));
        }
      }
    }

    // Category filter
    if (query.categories && query.categories.length > 0) {
      const categoryMatches = new Set<string>();
      for (const category of query.categories) {
        const matches = this.searchIndex.categoryIndex.get(category.toLowerCase()) || new Set();
        matches.forEach(id => categoryMatches.add(id));
      }

      if (isFirstFilter) {
        matchingIds = categoryMatches;
        isFirstFilter = false;
      } else {
        matchingIds = new Set([...matchingIds].filter(id => categoryMatches.has(id)));
      }
    }

    // Tag filter
    if (query.tags && query.tags.length > 0) {
      const tagMatches = new Set<string>();
      for (const tag of query.tags) {
        const matches = this.searchIndex.tagIndex.get(tag.toLowerCase()) || new Set();
        matches.forEach(id => tagMatches.add(id));
      }

      if (isFirstFilter) {
        matchingIds = tagMatches;
        isFirstFilter = false;
      } else {
        matchingIds = new Set([...matchingIds].filter(id => tagMatches.has(id)));
      }
    }

    // If no filters applied, include all prompts
    if (isFirstFilter) {
      matchingIds = new Set(this.prompts.keys());
    }

    // Apply additional filters
    let results = [...matchingIds]
      .map(id => this.prompts.get(id)!)
      .filter(prompt => {
        if (query.inputType && prompt.inputType !== query.inputType) return false;
        if (query.outputFormat && prompt.outputFormat !== query.outputFormat) return false;
        if (
          query.difficulty &&
          query.difficulty.length > 0 &&
          (!prompt.difficulty || !query.difficulty.includes(prompt.difficulty))
        )
          return false;
        if (query.favoritesOnly && !prompt.isFavorite) return false;
        return true;
      });

    // Sort results
    const sortBy = query.sortBy || 'name';
    const sortDirection = query.sortDirection || 'asc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'modified':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'usage':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'lastUsed': {
          const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    results = results.slice(offset, offset + limit);

    const searchTime = Date.now() - startTime;

    return {
      prompts: results,
      total,
      filters: query,
      searchTime,
    };
  }

  async getPromptById(id: string): Promise<Prompt | null> {
    return this.prompts.get(id) || null;
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return Array.from(this.prompts.values());
  }

  async getPromptsByCategory(categoryId: string): Promise<Prompt[]> {
    return Array.from(this.prompts.values()).filter(prompt => prompt.category === categoryId);
  }

  async getAllCategories(): Promise<PromptCategory[]> {
    return Array.from(this.categories.values());
  }

  async getRecentlyUsedPrompts(): Promise<Prompt[]> {
    return this.recentlyUsed
      .map(id => this.prompts.get(id))
      .filter(prompt => prompt !== undefined) as Prompt[];
  }

  async getFavoritePrompts(): Promise<Prompt[]> {
    return Array.from(this.prompts.values()).filter(prompt => prompt.isFavorite);
  }

  async addPrompt(prompt: Prompt): Promise<void> {
    if (this.config.enableValidation) {
      validatePrompt(prompt);
    }

    // Ensure unique ID
    if (this.prompts.has(prompt.id)) {
      throw new Error(`Prompt with ID ${prompt.id} already exists`);
    }

    // Set file path if not provided
    if (!prompt.filePath) {
      prompt.filePath = path.join(this.userPromptsPath, `${prompt.id}.md`);
    }

    // Save to file system
    await this.savePromptToFile(prompt);

    // Add to memory
    this.prompts.set(prompt.id, prompt);

    // Update category count
    const category = this.categories.get(prompt.category);
    if (category) {
      category.promptCount++;
    }

    // Update search index
    if (this.config.autoIndex) {
      await this.rebuildSearchIndex();
    }

    this.emit('prompt-added', prompt);
  }

  async updatePrompt(prompt: Prompt): Promise<void> {
    if (this.config.enableValidation) {
      validatePrompt(prompt);
    }

    const existingPrompt = this.prompts.get(prompt.id);
    if (!existingPrompt) {
      throw new Error(`Prompt with ID ${prompt.id} does not exist`);
    }

    // Update timestamp
    prompt.updatedAt = new Date().toISOString();

    // Save to file system
    await this.savePromptToFile(prompt);

    // Update in memory
    this.prompts.set(prompt.id, prompt);

    // Update search index
    if (this.config.autoIndex) {
      await this.rebuildSearchIndex();
    }

    this.emit('prompt-updated', prompt);
  }

  async deletePrompt(id: string): Promise<void> {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt with ID ${id} does not exist`);
    }

    // Don't delete built-in prompts
    if (prompt.isBuiltIn) {
      throw new Error('Cannot delete built-in prompts');
    }

    // Remove from file system
    try {
      if (fs.existsSync(prompt.filePath)) {
        fs.unlinkSync(prompt.filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete prompt file ${prompt.filePath}`, error);
    }

    // Remove from memory
    this.prompts.delete(id);

    // Update category count
    const category = this.categories.get(prompt.category);
    if (category) {
      category.promptCount = Math.max(0, category.promptCount - 1);
    }

    // Remove from user data
    this.recentlyUsed = this.recentlyUsed.filter(recentId => recentId !== id);
    this.favorites.delete(id);
    await this.saveUserData();

    // Update search index
    if (this.config.autoIndex) {
      await this.rebuildSearchIndex();
    }

    this.emit('prompt-removed', id);
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt with ID ${id} does not exist`);
    }

    const isFavorite = !prompt.isFavorite;
    prompt.isFavorite = isFavorite;

    if (isFavorite) {
      this.favorites.add(id);
    } else {
      this.favorites.delete(id);
    }

    await this.saveUserData();
    return isFavorite;
  }

  async recordUsage(id: string): Promise<void> {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      return;
    }

    // Update usage statistics
    prompt.usageCount++;
    prompt.lastUsed = new Date().toISOString();

    // Update recent usage
    this.recentlyUsed = [id, ...this.recentlyUsed.filter(recentId => recentId !== id)].slice(
      0,
      this.config.maxRecentPrompts
    );

    await this.saveUserData();
  }

  async importFromFabric(options: PromptImportOptions): Promise<PromptImportResult> {
    const startTime = Date.now();
    const result: PromptImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      importedIds: [],
      errors: [],
      importTime: 0,
    };

    try {
      const stats = fs.statSync(options.source);
      let filesToProcess: string[] = [];

      if (stats.isDirectory()) {
        // Process all .md files in directory
        const files = fs.readdirSync(options.source);
        filesToProcess = files
          .filter(file => file.endsWith('.md'))
          .map(file => path.join(options.source, file));
      } else if (stats.isFile() && options.source.endsWith('.md')) {
        filesToProcess = [options.source];
      }

      for (const filePath of filesToProcess) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const fabricPattern = safeParseFabricPatternFile({ content });

          if (!fabricPattern.success) {
            result.errors.push({
              file: filePath,
              error: 'Invalid Fabric pattern format',
            });
            result.failed++;
            continue;
          }

          // Convert Fabric pattern to our prompt format
          const fileName = path.basename(filePath, '.md');
          const promptId = options.targetCategory
            ? `${options.targetCategory}-${fileName}`
            : fileName;

          // Check if prompt already exists
          if (this.prompts.has(promptId) && !options.overwrite) {
            result.skipped++;
            continue;
          }

          const now = new Date().toISOString();
          const prompt: Prompt = this.parsePromptFromMarkdown(
            content,
            path.join(this.userPromptsPath, `${promptId}.md`)
          );

          // Override with import options
          prompt.id = promptId;
          if (options.targetCategory) {
            prompt.category = options.targetCategory;
          }
          if (!options.preserveMetadata) {
            prompt.createdAt = now;
            prompt.updatedAt = now;
            prompt.usageCount = 0;
            prompt.sourceUrl = filePath;
          }

          // Apply variable mapping
          if (options.variableMapping) {
            prompt.content.content = Object.entries(options.variableMapping).reduce(
              (content, [oldName, newName]) => {
                return content.replace(new RegExp(`\\{\\{${oldName}\\}\\}`, 'g'), `{{${newName}}}`);
              },
              prompt.content.content
            );
          }

          await this.addPrompt(prompt);
          result.imported++;
          result.importedIds.push(promptId);
        } catch (error) {
          result.errors.push({
            file: filePath,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          result.failed++;
        }
      }
    } catch (error) {
      result.errors.push({
        file: options.source,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.failed++;
    }

    result.importTime = Date.now() - startTime;
    this.emit('import-completed', result);
    return result;
  }

  async exportPrompts(options: PromptExportOptions): Promise<PromptExportResult> {
    const startTime = Date.now();
    const result: PromptExportResult = {
      exported: 0,
      exportPath: options.targetDirectory,
      exportedFiles: [],
      exportTime: 0,
    };

    try {
      // Ensure target directory exists
      if (!fs.existsSync(options.targetDirectory)) {
        fs.mkdirSync(options.targetDirectory, { recursive: true });
      }

      for (const promptId of options.promptIds) {
        const prompt = this.prompts.get(promptId);
        if (!prompt) {
          continue;
        }

        let exportPath = options.targetDirectory;
        if (options.organizeByCategory) {
          exportPath = path.join(exportPath, prompt.category);
          if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
          }
        }

        const fileName = `${prompt.id}.${this.getExportExtension(options.format)}`;
        const filePath = path.join(exportPath, fileName);

        let content: string;
        switch (options.format) {
          case 'fabric':
            content = prompt.content.content;
            break;
          case 'json':
            content = JSON.stringify(prompt, null, 2);
            break;
          case 'markdown':
          default:
            if (options.includeMetadata) {
              const frontmatter = this.generateYamlFrontmatter(prompt);
              content = `---\n${frontmatter}\n---\n\n${prompt.content.content}`;
            } else {
              content = prompt.content.content;
            }
            break;
        }

        fs.writeFileSync(filePath, content, 'utf8');
        result.exportedFiles.push(filePath);
        result.exported++;
      }
    } catch (error) {
      this.logger.error('Export failed', error);
      throw error;
    }

    result.exportTime = Date.now() - startTime;
    this.emit('export-completed', result);
    return result;
  }

  private getExportExtension(format: 'fabric' | 'markdown' | 'json'): string {
    switch (format) {
      case 'json':
        return 'json';
      case 'fabric':
      case 'markdown':
      default:
        return 'md';
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(path.dirname(this.configPath), 'backups');
    const backupPath = path.join(backupDir, `prompts-backup-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Export all prompts
    const allPromptIds = Array.from(this.prompts.keys());
    await this.exportPrompts({
      promptIds: allPromptIds,
      targetDirectory: backupPath,
      format: 'markdown',
      includeMetadata: true,
      organizeByCategory: true,
    });

    // Clean up old backups
    const backups = fs
      .readdirSync(backupDir)
      .filter(name => name.startsWith('prompts-backup-'))
      .sort()
      .reverse();

    if (backups.length > this.config.maxBackupFiles) {
      for (const oldBackup of backups.slice(this.config.maxBackupFiles)) {
        const oldBackupPath = path.join(backupDir, oldBackup);
        try {
          fs.rmSync(oldBackupPath, { recursive: true, force: true });
        } catch (error) {
          this.logger.error(`Failed to remove old backup ${oldBackupPath}`, error);
        }
      }
    }

    return backupPath;
  }

  async getConfig(): Promise<PromptRegistryConfig> {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<PromptRegistryConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    // Restart auto-backup if interval changed
    if ('autoBackupInterval' in newConfig) {
      if (this.autoBackupTimer) {
        clearInterval(this.autoBackupTimer);
        this.autoBackupTimer = undefined;
      }
      this.setupAutoBackup();
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Prompt Registry Service...');

    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }

    await this.saveUserData();
    await this.saveConfig();

    this.removeAllListeners();
    this.logger.info('Prompt Registry Service shut down successfully');
  }
}

export default PromptRegistryService;
