const NOMINATIM_URL = import.meta.env?.VITE_NOMINATIM_URL?.trim() || 'https://nominatim.openstreetmap.org';
const REQUEST_INTERVAL_MS = 1_100;
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timeout = globalThis.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      globalThis.clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export function requestNominatimJson(path: string, signal: AbortSignal) {
  const run = async () => {
    const wait = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait) await delay(wait, signal);
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const serverHeaders = typeof window === 'undefined'
        ? { 'User-Agent': 'Roamly travel planner (https://github.com/kenesbay2000-cpu/Project1)' } : undefined;
      const response = await fetch(`${NOMINATIM_URL}${path}`, { signal, headers: serverHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      return await response.json() as unknown;
    } finally { lastRequestAt = Date.now(); }
  };
  const result = requestQueue.then(run, run);
  requestQueue = result.then(() => undefined, () => undefined);
  return result;
}
