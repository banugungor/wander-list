// Safely parses a JSON-encoded id list read from AsyncStorage — returns []
// on a missing, malformed, or non-array value instead of throwing.
export function parseIdList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
