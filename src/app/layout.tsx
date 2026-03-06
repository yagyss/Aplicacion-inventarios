import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "Stokly — El Cerebro Financiero para el Retail de Moda",
  description: "Plataforma de inteligencia financiera para optimizar inventario, ROI real y unit economics en el retail de moda.",
  keywords: ["inventario", "moda", "retail", "ROI", "finanzas", "POS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
