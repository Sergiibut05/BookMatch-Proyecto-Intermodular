import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const cursorDir = join(scriptDir, '..');
const examplePath = join(cursorDir, 'mcp.json.example');
const targetPath = join(cursorDir, 'mcp.json');
const envExamplePath = join(cursorDir, '.env.example');
const envPath = join(cursorDir, '.env');

if (!existsSync(examplePath)) {
  console.error('Missing .cursor/mcp.json.example');
  process.exit(1);
}

if (!existsSync(targetPath)) {
  copyFileSync(examplePath, targetPath);
  console.log('Created .cursor/mcp.json from mcp.json.example');
} else {
  console.log('.cursor/mcp.json already exists (skipped)');
}

if (!existsSync(envPath)) {
  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    console.log('Created .cursor/.env from .env.example — fill N8N_API_URL and N8N_API_KEY');
  }
} else {
  console.log('.cursor/.env already exists (skipped)');
}

console.log('\nNext steps:');
console.log('1. Edit .cursor/.env with your n8n API URL and key');
console.log('2. Restart Cursor and enable the n8n-mcp server in Settings → MCP');
