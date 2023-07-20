import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <title>Journal</title>
                <meta content="Journal" property="og:title" />
                <meta content="You keep your experiences here" property="og:description" />
                <meta content="You keep your experiences here" name="description" />
                <meta content="https://journal.simondmc.com" property="og:url" />
                <meta content="#000000" data-react-helmet="true" name="theme-color" />
                <link rel="apple-touch-icon" href="maskable.png" />
                <meta name="viewport" content="width=device-width, user-scalable=no" />
                <link rel="icon" href="favicon.png" />
                <link rel="manifest" href="manifest.json" />
            </head>
            <body>{children}</body>
        </html>
    );
}
