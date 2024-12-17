import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import CharacterInitializer from "./provider";
import { Analytics } from "@vercel/analytics/react"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Friend.com (Clone)",
  description: "Built by rasmic.xyz",
  openGraph: {
    images: ["https://utfs.io/f/MD2AM9SEY8GusoZaKaevuCV1WfxmhwDrsQaPgcjknYTZlLRB"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider dynamic>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <CharacterInitializer>
            {children}
            <Analytics />
          </CharacterInitializer>
        </body>
      </ClerkProvider>
    </html>
  );
}
