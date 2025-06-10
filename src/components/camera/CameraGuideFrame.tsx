// src/components/camera/CameraGuideFrame.tsx
"use client";

import React from "react";
import { Target } from "lucide-react";

export const CameraGuideFrame: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-64 h-64 border-2 border-fn-green/70 rounded-lg">
        {/* Corner Markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-fn-green"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-fn-green"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-fn-green"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-fn-green"></div>

        {/* Center Target */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-fn-green/50">
            <Target size={24} />
          </div>
        </div>

        {/* Animated Scan Line */}
        <div className="absolute top-0 left-0 w-full overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-fn-green to-transparent animate-pulse"></div>
        </div>

        {/* Guide Text */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-xs text-fn-green/80 font-medium">
            วางบาร์โค้ดในกรอบ
          </p>
        </div>
      </div>
    </div>
  );
};
