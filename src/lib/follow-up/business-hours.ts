export function hourInTimeZone(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === "hour")?.value ?? date.getUTCHours());
  } catch {
    return date.getUTCHours();
  }
}

export function isWithinBusinessHours(
  date: Date,
  timeZone: string,
  startHour: number,
  endHour: number,
) {
  const hour = hourInTimeZone(date, timeZone);
  return hour >= startHour && hour < endHour;
}

export function nextBusinessTime(
  from: Date,
  timeZone: string,
  startHour: number,
  endHour: number,
) {
  const next = new Date(from);
  for (let i = 0; i < 48; i += 1) {
    if (isWithinBusinessHours(next, timeZone, startHour, endHour)) return next;
    next.setHours(next.getHours() + 1);
  }
  return next;
}
