/**
 * @hio/db — shared Supabase client typing + database types.
 *
 * M2 brings over the schema (migrations 001-004 from exploration/hio-builder) and
 * the typed server/client factories. Apps still create their own request-scoped
 * clients (SSR cookie handling) in apps/<app>/src/lib/supabase/*.
 */
export type { Database } from "./database.types";
