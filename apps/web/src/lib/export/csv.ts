/**
 * Minimal, dependency-free CSV serializer (RFC 4180). Pure so the escaping rules
 * — the part that actually breaks in the wild — are unit-tested.
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  const s = String(raw);
  // Quote when the value contains a comma, quote, or newline; double inner quotes.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(c.value(row))).join(","),
  );
  return [head, ...body].join("\r\n");
}

/** Prepends a UTF-8 BOM so Excel (incl. Romanian locale) reads diacritics correctly. */
export function toCsvFile<T>(rows: T[], columns: CsvColumn<T>[]): string {
  return `﻿${toCsv(rows, columns)}`;
}
