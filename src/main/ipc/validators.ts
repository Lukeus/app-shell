import { z, ZodTypeAny } from 'zod';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';
import { IpcMainInvokeEvent } from 'electron';
import { RateLimiter, RateLimitConfig, generateRateLimitKey } from './rate-limiter';
import { getGlobalCapabilityEnforcer, PermissionContext } from './capability-enforcer';

export interface ValidationOptions<T extends ZodTypeAny> {
  channel: string;
  schema: T; // Expect a single object payload
  handler: (input: z.infer<T>, event: IpcMainInvokeEvent) => Promise<unknown> | unknown;
  transformError?: (err: unknown) => { code: string; message: string; details?: unknown };
  capability?: string; // Optional capability tag for future permission model
  rateLimit?: RateLimitConfig; // Optional rate limiting
  pathValidation?: {
    pathFields: string[]; // Fields in input that contain paths to validate
    operation: 'read' | 'write' | 'delete' | 'execute';
    pathSecurity?: any; // PathSecurity instance (typed as any to avoid circular deps for now)
  };
}

export interface ErrorResult {
  error: { code: string; message: string; details?: unknown };
}

function toErrorResult(err: unknown): ErrorResult {
  if (err instanceof Error) {
    return { error: { code: 'INTERNAL_ERROR', message: err.message } };
  }
  return { error: { code: 'INTERNAL_ERROR', message: 'Unknown error' } };
}

// Global rate limiter instance
let globalRateLimiter: RateLimiter | null = null;

export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}

export function registerValidated<T extends ZodTypeAny>(
  ipc: IPCManager,
  logger: Logger,
  opts: ValidationOptions<T>
): void {
  ipc.handle(opts.channel, async (event, raw) => {
    try {
      // Rate limiting check
      if (opts.rateLimit) {
        const rateLimitKey = generateRateLimitKey(event, opts.channel);
        const rateLimiter = getGlobalRateLimiter();

        if (!rateLimiter.isAllowed(rateLimitKey, opts.rateLimit)) {
          logger.warn(`Rate limit exceeded for ${opts.channel}`);
          return {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests',
              details: {
                resetTime: rateLimiter.getResetTime(rateLimitKey, opts.rateLimit),
                remaining: rateLimiter.getRemainingCalls(rateLimitKey, opts.rateLimit),
              },
            },
          };
        }
      }

      // Support legacy positional args by converting array -> first element if object expected
      const candidate = Array.isArray(raw) ? raw[0] : raw;
      const input = opts.schema.parse(candidate);

      // Capability enforcement
      if (opts.capability) {
        const enforcer = getGlobalCapabilityEnforcer();
        const context: PermissionContext = {
          sessionId: event.sender?.id?.toString(),
          origin: event.senderFrame?.origin,
          timestamp: Date.now(),
        };

        if (!enforcer.checkCapability(opts.capability, context)) {
          logger.warn(`Capability denied: ${opts.capability} for ${opts.channel}`);
          return { error: { code: 'CAPABILITY_DENIED', message: 'Insufficient permissions' } };
        }
      }

      // Path validation if configured
      if (opts.pathValidation && opts.pathValidation.pathSecurity) {
        for (const field of opts.pathValidation.pathFields) {
          const pathValue = (input as any)[field];
          if (pathValue && typeof pathValue === 'string') {
            try {
              opts.pathValidation.pathSecurity.assertAllowed(
                pathValue,
                opts.pathValidation.operation
              );
            } catch (pathError: any) {
              logger.warn(`Path validation failed for ${opts.channel}.${field}: ${pathValue}`);
              return {
                error: { code: pathError.code || 'PATH_ACCESS_DENIED', message: pathError.message },
              };
            }
          }
        }
      }

      const result = await opts.handler(input, event);
      return result;
    } catch (err: any) {
      if (err?.name === 'ZodError') {
        logger.warn(`Validation failed for ${opts.channel}`, err.issues);
        return {
          error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: err.issues },
        };
      }
      logger.error(`Handler error for ${opts.channel}`, err);
      if (opts.transformError) {
        try {
          return { error: opts.transformError(err) };
        } catch {
          /* ignore */
        }
      }
      return toErrorResult(err);
    }
  });
}
