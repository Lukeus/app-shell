# IPC Validation & Hardening Plan

## Goals

- Introduce runtime validation for all renderer -> main IPC calls
- Provide consistent, typed, testable contracts
- Reduce security risk (path traversal, arbitrary command exec, unbounded payloads)
- Improve DX via central schemas and reusable helper
- Enable future capabilities: permission model, telemetry, rate limiting

## Principles

1. Validate at trust boundary (first thing inside handler)
2. Reject fast, return structured error (code + message)
3. Prefer allow-lists over free-form values where feasible
4. Centralize schemas to avoid drift between preload and main
5. Keep refactor incremental & low-risk (phase channels)

## Target Architecture

```
src/
  main/
    ipc/
      index.ts              # Aggregate registrar
      validators.ts         # Generic validateHandle helper
      schemas.ts            # Zod schemas per channel
```

### validators.ts (concept)

```ts
import { z, ZodTypeAny } from 'zod';
import { IPCManager } from '../ipc-manager';
import { Logger } from '../logger';

export interface ValidationOptions<T extends ZodTypeAny> {
  channel: string;
  schema: T; // Schema for args payload (single object)
  handler: (input: z.infer<T>, event: Electron.IpcMainInvokeEvent) => Promise<unknown> | unknown;
  transformError?: (err: unknown) => { code: string; message: string };
}

export function registerValidated<T extends ZodTypeAny>(
  ipc: IPCManager,
  logger: Logger,
  opts: ValidationOptions<T>
): void {
  ipc.handle(opts.channel, async (event, raw) => {
    try {
      const input = opts.schema.parse(raw);
      return await opts.handler(input, event);
    } catch (err) {
      logger.warn(`Validation / handler error on ${opts.channel}`, err);
      if (err instanceof Error && 'issues' in err) {
        return {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payload',
            details: (err as any).issues,
          },
        };
      }
      if (opts.transformError) return { error: opts.transformError(err) };
      return { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } };
    }
  });
}
```

### schemas.ts (initial subset)

- settings:get -> { key: string }
- settings:set -> { key: string; value: SettingsValue }
- filesystem:readFileText -> { path: string; encoding?: string }
- filesystem:readFile -> { path: string }
- terminal:create -> { cwd?: string; shell?: string; cols?: number; rows?: number }

Later phases: all remaining channels.

## Incremental Phases

| Phase | Channels                                                                   | Rationale                                     |
| ----- | -------------------------------------------------------------------------- | --------------------------------------------- |
| 1     | settings:get/set/getAll, terminal:create, filesystem:readFile/readFileText | Core, low complexity                          |
| 2     | filesystem write & mutating ops (writeFile, delete, mkdir, rename, copy)   | Add path safety checks                        |
| 3     | marketplace:\*                                                             | Structured search & plugin IDs                |
| 4     | extensions:_ & theme:_                                                     | Constrained enums & id validation             |
| 5     | window:_ & app:_                                                           | Mostly no payload; ensure empty object schema |
| 6     | Permission model integration                                               | Map schema tags to capabilities               |

## Structured Error Format

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid payload", "details": [...] } }
```

Renderer helpers can throw if `result.error` present.

## Future Enhancements

- Generate preload TypeScript types from schemas (codegen)
- Permission map: channel -> required capability
- Rate limiting decorator for high-frequency channels (e.g., terminal:write?)
- Telemetry hook (success/error counters)

## Immediate Action (PR Scope)

1. Add `docs/IPC_VALIDATION_PLAN.md` (this file)
2. Create `src/main/ipc/schemas.ts` + `validators.ts`
3. Refactor a subset of handlers in `main.ts` to use `registerValidated()`
4. Adjust preload to send single object payload where updated
5. Backward compatibility: Provide temporary shim (accept old signature if array args detected) – optional; can do breaking if internal only

## Phase 2 Progress (Filesystem Mutations)

- Added schemas for all filesystem mutation & utility operations (write, mkdir, delete, rename, copy, join, resolve, relative, tree)
- Refactored all remaining `filesystem:*` handlers to use `registerValidated`
- Updated preload to use object payloads for every filesystem channel
- Next: introduce path scoping (Phase 2b) and enforce workspace root once concept defined

### Phase 2b (Upcoming)

- Add path normalization & traversal prevention (reject paths resolving outside allowed roots)
- Introduce capability tags (e.g., `fs.read`, `fs.write`) for permission model
- Add tests covering success + validation error for representative fs channels

## Phase 2b (Initial Implementation)

Implemented:

- Basic path scoping guard in main process restricting file operations to: user home + process.cwd()
- Capability tagging field added to validator (currently logs; enforcement pending permission model)
- Preload now uses `invokeSafe` wrapper to surface structured errors as thrown exceptions

Planned Enhancements:

- Replace static roots with workspace root detection
- Enforce capability permissions (per window/session) once model defined
- Add deny-list & path canonicalization tests
- Audit performance impact of validation + security checks

## Open Questions

- Should we bundle all args into single object always? (Yes for consistency)
- Do we enforce path scoping now or separate pass? (Separate Phase 2)
- How to surface validation errors to UI? (Generic notification + console for now)

## Acceptance Criteria (Phase 1)

- Build & tests pass
- Updated channels reject malformed payloads
- Errors use structured format
- Documentation updated

---

Prepared: 2025-09-29

```

```
