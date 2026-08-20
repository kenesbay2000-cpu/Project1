import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

function fail(message) {
  console.error(`AI secret setup failed: ${message}`);
  process.exit(1);
}

function readValue(source, name) {
  const line = source
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith('#') && item.startsWith(`${name}=`));

  if (!line) return '';
  return line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
}

let source;
try {
  source = await readFile('.env', 'utf8');
} catch {
  fail('.env is missing');
}

const apiKey = readValue(source, 'GEMINI_API_KEY');
if (!apiKey) fail('GEMINI_API_KEY is missing in .env');
const geoapifyApiKey = readValue(source, 'GEOAPIFY_API_KEY');

const tempDirectory = await mkdtemp(join(tmpdir(), 'nfact-ai-secret-'));
const secretFile = join(tempDirectory, 'gemini.env');
const supabaseCli = fileURLToPath(
  new URL('../node_modules/supabase/dist/supabase.js', import.meta.url),
);

let uploadError = '';
try {
  const secrets = [`GEMINI_API_KEY=${apiKey}`];
  if (geoapifyApiKey) secrets.push(`GEOAPIFY_API_KEY=${geoapifyApiKey}`);
  await writeFile(secretFile, `${secrets.join('\n')}\n`, { mode: 0o600 });
  const result = spawnSync(process.execPath, [supabaseCli, 'secrets', 'set', '--env-file', secretFile], {
    stdio: 'inherit',
  });
  if (result.error) uploadError = result.error.message;
  else if (result.status !== 0) uploadError = 'Supabase CLI could not upload the secret';
} catch (error) {
  uploadError = error instanceof Error ? error.message : String(error);
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

if (uploadError) fail(uploadError);
console.log(`AI secrets uploaded to Supabase.${geoapifyApiKey ? ' Geoapify Places enabled.' : ' Geoapify key not found; OpenStreetMap fallback will be used.'}`);
