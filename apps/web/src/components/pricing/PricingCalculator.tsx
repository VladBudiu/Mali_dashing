"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import { computePricing, type PricingLineInput } from "@/lib/pricing/pricing";
import { formatMoney } from "@/lib/money/format";

type LineState = {
  description: string;
  quantity: string;
  unitCost: string;
  markupPct: string;
};

const emptyLine = (): LineState => ({
  description: "",
  quantity: "1",
  unitCost: "",
  markupPct: "30",
});

const num = (v: string): number => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export default function PricingCalculator() {
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);
  const [vatPct, setVatPct] = useState("0");
  const [discountPct, setDiscountPct] = useState("0");
  const [depositPct, setDepositPct] = useState("30");

  const result = useMemo(() => {
    const inputLines: PricingLineInput[] = lines.map((l) => ({
      description: l.description,
      quantity: num(l.quantity),
      unitCost: num(l.unitCost),
      markupPct: num(l.markupPct) / 100,
    }));
    return computePricing({
      lines: inputLines,
      vatRate: num(vatPct) / 100,
      discountPct: num(discountPct) / 100,
      depositPct: num(depositPct) / 100,
    });
  }, [lines, vatPct, discountPct, depositPct]);

  const updateLine = (i: number, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const marginColor =
    result.marginPct < 0
      ? "error.main"
      : result.marginPct < 0.15
        ? "warning.main"
        : "success.main";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Lines */}
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180 }}>Description</TableCell>
              <TableCell align="right" sx={{ width: 90 }}>Qty</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Unit cost</TableCell>
              <TableCell align="right" sx={{ width: 110 }}>Markup %</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Unit price</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Line price</TableCell>
              <TableCell padding="none" />
            </TableRow>
          </TableHead>
          <TableBody>
            {result.lines.map((computed, i) => (
              <TableRow key={i}>
                <TableCell>
                  <TextField
                    variant="standard"
                    fullWidth
                    placeholder="e.g. Aranjament floral masă"
                    value={lines[i]?.description ?? ""}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    type="number"
                    value={lines[i]?.quantity ?? ""}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    type="number"
                    value={lines[i]?.unitCost ?? ""}
                    onChange={(e) => updateLine(i, { unitCost: e.target.value })}
                    slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    type="number"
                    value={lines[i]?.markupPct ?? ""}
                    onChange={(e) => updateLine(i, { markupPct: e.target.value })}
                    slotProps={{ htmlInput: { step: "1", style: { textAlign: "right" } } }}
                  />
                </TableCell>
                <TableCell align="right">{formatMoney(computed.unitPrice)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatMoney(computed.linePrice)}
                </TableCell>
                <TableCell padding="none">
                  <IconButton
                    size="small"
                    aria-label="Remove line"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box>
        <Button variant="outlined" size="small" onClick={addLine}>
          Add line
        </Button>
      </Box>

      {/* Rate controls */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="VAT %"
          type="number"
          value={vatPct}
          onChange={(e) => setVatPct(e.target.value)}
          sx={{ width: 140 }}
          slotProps={{ htmlInput: { min: 0, step: "1" } }}
          helperText="0 if non-payer"
        />
        <TextField
          label="Discount %"
          type="number"
          value={discountPct}
          onChange={(e) => setDiscountPct(e.target.value)}
          sx={{ width: 140 }}
          slotProps={{ htmlInput: { min: 0, step: "1" } }}
        />
        <TextField
          label="Deposit %"
          type="number"
          value={depositPct}
          onChange={(e) => setDepositPct(e.target.value)}
          sx={{ width: 140 }}
          slotProps={{ htmlInput: { min: 0, step: "1" } }}
          helperText="Of gross total"
        />
      </Box>

      <Divider />

      {/* Summary */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <SummaryCard label="Total cost" value={formatMoney(result.totalCost)} />
        <SummaryCard label="Net price" value={formatMoney(result.netAfterDiscount)} />
        <SummaryCard
          label="Profit"
          value={formatMoney(result.profit)}
          color={result.profit < 0 ? "error.main" : "success.main"}
        />
        <SummaryCard
          label="Margin"
          value={`${(result.marginPct * 100).toFixed(1)}%`}
          color={marginColor}
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, maxWidth: 420 }}>
        <Row label="Subtotal (price)" value={formatMoney(result.subtotalPrice)} />
        {result.discountAmount > 0 && (
          <Row label="Discount" value={`− ${formatMoney(result.discountAmount)}`} />
        )}
        <Row label="Net after discount" value={formatMoney(result.netAfterDiscount)} />
        <Row label={`VAT (${num(vatPct)}%)`} value={formatMoney(result.vatAmount)} />
        <Divider sx={{ my: 1 }} />
        <Row label="Total (gross)" value={formatMoney(result.totalGross)} bold />
        <Row label={`Deposit due (${num(depositPct)}%)`} value={formatMoney(result.depositDue)} />
      </Paper>

      <Typography variant="caption" color="text.secondary">
        This is a quick estimate tool. Saving as a quote on an event is a later step.
      </Typography>
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card sx={{ flex: 1, minWidth: 150 }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }} color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>
        {value}
      </Typography>
    </Box>
  );
}
