import type { Metadata, Viewport } from "next";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maestro Kaizen - Aprendizaje Adaptativo",
  description:
    "PWA offline-first de aprendizaje acelerado, andamiaje pedagógico y tutoría socrática impulsada por IA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maestro Kaizen",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="application-name" content="Maestro Kaizen" />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
