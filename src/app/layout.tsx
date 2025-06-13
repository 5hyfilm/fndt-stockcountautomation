// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F&N Barcode Scanner",
  description: "ระบบตรวจจับและอ่าน barcode แบบ real-time",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "F&N Barcode Scanner",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#000000",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* Additional meta tags for better mobile experience */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-title" content="FN Scanner" />
      </head>
      <body>{children}</body>
    </html>
  );
}
