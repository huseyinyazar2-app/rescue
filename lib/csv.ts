export function createCsv(rows: Array<Record<string, string>>) {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const escapeValue = (value: string) => {
    if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
      return `"${value.replace(/\"/g, '""')}"`;
    }
    return value;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeValue(row[header] ?? "")).join(","));
  }
  return lines.join("\n");
}
