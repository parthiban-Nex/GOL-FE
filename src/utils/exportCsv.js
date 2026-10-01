/**
 * Client-side CSV download - used by every Reports screen's Download
 * button, so an export is exactly the rows the user is looking at.
 *
 * @param {string} filename   without extension
 * @param {{ key: string, header: string, value?: (row) => any }[]} [columns]
 *        Omit to export every key found on the rows - useful when a
 *        report's shape isn't fixed.
 * @param {object[]} rows
 */
export function downloadCsv(filename, rows, columns) {
  const list = Array.isArray(rows) ? rows : [];
  const cols =
    columns ??
    Array.from(new Set(list.flatMap((row) => Object.keys(row ?? {})))).map(
      (key) => ({ key, header: key }),
    );

  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    // Quote anything containing a delimiter, quote or newline.
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [
    cols.map((c) => escape(c.header)).join(","),
    ...list.map((row) =>
      cols.map((c) => escape(c.value ? c.value(row) : row?.[c.key])).join(","),
    ),
  ];

  // BOM so Excel opens UTF-8 (rupee signs, names) correctly.
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Keeps rows whose date field falls within [from, to] (YYYY-MM-DD,
 * inclusive). Rows with no recognisable date are kept rather than
 * silently dropped. */
export function filterByDateRange(rows, from, to, dateKeys) {
  if (!from && !to) return rows;
  const keys = dateKeys ?? [
    "createdAt",
    "invoice_date",
    "date",
    "adjustmentDate",
    "transferDate",
  ];
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59`) : null;

  return rows.filter((row) => {
    const raw = keys.map((k) => row?.[k]).find(Boolean);
    if (!raw) return true;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return true;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}
