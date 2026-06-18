import { describe, expect, it } from "vitest";
import { toCsv, toCsvFile, type CsvColumn } from "./csv";

type Row = { name: string; amount: number; note: string | null };

const cols: CsvColumn<Row>[] = [
  { header: "Name", value: (r) => r.name },
  { header: "Amount", value: (r) => r.amount },
  { header: "Note", value: (r) => r.note },
];

describe("toCsv", () => {
  it("writes a header and rows joined with CRLF", () => {
    const csv = toCsv([{ name: "A", amount: 10, note: "ok" }], cols);
    expect(csv).toBe("Name,Amount,Note\r\nA,10,ok");
  });

  it("quotes cells containing commas, quotes, or newlines", () => {
    const csv = toCsv(
      [{ name: "Doe, John", amount: 5, note: 'say "hi"' }],
      cols,
    );
    expect(csv).toBe('Name,Amount,Note\r\n"Doe, John",5,"say ""hi"""');
  });

  it("quotes newlines and renders null/undefined as empty", () => {
    const csv = toCsv([{ name: "line1\nline2", amount: 0, note: null }], cols);
    expect(csv).toBe('Name,Amount,Note\r\n"line1\nline2",0,');
  });

  it("handles an empty row set (header only)", () => {
    expect(toCsv([], cols)).toBe("Name,Amount,Note");
  });
});

describe("toCsvFile", () => {
  it("prepends a UTF-8 BOM", () => {
    const out = toCsvFile([{ name: "A", amount: 1, note: null }], cols);
    expect(out.charCodeAt(0)).toBe(0xfeff);
    expect(out.slice(1)).toBe("Name,Amount,Note\r\nA,1,");
  });
});
