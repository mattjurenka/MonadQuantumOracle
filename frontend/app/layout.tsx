"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { monadTestnet } from "viem/chains"
import { PrivyProvider } from '@privy-io/react-auth';


const queryClient = new QueryClient()


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProvider appId={"cmlr9f3r3001j0cla2s9wuocq"} config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets"
            }
          },
          appearance: { walletChainType: "ethereum-only" },
          supportedChains: [ monadTestnet ]
        }}>
           {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
