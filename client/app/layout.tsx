"use client";

import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apollo-client";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={client}>
          {children}
          <Toaster />
        </ApolloProvider>
      </body>
    </html>
  );
}