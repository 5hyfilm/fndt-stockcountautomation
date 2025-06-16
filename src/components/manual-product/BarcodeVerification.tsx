// src/components/manual-product/BarcodeVerification.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Search,
  Copy,
  Eye,
  EyeOff,
  Info,
  Clock,
  Database,
} from "lucide-react";

// ===== INTERFACES =====
interface BarcodeVerificationResult {
  isValid: boolean;
  isUnique: boolean;
  format: string;
  suggestions?: string[];
  existingProduct?: {
    materialCode: string;
    description: string;
    barcodeType: "ea" | "dsp" | "cs";
  };
  warnings?: string[];
}

interface BarcodeVerificationProps {
  barcode: string;
  barcodeType: "ea" | "dsp" | "cs";
  onVerificationComplete: (result: BarcodeVerificationResult) => void;
  onBarcodeChange?: (newBarcode: string) => void;
  isEditable?: boolean;
  autoVerify?: boolean;
  className?: string;
}

interface VerificationStatusProps {
  result: BarcodeVerificationResult | null;
  isLoading: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
}

interface BarcodeInputProps {
  barcode: string;
  onBarcodeChange: (barcode: string) => void;
  onVerify: () => void;
  isEditable: boolean;
  isLoading: boolean;
  error?: string;
}

// ===== BARCODE VALIDATION UTILITIES =====
const BARCODE_FORMATS = {
  UPC_A: { length: 12, pattern: /^\d{12}$/, name: "UPC-A" },
  EAN_13: { length: 13, pattern: /^\d{13}$/, name: "EAN-13" },
  EAN_8: { length: 8, pattern: /^\d{8}$/, name: "EAN-8" },
  CODE_128: { length: [6, 20], pattern: /^[\d\w]+$/, name: "Code 128" },
  ITF_14: { length: 14, pattern: /^\d{14}$/, name: "ITF-14" },
};

const validateBarcodeFormat = (
  barcode: string
): {
  isValid: boolean;
  format: string;
  warnings: string[];
} => {
  const cleaned = barcode.replace(/[^0-9A-Za-z]/g, "");
  const warnings: string[] = [];

  if (cleaned !== barcode) {
    warnings.push("Barcode มีอักขระพิเศษ จะถูกล้างออกโดยอัตโนมัติ");
  }

  // Check each format
  for (const [key, format] of Object.entries(BARCODE_FORMATS)) {
    if (Array.isArray(format.length)) {
      if (
        cleaned.length >= format.length[0] &&
        cleaned.length <= format.length[1] &&
        format.pattern.test(cleaned)
      ) {
        return { isValid: true, format: format.name, warnings };
      }
    } else {
      if (cleaned.length === format.length && format.pattern.test(cleaned)) {
        return { isValid: true, format: format.name, warnings };
      }
    }
  }

  return {
    isValid: false,
    format: "ไม่รู้จักรูปแบบ",
    warnings: [...warnings, "รูปแบบ barcode ไม่ถูกต้อง"],
  };
};

// Mock API calls (ในการใช้งานจริงจะเชื่อมต่อกับ backend)
const checkBarcodeUniqueness = async (
  barcode: string,
  barcodeType: "ea" | "dsp" | "cs"
): Promise<{
  isUnique: boolean;
  existingProduct?: any;
}> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock data - ในการใช้งานจริงจะเรียก API
  const mockExistingProducts = [
    {
      barcode: "8850999320113",
      materialCode: "F123456",
      description: "Bear Brand Sterilized Milk",
      barcodeType: "ea",
    },
    {
      barcode: "8850999320120",
      materialCode: "F123457",
      description: "Bear Brand Gold",
      barcodeType: "dsp",
    },
  ];

  const existing = mockExistingProducts.find(
    (p) => p.barcode === barcode && p.barcodeType === barcodeType
  );

  return {
    isUnique: !existing,
    existingProduct: existing,
  };
};

// ===== SUB-COMPONENTS =====
const BarcodeInput: React.FC<BarcodeInputProps> = ({
  barcode,
  onBarcodeChange,
  onVerify,
  isEditable,
  isLoading,
  error,
}) => {
  const [showBarcode, setShowBarcode] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(barcode);
      // Could add toast notification here
    } catch (err) {
      console.error("Failed to copy barcode:", err);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Shield className="w-4 h-4" />
        <span>Barcode ที่ต้องการตรวจสอบ</span>
      </label>

      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type={showBarcode ? "text" : "password"}
            value={barcode}
            onChange={(e) => onBarcodeChange(e.target.value)}
            readOnly={!isEditable}
            className={`w-full px-3 py-2 pr-20 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? "border-red-300" : "border-gray-300"
            } ${!isEditable ? "bg-gray-50" : ""}`}
            placeholder="8850999320113"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
            <button
              type="button"
              onClick={() => setShowBarcode(!showBarcode)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={showBarcode ? "ซ่อน barcode" : "แสดง barcode"}
            >
              {showBarcode ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="คัดลอก barcode"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onVerify}
          disabled={isLoading || !barcode.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{isLoading ? "ตรวจสอบ..." : "ตรวจสอบ"}</span>
        </button>
      </div>

      {error && (
        <p className="flex items-center space-x-1 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

const VerificationStatus: React.FC<VerificationStatusProps> = ({
  result,
  isLoading,
  showDetails,
  onToggleDetails,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">กำลังตรวจสอบ...</p>
          <p className="text-xs text-gray-500">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <Info className="w-6 h-6 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">พร้อมตรวจสอบ</p>
          <p className="text-xs text-gray-500">
            กดปุ่ม "ตรวจสอบ" เพื่อเริ่มต้น
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!result.isValid) return "border-red-300 bg-red-50";
    if (!result.isUnique) return "border-yellow-300 bg-yellow-50";
    return "border-green-300 bg-green-50";
  };

  const getStatusIcon = () => {
    if (!result.isValid) return <X className="w-6 h-6 text-red-600" />;
    if (!result.isUnique)
      return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    return <Check className="w-6 h-6 text-green-600" />;
  };

  const getStatusMessage = () => {
    if (!result.isValid) return "Barcode ไม่ถูกต้อง";
    if (!result.isUnique) return "Barcode นี้มีในระบบแล้ว";
    return "Barcode ใช้ได้";
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">
              {getStatusMessage()}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              รูปแบบ: {result.format}
            </p>

            {/* Existing Product Alert */}
            {result.existingProduct && (
              <div className="mt-3 p-3 bg-white border border-yellow-200 rounded">
                <p className="text-xs font-medium text-yellow-800 mb-1">
                  พบสินค้าที่ใช้ barcode นี้แล้ว:
                </p>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>
                    <strong>รหัส:</strong> {result.existingProduct.materialCode}
                  </p>
                  <p>
                    <strong>ชื่อ:</strong> {result.existingProduct.description}
                  </p>
                  <p>
                    <strong>ประเภท:</strong>{" "}
                    {result.existingProduct.barcodeType.toUpperCase()}
                  </p>
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.warnings.map((warning, index) => (
                  <p
                    key={index}
                    className="text-xs text-yellow-700 flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>{warning}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onToggleDetails}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {showDetails ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
        </button>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-700">สถานะการตรวจสอบ</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-center space-x-2">
                  {result.isValid ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <X className="w-3 h-3 text-red-600" />
                  )}
                  <span>รูปแบบถูกต้อง</span>
                </div>
                <div className="flex items-center space-x-2">
                  {result.isUnique ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <X className="w-3 h-3 text-red-600" />
                  )}
                  <span>ไม่ซ้ำในระบบ</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium text-gray-700">ข้อมูลเพิ่มเติม</p>
              <div className="mt-1 space-y-1 text-gray-600">
                <p>รูปแบบ: {result.format}</p>
                <p>ความยาว: {result.isValid ? "ถูกต้อง" : "ไม่ถูกต้อง"}</p>
                <p className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    ตรวจสอบเมื่อ: {new Date().toLocaleTimeString("th-TH")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div>
              <p className="font-medium text-gray-700 text-xs mb-2">
                แนะนำ barcode ที่คล้ายกัน
              </p>
              <div className="flex flex-wrap gap-1">
                {result.suggestions.map((suggestion, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded font-mono"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== MAIN COMPONENT =====
const BarcodeVerification: React.FC<BarcodeVerificationProps> = ({
  barcode,
  barcodeType,
  onVerificationComplete,
  onBarcodeChange,
  isEditable = false,
  autoVerify = true,
  className = "",
}) => {
  const [currentBarcode, setCurrentBarcode] = useState(barcode);
  const [verificationResult, setVerificationResult] =
    useState<BarcodeVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  // Handle barcode verification
  const handleVerification = async () => {
    if (!currentBarcode.trim()) {
      setError("กรุณาระบุ barcode");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Step 1: Validate format
      const formatValidation = validateBarcodeFormat(currentBarcode);

      if (!formatValidation.isValid) {
        const result: BarcodeVerificationResult = {
          isValid: false,
          isUnique: false,
          format: formatValidation.format,
          warnings: formatValidation.warnings,
        };

        setVerificationResult(result);
        onVerificationComplete(result);
        return;
      }

      // Step 2: Check uniqueness
      const uniquenessCheck = await checkBarcodeUniqueness(
        currentBarcode,
        barcodeType
      );

      const result: BarcodeVerificationResult = {
        isValid: true,
        isUnique: uniquenessCheck.isUnique,
        format: formatValidation.format,
        existingProduct: uniquenessCheck.existingProduct,
        warnings: formatValidation.warnings,
      };

      setVerificationResult(result);
      onVerificationComplete(result);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่");
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle barcode change
  const handleBarcodeChange = (newBarcode: string) => {
    setCurrentBarcode(newBarcode);
    onBarcodeChange?.(newBarcode);
    setVerificationResult(null);
    setError("");
  };

  // Auto verify when barcode changes
  useEffect(() => {
    if (autoVerify && currentBarcode && currentBarcode !== barcode) {
      const timeoutId = setTimeout(() => {
        handleVerification();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [currentBarcode, barcodeType, autoVerify]);

  // Update internal state when props change
  useEffect(() => {
    if (barcode !== currentBarcode) {
      setCurrentBarcode(barcode);
      setVerificationResult(null);
    }
  }, [barcode]);

  return (
    <div className={`space-y-4 ${className}`}>
      <BarcodeInput
        barcode={currentBarcode}
        onBarcodeChange={handleBarcodeChange}
        onVerify={handleVerification}
        isEditable={isEditable}
        isLoading={isLoading}
        error={error}
      />

      <VerificationStatus
        result={verificationResult}
        isLoading={isLoading}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
      />

      {/* Database Info */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Database className="w-3 h-3" />
        <span>
          ตรวจสอบกับฐานข้อมูลสินค้า {barcodeType.toUpperCase()} ล่าสุด
        </span>
      </div>
    </div>
  );
};

export default BarcodeVerification;

// ===== EXPORT TYPES =====
export type { BarcodeVerificationProps, BarcodeVerificationResult };
