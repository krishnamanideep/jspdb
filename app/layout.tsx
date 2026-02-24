import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
    title: "JSP Dashboard",
    description: "Jana Sena Party — Analytics Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased" suppressHydrationWarning>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
