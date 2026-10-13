import { readFile } from 'node:fs/promises';

function readValue(source, name) {
  const line = source.split(/\r?\n/).map((item) => item.trim())
    .find((item) => item && !item.startsWith('#') && item.startsWith(`${name}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2') : '';
}

let source;
try { source = await readFile('.env', 'utf8'); }
catch { console.error('AI check failed: .env is missing.'); process.exit(1); }
const url = readValue(source, 'VITE_SUPABASE_URL');
const key = readValue(source, 'VITE_SUPABASE_ANON_KEY');
if (!url || !key) {
  console.error('AI check failed: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env.');
  process.exit(1);
}

try {
  const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ mode: 'healthcheck' }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await response.json().catch(() => null);
  if (response.ok && body?.ok && typeof body.model === 'string') {
    console.log(`AI check passed: ${body.model} answered in ${body.durationMs} ms.`);
    process.exit(0);
  }
  const message = body?.error?.message ?? `HTTP ${response.status}`;
  console.error(`AI check failed: ${message}`);
  process.exit(1);
} catch (error) {
  console.error(`AI check failed: ${error instanceof Error ? error.message : 'network error'}`);
  process.exit(1);
}
