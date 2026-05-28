import { spawn } from 'node:child_process';
import { deriveN8nApiUrl, loadProjectEnv, repoRoot } from './load-env.mjs';

loadProjectEnv();
deriveN8nApiUrl();

process.env.MCP_MODE ??= 'stdio';
process.env.LOG_LEVEL ??= 'error';
process.env.DISABLE_CONSOLE_OUTPUT ??= 'true';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCommand, ['-y', 'n8n-mcp'], {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error('[n8n-mcp] Failed to start:', error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
