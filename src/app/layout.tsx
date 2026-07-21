import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Magnolia — Centro de Salud Mental", template: "%s | Magnolia" },
  description: "Psicólogos y psiquiatras. Agenda tu hora online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={`${fraunces.variable} ${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
