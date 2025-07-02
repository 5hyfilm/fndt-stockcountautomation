// Path: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F&N Barcode Scanner",
  description: "ระบบตรวจจับและอ่าน barcode แบบ real-time",
  appleWebApp: {
    capable: true,
    // ✅ FIX: เปลี่ยน status bar style ให้ไม่ทับ
    statusBarStyle: "default", // เปลี่ยนจาก "black-translucent" เป็น "default"
    title: "F&N Scanner",
  },
  other: {
    "mobile-web-app-capable": "yes",
    // ✅ FIX: เปลี่ยน theme color ให้ตรงกับ header
    "theme-color": "#ffffff", // เปลี่ยนเป็นสีขาวเพื่อให้เข้ากับ header
    // ✅ เพิ่ม meta tags สำหรับ status bar
    "apple-mobile-web-app-status-bar-style": "default",
  },
  // ✅ เพิ่ม manifest link
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  // ✅ FIX: เปลี่ยน viewport fit
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
        {/* ✅ เพิ่ม PWA links */}
        <link rel="manifest" href="/manifest.json" />

        {/* ✅ FIX: เพิ่ม meta tags สำหรับ status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="F&N Scanner" />

        {/* ✅ เพิ่ม theme color สำหรับแต่ละแพลตฟอร์ม */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-navbutton-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/fn-barcode-scanner-192.png"
        />

        {/* ✅ เพิ่ม Apple touch icons */}
        <link rel="apple-touch-icon" href="/fn-barcode-scanner-180.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/fn-barcode-scanner-180.png"
        />

        {/* Additional meta tags for better mobile experience */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* ✅ เพิ่ม CSS สำหรับ safe area */}
        <style jsx>{`
          :root {
            /* ✅ กำหนด CSS custom properties สำหรับ safe area */
            --safe-area-inset-top: env(safe-area-inset-top, 0px);
            --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
            --safe-area-inset-left: env(safe-area-inset-left, 0px);
            --safe-area-inset-right: env(safe-area-inset-right, 0px);
          }

          body {
            /* ✅ เพิ่ม padding สำหรับ safe area */
            padding-top: var(--safe-area-inset-top);
            padding-left: var(--safe-area-inset-left);
            padding-right: var(--safe-area-inset-right);
            /* ไม่ใส่ bottom padding เพราะจะทำให้ content สูงเกิน */
          }

          /* ✅ สำหรับ full screen mode (camera) */
          .fullscreen-mode {
            padding: 0 !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
