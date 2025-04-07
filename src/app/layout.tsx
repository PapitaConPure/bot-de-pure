import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Footer from "../components/layout/Footer";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

fontAwesomeConfig.autoAddCss = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bot de Puré",
  description: "Sitio Oficial de Bot de Puré",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="./boticon.webp" as="image" />
      </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem>
            <div className={`flex min-h-screen font-sans`}>
              <div
                className={`min-h-full min-w-full bg-background text-foreground duration-300 transition-colors`}
              >
                {children}
                <Footer />
              </div>
            </div>
          </ThemeProvider>
        </body>
    </html>
  );
}
