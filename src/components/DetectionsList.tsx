"use client";

import React from "react";
import { Target, Search } from "lucide-react";
import { Detection } from "../types/detection";

interface DetectionsListProps {
  detections: Detection[];
}

export const DetectionsList: React.FC<DetectionsListProps> = ({
  detections,
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-2xl border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="text-blue-400" size={20} />
        รายการที่ตรวจพบ ({detections.length})
      </h3>

      {detections.length > 0 ? (
        <div className="space-y-2 max-h-40 lg:max-h-48 overflow-y-auto custom-scrollbar">
          {detections.map((detection, index) => (
            <div
              key={index}
              className="bg-gray-700/80 rounded-lg p-3 border border-gray-600/50 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-400 text-sm lg:text-base font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Barcode #{index + 1}
                </span>
                <span className="text-white bg-green-600 px-2 py-1 rounded text-xs font-mono">
                  {(detection.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <span>
                    X: {detection.xmin.toFixed(0)}-{detection.xmax.toFixed(0)}
                  </span>
                  <span>
                    Y: {detection.ymin.toFixed(0)}-{detection.ymax.toFixed(0)}
                  </span>
                </div>
                <div className="mt-1 text-gray-500">
                  ขนาด: {(detection.xmax - detection.xmin).toFixed(0)} ×{" "}
                  {(detection.ymax - detection.ymin).toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Search className="text-gray-500" size={32} />
          </div>
          <p className="text-gray-400 text-sm lg:text-base mb-1">
            ยังไม่พบ barcode
          </p>
          <p className="text-gray-500 text-xs">
            วางบาร์โค้ดในกรอบกล้องเพื่อเริ่มตรวจจับ
          </p>
        </div>
      )}
    </div>
  );
};
