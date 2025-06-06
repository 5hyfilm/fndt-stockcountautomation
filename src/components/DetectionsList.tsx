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
    } catch (err) {
      // Fallback for older browsers
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
                    คลิกเพื่อคัดลอก
                  </>
                )}
              </div>
            </div>

            <code className="text-gray-800 text-sm lg:text-base font-mono break-all block leading-relaxed bg-white/80 rounded p-2 border border-gray-200">
              {lastDetectedCode}
            </code>

            <div className="mt-2 text-xs text-gray-600">
              {lastDetectedCode.length} ตัวอักษร
            </div>
          </div>

          {/* Success Indicator */}
          <div className="bg-fn-green/10 border border-fn-green/30 rounded-lg p-3 text-center">
            <div className="fn-green text-sm font-medium mb-1">
              ✅ สแกนสำเร็จ
            </div>
            <div className="text-xs text-gray-600">
              ระบบพบและอ่านบาร์โค้ดได้แล้ว
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 border border-gray-200">
            <Search className="text-gray-500" size={32} />
          </div>
          <p className="text-gray-700 text-sm lg:text-base mb-1">
            ยังไม่พบบาร์โค้ด
          </p>
          <p className="text-gray-500 text-xs">
            วางบาร์โค้ดในกรอบกล้องเพื่อเริ่มสแกน
          </p>
        </div>
      )}
    </div>
  );
};
