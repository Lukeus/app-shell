import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logger';

/**
 * Extension code signing and integrity verification system
 * Provides cryptographic verification of extension authenticity
 */

export interface ExtensionSignature {
  algorithm: string;
  signature: string;
  publicKeyFingerprint: string;
  timestamp: number;
  version: string;
}

export interface TrustedPublisher {
  name: string;
  publicKey: string;
  fingerprint: string;
  trusted: boolean;
  addedDate: number;
}

export interface SigningResult {
  valid: boolean;
  publisher?: TrustedPublisher;
  error?: string;
  details?: {
    algorithm: string;
    verified: boolean;
    timestamp: number;
  };
}

/**
 * Extension signing and verification service
 */
export class ExtensionSigner {
  private logger: Logger;
  private trustedPublishers: Map<string, TrustedPublisher> = new Map();
  private enabled: boolean;

  constructor(enabled = true) {
    this.logger = new Logger('ExtensionSigner');
    this.enabled = enabled;
    this.loadTrustedPublishers();
  }

  /**
   * Verify an extension's signature
   */
  async verifyExtension(extensionPath: string): Promise<SigningResult> {
    if (!this.enabled) {
      this.logger.debug('Extension signing verification disabled');
      return { valid: true };
    }

    try {
      const signatureFile = path.join(extensionPath, '.signature.json');

      if (!fs.existsSync(signatureFile)) {
        this.logger.warn(`No signature file found for extension: ${extensionPath}`);
        return { valid: false, error: 'Missing signature file' };
      }

      const signatureData = JSON.parse(
        fs.readFileSync(signatureFile, 'utf8')
      ) as ExtensionSignature;

      // Verify signature format
      if (!this.isValidSignatureFormat(signatureData)) {
        return { valid: false, error: 'Invalid signature format' };
      }

      // Find trusted publisher
      const publisher = this.trustedPublishers.get(signatureData.publicKeyFingerprint);
      if (!publisher) {
        this.logger.warn(`Unknown publisher: ${signatureData.publicKeyFingerprint}`);
        return { valid: false, error: 'Unknown publisher' };
      }

      if (!publisher.trusted) {
        return { valid: false, error: 'Publisher not trusted' };
      }

      // Verify signature
      const isValid = await this.verifyCryptographicSignature(
        extensionPath,
        signatureData,
        publisher.publicKey
      );

      return {
        valid: isValid,
        publisher,
        details: {
          algorithm: signatureData.algorithm,
          verified: isValid,
          timestamp: signatureData.timestamp,
        },
      };
    } catch (error) {
      this.logger.error(`Error verifying extension signature: ${extensionPath}`, error);
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async verifyCryptographicSignature(
    extensionPath: string,
    signatureData: ExtensionSignature,
    publicKey: string
  ): Promise<boolean> {
    try {
      const hash = await this.generateExtensionHash(extensionPath);
      const verify = crypto.createVerify(signatureData.algorithm);
      verify.update(hash);

      return verify.verify(publicKey, signatureData.signature, 'base64');
    } catch (error) {
      this.logger.error('Error verifying cryptographic signature', error);
      return false;
    }
  }

  private async generateExtensionHash(extensionPath: string): Promise<string> {
    const hash = crypto.createHash('sha256');

    // Hash all files in the extension directory (except signature file)
    const files = await this.getAllFiles(extensionPath);
    const sortedFiles = files.filter(file => !file.endsWith('.signature.json')).sort();

    for (const file of sortedFiles) {
      const content = fs.readFileSync(file);
      const relativePath = path.relative(extensionPath, file);
      hash.update(relativePath);
      hash.update(content);
    }

    return hash.digest('hex');
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...(await this.getAllFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private isValidSignatureFormat(signature: unknown): signature is ExtensionSignature {
    return (
      typeof signature === 'object' &&
      signature !== null &&
      'algorithm' in signature &&
      'signature' in signature &&
      'publicKeyFingerprint' in signature &&
      'timestamp' in signature &&
      'version' in signature &&
      typeof (signature as Record<string, unknown>).algorithm === 'string' &&
      typeof (signature as Record<string, unknown>).signature === 'string' &&
      typeof (signature as Record<string, unknown>).publicKeyFingerprint === 'string' &&
      typeof (signature as Record<string, unknown>).timestamp === 'number' &&
      typeof (signature as Record<string, unknown>).version === 'string'
    );
  }

  private loadTrustedPublishers(): void {
    try {
      const configPath = path.join(process.cwd(), 'trusted-publishers.json');
      if (fs.existsSync(configPath)) {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        for (const publisher of data.publishers || []) {
          this.trustedPublishers.set(publisher.fingerprint, publisher);
        }
        this.logger.info(`Loaded ${this.trustedPublishers.size} trusted publishers`);
      } else {
        this.createDefaultTrustedPublishers();
      }
    } catch (error) {
      this.logger.error('Error loading trusted publishers', error);
      this.createDefaultTrustedPublishers();
    }
  }

  private createDefaultTrustedPublishers(): void {
    const defaultPublisher: TrustedPublisher = {
      name: 'App Shell Team',
      publicKey:
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
      fingerprint: 'app-shell-default',
      trusted: true,
      addedDate: Date.now(),
    };

    this.trustedPublishers.set(defaultPublisher.fingerprint, defaultPublisher);
    this.logger.info('Created default trusted publishers');
  }

  dispose(): void {
    this.trustedPublishers.clear();
  }
}

/**
 * Global extension signer instance
 */
let globalExtensionSigner: ExtensionSigner | null = null;

export function getGlobalExtensionSigner(): ExtensionSigner {
  if (!globalExtensionSigner) {
    globalExtensionSigner = new ExtensionSigner(process.env.NODE_ENV === 'production');
  }
  return globalExtensionSigner;
}
