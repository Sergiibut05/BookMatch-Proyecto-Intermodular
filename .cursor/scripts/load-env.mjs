import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(scriptDir, '../..');

/**
 * Carga KEY=VALUE desde un fichero .env sin sobrescribir variables ya definidas.
 */
export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return false;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return true;
}

/**
 * Orden: .cursor/.env → .env (raíz) → BookMatch-Backend/.env
 */
export function loadProjectEnv() {
  const candidates = [
    join(repoRoot, '.cursor', '.env'),
    join(repoRoot, '.env'),
    join(repoRoot, 'BookMatch-Backend', '.env'),
  ];

  for (const filePath of candidates) {
    loadEnvFile(filePath);
  }
}

export function deriveN8nApiUrl() {
  if (process.env.N8N_API_URL) {
    return;
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL ?? process.env.N8N_WEBHOOK_PLAYLIST_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    process.env.N8N_API_URL = new URL(webhookUrl).origin;
  } catch {
    // ignore invalid URL
  }
}
