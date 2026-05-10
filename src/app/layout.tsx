import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holy Grail · Trading Dashboard",
  description: "Position-sizing & risk dashboard for systematic equity trading.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
