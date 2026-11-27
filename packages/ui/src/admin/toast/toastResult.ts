export type ToastKind = "success" | "error";

export type ToastDescriptor = { kind: ToastKind; message: string };

/**
 * Maps the repo-wide server-action result shape — `{ error: string }` on
 * failure, anything else (usually `{ ok: true }`) on success — to a toast.
 * Pure so it's testable without React; `null`/`undefined` (useActionState's
 * initial state) yields no toast.
 */
export function toastFromResult(
  result: { error: string } | Record<string, unknown> | null | undefined,
  successMessage: string,
): ToastDescriptor | null {
  if (result == null) return null;
  if ("error" in result && typeof result.error === "string") {
    return { kind: "error", message: result.error };
  }
  return { kind: "success", message: successMessage };
}
