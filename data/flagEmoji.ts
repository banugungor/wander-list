export function flagEmoji(iso2?: string): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";

  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
