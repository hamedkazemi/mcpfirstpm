import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MCP Project Manager",
  description: "A comprehensive project management application built with MCP",
  keywords: "project management, team collaboration, task tracking, MCP",
  authors: [{ name: "MCP Team" }],
  openGraph: {
    title: "MCP Project Manager",
    description: "Streamline your project management with powerful tools",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="modern" className={inter.variable}>
      <body className="min-h-screen bg-base-100 font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
