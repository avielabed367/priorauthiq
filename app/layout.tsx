import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriorAuthIQ | Pre-Visit Readiness & Exception Management",
  description:
    "Fake-data demo for benefits verification, authorization readiness, payer evidence, and exception management. Human review required.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
