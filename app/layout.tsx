import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/components/provider";
import { ErrorBoundary } from 'react-error-boundary';


function ErrorFallback({error}:any) {

  console.error("Layout Error:", error);

  return <div>Error: {error.message}</div>

}
export const metadata: Metadata = {
  title: "FRIEND.COM CLONE",
  description: "A less weird FRIEND.COM. Built by rasmic.xyz",
  openGraph: {
    images: ["https://utfs.io/f/MD2AM9SEY8Gu0M2nNSoxuSJ9ba17ZAls2qn06UEWkzfxOYjD"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased`}>
        <ClerkProvider>
          <Provider>
            {children}
            <Analytics />
          </Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
