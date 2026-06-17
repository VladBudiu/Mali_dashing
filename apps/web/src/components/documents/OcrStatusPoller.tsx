"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Props = {
  pollIntervalMs?: number;
};

export function OcrStatusPoller({ pollIntervalMs = 5000 }: Props) {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return null;
}
