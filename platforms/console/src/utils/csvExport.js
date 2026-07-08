/**
 * Escape a CSV field (wrap in quotes if contains comma, quote, or newline).
 * @param {string|number} value
 * @returns {string}
 */
function escapeCsvField(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[,"\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Build CSV string from array of objects. Uses first object's keys as header.
 * @param {Array<Record<string, unknown>>} rows
 * @param {string[]} [columns] Optional column order; otherwise uses Object.keys(rows[0]).
 * @returns {string}
 */
export function toCsv(rows, columns) {
  if (!rows.length) return '';
  const headers = columns || Object.keys(rows[0]);
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCsvField(row[h])).join(','));
  }
  return lines.join('\r\n');
}

/**
 * Trigger browser download of a CSV file.
 * @param {string} csvContent
 * @param {string} filename
 */
export function downloadCsv(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
