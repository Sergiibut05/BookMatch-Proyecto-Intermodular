/**
 * Cursor hook: evita `git add` de ficheros de entorno con secretos.
 * Entrada JSON en stdin (beforeShellExecution). Salida JSON en stdout.
 */
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}
const raw = Buffer.concat(chunks).toString('utf8');

const allow = () => {
  process.stdout.write(JSON.stringify({ permission: 'allow' }));
};

try {
  const input = JSON.parse(raw || '{}');
  const cmd = String(input.command ?? input.shellCommand ?? input.fullCommand ?? '').trim();

  if (!/git\s+add/i.test(cmd)) {
    allow();
    process.exit(0);
  }

  const envPattern =
    /\.env/i.test(cmd) ||
    /(^|\s)env\.local\b/i.test(cmd) ||
    /\.env\.(local|production|development)\b/i.test(cmd);

  if (envPattern) {
    process.stdout.write(
      JSON.stringify({
        permission: 'deny',
        user_message:
          'No añadas ficheros .env al índice de Git: suelen contener secretos. Usa .env.example o variables en el hosting.',
        agent_message:
          'Project hook blocked git add involving .env files. Use env.example placeholders only.',
      }),
    );
    process.exit(0);
  }
} catch {
  // fail open
}

allow();
process.exit(0);
