import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PricingCalculator from "@/components/pricing/PricingCalculator";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          Pricing calculator
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Build a costed estimate: enter cost lines and a markup to see price,
          margin, VAT, and the deposit due.
        </Typography>
      </Box>
      <PricingCalculator />
    </Box>
  );
}
