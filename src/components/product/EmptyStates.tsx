// Path: src/components/product/EmptyStates.tsx
// Updated with barcode type detection support

"use client";

import React from "react";
import {
  Loader2,
  AlertCircle,
  Scan,
  Copy,
  CheckCircle,
  Package2,
  Package,
  Archive,
  SearchX,
  QrCode,
} from "lucide-react";
import { BarcodeType } from "../../types/product";

// ✅ Enhanced interface for error states
interface ErrorStateProps {
  error: string;
  barcode?: string;
  detectedBarcodeType?: BarcodeType | null;
}

interface ProductNotFoundStateProps {
  barcode?: string;
  detectedBarcodeType?: BarcodeType | null;
  onCopyBarcode?: () => void;
  copied?: boolean;
}

interface LoadingStateProps {
  message?: string;
}

interface WaitingScanStateProps {
  message?: string;
  showInstructions?: boolean;
}

// ✅ Get unit configuration
const getUnitConfig = (type: BarcodeType) => {
  const configs = {
    [BarcodeType.EA]: {
      icon: Package2,
      label: "ชิ้น",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    [BarcodeType.DSP]: {
      icon: Package,
      label: "แพ็ค",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    [BarcodeType.CS]: {
      icon: Archive,
      label: "ลัง",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  };
  return configs[type];
};

// ✅ Format barcode for display
const formatBarcode = (barcode: string): string => {
  if (barcode.length === 13) {
    return barcode.replace(
      /(\d{3})(\d{3})(\d{3})(\d{3})(\d{1})/,
      "$1-$2-$3-$4-$5"
    );
  } else if (barcode.length === 12) {
    return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1-$2-$3-$4");
  } else if (barcode.length === 8) {
    return barcode.replace(/(\d{4})(\d{4})/, "$1-$2");
  }
  return barcode;
};

// ✅ Loading State
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "กำลังโหลดข้อมูลสินค้า...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-fn-green/10 rounded-full flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 text-fn-green animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">กำลังโหลด</h3>
      <p className="text-gray-500 max-w-md">{message}</p>
    </div>
  );
};

// ✅ Enhanced Error State with barcode type support
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  barcode,
  detectedBarcodeType,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
      <p className="text-red-600 mb-4 max-w-md">{error}</p>

      {/* ✅ Show scanned barcode info if available */}
      {barcode && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-w-sm w-full">
          <div className="flex items-center gap-3">
            {detectedBarcodeType ? (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  getUnitConfig(detectedBarcodeType).bgColor
                }`}
              >
                {React.createElement(getUnitConfig(detectedBarcodeType).icon, {
                  size: 16,
                  className: getUnitConfig(detectedBarcodeType).color,
                })}
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <QrCode size={16} className="text-gray-500" />
              </div>
            )}

            <div className="flex-1 text-left">
              <div className="text-xs text-gray-600">
                บาร์โค้ดที่สแกน
                {detectedBarcodeType && (
                  <span className="ml-1 text-xs font-medium">
                    ({detectedBarcodeType.toUpperCase()})
                  </span>
                )}
              </div>
              <div className="font-mono text-sm text-gray-900">
                {formatBarcode(barcode)}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        ลองสแกนบาร์โค้ดใหม่ หรือตรวจสอบการเชื่อมต่อ
      </p>
    </div>
  );
};

// ✅ Enhanced Product Not Found State
export const ProductNotFoundState: React.FC<ProductNotFoundStateProps> = ({
  barcode,
  detectedBarcodeType,
  onCopyBarcode,
  copied = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-orange-600" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        ไม่พบข้อมูลสินค้า
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">
        ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้ในระบบ
      </p>

      {/* ✅ Enhanced barcode display with type detection */}
      {barcode && (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 max-w-sm w-full mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {detectedBarcodeType ? (
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    getUnitConfig(detectedBarcodeType).bgColor
                  }`}
                >
                  {React.createElement(
                    getUnitConfig(detectedBarcodeType).icon,
                    {
                      size: 16,
                      className: getUnitConfig(detectedBarcodeType).color,
                    }
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode size={16} className="text-gray-500" />
                </div>
              )}

              <div className="text-left">
                <div className="text-xs text-gray-600">
                  บาร์โค้ดที่สแกน
                  {detectedBarcodeType && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                        getUnitConfig(detectedBarcodeType).bgColor
                      } ${getUnitConfig(detectedBarcodeType).color}`}
                    >
                      {detectedBarcodeType.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="font-mono text-sm text-gray-900">
                  {formatBarcode(barcode)}
                </div>
              </div>
            </div>

            {/* ✅ Copy button */}
            {onCopyBarcode && (
              <button
                onClick={onCopyBarcode}
                className={`p-2 rounded transition-colors ${
                  copied
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title="คัดลอกบาร์โค้ด"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ Suggestions */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
            <Scan size={14} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              แนวทางแก้ไข:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• ตรวจสอบว่าบาร์โค้ดชัดเจน</li>
              <li>• ลองสแกนใหม่ในแสงที่เพียงพอ</li>
              <li>• ตรวจสอบว่าเป็นสินค้าในระบบ</li>
              {detectedBarcodeType && (
                <li>
                  • ลองสแกนบาร์โค้ด {detectedBarcodeType.toUpperCase()} อื่นๆ
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Enhanced Waiting Scan State
export const WaitingScanState: React.FC<WaitingScanStateProps> = ({
  message = "เตรียมพร้อมสแกนบาร์โค้ด",
  showInstructions = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Scan className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-500 mb-6 max-w-md">
        กดปุ่มเริ่มสแกนเพื่อเปิดกล้องและสแกนบาร์โค้ดสินค้า
      </p>

      {/* ✅ Instructions */}
      {showInstructions && (
        <div className="bg-gradient-to-r from-fn-green/5 to-green-50 rounded-lg p-4 border border-green-200 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-fn-green/10 rounded-lg flex items-center justify-center mt-0.5">
              <QrCode size={14} className="text-fn-green" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-fn-green mb-2">
                ประเภทบาร์โค้ดที่รองรับ:
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Package2 size={12} className="text-blue-600" />
                  <span className="text-blue-600 font-medium">EA</span>
                  <span className="text-gray-600">- บาร์โค้ดชิ้น</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Package size={12} className="text-green-600" />
                  <span className="text-green-600 font-medium">DSP</span>
                  <span className="text-gray-600">- บาร์โค้ดแพ็ค</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Archive size={12} className="text-purple-600" />
                  <span className="text-purple-600 font-medium">CS</span>
                  <span className="text-gray-600">- บาร์โค้ดลัง</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
