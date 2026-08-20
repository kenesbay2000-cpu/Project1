export type TripClimateSummary = {
  averageDailyPrecipitation: number;
  averageTemperatureMax: number;
  averageTemperatureMin: number;
  baselineEndYear: number;
  baselineStartYear: number;
  dominantWeatherCode: number;
  wetDayPercentage: number;
};

export type HistoricalWeatherDays = {
  precipitation: Array<number | null>;
  temperatureMax: Array<number | null>;
  temperatureMin: Array<number | null>;
  time: string[];
  weatherCode: Array<number | null>;
};

const DAY_MS = 86_400_000;

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function tripMonthDays(start: string, end: string) {
  const first = parseIsoDate(start);
  const last = parseIsoDate(end);
  if (!first || !last || last < first || last.getTime() - first.getTime() > 92 * DAY_MS) return [];
  const result: string[] = [];
  for (let cursor = first.getTime(); cursor <= last.getTime(); cursor += DAY_MS) {
    result.push(new Date(cursor).toISOString().slice(5, 10));
  }
  return result;
}

function weatherGroup(code: number) {
  if (code === 0) return 0;
  if (code <= 3) return 2;
  if ([45, 48].includes(code)) return 45;
  if (code >= 71 && code <= 86) return 71;
  if (code >= 95) return 95;
  return 61;
}

export function summarizeClimate(
  days: HistoricalWeatherDays,
  monthDays: string[],
  baselineStartYear: number,
  baselineEndYear: number,
): TripClimateSummary | null {
  const wanted = new Set(monthDays);
  const temperaturesMax: number[] = [];
  const temperaturesMin: number[] = [];
  const precipitation: number[] = [];
  const groups = new Map<number, number>();

  days.time.forEach((date, index) => {
    if (!wanted.has(date.slice(5, 10))) return;
    const max = days.temperatureMax[index];
    const min = days.temperatureMin[index];
    const rain = days.precipitation[index];
    const code = days.weatherCode[index];
    if (typeof max === 'number' && Number.isFinite(max)) temperaturesMax.push(max);
    if (typeof min === 'number' && Number.isFinite(min)) temperaturesMin.push(min);
    if (typeof rain === 'number' && Number.isFinite(rain)) precipitation.push(rain);
    if (typeof code === 'number' && Number.isFinite(code)) {
      const group = weatherGroup(code);
      groups.set(group, (groups.get(group) ?? 0) + 1);
    }
  });

  if (!temperaturesMax.length || !temperaturesMin.length || !precipitation.length) return null;
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const dominantWeatherCode = [...groups].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 2;
  return {
    averageDailyPrecipitation: average(precipitation),
    averageTemperatureMax: average(temperaturesMax),
    averageTemperatureMin: average(temperaturesMin),
    baselineEndYear,
    baselineStartYear,
    dominantWeatherCode,
    wetDayPercentage: precipitation.filter((value) => value >= 1).length / precipitation.length * 100,
  };
}
