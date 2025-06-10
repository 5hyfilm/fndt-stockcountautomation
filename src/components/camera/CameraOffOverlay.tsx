// src/components/camera/CameraOffOverlay.tsx
"use client";

import React from "react";
import { VideoOff, Play } from "lucide-react";

export const CameraOffOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-100/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center max-w-sm mx-auto p-6">
        <div className="bg-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-300 shadow-sm">
          <VideoOff className="text-gray-500" size={32} />
        </div>

        <h3 className="text-gray-700 text-lg font-medium mb-2">
          กล้องไม่ได้เปิดใช้งาน
        </h3>

        <p className="text-gray-500 text-sm mb-4">
          กดปุ่ม "เริ่ม" เพื่อเปิดกล้องและเริ่มสแกนบาร์โค้ด
        </p>

        {/* Visual Guide */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 inline-block">
          <div className="flex items-center gap-2 text-fn-green">
            <Play size={16} />
            <span className="text-sm font-medium">พร้อมสแกน</span>
          </div>
        </div>
      </div>
    </div>
  );
};
