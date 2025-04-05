import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { config as fontAwesomeConfig } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faLegal, faLock } from '@fortawesome/free-solid-svg-icons'
//import { faGithub } from '@fortawesome/free-brands-svg-icons'

import '@fortawesome/fontawesome-svg-core/styles.css'
fontAwesomeConfig.autoAddCss = false

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="pt-3 mb-6 border-t border-t-black/[.065] dark:border-t-white/[.08] row-start-3 flex gap-[24px] flex-wrap items-center justify-center font-[family-name:var(--font-geist-sans)]">
          <a
            className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faBook} color="#505254" className="fa-fw" />
            Aprender
          </a>
          <a
            className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faLegal} color="#505254" className="fa-fw" />
            Términos y Condiciones
          </a>
          <a
            className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faLock} color="#505254" className="fa-fw" />
            Privacidad
          </a>
        </footer>
      </body>
    </html>
  );
}
