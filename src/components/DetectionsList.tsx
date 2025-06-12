// ./src/components/DetectionsList.tsx
"use client";

import React from "react";
import { QrCode, Copy, CheckCircle, Search } from "lucide-react";

interface DetectionsListProps {
  lastDetectedCode: string;
}

export const DetectionsList: React.FC<DetectionsListProps> = ({
  lastDetectedCode,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    if (!lastDetectedCode) return;

    try {
      await navigator.clipboard.writeText(lastDetectedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers - removed unused 'err' parameter
      const textArea = document.createElement("textarea");
      textArea.value = lastDetectedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
        <QrCode className="fn-green" size={20} />
        ผลลัพธ์การสแกน
      </h3>

      {lastDetectedCode ? (
        <div className="space-y-4">
          {/* Code Display */}
          <div
            className="bg-gradient-to-r from-green-50 to-green-100 border border-fn-green/30 rounded-lg p-4 cursor-pointer hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-sm"
            onClick={copyToClipboard}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="fn-green text-sm font-medium">
                🎯 Barcode Data
              </span>
              <div className="flex items-center gap-1 text-xs fn-green">
                {copied ? (
                  <>
                    <CheckCircle size={12} />
                    คัดลอกแล้ว!
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    คลิกคัดลอก
                  </>
                )}
              </div>
            </div>

            <div className="font-mono text-lg font-bold text-gray-900 break-all">
              {lastDetectedCode}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              ความยาว: {lastDetectedCode.length} ตัวอักษร
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-fn-green text-white rounded-lg hover:bg-fn-green/90 transition-colors duration-200 text-sm font-medium"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? "คัดลอกแล้ว!" : "คัดลอกบาร์โค้ด"}
            </button>

            <button
              onClick={() => {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                  lastDetectedCode
                )}`;
                window.open(searchUrl, "_blank");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              <Search size={16} />
              ค้นหาใน Google
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <QrCode size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg">ยังไม่มีข้อมูลบาร์โค้ด</p>
          <p className="text-sm mt-1">สแกนบาร์โค้ดเพื่อแสดงผลลัพธ์</p>
        </div>
      )}
    </div>
  );
};
