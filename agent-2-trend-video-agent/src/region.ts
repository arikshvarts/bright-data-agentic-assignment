export function inferRegion(location: string): string {
  const normalized = location.toLowerCase();
  const mappings: Array<[RegExp, string]> = [
    [/\bisrael\b|tel aviv|jerusalem/, "il"],
    [/\bunited states\b|\busa\b|new york|los angeles|san francisco|chicago/, "us"],
    [/\bunited kingdom\b|\buk\b|london|manchester/, "gb"],
    [/\bcanada\b|toronto|vancouver/, "ca"],
    [/\baustralia\b|sydney|melbourne/, "au"],
    [/\bgermany\b|berlin|munich/, "de"],
    [/\bfrance\b|paris/, "fr"],
    [/\bspain\b|madrid|barcelona/, "es"]
  ];
  return mappings.find(([pattern]) => pattern.test(normalized))?.[1] ?? "us";
}
