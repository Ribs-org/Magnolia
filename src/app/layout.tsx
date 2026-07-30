import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans-body" });

export const metadata: Metadata = {
  title: {
    default: "Centro de Salud Magnolia | Psicología y Psiquiatría",
    template: "%s | Centro de Salud Magnolia",
  },
  description:
    "Centro de salud mental con atención presencial y online. Agenda tu hora de psicología o psiquiatría en línea.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={`${cormorant.variable} ${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
