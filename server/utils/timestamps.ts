/**
 * Convert seconds to HH:MM:SS.mmm format
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms
    .toString()
    .padStart(3, '0')}`;
}

/**
 * Parse timestamp in HH:MM:SS or MM:SS format to seconds
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(parseFloat);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else {
    return parseFloat(timestamp);
  }
}
