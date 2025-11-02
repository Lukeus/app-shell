#!/usr/bin/env ts-node
/*
 * Spec Kit CLI helper.
 *
 * Provides a lightweight interface for interacting with the Spec Kit orchestration bridge.
 */

interface ParsedArgs {
  [key: string]: string | boolean | string[];
}

interface CliOptions {
  baseUrl: string;
  token?: string;
}

const DEFAULT_PORT = process.env.SPEC_KIT_API_PORT ?? '17653';
const DEFAULT_BASE_URL = process.env.SPEC_KIT_API_URL ?? `http://127.0.0.1:${DEFAULT_PORT}`;
const DEFAULT_TOKEN =
  process.env.SPEC_KIT_API_TOKEN || process.env.SPEC_KIT_BRIDGE_TOKEN || process.env.SPEC_KIT_TOKEN;

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) {
      const positional = (result._ as string[] | undefined) ?? [];
      positional.push(current);
      result._ = positional;
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function startPipeline(args: ParsedArgs, options: CliOptions): Promise<void> {
  const pipelineId = (args.pipeline as string | undefined) ?? (args.p as string | undefined);
  const commandId = (args.command as string | undefined) ?? (args['command-id'] as string | undefined);
  const argsRaw = (args.args as string | undefined) ?? (args.a as string | undefined);
  const token = (args.token as string | undefined) ?? options.token;

  const payload: Record<string, unknown> = {};
  if (pipelineId) {
    payload.pipelineId = pipelineId;
  }
  if (commandId) {
    payload.commandId = commandId;
  }
  if (argsRaw) {
    payload.args = argsRaw.split(',').map(item => item.trim()).filter(Boolean);
  }

  const response = await fetch(`${options.baseUrl}/spec-kit/startPipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);
}

async function workspaceState(args: ParsedArgs, options: CliOptions): Promise<void> {
  const token = (args.token as string | undefined) ?? options.token;
  const response = await fetch(`${options.baseUrl}/spec-kit/workspaceState`, {
    method: 'GET',
    headers: buildHeaders(token),
  });
  await handleResponse(response);
}

async function exportWorkspace(args: ParsedArgs, options: CliOptions): Promise<void> {
  const token = (args.token as string | undefined) ?? options.token;
  const payload: Record<string, unknown> = {};

  if (typeof args.workspace === 'string') {
    payload.workspaceRoot = args.workspace;
  }
  if (typeof args.out === 'string') {
    payload.destinationPath = args.out;
  }
  if (args['include-hidden'] === true || args.hidden === true) {
    payload.includeHidden = true;
  }
  if (args['include-content'] === true || args.content === true) {
    payload.includeContent = true;
  }
  if (typeof args.depth === 'string') {
    const parsed = Number(args.depth);
    if (!Number.isNaN(parsed) && parsed > 0) {
      payload.maxDepth = parsed;
    }
  }

  const response = await fetch(`${options.baseUrl}/spec-kit/exportWorkspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);
}

async function handleResponse(response: Response): Promise<void> {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    console.log('');
    return;
  }

  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      console.error(JSON.stringify(json, null, 2));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(json, null, 2));
  } catch (error) {
    if (!response.ok) {
      console.error(text);
      process.exitCode = 1;
      return;
    }
    console.log(text);
  }
}

function printHelp(): void {
  console.log(`Usage: spec-kit-cli <command> [options]

Commands:
  start-pipeline       Trigger a pipeline via the orchestration bridge
  workspace-state      Fetch workspace state metadata
  export-workspace     Capture a workspace snapshot

Options:
  --pipeline <id>      Pipeline identifier (start-pipeline)
  --command <id>       Command identifier override (start-pipeline)
  --args <a,b,c>       Comma separated command arguments (start-pipeline)
  --workspace <path>   Workspace root to export (export-workspace)
  --out <file>         Destination path for export (export-workspace)
  --include-hidden     Include hidden files in export
  --include-content    Embed Base64 file content in export
  --depth <n>          Directory depth for export traversal
  --token <token>      Override token for this invocation
  --help               Show this help message
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv.shift();

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const args = parseArgs(argv);
  const options: CliOptions = {
    baseUrl: (args.url as string | undefined) ?? DEFAULT_BASE_URL,
    token: (args.token as string | undefined) ?? DEFAULT_TOKEN,
  };

  try {
    if (command === 'start-pipeline') {
      await startPipeline(args, options);
      return;
    }

    if (command === 'workspace-state') {
      await workspaceState(args, options);
      return;
    }

    if (command === 'export-workspace') {
      await exportWorkspace(args, options);
      return;
    }

    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
