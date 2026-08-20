export async function requestTravelJson(url: string, label: string, timeoutMs = 10_000, headers?: HeadersInit) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const started = Date.now();
    try {
      const response = await fetch(url, { signal: controller.signal, headers });
      if (response.ok) return await response.json() as unknown;
      const retryable = response.status === 429 || response.status >= 500;
      console.warn(`[TravelData] ${label} HTTP ${response.status} on attempt ${attempt + 1} (${Date.now() - started} ms).`);
      if (!retryable || attempt === 1) throw new Error(`Travel data HTTP ${response.status}`);
      const retryAfter = Number(response.headers.get('retry-after')) * 1_000;
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 2_000) : 350 * (attempt + 1)));
    } catch (error) {
      if (attempt === 1 || (error instanceof Error && error.message.startsWith('Travel data HTTP 4'))) throw error;
      console.warn(`[TravelData] ${label} retry after ${error instanceof Error ? error.name : 'request error'} (${Date.now() - started} ms).`);
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    } finally { clearTimeout(timeout); }
  }
  throw new Error(`Travel data ${label} failed`);
}
