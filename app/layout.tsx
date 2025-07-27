import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs';
import NavbarClient from "../components/B-components/nav/navbar-server";
import StyledComponentsRegistry from '../lib/registry';
import AlertProvider from '../components/B-components/alert/AlertContext';
import Providers from '../components/B-components/historybar/Providers';
import HistoryBar from '../components/B-components/historybar/HistoryBar';
import UserActivityTracker from '../components/B-components/historybar/UserActivityTracker';
import ConditionalFooter from '../components/B-components/footer/ConditionalFooter';
import LoaderWrapper from '../components/B-components/loader/LoaderWrapper';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Finder - Discover Amazing AI Tools",
  description: "Find and explore the best AI tools across all categories. Your ultimate directory for artificial intelligence applications and tools.",
  robots: "index, follow",
  openGraph: {
    title: "AI Finder - Discover Amazing AI Tools",
    description: "Find and explore the best AI tools across all categories. Your ultimate directory for artificial intelligence applications and tools.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Finder - Discover Amazing AI Tools",
    description: "Find and explore the best AI tools across all categories. Your ultimate directory for artificial intelligence applications and tools.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
          card: 'bg-white shadow-lg',
          headerTitle: 'text-black',
          headerSubtitle: 'text-gray-600',
        },
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <html lang="en">
        <body className={inter.variable}>
          <StyledComponentsRegistry>
            <AlertProvider>
              <Providers>
                <LoaderWrapper>
                  <UserActivityTracker />
                  <NavbarClient />
                  <main style={{ paddingBottom: '0px' }}>
                    {children}
                  </main>
                  <ConditionalFooter />
                  <HistoryBar />
                </LoaderWrapper>
              </Providers>
            </AlertProvider>
          </StyledComponentsRegistry>
        </body>
      </html>
    </ClerkProvider>
  );
}
