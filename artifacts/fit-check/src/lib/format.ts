export function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

export function formatTemp(tempF: number, unit: "f" | "c"): string {
  const t = unit === "c" ? fToC(tempF) : Math.round(tempF);
  const symbol = unit === "c" ? "C" : "F";
  return `${t}°${symbol}`;
}

export function formatTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return timeStr;
  }
}

export function getDayName(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString([], { weekday: 'short' });
  } catch (e) {
    return timeStr;
  }
}
