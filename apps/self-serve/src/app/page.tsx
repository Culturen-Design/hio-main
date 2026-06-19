import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{ fontFamily: "system-ui", padding: "4rem 1.5rem", maxWidth: 640, margin: "0 auto" }}
    >
      <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>hio</h1>
      <p style={{ color: "#6b7280", fontSize: "1.05rem" }}>
        Your page, built and edited by AI. Sign up to get your page in seconds.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <Link
          href="/signup"
          style={{
            padding: "0.7rem 1.2rem",
            borderRadius: 8,
            background: "#111827",
            color: "white",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Get started
        </Link>
        <Link
          href="/login"
          style={{
            padding: "0.7rem 1.2rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
