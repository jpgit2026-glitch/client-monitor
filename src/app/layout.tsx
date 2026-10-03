import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/session";
import NavBar from "./nav-bar";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "JPG Monitoring",
  description: "Internal client work monitoring for accounting and liaison staff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        {session && <NavBar name={session.name} role={session.role} />}
        <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
