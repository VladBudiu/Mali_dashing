import { NextResponse } from "next/server";
import { APP_NAME } from "@mali/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: APP_NAME,
  });
}
