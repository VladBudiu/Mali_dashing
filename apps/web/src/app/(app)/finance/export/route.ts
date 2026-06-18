import { resolveCurrentOrg } from "@/lib/org/membership";
import { listTransactions, type TransactionWithRefs } from "@/lib/finance/queries";
import { toCsvFile, type CsvColumn } from "@/lib/export/csv";

const COLUMNS: CsvColumn<TransactionWithRefs>[] = [
  { header: "Date", value: (t) => t.transaction_date },
  { header: "Type", value: (t) => t.type },
  { header: "Description", value: (t) => t.description },
  { header: "Category", value: (t) => t.expense_categories?.name ?? "" },
  { header: "Event", value: (t) => t.events?.title ?? "" },
  { header: "Currency", value: (t) => t.currency },
  { header: "Amount", value: (t) => t.amount },
  { header: "Amount RON", value: (t) => t.amount_ron ?? "" },
  { header: "Reference", value: (t) => t.reference_no ?? "" },
];

export async function GET() {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) {
    return new Response("Unauthorized", { status: 401 });
  }

  const transactions = await listTransactions(currentOrg.organizationId);
  const csv = toCsvFile(transactions, COLUMNS);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
