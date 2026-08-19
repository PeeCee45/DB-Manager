import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "DB Manager",
  description: "Modern MySQL/MariaDB Database Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}


