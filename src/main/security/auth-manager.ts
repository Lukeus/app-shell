import { IncomingMessage } from 'http';
import { URL } from 'url';
import { Logger } from '../logger';

type AuthStrategy = 'token' | 'loopback';

export interface AuthResult {
  ok: boolean;
  strategy: AuthStrategy;
  reason?: string;
}

export class SpecKitAuthManager {
  private readonly logger: Logger;
  private readonly token?: string;

  constructor(logger: Logger = new Logger('SpecKitAuthManager')) {
    this.logger = logger;
    const envToken =
      process.env.SPEC_KIT_API_TOKEN || process.env.SPEC_KIT_BRIDGE_TOKEN || process.env.SPEC_KIT_TOKEN;

    if (envToken) {
      this.token = envToken;
      this.logger.info('Spec Kit bridge token authentication enabled');
    } else {
      this.logger.warn('No Spec Kit bridge token configured; restricting access to loopback clients only');
    }
  }

  public validateRequest(request: IncomingMessage): AuthResult {
    if (this.token) {
      return this.validateToken(request);
    }

    return this.validateLoopback(request);
  }

  private validateToken(request: IncomingMessage): AuthResult {
    const providedToken = this.extractToken(request);

    if (!providedToken) {
      return { ok: false, strategy: 'token', reason: 'Missing authentication token' };
    }

    if (providedToken !== this.token) {
      return { ok: false, strategy: 'token', reason: 'Invalid authentication token' };
    }

    return { ok: true, strategy: 'token' };
  }

  private extractToken(request: IncomingMessage): string | undefined {
    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    const headerToken = request.headers['x-spec-kit-token'];
    if (typeof headerToken === 'string') {
      return headerToken;
    }

    if (Array.isArray(headerToken) && headerToken.length > 0) {
      return headerToken[0];
    }

    if (request.url) {
      try {
        const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
        const token = url.searchParams.get('token');
        if (token) {
          return token;
        }
      } catch {
        // Ignore invalid URL parsing errors
      }
    }

    return undefined;
  }

  private validateLoopback(request: IncomingMessage): AuthResult {
    const remoteAddress = request.socket.remoteAddress;
    if (!remoteAddress) {
      return { ok: false, strategy: 'loopback', reason: 'Unknown remote address' };
    }

    const normalized = remoteAddress.replace('::ffff:', '');
    const isLoopback = normalized === '127.0.0.1' || normalized === '::1';

    if (!isLoopback) {
      this.logger.warn(`Rejected non-loopback request from ${remoteAddress}`);
      return { ok: false, strategy: 'loopback', reason: 'Remote address not permitted' };
    }

    return { ok: true, strategy: 'loopback' };
  }
}
