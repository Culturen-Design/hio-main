import { MODULE_BUNDLES } from "@hio/content-model";
import { z } from "zod";

/** The schema_variant bundles a client may be assigned — the keys of the
 *  content-model registry's `MODULE_BUNDLES`. New bundles (additive content-model
 *  changes) appear here automatically. */
export const SCHEMA_VARIANTS = Object.keys(MODULE_BUNDLES) as [string, ...string[]];

const slug = z
  .string()
  .min(1, "Slug is required")
  .max(63, "Slug is too long")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only");

/** Input for creating a Studio client (the New-client form). */
export const newClientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  slug,
  schema_variant: z.enum(SCHEMA_VARIANTS),
});
export type NewClientInput = z.infer<typeof newClientSchema>;

/** Input for editing a client's settings (name + bundle). */
export const updateClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  schema_variant: z.enum(SCHEMA_VARIANTS),
});
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
