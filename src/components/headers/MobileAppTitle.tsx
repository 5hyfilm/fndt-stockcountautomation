// src/components/headers/MobileAppTitle.tsx
"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import Image from "next/image";

export const MobileAppTitle: React.FC = () => {
  return (
    <div className="px-3 py-2 flex items-center justify-center gap-2">
      <div className="bg-gray-100 rounded-lg p-1.5">
        <Image
          src="/fn-logo.png"
          alt="F&N Logo"
          width={24}
          height={24}
          className="w-6 h-6 object-contain"
          priority
        />
      </div>
      <div className="text-center">
        <h1 className="text-sm font-bold flex items-center gap-1">
          <span className="fn-gradient-text">เช็ค Stock</span>
          <Sparkles className="fn-red" size={14} />
        </h1>
      </div>
    </div>
  );
};
