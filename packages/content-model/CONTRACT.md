# `@hio/content-model` — the frozen seam (v1.1.0)

This package is **the pluggable seam** between the two products and the one engine.
`@hio/ai-engine` and both apps depend on the contract defined here. As of the **M3
seam-freeze** (2026-06-20, `@hio/content-model@1.0.0`) this contract is **stable**:
Studio (M4) builds on it without it churning. **v1.1.0** (M4.2, 2026-06-21) adds the
per-tenant provider resolver (`MODULE_REGISTRY` + `resolveProvider`/`resolveVariant`)
— an **additive, minor** change that grows the seam without touching the frozen surface
(see [change protocol](#change-protocol-the-freeze-is-social--documentary)).

> Freeze ratified by the M3 gate: the `SchemaProvider` / `ModuleDefinition` /
> `AiToolDescriptor` contract is good enough for Studio to resolve a provider
> **per client** (provider + allowed modules + per-client tools) with **zero engine
> code change**. Proven by `packages/ai-engine/src/contract.test.ts`.

## What "frozen" means

Freeze the **shapes, not the instances.** The whole point of the seam is that
providers and modules grow — that growth is _not_ a contract change.

### 🔒 Frozen surface — changing it is a breaking change (see protocol)
- `SchemaProvider` — `{ id, modules, getModule(type), allTools() }`
- `ModuleDefinition<T>` — `{ type, label, contentSchema, defaults, width, aiTools }`
- `AiToolDescriptor` — `{ name, description, inputSchema, moduleType, op }`
- `AiToolOp` — the `appendItem | updateItem | removeItem` interpreter semantics the
  engine applies. Adding a **new op kind** is additive (minor); changing an existing
  one's fields/meaning is breaking.
- `createSchemaProvider(id, modules)` and its enforced invariants (below).
- The engine's consumption contract in `@hio/ai-engine`: `buildClaudeTools`,
  `validateToolInput`, `executeTool`, the `SectionStore` port, `PROTECTED_FIELDS`,
  and the built-in `update_module_content` tool (name reserved via
  `RESERVED_TOOL_NAMES`).

### 🌱 Not frozen — expected to grow (this _is_ the pluggability)
- The **set of modules** and concrete content schemas (adding `services`, `contact`,
  `gallery`, `testimonial`, …). New modules are additive, not contract changes.
- Concrete **providers**: `selfServeSchema` is one instance; Studio adds one per client.
- Per-module `defaults`, `width`, descriptions, and `aiTools` lists.
- **Provider resolution (added v1.1.0, M4.2):** `MODULE_REGISTRY` (the registry of built
  modules, keyed by `ModuleType`), `MODULE_BUNDLES` (named module sets keyed by a tenant's
  `schema_variant`), and `resolveProvider(id, enabledTypes)` / `resolveVariant(id, variant)`
  which build a per-tenant `SchemaProvider` over `createSchemaProvider`. These are
  **resolution helpers above** the frozen surface — they produce a `SchemaProvider`, they
  do not change its shape. Registering a new module or adding a new bundle/variant is
  additive growth, not a contract change. **Storage decision (M4.2):** a tenant's enabled
  module set is its `tenants.schema_variant` (a named bundle), not a per-tenant column — a
  granular `enabled_modules` override stays a future *additive* option.

## Enforced invariants

`createSchemaProvider` fails loudly at construction (never at request time) if:
1. two modules share a `type`,
2. two AI tools share a `name`, or
3. a tool name collides with a reserved engine tool (`RESERVED_TOOL_NAMES`).

A malformed provider therefore can't reach the engine, where a name collision
would otherwise resolve silently last-wins.

## Deliberate boundaries (decided at the M3 gate, 2026-06-20)

- **Module-type space is CLOSED.** `ModuleType` is the fixed `MODULE_TYPES` union
  (mirrored by the DB `module_type` enum). Products pick from it; **`custom` is the
  escape hatch** for bespoke content. Opening the space to arbitrary per-client types
  is a deferred **M4+** decision (it would also reshape the DB enum).
- **Theme is OUT of scope.** This package is presentation-free — content + AI
  capabilities only. `StyleVariant` and all styling live in `@hio/ui`, resolved next
  to the active provider. A provider carries **no** theme field.
- **"Allowed modules" = `provider.modules`.** The provider's module list is the
  authority on what exists. _Enforcement_ is per-product: Self-Serve gates by tier via
  DB RLS (`allowed_module_types()`); Studio (M4) gates per client via its per-client
  provider plus the forthcoming tenancy RLS.

## How the engine consumes the seam

`@hio/ai-engine` is product-agnostic. It is handed a `SchemaProvider` and:
1. `buildClaudeTools(provider)` → the built-in `update_module_content` + one Claude
   tool per `AiToolDescriptor` (JSON Schema generated from each `inputSchema`).
2. `validateToolInput(provider, name, input)` → server-side Zod validation.
3. `executeTool(...)` → interprets the descriptor's `op` against the section content,
   re-validates against the module's `contentSchema`, and persists via `SectionStore`.

The engine **never hard-codes module types.** Self-Serve passes `selfServeSchema`;
Studio passes a per-client provider. Same engine, different tools.

## Change protocol (the freeze is social + documentary)

There is no automated gate that can judge "is this contract change OK" — protection
is the rule below + the deviation log.

1. **Additive change** (new module, new op kind, new optional field): allowed; bump the
   **minor** version. Keep `contract.test.ts` green.
2. **Breaking change** to any 🔒 item: **stop and propose it** (what + why) for a human
   decision per `CLAUDE.md` rule 6, log a dated entry in
   [`docs/ROADMAP.md`](../../docs/ROADMAP.md) Deviation log, bump the **major** version,
   and update this file.
3. `contract.test.ts` is the regression guard for the freeze. If a change makes it fail,
   that is the signal you are touching the frozen surface — go to step 2.

### Change log

- **v1.4.0 — 2026-06-22 (M2 widening, additive/minor).** Built the `gallery` and `testimonial`
  modules, both **collection** modules. `gallery` (`galleryImageSchema`/`gallerySchema`) is an
  image-URL grid with `add_image`/`update_image`/`remove_image` (users paste hosted URLs — no upload
  pipeline; Supabase Storage upload is a future enhancement). `testimonial`
  (`testimonialItemSchema`/`testimonialSchema`) is a quote list with
  `add_testimonial`/`update_testimonial`/`remove_testimonial`. Both registered in `MODULE_REGISTRY` and
  added to the `self-serve` bundle (paid-gated by RLS). Only `custom` remains unbuilt. No 🔒 frozen item
  changed; `contract.test.ts` stays green.
- **v1.3.0 — 2026-06-22 (M2 widening, additive/minor).** Built the `services` module
  (`serviceItemSchema` + `servicesSchema` + `ServicesContent` + `servicesModule`), a **collection**
  module with `add_service`/`update_service`/`remove_service` AI tools (the append/update/remove ops,
  same pattern as `calendar`). Registered in `MODULE_REGISTRY` and added to the `self-serve` bundle
  (paid-gated by RLS, like `calendar`). No 🔒 frozen item changed; `contract.test.ts` stays green.
- **v1.2.0 — 2026-06-22 (M2 widening, additive/minor).** Built the `contact` module
  (`contactSchema` + `ContactContent` + `contactModule`), registered it in `MODULE_REGISTRY`,
  and added it to the `self-serve` bundle — closing the free-tier gap (the DB
  `allowed_module_types()` gate lists `contact` as free, but it had no module). No 🔒 frozen
  item changed; `contact` is a plain-text module edited by the built-in `update_module_content`
  tool (no new AI tools). `contract.test.ts` stays green.
- **v1.1.0 — 2026-06-21 (M4.2, additive/minor).** Added the per-tenant provider resolver:
  `MODULE_REGISTRY`, `MODULE_BUNDLES`, `resolveProvider(id, enabledTypes)`, and
  `resolveVariant(id, variant)`. No 🔒 frozen item changed — these build a `SchemaProvider`
  over the unchanged `createSchemaProvider`. `contract.test.ts` stays green; new coverage in
  `content-model`'s `index.test.ts` proves a resolved provider exposes only the enabled
  modules' tools. `selfServeSchema` is now expressed via the registry/bundle (same module set).
- **v1.0.0 — 2026-06-20 (M3 seam-freeze).** Initial frozen surface.
