export function parseThaiMenu(ocrText) {
  let lines = ocrText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const menu = [];
  function cleanLine(line) {
    return line
      .replace(/^[^\u0E00-\u0E7F\d]+|[^\u0E00-\u0E7F\d]+$/g, "")
      .replace(/[|"'().,;:]+/g, "")
      .trim();
  }
  lines = lines.filter((line) => (line.match(/\d{2,3}/g) || []).length >= 2);
  const lineRegex = /^(.+?)\s+(\d{2,3})\s+(\d{2,3})(?:\s+(\d{2,3}))?$/;
  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    const match = line.match(lineRegex);
    if (match) {
      menu.push({
        nameTH: match[1],
        prices: {
          regular: parseInt(match[2]),
          special: parseInt(match[3]),
          jumbo: match[4] ? parseInt(match[4]) : null,
        },
      });
    }
  }
  return menu;
}
