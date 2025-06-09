// src/components/BarcodeUnitDisplay.tsx
"use client";

import React from "react";
import { Package2, Box, Boxes, AlertCircle } from "lucide-react";

interface BarcodeInfo {
  ea?: string; // Each unit
  dsp?: string; // Display pack
  cs?: string; // Case/Carton
  primary: string; // Primary barcode for display
  scannedType?: "ea" | "dsp" | "cs"; // Which barcode was scanned
}

interface BarcodeUnitDisplayProps {
  barcodes: BarcodeInfo;
  scannedBarcode: string;
}

const UNIT_CONFIG = {
  ea: {
    label: "ชิ้น (Each)",
    shortLabel: "EA",
    icon: Package2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "หน่วยผลิตภัณฑ์ต่อชิ้น",
  },
  dsp: {
    label: "แพ็ค (Display Pack)",
    shortLabel: "DSP",
    icon: Box,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "หน่วยแพ็คสำหรับจัดแสดง",
  },
  cs: {
    label: "ลัง (Case/Carton)",
    shortLabel: "CS",
    icon: Boxes,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "หน่วยลังหรือกล่องใหญ่",
  },
};

export const BarcodeUnitDisplay: React.FC<BarcodeUnitDisplayProps> = ({
  barcodes,
  scannedBarcode,
}) => {
  const scannedType = barcodes.scannedType;

  if (!scannedType) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle size={16} />
          <span className="text-sm">ไม่สามารถระบุหน่วยของบาร์โค้ดได้</span>
        </div>
      </div>
    );
  }

  const config = UNIT_CONFIG[scannedType];
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      {/* Scanned Unit Display */}
      <div
        className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-2`}
          >
            <Icon className={config.color} size={20} />
          </div>
          <div>
            <div className={`font-semibold ${config.color}`}>
              บาร์โค้ดหน่วย: {config.label}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {config.description}
            </div>
          </div>
        </div>

        <div className="bg-white rounded p-2 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">บาร์โค้ดที่สแกน:</div>
          <code className="text-sm font-mono text-gray-800 break-all">
            {scannedBarcode}
          </code>
        </div>
      </div>

      {/* All Available Barcodes */}
      {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Package2 size={16} />
          บาร์โค้ดทั้งหมดของสินค้านี้
        </h4>

        <div className="space-y-2">
          {(["ea", "dsp", "cs"] as const).map((type) => {
            const barcode = barcodes[type];
            const typeConfig = UNIT_CONFIG[type];
            const isScanned = type === scannedType;

            if (!barcode) return null;

            return (
              <div
                key={type}
                className={`flex items-center justify-between p-2 rounded border transition-all ${
                  isScanned
                    ? `${typeConfig.bgColor} ${typeConfig.borderColor} border-2`
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      isScanned
                        ? `${typeConfig.bgColor} ${typeConfig.color}`
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {typeConfig.shortLabel}
                  </span>
                  <span className="text-sm text-gray-700">
                    {typeConfig.label}
                  </span>
                  {isScanned && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✓ สแกนแล้ว
                    </span>
                  )}
                </div>

                <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {barcode}
                </code>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 สินค้าชิ้นเดียวกันสามารถมีบาร์โค้ดหลายแบบได้ ขึ้นอยู่กับหน่วยบรรจุ
        </div>
      </div> */}
    </div>
  );
};
