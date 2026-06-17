import { roundMoney } from "@/lib/money/format";
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
  const subtotalNet = roundMoney(
    lines.reduce(
      (sum, line) => sum + roundMoney(line.quantity * line.unit_price_net),
      0,
    ),
  );
  // A discount can never exceed the subtotal — a quote total must not go
  // negative, which would otherwise yield negative VAT and gross amounts.
  const rawDiscountNet =
    roundMoney(subtotalNet * discountPct) + fixedDiscountNet;
  const discountNet = Math.min(roundMoney(rawDiscountNet), subtotalNet);
  const netAfterDiscount = roundMoney(subtotalNet - discountNet);
  const vatAmount = roundMoney(netAfterDiscount * vatRate);
  const totalGross = roundMoney(netAfterDiscount + vatAmount);

  return { subtotalNet, discountNet, netAfterDiscount, vatAmount, totalGross };
}
