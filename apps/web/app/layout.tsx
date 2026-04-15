import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travel Insurance Ops Portal",
  description: "Internal policy operations portal",
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
