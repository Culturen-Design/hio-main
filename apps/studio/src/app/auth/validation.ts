import { z } from "zod";

/**
 * Login credentials for Studio team members. Studio is login-only — agency staff
 * are provisioned auth users (no public signup), so there is no weaker variant.
 */
export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;
