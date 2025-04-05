import type { Metadata } from "next";
import NavBar from "../components/NavBar";

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
        <>
            <NavBar />
            {children}
        </>
    );
}
