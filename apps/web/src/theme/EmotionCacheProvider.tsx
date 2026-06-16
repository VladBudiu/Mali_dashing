"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import type { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

const STYLE_CACHE_KEY = "mui";

/**
 * Collects Emotion-generated CSS during SSR and flushes it into the document
 * head before any markup that depends on it, following the Next.js App Router
 * CSS-in-JS registry pattern.
 */
export default function EmotionCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [registry] = useState(() => {
    const cache: EmotionCache = createCache({ key: STYLE_CACHE_KEY });
    cache.compat = true;

    const previousInsert = cache.insert.bind(cache);
    let insertedNames: string[] = [];

    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        insertedNames.push(serialized.name);
      }
      return previousInsert(...args);
    };

    const flush = () => {
      const flushed = insertedNames;
      insertedNames = [];
      return flushed;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) {
      return null;
    }

    let styles = "";
    for (const name of names) {
      styles += registry.cache.inserted[name];
    }

    return (
      <style
        data-emotion={`${registry.cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}
