/**
 * Formats a Date object or ISO string to Venezuelan Legal Time (HLV) with DD-MM-YYYY format.
 *
 * Examples:
 * - formatVE("2026-06-24T22:05:00Z") => "24-06-2026, 06:05:00 a. m."
 * - formatVE("2026-06-24T22:05:00Z", false) => "24-06-2026"
 */
export function formatVE(dateInput: Date | string | undefined | null, includeTime = true): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    } : {})
  });

  return formatter.format(date).replace(/\//g, '-');
}

/**
 * Returns YYYY-MM-DD formatted date string in America/Caracas timezone.
 * Useful for calendar input matches and filtering.
 */
export function getVenezuelaDateString(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  return `${year}-${month}-${day}`;
}
