const SECONDS_PER_MINUTE = 60;

/** Formats a whole number of seconds as `mm:ss` (minutes keep counting past 59). */
export class ElapsedTimeFormatter {
  format(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const rest = seconds % SECONDS_PER_MINUTE;
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  }
}
