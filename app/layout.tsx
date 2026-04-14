import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "GBC Analytics — Дашборд заказов",
  description: "Мини-дашборд заказов: RetailCRM → Supabase → Vercel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <header className="app-header">
          <div className="header-inner">
            <h1>GBC Analytics</h1>
            <span className="header-subtitle">Дашборд заказов</span>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
