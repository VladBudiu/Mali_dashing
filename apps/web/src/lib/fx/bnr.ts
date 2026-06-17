export type ParsedRate = {
  currency: string;
  rate: number;
  rateDate: string;
  multiplier: number;
};

export type BnrParseResult = {
  rateDate: string;
  rates: ParsedRate[];
};

/**
 * Parses BNR nbrfxrates.xml response text into structured rate objects.
 * BNR publishes EUR, USD, GBP, etc. relative to RON.
 * Rate in the XML is "X RON = 1 <currency>", but the multiplier attribute
 * means "X units of currency = rate RON" — handle both forms.
 */
export function parseBnrXml(xml: string): BnrParseResult {
  const dateMatch = xml.match(/<Header>[\s\S]*?<PublishingDate>([^<]+)<\/PublishingDate>/);
  const rateDate = dateMatch?.[1]?.trim() ?? "";

  const rates: ParsedRate[] = [];
  const rateRegex = /<Rate\s+currency="([^"]+)"(?:\s+multiplier="([^"]+)")?>([\d.,]+)<\/Rate>/g;

  let match: RegExpExecArray | null;
  while ((match = rateRegex.exec(xml)) !== null) {
    const currency = match[1] ?? "";
    const multiplier = match[2] ? parseFloat(match[2]) : 1;
    const rawRate = parseFloat((match[3] ?? "0").replace(",", "."));
    const rate = rawRate / multiplier;

    if (currency && !isNaN(rate) && rate > 0) {
      rates.push({ currency, rate, rateDate, multiplier });
    }
  }

  return { rateDate, rates };
}

export function findRate(result: BnrParseResult, currency: string): ParsedRate | undefined {
  return result.rates.find((r) => r.currency === currency);
}
