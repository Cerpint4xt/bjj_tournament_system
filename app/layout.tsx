import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BJJ Scoreboard",
  description: "BJJ Tournament Scoring System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
