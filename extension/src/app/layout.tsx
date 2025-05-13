import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FortiSafe Extension",
  description: "A browser extension built with Next.js",
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
