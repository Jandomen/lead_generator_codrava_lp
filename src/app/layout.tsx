import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "CODRAVA LP | Gestión de Leads Inteligente",
    description: "Plataforma avanzada para la gestión de leads y pipeline de ventas.",
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-100 selection:text-blue-900`}
            >
                {children}
            </body>
        </html>
    );
}
