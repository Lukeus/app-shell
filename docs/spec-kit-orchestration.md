# Spec Kit Orchestration Bridge

The Spec Kit orchestration bridge exposes a lightweight HTTP surface for driving
App Shell automation from external tools. It is designed for local
orchestration workflows such as automated test rigs, cross-application scripts,
or CI runners that need to coordinate Electron state.

## Overview

- **Base URL**: `http://127.0.0.1:${SPEC_KIT_API_PORT || 17653}`
- **Authentication**: Bearer token (`SPEC_KIT_API_TOKEN`) or loopback-only mode
- **Transport**: JSON over HTTP, gzip payload for workspace exports
- **Defaults**: Server starts automatically when the main process initialises

Set `SPEC_KIT_API_TOKEN` (or `SPEC_KIT_BRIDGE_TOKEN`) in the environment to
require token-based access. When unset the bridge only accepts requests from
loopback interfaces (127.0.0.1/::1).

## Authentication

### Token Authentication

1. Define an environment variable before launching the Electron app:

   ```bash
   export SPEC_KIT_API_TOKEN="<a-long-random-string>"
   ```

2. Supply the token using **one** of the following mechanisms:

   - HTTP header: `Authorization: Bearer <token>`
   - HTTP header: `X-Spec-Kit-Token: <token>`
   - Query string: `?token=<token>`

The bridge rejects requests with an invalid or missing token when a token is
configured.

### Loopback Authentication

When no token is configured, the bridge verifies that incoming requests
originate from `127.0.0.1` or `::1`. Requests from any other interface are
rejected.

## API Endpoints

### `POST /spec-kit/startPipeline`

Start a pipeline by executing a registered command. By default the bridge will
execute the `pipeline.start` command and prepend the supplied `pipelineId`
argument.

**Request Body**

```json
{
  "pipelineId": "example.pipeline",
  "commandId": "pipeline.start",
  "args": ["--force"]
}
```

- `pipelineId` *(optional)*: Passed as the first argument when using the
  default `pipeline.start` command.
- `commandId` *(optional)*: Override the command to execute.
- `args` *(optional)*: Additional arguments array forwarded to the command.

**Responses**

- `200 OK`: Command executed successfully.
- `404 Not Found`: Command ID not registered.
- `500 Internal Server Error`: Command execution failure.

**Sample cURL**

```bash
curl -X POST "http://127.0.0.1:17653/spec-kit/startPipeline" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPEC_KIT_API_TOKEN" \
  -d '{"pipelineId":"example.pipeline"}'
```

### `GET /spec-kit/workspaceState`

Retrieve runtime metadata that describes the current workspace.

**Response Body**

```json
{
  "status": "ok",
  "workspaceRoots": ["/path/to/workspace"],
  "settings": {"theme": "dark"},
  "commands": [
    {
      "command": "app.reload",
      "title": "Reload Window",
      "category": "Application"
    }
  ]
}
```

**Sample cURL**

```bash
curl "http://127.0.0.1:17653/spec-kit/workspaceState" \
  -H "Authorization: Bearer $SPEC_KIT_API_TOKEN"
```

### `POST /spec-kit/exportWorkspace`

Capture a snapshot of the workspace filesystem.

**Request Body**

```json
{
  "workspaceRoot": "/path/to/workspace",
  "destinationPath": "/tmp/workspace-export.json",
  "includeHidden": false,
  "includeContent": false,
  "maxDepth": 3
}
```

- `workspaceRoot` *(optional)*: Defaults to the first configured workspace
  root.
- `destinationPath` *(optional)*: When provided the JSON snapshot is written to
  this path on disk.
- `includeHidden`: Include entries starting with `.` (default: `false`).
- `includeContent`: Embed up to 1 MiB of Base64-encoded file content per file
  (default: `false`).
- `maxDepth`: Directory traversal depth limit (default: `3`).

**Responses**

- `200 OK` with `status: "written"`: Snapshot persisted to
  `destinationPath`.
- `200 OK` with Base64 payload: Inline gzipped snapshot returned as
  `payload`.
- `400 Bad Request`: Workspace root missing.
- `403 Forbidden`: Workspace root not permitted by path security.
- `500 Internal Server Error`: Snapshot generation failed.

**Sample cURL**

```bash
curl -X POST "http://127.0.0.1:17653/spec-kit/exportWorkspace" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SPEC_KIT_API_TOKEN" \
  -d '{"destinationPath":"/tmp/workspace-export.json","includeHidden":true}'
```

## CLI Helper

A companion CLI is provided at `scripts/spec-kit-cli.ts`. Use `ts-node` (or the
TypeScript runtime of your choice) to interact with the bridge:

```bash
pnpm exec ts-node scripts/spec-kit-cli.ts workspace-state
pnpm exec ts-node scripts/spec-kit-cli.ts start-pipeline --pipeline example.pipeline
pnpm exec ts-node scripts/spec-kit-cli.ts export-workspace --workspace /path --out /tmp/export.json
```

Set `SPEC_KIT_API_URL` to override the base URL when the server is bound to a
non-default host/port.
