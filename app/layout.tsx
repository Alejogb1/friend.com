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
