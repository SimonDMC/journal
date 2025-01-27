import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import ToastProvider from "@/components/toast-provider/ToastProvider";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    title: "Journal",
    description: "Until I can preserve my memories indefinitely, this will have to do.",
    openGraph: {
        title: "Journal",
        description: "Until I can preserve my memories indefinitely, this will have to do.",
        url: "https://journal.simondmc.com",
    },
    icons: {
        icon: "/favicon.png",
        apple: "/maskable.png",
    },
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="stylesheet" href="https://rsms.me/inter/inter.css"></link>
            </head>
            <body>
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}
