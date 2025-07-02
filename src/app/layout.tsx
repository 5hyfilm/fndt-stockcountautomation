// Path: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F&N Barcode Scanner",
  description: "ระบบตรวจจับและอ่าน barcode แบบ real-time",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // เปลี่ยนจาก "black-translucent" เป็น "default"
    title: "F&N Scanner",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#ffffff", // เปลี่ยนเป็นสีขาวเพื่อให้เข้ากับ header
    "apple-mobile-web-app-status-bar-style": "default",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "contain", // เปลี่ยนจาก "cover" เป็น "contain"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* PWA links */}
        <link rel="manifest" href="/manifest.json" />

        {/* Meta tags สำหรับ status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="F&N Scanner" />

        {/* Theme color สำหรับแต่ละแพลตฟอร์ม */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-navbutton-color" content="#ffffff" />

        {/* Icons */}
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/fn-barcode-scanner-192.png"
        />
        <link rel="apple-touch-icon" href="/fn-barcode-scanner-180.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/fn-barcode-scanner-180.png"
        />

        {/* Additional meta tags for better mobile experience */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
