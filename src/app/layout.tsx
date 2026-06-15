import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hio.space — AI Website Builder for SMBs",
  description: "Build your professional website in 60 seconds with AI. Perfect for salons, restaurants, plumbers, and every local business.",
  keywords: ["website builder", "AI", "small business", "SMB", "local business"],
  openGraph: {
    title: "hio.space — AI Website Builder for SMBs",
    description: "Build your professional website in 60 seconds with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
