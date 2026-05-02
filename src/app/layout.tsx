import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FenceFlow — Fencing CRM",
  description: "Fencing company client onboarding, proposals, and CRM integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
