import { redirect } from "next/navigation";

export default function Home() {
  // The dashboard handles the auth/staff gate (→ /login when signed out).
  redirect("/dashboard");
}
