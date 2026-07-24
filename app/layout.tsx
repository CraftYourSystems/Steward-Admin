import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";

console.log("[DIAGNOSTIC] app/layout.tsx module loaded");

export const metadata: Metadata = {
  title: "Steward — Restaurant Operating System",
  description: "Modern admin dashboard for restaurant operating system and management",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("[DIAGNOSTIC] app/layout.tsx component rendering");
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
