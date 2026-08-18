export function getTripDayColor(day: number) {
  const hue = (12 + Math.max(0, day - 1) * 137.508) % 360;
  return `hsl(${hue.toFixed(1)} 48% 42%)`;
}
