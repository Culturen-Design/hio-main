/**
 * @hio/ui/admin — the admin-side design system (dashboard, console, builder
 * chrome, settings) for both apps. Separate subpath so the public-renderer
 * barrel (`@hio/ui`) stays free of `"use client"` modules. Anything here may
 * assume an authed, desktop-first admin context — never import it from a
 * public site route.
 */
export { AdminShell, navLinkClasses } from "./AdminShell";
export { Badge, type BadgeTone } from "./Badge";
export {
  type BuilderActionResult,
  BuilderCanvas,
  type BuilderSection,
} from "./builder/BuilderCanvas";
export { ChatPanel, type SendOutcome } from "./builder/ChatPanel";
export { buildSuggestions } from "./builder/suggestions";
export { Button, type ButtonSize, type ButtonVariant, buttonClasses } from "./Button";
export { Card, CardTitle } from "./Card";
export { ConfirmDialog } from "./ConfirmDialog";
export { CopyField } from "./CopyField";
export { Container, type ContainerSize } from "./Container";
export { Field, Input, Select, Textarea } from "./Field";
export { PageHeader } from "./PageHeader";
export { Spinner } from "./Spinner";
export { ToastProvider, useToast } from "./toast/Toast";
export {
  type ToastDescriptor,
  type ToastKind,
  toastFromResult,
} from "./toast/toastResult";
