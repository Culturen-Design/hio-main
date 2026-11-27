"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  type ResolvedTheme,
  THEME_PREVIEW_MESSAGE,
  curatedTheme,
  sitePageProps,
} from "../../theme";

/**
 * The page inside a Site look preview frame. It starts from the theme in the
 * URL, then follows the form: the form posts each change as a message, so the
 * preview restyles in place instead of reloading. Only messages from this
 * same origin are read, and every value goes through `curatedTheme`, so the
 * frame can only ever show a look the picker could produce.
 */
export function LiveSitePage({
  initial,
  children,
}: {
  initial: ResolvedTheme;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: unknown; theme?: unknown } | null;
      if (data?.type !== THEME_PREVIEW_MESSAGE) return;
      setTheme(curatedTheme(data.theme));
    };
    window.addEventListener("message", onMessage);
    // Tell the form the frame is listening, so it can send the latest state
    // (changes made while the frame was still loading).
    window.parent?.postMessage({ type: `${THEME_PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const { className, style } = sitePageProps(theme);
  return (
    <main className={className} style={style}>
      {children}
    </main>
  );
}
