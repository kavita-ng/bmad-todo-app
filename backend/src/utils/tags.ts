/**
 * Single serialisation point for tags CSV ↔ string[] conversion.
 * No other code may read or write raw tag CSV strings.
 */

export function serializeTags(tags: string[]): string {
  return tags.filter(Boolean).join(',')
}

export function deserializeTags(csv: string): string[] {
  if (!csv) return []
  return csv.split(',').filter(Boolean)
}
