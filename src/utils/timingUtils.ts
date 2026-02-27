
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Convert "06:00" or "06:00:00" to "6:00 AM"
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${ampm}`;
}

/**
 * Get days the room is closed
 */
export function getClosedDays(workingDays: string[] | null | undefined): string[] {
  if (!workingDays || workingDays.length === 0) return [];
  return ALL_DAYS.filter(d => !workingDays.includes(d));
}

/**
 * Get full day name from abbreviation
 */
export function getFullDayName(abbr: string): string {
  const map: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  };
  return map[abbr] || abbr;
}

/**
 * Returns a compact display string like "Open: 6:00 AM – 10:00 PM"
 */
export function getTimingDisplay(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
): string {
  if (!openingTime || !closingTime) return '';
  return `Open: ${formatTime(openingTime)} – ${formatTime(closingTime)}`;
}

/**
 * Returns closed days display like "Closed on Sunday" or "Closed on Saturday, Sunday"
 */
export function getClosedDaysDisplay(workingDays: string[] | null | undefined): string {
  const closed = getClosedDays(workingDays);
  if (closed.length === 0) return '';
  return `Closed on ${closed.map(getFullDayName).join(', ')}`;
}

/**
 * Returns display string for 24/7 rooms
 */
export function is24HoursDisplay(is24Hours: boolean | undefined): string {
  return is24Hours ? 'Open 24/7' : '';
}

export { ALL_DAYS };
