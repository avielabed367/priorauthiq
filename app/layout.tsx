import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriorAuthIQ | Front-End Denial-Risk Review",
  description:
    "Fake-data demo for billing/admin teams to review sample cases, catch eligibility, authorization, documentation, coding, coverage, and follow-up risks, and prepare next steps for human review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}