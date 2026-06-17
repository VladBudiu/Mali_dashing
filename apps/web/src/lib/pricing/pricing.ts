/**
 * Pure pricing/margin maths for the standalone cost→price calculator.
 * No Supabase, no React — so the rules are unit-tested and could later feed a
 * "create quote" hand-off. Rounding goes through the shared money util so the
 * calculator and the quote engine agree to the cent.
 */
import { roundMoney } from "@/lib/money/format";

export type PricingLineInput = {
  description: string;
  quantity: number;
  unitCost: number;
  /** Fractional markup over cost: 0.3 = +30%. May be negative (selling under cost). */
  markupPct: number;
};

export type PricingLineResult = PricingLineInput & {
  unitPrice: number;
  lineCost: number;
  linePrice: number;
  lineProfit: number;
};

export type PricingInput = {
  lines: PricingLineInput[];
  /** Fractional VAT rate: 0.19 = 19%. */
  vatRate: number;
  /** Fractional discount over the net price: 0.1 = 10%. */
  discountPct: number;
  /** Fractional deposit of the gross total: 0.3 = 30%. */
  depositPct: number;
};

export type PricingResult = {
  lines: PricingLineResult[];
  totalCost: number;
  subtotalPrice: number;
  discountAmount: number;
  netAfterDiscount: number;
  /** Profit as a fraction of net price (0..1); 0 when there is no revenue. */
  marginPct: number;
  profit: number;
  vatAmount: number;
  totalGross: number;
  depositDue: number;
};

function clampNonNeg(n: number): number {
  return n > 0 ? n : 0;
}

export function computePricingLine(line: PricingLineInput): PricingLineResult {
  const quantity = clampNonNeg(line.quantity);
  const unitCost = clampNonNeg(line.unitCost);
  // A markup below -100% would imply a negative price — floor the unit price at 0.
  const unitPrice = roundMoney(clampNonNeg(unitCost * (1 + line.markupPct)));
  const lineCost = roundMoney(quantity * unitCost);
  const linePrice = roundMoney(quantity * unitPrice);

  return {
    ...line,
    quantity,
    unitCost,
    unitPrice,
    lineCost,
    linePrice,
    lineProfit: roundMoney(linePrice - lineCost),
  };
}

export function computePricing(input: PricingInput): PricingResult {
  const lines = input.lines.map(computePricingLine);

  const totalCost = roundMoney(lines.reduce((s, l) => s + l.lineCost, 0));
  const subtotalPrice = roundMoney(lines.reduce((s, l) => s + l.linePrice, 0));

  // A discount can never exceed the price — net (and therefore VAT/gross) floor at 0.
  const rawDiscount = roundMoney(subtotalPrice * clampNonNeg(input.discountPct));
  const discountAmount = Math.min(rawDiscount, subtotalPrice);
  const netAfterDiscount = roundMoney(subtotalPrice - discountAmount);

  const profit = roundMoney(netAfterDiscount - totalCost);
  const marginPct = netAfterDiscount > 0 ? profit / netAfterDiscount : 0;

  const vatAmount = roundMoney(netAfterDiscount * clampNonNeg(input.vatRate));
  const totalGross = roundMoney(netAfterDiscount + vatAmount);
  const depositDue = roundMoney(totalGross * Math.min(clampNonNeg(input.depositPct), 1));

  return {
    lines,
    totalCost,
    subtotalPrice,
    discountAmount,
    netAfterDiscount,
    marginPct,
    profit,
    vatAmount,
    totalGross,
    depositDue,
  };
}
