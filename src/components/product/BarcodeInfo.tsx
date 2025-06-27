// Path: src/components/product/BarcodeInfo.tsx
// Updated with enhanced barcode type detection support

"use client";

import React, { useState } from "react";
import {
  Hash,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
  Scan,
  Package,
  Package2,
  Archive,
} from "lucide-react";
import { Product, BarcodeType, BarcodeUtils } from "../../types/product";
import {
  ProductWithMultipleBarcodes,
  CSVUtils,
} from "../../data/types/csvTypes";

interface BarcodeInfoProps {
  product: Product | ProductWithMultipleBarcodes;
  scannedBarcode?: string; // The actual barcode that was scanned
  detectedBarcodeType?: BarcodeType | null;
  onCopyBarcode?: () => void;
  copied?: boolean;
}

export const BarcodeInfo: React.FC<BarcodeInfoProps> = ({
  product,
  scannedBarcode,
  detectedBarcodeType,
  onCopyBarcode,
  copied = false,
}) => {
  const [showAllBarcodes, setShowAllBarcodes] = useState(false);
  const [localCopied, setLocalCopied] = useState<string | null>(null);

  const productWithBarcodes = product as ProductWithMultipleBarcodes;

  // ✅ Get available barcode types
  const availableBarcodeTypes = productWithBarcodes.barcodes
    ? CSVUtils.getAvailableBarcodeTypes(productWithBarcodes)
    : [];

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

  // ✅ Copy barcode function
  const copyBarcode = async (barcode: string, type?: BarcodeType) => {
    try {
      await navigator.clipboard.writeText(barcode);
      setLocalCopied(barcode);

      console.log(
        `📋 Copied ${type ? `${type.toUpperCase()} ` : ""}barcode: ${barcode}`
      );

      // Reset copied state after 2 seconds
      setTimeout(() => setLocalCopied(null), 2000);

      // Call parent callback if provided
      onCopyBarcode?.();
    } catch (err) {
      console.error("Failed to copy barcode:", err);
    }
  };

  // ✅ Format barcode for display
  const formatBarcode = (barcode: string): string => {
    if (barcode.length === 13) {
      // EAN-13: 123-456-789-012-3
      return barcode.replace(
        /(\d{3})(\d{3})(\d{3})(\d{3})(\d{1})/,
        "$1-$2-$3-$4-$5"
      );
    } else if (barcode.length === 12) {
      // UPC-A: 123-456-789-012
      return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1-$2-$3-$4");
    } else if (barcode.length === 8) {
      // EAN-8: 1234-5678
      return barcode.replace(/(\d{4})(\d{4})/, "$1-$2");
    }
    // For other lengths, just show as is
    return barcode;
  };

  // ✅ Render barcode item
  const renderBarcodeItem = (
    barcode: string,
    type: BarcodeType,
    isScanned: boolean = false
  ) => {
    const config = getUnitConfig(type);
    const isCopied =
      localCopied === barcode || (copied && scannedBarcode === barcode);

    return (
      <div
        key={`${type}-${barcode}`}
        className={`
          p-3 rounded-lg border transition-all duration-200
          ${
            isScanned
              ? `${config.bgColor} ${config.borderColor} border-2`
              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* ✅ Unit Icon and Label */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isScanned ? config.bgColor : "bg-gray-200"
              }`}
            >
              {React.createElement(config.icon, {
                size: 16,
                className: isScanned ? config.color : "text-gray-500",
              })}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isScanned ? config.color : "text-gray-600"
                  }`}
                >
                  {type.toUpperCase()} - {config.label}
                </span>
                {isScanned && (
                  <div className="flex items-center gap-1 text-xs text-fn-green">
                    <Scan size={12} />
                    <span>สแกนแล้ว</span>
                  </div>
                )}
              </div>
              <div className="font-mono text-sm text-gray-900 mt-1">
                {formatBarcode(barcode)}
              </div>
            </div>
          </div>

          {/* ✅ Copy Button */}
          <button
            onClick={() => copyBarcode(barcode, type)}
            className={`
              p-1.5 rounded transition-colors
              ${
                isCopied
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }
            `}
            title={`คัดลอกบาร์โค้ด ${type.toUpperCase()}`}
          >
            {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ✅ Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash size={20} className="text-gray-500" />
          <h3 className="font-medium text-gray-900">ข้อมูลบาร์โค้ด</h3>
          {availableBarcodeTypes.length > 1 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {availableBarcodeTypes.length} หน่วย
            </span>
          )}
        </div>

        {/* ✅ Toggle View Button (if multiple barcodes) */}
        {availableBarcodeTypes.length > 1 && (
          <button
            onClick={() => setShowAllBarcodes(!showAllBarcodes)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showAllBarcodes ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAllBarcodes ? "ซ่อน" : "แสดงทั้งหมด"}</span>
          </button>
        )}
      </div>

      {/* ✅ Barcode Display */}
      <div className="space-y-3">
        {scannedBarcode && detectedBarcodeType ? (
          /* ✅ Show scanned barcode first (highlighted) */
          <>
            {renderBarcodeItem(scannedBarcode, detectedBarcodeType, true)}

            {/* ✅ Show other barcodes if requested */}
            {showAllBarcodes && (
              <>
                {availableBarcodeTypes
                  .filter((type) => type !== detectedBarcodeType)
                  .map((type) => {
                    const barcode = CSVUtils.getBarcodeByType(
                      productWithBarcodes,
                      type
                    );
                    return barcode
                      ? renderBarcodeItem(barcode, type, false)
                      : null;
                  })
                  .filter(Boolean)}
              </>
            )}
          </>
        ) : (
          /* ✅ Show all available barcodes if no detection */
          availableBarcodeTypes
            .map((type) => {
              const barcode = CSVUtils.getBarcodeByType(
                productWithBarcodes,
                type
              );
              return barcode ? renderBarcodeItem(barcode, type, false) : null;
            })
            .filter(Boolean)
        )}

        {/* ✅ Fallback: Show primary barcode if no specific barcodes */}
        {availableBarcodeTypes.length === 0 && product.barcode && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Hash size={16} className="text-gray-500" />
                </div>
                <div>
                  <span className="text-xs text-gray-600">บาร์โค้ดหลัก</span>
                  <div className="font-mono text-sm text-gray-900">
                    {formatBarcode(product.barcode)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyBarcode(product.barcode)}
                className={`
                  p-1.5 rounded transition-colors
                  ${
                    localCopied === product.barcode
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }
                `}
              >
                {localCopied === product.barcode ? (
                  <CheckCircle size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Barcode Information Footer */}
      {availableBarcodeTypes.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-start gap-2">
            <Scan size={14} className="text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">เกี่ยวกับบาร์โค้ด:</p>
              <ul className="space-y-1">
                <li>• แต่ละหน่วยมีบาร์โค้ดแยกกัน</li>
                <li>• สแกนบาร์โค้ดไหน จะเพิ่มในหน่วยนั้น</li>
                <li>• สแกนซ้ำเพื่อเพิ่มจำนวน</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Development Debug Panel */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              🔧 Debug: Barcode Info
            </summary>
            <div className="space-y-1 font-mono text-gray-600">
              <div>Scanned Barcode: {scannedBarcode || "None"}</div>
              <div>Detected Type: {detectedBarcodeType || "None"}</div>
              <div>Available Types: [{availableBarcodeTypes.join(", ")}]</div>
              <div>Primary Barcode: {product.barcode}</div>
              <div>Show All: {showAllBarcodes.toString()}</div>
              <div>Local Copied: {localCopied || "None"}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
