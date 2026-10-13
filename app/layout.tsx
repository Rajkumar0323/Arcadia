import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/pwa";
import { NavProgress } from "@/components/nav-progress";
import { APP_NAME } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Play, learn, win`, template: `%s · ${APP_NAME}` },
  description: "Join clubs, play arcade challenges, climb leaderboards and win course discounts.",
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#06050d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#8b5cf6", colorBackground: "#0c0a1a", borderRadius: "0.9rem" },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <NavProgress />
          {children}
          <Toaster theme="dark" position="top-center" richColors closeButton />
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
