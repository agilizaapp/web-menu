import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Web Menu - Sistema de Pedidos",
  description: "Plataforma de Restaurantes White-Label - Sistema de Pedidos Multi-Tenant Mobile-First",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Web Menu",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="preload"
          as="video"
          href="/videos/delivery-app-loading.mp4"
          type="video/mp4"
        />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <PWAInstallPrompt />
        <Toaster position="top-right" richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('SW registrado:', registration.scope))
                    .catch(err => console.log('SW falhou:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
