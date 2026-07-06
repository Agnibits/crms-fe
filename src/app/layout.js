import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: {
    default: "AgniBits CRM — Sales Automation Platform",
    template: "%s | AgniBits CRM",
  },
  description:
    "Enterprise CRM and Sales Automation platform — manage customers, leads, deals, invoices and more.",
  keywords: ["CRM", "Sales Automation", "Leads", "Deals", "Invoices", "SaaS"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
