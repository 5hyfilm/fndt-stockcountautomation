import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ป้องกันไม่ให้ build หยุดเมื่อมี TypeScript errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // ป้องกันไม่ให้ build หยุดเมื่อมี ESLint errors
    ignoreDuringBuilds: false,
  },
  // ปิด Turbopack เพื่อแก้ปัญหา TypeScript API routes
  // experimental: {
  //   turbo: undefined,
  // },

  // การตั้งค่าสำหรับ API routes
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },

  // Headers สำหรับ CORS ถ้าจำเป็น
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
