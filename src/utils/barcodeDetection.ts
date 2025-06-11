// src/utils/barcodeDetection.ts
"use client";

// Detection types
export interface BarcodeDetectionResult {
  rawValue: string;
  format: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cornerPoints?: Array<{ x: number; y: number }>;
  confidence?: number;
}

// Browser compatibility check
export const isBarcodeDetectorSupported = (): boolean => {
  return "BarcodeDetector" in window;
};

// Get supported formats
export const getSupportedFormats = async (): Promise<string[]> => {
  if (!isBarcodeDetectorSupported()) {
    return [];
  }

  try {
    const formats = await (window as any).BarcodeDetector.getSupportedFormats();
    return formats;
  } catch (error) {
    console.warn("Could not get supported barcode formats:", error);
    return [];
  }
};

// Main barcode detection function using native BarcodeDetector API
export const detectBarcodesInImage = async (
  imageSource: HTMLCanvasElement | HTMLImageElement | ImageData
): Promise<BarcodeDetectionResult[]> => {
  // Fallback to API detection if BarcodeDetector is not supported
  if (!isBarcodeDetectorSupported()) {
    console.log("🔄 BarcodeDetector not supported, using API fallback");
    return await detectBarcodesViaAPI(imageSource);
  }

  try {
    // Use native BarcodeDetector API
    const detector = new (window as any).BarcodeDetector({
      formats: [
        "code_128",
        "code_39",
        "code_93",
        "ean_13",
        "ean_8",
        "upc_a",
        "upc_e",
        "qr_code",
        "data_matrix",
        "aztec",
        "pdf417",
        "codabar",
        "itf",
      ],
    });

    const barcodes = await detector.detect(imageSource);

    return barcodes.map(
      (barcode: any): BarcodeDetectionResult => ({
        rawValue: barcode.rawValue,
        format: barcode.format,
        boundingBox: barcode.boundingBox
          ? {
              x: barcode.boundingBox.x,
              y: barcode.boundingBox.y,
              width: barcode.boundingBox.width,
              height: barcode.boundingBox.height,
            }
          : undefined,
        cornerPoints: barcode.cornerPoints?.map((point: any) => ({
          x: point.x,
          y: point.y,
        })),
        confidence: 0.9, // Native API doesn't provide confidence, assume high
      })
    );
  } catch (error) {
    console.error("Error with native BarcodeDetector:", error);
    // Fallback to API detection
    return await detectBarcodesViaAPI(imageSource);
  }
};

// Fallback detection using backend API
const detectBarcodesViaAPI = async (
  imageSource: HTMLCanvasElement | HTMLImageElement | ImageData
): Promise<BarcodeDetectionResult[]> => {
  try {
    let canvas: HTMLCanvasElement;

    // Convert image source to canvas if needed
    if (imageSource instanceof HTMLCanvasElement) {
      canvas = imageSource;
    } else {
      canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      if (imageSource instanceof HTMLImageElement) {
        canvas.width = imageSource.naturalWidth;
        canvas.height = imageSource.naturalHeight;
        ctx.drawImage(imageSource, 0, 0);
      } else {
        // ImageData
        canvas.width = imageSource.width;
        canvas.height = imageSource.height;
        ctx.putImageData(imageSource, 0, 0);
      }
    }

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not convert canvas to blob"));
        },
        "image/jpeg",
        0.8
      );
    });

    // Send to API
    const formData = new FormData();
    formData.append("image", blob, "barcode-scan.jpg");

    const response = await fetch("/api/detect-barcode", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      console.warn("API detection failed:", result.error);
      return [];
    }

    // Convert API response to standard format
    const detections: BarcodeDetectionResult[] = [];

    if (result.barcodes && result.barcodes.length > 0) {
      detections.push(
        ...result.barcodes.map((barcode: string) => ({
          rawValue: barcode,
          format: result.decode_method || "unknown",
          confidence: result.confidence || 0.8,
        }))
      );
    }

    return detections;
  } catch (error) {
    console.error("API barcode detection failed:", error);
    return [];
  }
};

// Utility function to validate barcode format
export const isValidBarcodeFormat = (format: string): boolean => {
  const validFormats = [
    "code_128",
    "code_39",
    "code_93",
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "qr_code",
    "data_matrix",
    "aztec",
    "pdf417",
    "codabar",
    "itf",
  ];

  return validFormats.includes(format.toLowerCase());
};

// Utility function to normalize barcode value
export const normalizeBarcodeValue = (value: string): string => {
  return value.trim().replace(/\s+/g, "");
};

// Utility function to get barcode type category
export const getBarcodeCategory = (
  format: string
): "linear" | "matrix" | "unknown" => {
  const linearFormats = [
    "code_128",
    "code_39",
    "code_93",
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "codabar",
    "itf",
  ];
  const matrixFormats = ["qr_code", "data_matrix", "aztec", "pdf417"];

  const normalizedFormat = format.toLowerCase();

  if (linearFormats.includes(normalizedFormat)) return "linear";
  if (matrixFormats.includes(normalizedFormat)) return "matrix";
  return "unknown";
};

// Enhanced detection with retry logic
export const detectBarcodesWithRetry = async (
  imageSource: HTMLCanvasElement | HTMLImageElement | ImageData,
  maxRetries: number = 2
): Promise<BarcodeDetectionResult[]> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await detectBarcodesInImage(imageSource);

      if (results.length > 0) {
        console.log(
          `🎯 Barcode detected on attempt ${attempt}:`,
          results.length,
          "barcodes"
        );
        return results;
      }

      if (attempt < maxRetries) {
        console.log(`🔄 No barcodes found on attempt ${attempt}, retrying...`);
        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Detection attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw error;
      }
    }
  }

  return [];
};

// Performance monitoring
export const measureDetectionPerformance = async (
  detectionFunction: () => Promise<BarcodeDetectionResult[]>
): Promise<{ results: BarcodeDetectionResult[]; duration: number }> => {
  const startTime = performance.now();
  const results = await detectionFunction();
  const duration = performance.now() - startTime;

  console.log(
    `⏱️ Detection completed in ${duration.toFixed(2)}ms, found ${
      results.length
    } barcodes`
  );

  return { results, duration };
};

// Debug function for development
export const debugBarcodeDetection = async (
  imageSource: HTMLCanvasElement | HTMLImageElement | ImageData
): Promise<void> => {
  console.log("🔍 Starting barcode detection debug...");

  // Check browser support
  const isSupported = isBarcodeDetectorSupported();
  console.log("📱 BarcodeDetector support:", isSupported);

  if (isSupported) {
    const formats = await getSupportedFormats();
    console.log("📋 Supported formats:", formats);
  }

  // Test detection
  const { results, duration } = await measureDetectionPerformance(() =>
    detectBarcodesInImage(imageSource)
  );

  console.log("📊 Detection results:");
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.rawValue} (${result.format})`);
    if (result.confidence) {
      console.log(`     Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }
  });

  console.log("✅ Debug complete");
};
