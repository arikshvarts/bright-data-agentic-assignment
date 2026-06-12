const replacements: Array<[RegExp, string]> = [
  [/\u2018|\u2019/g, "'"],
  [/\u201c|\u201d/g, "\""],
  [/\u2013|\u2014/g, "-"],
  [/\u2026/g, "..."],
  [/â€™/g, "'"],
  [/â€œ|â€|â€ť/g, "\""],
  [/â€“|â€”/g, "-"],
  [/â€¦/g, "..."],
  [/Ã—/g, "x"],
  [/Ã©/g, "e"],
  [/Ã¨/g, "e"],
  [/Ã¡/g, "a"],
  [/Ã­/g, "i"],
  [/Ã³/g, "o"],
  [/Ãº/g, "u"],
  [/â˜•ï¸|â˜•/g, "coffee"],
  [/ï¸/g, ""],
  [/Â/g, ""]
];

export function repairText(value: string): string {
  const decoded = maybeDecodeMojibake(value);
  return replacements
    .reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), decoded)
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function maybeDecodeMojibake(value: string): string {
  if (!/[ÃÂâ]/.test(value)) return value;

  try {
    const decoded = Buffer.from(value, "latin1").toString("utf8");
    return mojibakeScore(decoded) < mojibakeScore(value) ? decoded : value;
  } catch {
    return value;
  }
}

function mojibakeScore(value: string): number {
  return (value.match(/[ÃÂâ�]/g) ?? []).length;
}
