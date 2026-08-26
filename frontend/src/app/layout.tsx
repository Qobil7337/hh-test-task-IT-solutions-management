import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kobil · Backend Developer",
    template: "%s · CharityHub",
  },
  description:
    "Digital business card of Kobil, Backend Developer, and the CharityHub demo platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              CharityHub
            </Link>
            <div className="flex gap-6 text-sm text-zinc-600">
              <Link href="/" className="hover:text-zinc-900">
                About
              </Link>
              <Link href="/campaigns" className="hover:text-zinc-900">
                Campaigns
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-zinc-500">
            <span>Built by Kobil · NestJS · GraphQL · Prisma · Next.js</span>
            <a
              href="https://github.com/Qobil7337"
              className="hover:text-zinc-900"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
