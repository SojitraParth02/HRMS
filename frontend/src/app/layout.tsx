import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../providers/AppProviders";

export const metadata: Metadata = {
  title: "HRMS - Human Resource Management System",
  description: "Enterprise HRMS Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
