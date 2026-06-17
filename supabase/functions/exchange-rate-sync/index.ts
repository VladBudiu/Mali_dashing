import { createClient } from "jsr:@supabase/supabase-js@2";

const BNR_URL = "https://www.bnr.ro/nbrfxrates.xml";
const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

type RateRow = {
  source: string;
  rate_date: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  published_at: string;
};

function parseBnrXml(xml: string): { rateDate: string; rates: RateRow[] } {
  const dateMatch = xml.match(
    /<PublishingDate>([^<]+)<\/PublishingDate>/,
  );
  const rateDate = dateMatch ? dateMatch[1].trim() : "";

  const rates: RateRow[] = [];
  const rateRegex =
    /<Rate\s+currency="([^"]+)"(?:\s+multiplier="([^"]+)")?>([\d.,]+)<\/Rate>/g;

  let match: RegExpExecArray | null;
  while ((match = rateRegex.exec(xml)) !== null) {
    const currency = match[1];
    if (!SUPPORTED_CURRENCIES.includes(currency)) continue;

    const multiplier = match[2] ? parseFloat(match[2]) : 1;
    const rawRate = parseFloat(match[3].replace(",", "."));
    const rate = rawRate / multiplier;

    if (!isNaN(rate) && rate > 0 && rateDate) {
      rates.push({
        source: "BNR",
        rate_date: rateDate,
        base_currency: currency,
        quote_currency: "RON",
        rate: Math.round(rate * 1e8) / 1e8,
        published_at: new Date().toISOString(),
      });
    }
  }

  return { rateDate, rates };
}

Deno.serve(async (req) => {
  // Allow manual trigger via POST, or cron invocation with any method
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let xml: string;
  try {
    const res = await fetch(BNR_URL, {
      headers: { "Accept": "application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`BNR fetch failed: ${res.status} ${res.statusText}`);
    }
    xml = await res.text();
  } catch (err) {
    console.error("BNR fetch error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch BNR rates", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const { rateDate, rates } = parseBnrXml(xml);
  if (!rateDate || rates.length === 0) {
    return new Response(
      JSON.stringify({ error: "No rates parsed from BNR XML" }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(rates, {
      onConflict: "source,rate_date,base_currency,quote_currency",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("Upsert error:", error);
    return new Response(
      JSON.stringify({ error: "DB upsert failed", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`Synced ${rates.length} rates for ${rateDate}`);
  return new Response(
    JSON.stringify({ ok: true, rateDate, count: rates.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
