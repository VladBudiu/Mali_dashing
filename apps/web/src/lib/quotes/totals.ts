import type { QuoteLineRow } from "./queries";

export type QuoteTotals = {
  subtotalNet: number;
  discountNet: number;
  netAfterDiscount: number;
  vatAmount: number;
  totalGross: number;
};

export function calculateQuoteTotals(
  lines: Pick<QuoteLineRow, "quantity" | "unit_price_net">[],
  vatRate: number,
  discountPct: number,
  fixedDiscountNet: number,
): QuoteTotals {
  const subtotalNet = lines.reduce(
    (sum, line) => sum + roundMoney(line.quantity * line.unit_price_net),
    0,
  );
  const discountNet = roundMoney(subtotalNet * discountPct) + fixedDiscountNet;
  const netAfterDiscount = roundMoney(subtotalNet - discountNet);
  const vatAmount = roundMoney(netAfterDiscount * vatRate);
  const totalGross = roundMoney(netAfterDiscount + vatAmount);

  return { subtotalNet, discountNet, netAfterDiscount, vatAmount, totalGross };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
