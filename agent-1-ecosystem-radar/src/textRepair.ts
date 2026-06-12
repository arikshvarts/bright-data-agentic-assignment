export function repairText(value: string): string {
  return value
    .replace(/[—–]/g, "-")
    .replace(/[→↦]/g, "->")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/â€”|â€“/g, "-")
    .replace(/â€œ|â€�/g, "\"")
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€¢/g, "-")
    .replace(/â€¦/g, "...")
    .replace(/Â©/g, "(c)")
    .replace(/Â®/g, "(r)")
    .replace(/Â/g, "")
    .replace(/ðŸ˜…/g, "")
    .replace(/â€|â€/g, "\"")
    .replace(/â€˜|â€™/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
