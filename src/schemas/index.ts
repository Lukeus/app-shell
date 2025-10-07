import { z } from 'zod';

// Extension Manifest Schema
export const ExtensionManifestSchema = z.object({
  name: z
    .string()
    .regex(
      /^[a-z0-9-_]+$/,
      'Extension name must contain only lowercase letters, numbers, hyphens, and underscores'
    ),
  displayName: z.string().optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+/, 'Extension version must follow semantic versioning (e.g., 1.0.0)'),
  description: z.string(),
  main: z.string().optional().default('extension.js'),
  activationEvents: z.array(z.string()).optional(),
  engines: z
    .object({
      'app-shell': z.string().optional(),
    })
    .optional(),
  author: z
    .union([
      z.string(),
      z.object({
        name: z.string(),
        email: z.string().optional(),
        url: z.string().optional(),
      }),
    ])
    .optional(),
  repository: z
    .union([
      z.string(),
      z.object({
        type: z.string(),
        url: z.string(),
      }),
    ])
    .optional(),
  license: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  publisher: z.string().optional(),
  contributes: z
    .object({
      commands: z
        .array(
          z.object({
            command: z.string().regex(/^[a-zA-Z0-9.-]+$/, 'Command ID contains invalid characters'),
            title: z.string(),
            category: z.string().optional(),
            icon: z.string().optional(),
            when: z.string().optional(),
          })
        )
        .optional(),
      themes: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            uiTheme: z.enum(['vs', 'vs-dark', 'hc-black', 'hc-light']).optional(),
            path: z.string(),
          })
        )
        .optional(),
      settings: z
        .array(
          z.object({
            key: z.string(),
            type: z.enum(['boolean', 'string', 'number', 'array', 'object']),
            default: z.unknown(),
            title: z.string(),
            description: z.string().optional(),
            enum: z.array(z.unknown()).optional(),
            enumDescriptions: z.array(z.string()).optional(),
            scope: z.enum(['application', 'window', 'resource']).optional(),
            order: z.number().optional(),
          })
        )
        .optional(),
      keybindings: z
        .array(
          z.object({
            command: z.string(),
            key: z.string(),
            mac: z.string().optional(),
            linux: z.string().optional(),
            win: z.string().optional(),
            when: z.string().optional(),
          })
        )
        .optional(),
      menus: z
        .record(
          z.string(),
          z.array(
            z.object({
              command: z.string(),
              when: z.string().optional(),
              group: z.string().optional(),
              order: z.number().optional(),
            })
          )
        )
        .optional(),
    })
    .optional(),
});

// IPC Schemas
export const IPCRequestSchema = z.object({
  channel: z.string(),
  data: z.unknown(),
});

export const IPCResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.string().optional(),
});

// Extension API Schemas
export const CommandRegistrationSchema = z.object({
  command: z.string(),
  title: z.string(),
  category: z.string().optional(),
  icon: z.string().optional(),
  when: z.string().optional(),
  accelerator: z.string().optional(),
  // Accept any callable at runtime without strict zod function typing (TS types enforce shape)
  callback: z.any(),
});

export const ExtensionContextSchema = z.object({
  extensionId: z.string(),
  extensionPath: z.string(),
  globalState: z.object({
    get: z.any(),
    update: z.any(),
    keys: z.any(),
  }),
  workspaceState: z.object({
    get: z.any(),
    update: z.any(),
    keys: z.any(),
  }),
  subscriptions: z.array(
    z.object({
      dispose: z.any(),
    })
  ),
});

// Theme Schema
export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['light', 'dark', 'high-contrast']),
  colors: z.record(z.string(), z.string()).optional(),
  tokenColors: z
    .array(
      z.object({
        name: z.string().optional(),
        scope: z.union([z.string(), z.array(z.string())]),
        settings: z.object({
          foreground: z.string().optional(),
          background: z.string().optional(),
          fontStyle: z.string().optional(),
        }),
      })
    )
    .optional(),
});

// Settings Schema
// Window state schema
export const WindowStateSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isMaximized: z.boolean().optional(),
  isFullScreen: z.boolean().optional(),
  displayBounds: z
    .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
    .optional(),
});

export const SettingsValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
  z.null(),
]);

// Terminal Schema
export const TerminalOptionsSchema = z.object({
  shell: z.string().optional(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  cols: z.number().optional(),
  rows: z.number().optional(),
});

// Marketplace Plugin Schema
export const MarketplacePluginSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  version: z.string(),
  description: z.string(),
  longDescription: z.string().optional(),
  author: z.object({
    name: z.string(),
    email: z.string().optional(),
    url: z.string().optional(),
  }),
  publisher: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  repository: z
    .object({
      type: z.string(),
      url: z.string(),
    })
    .optional(),
  homepage: z.string().optional(),
  license: z.string(),
  engines: z.object({
    'app-shell': z.string(),
  }),
  downloadCount: z.number(),
  rating: z.object({
    average: z.number(),
    count: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  versions: z.array(
    z.object({
      version: z.string(),
      downloadUrl: z.string(),
      size: z.number(),
      changelog: z.string().optional(),
      publishedAt: z.string(),
      engines: z.object({
        'app-shell': z.string(),
      }),
    })
  ),
  isInstalled: z.boolean().optional(),
  installedVersion: z.string().optional(),
  hasUpdate: z.boolean().optional(),
});

// Type exports from schemas
export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;
export type IPCRequest = z.infer<typeof IPCRequestSchema>;
export type IPCResponse = z.infer<typeof IPCResponseSchema>;
export type CommandRegistration = z.infer<typeof CommandRegistrationSchema>;
export type ExtensionContext = z.infer<typeof ExtensionContextSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type SettingsValue = z.infer<typeof SettingsValueSchema>;
export type TerminalOptions = z.infer<typeof TerminalOptionsSchema>;
export type MarketplacePlugin = z.infer<typeof MarketplacePluginSchema>;
export type WindowState = z.infer<typeof WindowStateSchema>;

// Re-export types from types module
export type { Extension } from '../types';

// Validation helper functions
export function validateExtensionManifest(data: unknown): ExtensionManifest {
  return ExtensionManifestSchema.parse(data);
}

export function validateIPCRequest(data: unknown): IPCRequest {
  return IPCRequestSchema.parse(data);
}

export function validateTheme(data: unknown): Theme {
  return ThemeSchema.parse(data);
}

export function validateTerminalOptions(data: unknown): TerminalOptions {
  return TerminalOptionsSchema.parse(data);
}

export function validateMarketplacePlugin(data: unknown): MarketplacePlugin {
  return MarketplacePluginSchema.parse(data);
}

// Safe parsing functions that return results instead of throwing
export function safeParseExtensionManifest(data: unknown) {
  return ExtensionManifestSchema.safeParse(data);
}

export function safeParseIPCRequest(data: unknown) {
  return IPCRequestSchema.safeParse(data);
}

export function safeParseTheme(data: unknown) {
  return ThemeSchema.safeParse(data);
}

// Export prompt registry schemas and types
export * from './prompt-registry-schemas';
