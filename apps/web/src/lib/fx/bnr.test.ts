import { describe, expect, it } from "vitest";
import { parseBnrXml, findRate } from "./bnr";

const SAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<DataSet xmlns="http://www.bnr.ro/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.bnr.ro/xsd nbrfxrates.xsd">
  <Header>
    <Publisher>National Bank of Romania</Publisher>
    <PublishingDate>2026-06-17</PublishingDate>
    <MessageType>DR</MessageType>
  </Header>
  <Body>
    <Subject>Reference rates CCY/RON</Subject>
    <OrigCurrency>RON</OrigCurrency>
    <Cube date="2026-06-17">
      <Rate currency="EUR">4.9712</Rate>
      <Rate currency="USD">4.5831</Rate>
      <Rate currency="GBP">5.8204</Rate>
      <Rate currency="CHF" multiplier="100">504.7200</Rate>
    </Cube>
  </Body>
</DataSet>`;

describe("parseBnrXml", () => {
  it("extracts the publishing date", () => {
    const result = parseBnrXml(SAMPLE_XML);
    expect(result.rateDate).toBe("2026-06-17");
  });

  it("parses EUR rate without multiplier", () => {
    const result = parseBnrXml(SAMPLE_XML);
    const eur = findRate(result, "EUR");
    expect(eur).toBeDefined();
    expect(eur?.rate).toBeCloseTo(4.9712, 4);
    expect(eur?.multiplier).toBe(1);
  });

  it("parses USD rate", () => {
    const result = parseBnrXml(SAMPLE_XML);
    const usd = findRate(result, "USD");
    expect(usd?.rate).toBeCloseTo(4.5831, 4);
  });

  it("handles multiplier correctly — CHF multiplier=100 means 100 CHF = 504.72 RON → 1 CHF = 5.0472", () => {
    const result = parseBnrXml(SAMPLE_XML);
    const chf = findRate(result, "CHF");
    expect(chf?.multiplier).toBe(100);
    expect(chf?.rate).toBeCloseTo(5.0472, 4);
  });

  it("returns all 4 rates from sample", () => {
    const result = parseBnrXml(SAMPLE_XML);
    expect(result.rates).toHaveLength(4);
  });

  it("returns empty rates for empty XML", () => {
    const result = parseBnrXml("<DataSet></DataSet>");
    expect(result.rates).toHaveLength(0);
    expect(result.rateDate).toBe("");
  });

  it("findRate returns undefined for unknown currency", () => {
    const result = parseBnrXml(SAMPLE_XML);
    expect(findRate(result, "JPY")).toBeUndefined();
  });

  it("filters out non-positive rates", () => {
    const xml = `<Cube date="2026-06-17">
      <Rate currency="EUR">5.00</Rate>
      <Rate currency="BAD">0</Rate>
    </Cube>`;
    const result = parseBnrXml(xml);
    expect(findRate(result, "EUR")?.rate).toBeCloseTo(5, 4);
    expect(findRate(result, "BAD")).toBeUndefined();
  });

  it("handles a comma decimal separator defensively", () => {
    const xml = `<Cube date="2026-06-17"><Rate currency="EUR">4,9712</Rate></Cube>`;
    const result = parseBnrXml(xml);
    expect(findRate(result, "EUR")?.rate).toBeCloseTo(4.9712, 4);
  });

  it("is resilient to malformed XML (returns no rates, does not throw)", () => {
    expect(() => parseBnrXml("not xml at all <<<")).not.toThrow();
    expect(parseBnrXml("not xml at all <<<").rates).toHaveLength(0);
  });
});
