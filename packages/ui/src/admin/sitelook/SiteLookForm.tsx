"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { cn } from "../../cn";
import {
  ACCENT_SWATCHES,
  DEFAULT_THEME,
  FONT_STACKS,
  MARGIN_PATTERN_OPTIONS,
  PAGE_WIDTH_OPTIONS,
  PAPER_OPTIONS,
  RADIUS_PRESETS,
  type ResolvedTheme,
  STYLE_OPTIONS,
  THEME_PREVIEW_MESSAGE,
} from "../../theme";
import { Button } from "../Button";
import { Spinner } from "../Spinner";
import { useToast } from "../toast/Toast";
import { toastFromResult } from "../toast/toastResult";

type Key = keyof ResolvedTheme;

/** The theme keys that differ between two themes (empty = same look). */
export function changedKeys(a: ResolvedTheme, b: ResolvedTheme): Key[] {
  return (Object.keys(a) as Key[]).filter((k) => a[k] !== b[k]);
}

/** Why the margin pattern can't be used with these settings, if it can't. */
export function marginPatternBlocked(t: ResolvedTheme): string | null {
  if (t.pageWidth === "full") return "Full screen pages have no margin to fill.";
  if (t.style !== "warm-blueprint-brutalism") return "Only drawn by the Warm Blueprint style.";
  return null;
}

/** Share of the tile a page-width option's sheet takes, for its diagram. */
function sheetShare(margin: number): number {
  return margin < 0 ? 62 : 100 - 2 * margin;
}

const PATTERN_PREVIEW: Record<string, string> = {
  none: "none",
  pinstripe: "repeating-linear-gradient(90deg, #cbbfa8 0 1px, transparent 1px 6px)",
  "dot-grid": "radial-gradient(#cbbfa8 1px, transparent 1.5px) 0 0 / 8px 8px",
  "diagonal-hatch": "repeating-linear-gradient(45deg, #cbbfa8 0 1px, transparent 1px 6px)",
};

const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;

/**
 * The Site look editor, shared by Self-Serve's Settings and Studio's client
 * page. Controls are grouped (Layout, Colour, Type, Details) and shown as
 * pictures of what they do; the preview beside them renders the site at real
 * desktop width (scaled to fit) or phone width, and restyles in place on every
 * change. Nothing is saved until Save; Discard returns to the saved look,
 * Reset to default picks the defaults (still unsaved), and leaving with
 * unsaved changes asks first.
 */
export function SiteLookForm({
  initial,
  onSave,
  previewSrc,
  livePageHref,
  savedMessage = "Site look saved — it's live on your page.",
}: {
  initial: ResolvedTheme;
  onSave: (theme: ResolvedTheme) => Promise<{ error: string } | null>;
  /** The preview route; the starting theme is added as query parameters. */
  previewSrc: string;
  /** The published page, opened in a new tab. */
  livePageHref?: string;
  savedMessage?: string;
}) {
  const [theme, setTheme] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [pending, start] = useTransition();
  const toast = useToast();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const dirty = changedKeys(theme, saved).length > 0;
  const isDefault = changedKeys(theme, DEFAULT_THEME).length === 0;
  const set = <K extends Key>(k: K, v: ResolvedTheme[K]) => setTheme((t) => ({ ...t, [k]: v }));
  const patternBlocked = marginPatternBlocked(theme);

  // The frame loads once, from the starting theme; changes go by message.
  // biome-ignore lint/correctness/useExhaustiveDependencies: loading once is the point.
  const src = useMemo(() => {
    const sep = previewSrc.includes("?") ? "&" : "?";
    return `${previewSrc}${sep}${new URLSearchParams(initial).toString()}`;
  }, []);

  useEffect(() => {
    const send = () =>
      frameRef.current?.contentWindow?.postMessage(
        { type: THEME_PREVIEW_MESSAGE, theme },
        window.location.origin,
      );
    send();
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === `${THEME_PREVIEW_MESSAGE}:ready`)
        send();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [theme]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const virtualWidth = device === "desktop" ? DESKTOP_WIDTH : PHONE_WIDTH;
  const scale = box.width ? Math.min(1, box.width / virtualWidth) : 1;
  const frameStyle: CSSProperties = {
    width: virtualWidth,
    height: box.height ? box.height / scale : 600,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  function save() {
    const next = theme;
    start(async () => {
      const res = await onSave(next);
      const t = toastFromResult(res ?? { ok: true }, savedMessage);
      if (t) toast(t);
      if (!res) setSaved(next);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <form
        className="flex min-w-0 flex-col gap-7"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Group title="Layout">
          <Choice
            legend="Page width"
            hint="How much of the screen your page uses. Phones always use the full width."
            name="pageWidth"
            value={theme.pageWidth}
            onChange={(v) => set("pageWidth", v)}
            columns={3}
            options={PAGE_WIDTH_OPTIONS.map((o) => ({
              value: o.value,
              label: o.name,
              title: o.hint,
              visual: (
                <span className="flex h-9 w-full items-stretch justify-center rounded-sm bg-background px-0 py-1 ring-1 ring-border">
                  <span
                    className="rounded-[2px] bg-foreground/25"
                    style={{ width: `${sheetShare(o.margin)}%` }}
                  />
                </span>
              ),
            }))}
          />
          <Choice
            legend="Page style"
            hint="Lines, type and colours of the whole page."
            name="style"
            value={theme.style}
            onChange={(v) => set("style", v)}
            columns={2}
            options={STYLE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.name,
              title: o.hint,
              visual: (
                <span
                  className="flex h-12 w-full items-end justify-between rounded-sm px-2 pb-1.5"
                  style={{
                    background: o.swatch.paper,
                    color: o.swatch.ink,
                    boxShadow: `inset 0 0 0 1px ${o.swatch.line}`,
                    fontFamily: o.swatch.font,
                  }}
                >
                  <span className="text-lg leading-none">Aa</span>
                  <span className="h-px w-8" style={{ background: o.swatch.line }} />
                </span>
              ),
            }))}
          />
          <Choice
            legend="Margin pattern"
            hint={patternBlocked ?? "A faint texture in the margin around your page."}
            name="marginPattern"
            value={theme.marginPattern}
            onChange={(v) => set("marginPattern", v)}
            disabled={patternBlocked !== null}
            columns={4}
            options={MARGIN_PATTERN_OPTIONS.map((o) => ({
              value: o.value,
              label: o.value === "none" ? "None" : o.name.replace(" rules", ""),
              visual: (
                <span
                  className="block h-9 w-full rounded-sm bg-[#faf8f4] ring-1 ring-border"
                  style={{ background: `${PATTERN_PREVIEW[o.value] ?? "none"}, #faf8f4` }}
                />
              ),
            }))}
          />
        </Group>

        <Group title="Colour">
          <Swatches
            legend="Accent"
            hint="Buttons and highlights."
            name="accent"
            value={theme.accent}
            onChange={(v) => set("accent", v)}
            options={ACCENT_SWATCHES.map((s) => ({
              value: s.value,
              label: s.name,
              color: s.value,
            }))}
          />
          <Swatches
            legend="Paper"
            hint="The page background. Style default keeps the style's own paper."
            name="paper"
            value={theme.paper}
            onChange={(v) => set("paper", v)}
            options={PAPER_OPTIONS.map((p) => ({
              value: p.value,
              label: p.name,
              color:
                p.color ??
                STYLE_OPTIONS.find((s) => s.value === theme.style)?.swatch.paper ??
                "#ffffff",
            }))}
          />
        </Group>

        <Group title="Type">
          <Choice
            legend="Font"
            hint="Used for the text on your page. Warm Blueprint keeps its own heading type."
            name="font"
            value={theme.font}
            onChange={(v) => set("font", v)}
            columns={2}
            options={FONT_STACKS.map((f) => ({
              value: f.value,
              label: f.name.replace(" (default)", ""),
              visual: (
                <span className="block text-xl leading-none" style={{ fontFamily: f.value }}>
                  Aa Gg
                </span>
              ),
            }))}
          />
        </Group>

        <Group title="Details">
          <Choice
            legend="Rounding"
            hint="Corners of buttons and pictures. Sections always stay square so their lines meet."
            name="radius"
            value={theme.radius}
            onChange={(v) => set("radius", v)}
            columns={3}
            options={RADIUS_PRESETS.map((r) => ({
              value: r.value,
              label: r.name,
              visual: (
                <span className="flex h-9 w-full items-center justify-center gap-1.5">
                  <span
                    className="block h-6 w-6 bg-muted-foreground/40"
                    style={{ borderRadius: r.value === "sharp" ? 0 : r.value === "soft" ? 3 : 7 }}
                  />
                  <span
                    className="block h-4 w-10 bg-primary"
                    style={{
                      borderRadius: r.value === "sharp" ? 0 : r.value === "soft" ? 3 : 9999,
                    }}
                  />
                </span>
              ),
            }))}
          />
        </Group>

        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-2 border-t border-border bg-background px-1 py-3">
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? <Spinner label="Saving…" /> : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || !dirty}
            onClick={() => setTheme(saved)}
          >
            Discard
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || isDefault}
            onClick={() => setTheme(DEFAULT_THEME)}
            title="Pick the default look. You still need to save."
          >
            Reset to default
          </Button>
          <span aria-live="polite" className="basis-full text-xs text-muted-foreground">
            {dirty
              ? "Unsaved changes — the preview shows them, your page doesn't yet."
              : "All changes saved."}
          </span>
        </div>
      </form>

      <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <fieldset
            aria-label="Preview size"
            className="m-0 inline-flex rounded-lg border border-border p-0.5"
          >
            {(["desktop", "phone"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs",
                  device === d ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {d === "desktop" ? "Desktop" : "Phone"}
              </button>
            ))}
          </fieldset>
          {livePageHref ? (
            <a
              href={livePageHref}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Open your page ↗
            </a>
          ) : null}
        </div>
        <div
          className={cn(
            "mx-auto h-[min(70dvh,680px)] overflow-hidden rounded-xl border border-border bg-muted",
            device === "phone" && "max-w-[390px]",
          )}
        >
          <div ref={boxRef} className="h-full w-full">
            <iframe
              ref={frameRef}
              title="Site look preview"
              src={src}
              style={frameStyle}
              className="block border-0"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {device === "desktop"
            ? `Shown at ${DESKTOP_WIDTH}px wide, scaled to fit.`
            : `Shown at ${PHONE_WIDTH}px wide, like a phone.`}
        </p>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="m-0 border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice<V extends string>({
  legend,
  hint,
  name,
  value,
  onChange,
  options,
  columns,
  disabled = false,
}: {
  legend: string;
  hint?: string;
  name: string;
  value: V;
  onChange: (v: V) => void;
  options: Array<{ value: V; label: string; title?: string; visual: ReactNode }>;
  columns: 2 | 3 | 4;
  disabled?: boolean;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-0.5 p-0 text-xs font-medium">{legend}</legend>
      {hint ? <p className="mt-0 mb-2 text-xs text-muted-foreground">{hint}</p> : null}
      <div
        className={cn(
          "grid gap-2",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
          disabled && "opacity-50",
        )}
      >
        {options.map((o) => (
          <label
            key={o.value}
            title={o.title}
            className={cn("min-w-0", !disabled && "cursor-pointer")}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-1.5 text-center text-xs",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                value === o.value
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              {o.visual}
              <span className="truncate">{o.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Swatches<V extends string>({
  legend,
  hint,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  hint?: string;
  name: string;
  value: V;
  onChange: (v: V) => void;
  options: Array<{ value: V; label: string; color: string }>;
}) {
  const current = options.find((o) => o.value === value)?.label;
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-0.5 p-0 text-xs font-medium">
        {legend}
        {current ? <span className="font-normal text-muted-foreground"> · {current}</span> : null}
      </legend>
      {hint ? <p className="mt-0 mb-2 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer" title={o.label}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="sr-only">{o.label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "block size-8 rounded-full ring-1 ring-border",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-foreground peer-focus-visible:ring-offset-2",
                value === o.value && "ring-2 ring-primary ring-offset-2",
              )}
              style={{ background: o.color }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
