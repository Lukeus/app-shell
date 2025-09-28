import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from './logger';
import { SettingsValue } from '../schemas';

export class SettingsManager {
  private logger: Logger;
  private settings: Map<string, SettingsValue>;
  private settingsPath: string;

  constructor() {
    this.logger = new Logger('SettingsManager');
    this.settings = new Map();
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }

  async init(): Promise<void> {
    try {
      await this.loadSettings();
      this.logger.info('Settings manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize settings manager', error);
      throw error;
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed = JSON.parse(data) as Record<string, SettingsValue>;

        for (const [key, value] of Object.entries(parsed)) {
          this.settings.set(key, value as SettingsValue);
        }

        this.logger.debug('Settings loaded from file');
      } else {
        // Set default settings
        await this.setDefaults();
        this.logger.debug('Using default settings');
      }
    } catch (error) {
      this.logger.error('Failed to load settings', error);
      await this.setDefaults();
    }
  }

  private async setDefaults(): Promise<void> {
    const defaults = {
      theme: 'dark',
      windowState: {
        width: 1200,
        height: 800,
      },
      terminal: {
        shell: process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash',
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      },
      extensions: {
        enabled: [],
      },
    };

    for (const [key, value] of Object.entries(defaults)) {
      this.settings.set(key, value);
    }

    await this.saveSettings();
  }

  async get<T extends SettingsValue = SettingsValue>(key: string): Promise<T | undefined> {
    return this.settings.get(key) as T | undefined;
  }

  async set(key: string, value: SettingsValue): Promise<void> {
    // Validate value is a valid SettingsValue
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value) ||
      (typeof value === 'object' && value !== null)
    ) {
      this.settings.set(key, value);
      await this.saveSettings();
    } else {
      throw new Error(`Invalid settings value type for key: ${key}`);
    }
  }

  async getAll(): Promise<Record<string, SettingsValue>> {
    const result: Record<string, SettingsValue> = {};
    for (const [key, value] of this.settings.entries()) {
      result[key] = value;
    }
    return result;
  }

  private async saveSettings(): Promise<void> {
    try {
      const settingsObj: Record<string, SettingsValue> = {};
      for (const [key, value] of this.settings.entries()) {
        settingsObj[key] = value;
      }

      const data = JSON.stringify(settingsObj, null, 2);
      fs.writeFileSync(this.settingsPath, data, 'utf8');

      this.logger.debug('Settings saved to file');
    } catch (error) {
      this.logger.error('Failed to save settings', error);
    }
  }

  async saveAppState(): Promise<void> {
    await this.saveSettings();
  }
}
