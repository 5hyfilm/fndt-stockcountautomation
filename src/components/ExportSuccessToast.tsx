// src/components/ExportSuccessToast.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, X, FileText } from "lucide-react";

interface ExportSuccessToastProps {
  show: boolean;
  onClose: () => void;
  fileName?: string;
  itemCount?: number;
}

export const ExportSuccessToast: React.FC<ExportSuccessToastProps> = ({
  show,
  onClose,
  fileName,
  itemCount,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 rounded-full p-1">
            <CheckCircle className="text-green-600" size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 mb-1">
              ส่งออกข้อมูลสำเร็จ!
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-1">
                <FileText size={12} />
                <span>{fileName || "FN_Stock_Inventory.csv"}</span>
              </div>
              {itemCount && <div>จำนวน {itemCount} รายการ</div>}
              <div className="text-green-600">✓ ไฟล์ถูกดาวน์โหลดแล้ว</div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
