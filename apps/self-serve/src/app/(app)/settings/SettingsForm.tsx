"use client";

import {
  ACCENT_SWATCHES,
  FONT_STACKS,
  MARGIN_PATTERN_OPTIONS,
  RADIUS_PRESETS,
  STYLE_OPTIONS,
  cn,
} from "@hio/ui";
import { Button, Field, Select, Spinner, toastFromResult, useToast } from "@hio/ui/admin";
import { type FormEvent, useState, useTransition } from "react";
import { updateTheme } from "./actions";

export function SettingsForm({
  accent,
  font,
  radius,
  style,
  marginPattern,
}: {
  accent: string;
  font: string;
  radius: string;
  style: string;
  marginPattern: string;
}) {
  const [selectedAccent, setSelectedAccent] = useState(accent);
  const [selectedFont, setSelectedFont] = useState(font);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const [selectedStyle, setSelectedStyle] = useState(style);
  const [selectedMargin, setSelectedMargin] = useState(marginPattern);
  const [saved, setSaved] = useState({ accent, font, radius, style, marginPattern });
  const [pending, start] = useTransition();
  const toast = useToast();
  const dirty =
    selectedAccent !== saved.accent ||
    selectedFont !== saved.font ||
    selectedRadius !== saved.radius ||
    selectedStyle !== saved.style ||
    selectedMargin !== saved.marginPattern;
  // Margin patterns are drawn by the Warm Blueprint style only.
  const marginApplies = selectedStyle === "warm-blueprint-brutalism";

  // Called directly (not via useActionState): the action returns null on
  // success, which useActionState can't distinguish from its initial state —
  // and the toast needs to fire on every save, not just the first.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateTheme(null, formData);
      const t = toastFromResult(res ?? { ok: true }, "Site look saved — it's live on your page.");
      if (t) toast(t);
      if (!res || !("error" in res)) {
        setSaved({
          accent: selectedAccent,
          font: selectedFont,
          radius: selectedRadius,
          style: selectedStyle,
          marginPattern: selectedMargin,
        });
      }
    });
  }

  const previewParams = new URLSearchParams({
    accent: selectedAccent,
    font: selectedFont,
    radius: selectedRadius,
    style: selectedStyle,
    marginPattern: selectedMargin,
  });

  return (
    <div className="flex flex-wrap gap-8">
      <form onSubmit={onSubmit} className="flex w-full max-w-[420px] flex-col gap-4">
        <fieldset className="m-0 border-none p-0">
          <legend className="mb-1.5 text-xs font-medium">Accent color</legend>
          <div className="flex flex-wrap gap-2">
            {ACCENT_SWATCHES.map((s) => (
              <label key={s.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="accent"
                  value={s.value}
                  checked={selectedAccent === s.value}
                  onChange={() => setSelectedAccent(s.value)}
                  className="peer sr-only"
                />
                <span className="sr-only">{s.name}</span>
                <span
                  aria-hidden="true"
                  title={s.name}
                  className={cn(
                    "block size-8 rounded-full ring-1 ring-border peer-focus-visible:ring-2 peer-focus-visible:ring-foreground peer-focus-visible:ring-offset-2",
                    selectedAccent === s.value && "ring-2 ring-primary ring-offset-2",
                  )}
                  style={{ background: s.value }}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Font">
          <Select
            name="font"
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
          >
            {FONT_STACKS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Rounding" hint="How rounded buttons and cards are.">
          <Select
            name="radius"
            value={selectedRadius}
            onChange={(e) => setSelectedRadius(e.target.value)}
          >
            {RADIUS_PRESETS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Page style" hint="The overall look: lines, type and colours of your page.">
          <Select
            name="style"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            {STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Margin pattern"
          hint={
            marginApplies
              ? "A faint texture in the margins around your page."
              : "Only shown with the Warm Blueprint page style."
          }
        >
          <Select
            name="marginPattern"
            disabled={!marginApplies}
            value={selectedMargin}
            onChange={(e) => setSelectedMargin(e.target.value)}
          >
            {MARGIN_PATTERN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        {/* A disabled select isn't submitted; keep the stored value. */}
        {!marginApplies && <input type="hidden" name="marginPattern" value={selectedMargin} />}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? <Spinner label="Saving…" /> : "Save changes"}
          </Button>
          <span aria-live="polite" className="text-muted-foreground text-xs">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </span>
        </div>
      </form>

      <div className="min-w-[320px] flex-[1_1_380px]">
        <p className="mb-2 text-xs text-muted-foreground">
          Preview with sample content — updates as you change a control, before you save.
        </p>
        <iframe
          title="Site look preview"
          src={`/settings/preview?${previewParams.toString()}`}
          className="h-[520px] w-full rounded-xl border border-border"
        />
      </div>
    </div>
  );
}
