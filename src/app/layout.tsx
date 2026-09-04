import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SMF - Enquêtes de satisfaction",
    description: "Plateforme de gestion des enquêtes de la MUGEF-CI",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={`${inter.className} h-full antialiased bg-gray-50`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}