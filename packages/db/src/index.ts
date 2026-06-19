/**
 * @hio/db — shared Supabase database types (generated from the dev project).
 *
 * Regenerate after a migration with `npm run db:types`. Apps create their own
 * request-scoped clients (SSR cookie handling) in apps/<app>/src/lib/supabase/*,
 * parameterized by the `Database` type exported here.
 */
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./database.types";
export { Constants } from "./database.types";
