// src/app/api/detect-barcode/route.ts - Improved API with better error handling and stability
import { NextRequest, NextResponse } from "next/server";
import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";

// Enhanced response type
interface BarcodeDetectionResponse {
  success: boolean;
  barcodes?: Array<{
    data: string;
    format: string;
    quality?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  detections?: Array<{
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    confidence: number;
    class: string;
  }>;
  confidence?: number;
  rotation_angle?: number;
  decode_method?: string;
  processing_time?: number;
  error?: string;
}

// Barcode format mapping for better recognition
const BARCODE_FORMATS = [
  "aztec",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "data_matrix",
  "ean_13",
  "ean_8",
  "itf",
  "pdf417",
  "qr_code",
  "upc_a",
  "upc_e",
];

// Initialize barcode detector with comprehensive formats
let barcodeDetector: BarcodeDetectorPolyfill | null = null;

const initializeBarcodeDetector = async () => {
  if (!barcodeDetector) {
    try {
      barcodeDetector = new BarcodeDetectorPolyfill({
        formats: BARCODE_FORMATS,
      });
      console.log(
        "✅ Barcode detector initialized with formats:",
        BARCODE_FORMATS
      );
    } catch (error) {
      console.error("❌ Failed to initialize barcode detector:", error);
      throw new Error("Failed to initialize barcode detector");
    }
  }
  return barcodeDetector;
};

// Enhanced barcode validation
const validateBarcode = (data: string): boolean => {
  if (!data || typeof data !== "string") return false;

  // Remove any whitespace
  const cleaned = data.trim();

  // Check minimum length (most barcodes are at least 4 digits)
  if (cleaned.length < 4) return false;

  // Check if it contains only valid characters (numbers, some letters for certain formats)
  if (!/^[0-9A-Za-z\-\.\s]+$/.test(cleaned)) return false;

  // Common barcode length validations
  const numericData = cleaned.replace(/[^0-9]/g, "");
  if (numericData.length >= 8) {
    // Valid for most commercial barcodes (EAN, UPC, etc.)
    return true;
  }

  // Allow some non-numeric barcodes (Code 39, Code 128)
  if (cleaned.length >= 6 && /[A-Za-z]/.test(cleaned)) {
    return true;
  }

  return false;
};

// Enhanced image preprocessing
const preprocessImage = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): HTMLCanvasElement[] => {
  const variants: HTMLCanvasElement[] = [canvas]; // Original

  try {
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);

    // Create contrast enhanced version
    const contrastCanvas = document.createElement("canvas");
    contrastCanvas.width = width;
    contrastCanvas.height = height;
    const contrastCtx = contrastCanvas.getContext("2d")!;
    const contrastImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height
    );

    // Apply contrast enhancement
    const data = contrastImageData.data;
    const factor = 1.5; // Contrast factor
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128)); // R
      data[i + 1] = Math.min(
        255,
        Math.max(0, factor * (data[i + 1] - 128) + 128)
      ); // G
      data[i + 2] = Math.min(
        255,
        Math.max(0, factor * (data[i + 2] - 128) + 128)
      ); // B
    }

    contrastCtx.putImageData(contrastImageData, 0, 0);
    variants.push(contrastCanvas);

    // Create brightness adjusted version
    const brightCanvas = document.createElement("canvas");
    brightCanvas.width = width;
    brightCanvas.height = height;
    const brightCtx = brightCanvas.getContext("2d")!;
    const brightImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height
    );

    // Apply brightness adjustment
    const brightData = brightImageData.data;
    const brightness = 30; // Brightness adjustment
    for (let i = 0; i < brightData.length; i += 4) {
      brightData[i] = Math.min(255, brightData[i] + brightness); // R
      brightData[i + 1] = Math.min(255, brightData[i + 1] + brightness); // G
      brightData[i + 2] = Math.min(255, brightData[i + 2] + brightness); // B
    }

    brightCtx.putImageData(brightImageData, 0, 0);
    variants.push(brightCanvas);
  } catch (error) {
    console.warn("⚠️ Failed to create image variants:", error);
  }

  return variants;
};

// Try multiple detection attempts with different strategies
const detectBarcodesWithRetry = async (
  detector: BarcodeDetectorPolyfill,
  imageData: ImageBitmap | HTMLCanvasElement,
  maxAttempts: number = 3
): Promise<any[]> => {
  let barcodes: any[] = [];
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Detection attempt ${attempt}/${maxAttempts}`);

      const results = await detector.detect(imageData);

      if (results && results.length > 0) {
        // Filter and validate results
        const validBarcodes = results.filter((result) => {
          if (!result.rawValue || !validateBarcode(result.rawValue)) {
            console.warn("⚠️ Invalid barcode data:", result.rawValue);
            return false;
          }
          return true;
        });

        if (validBarcodes.length > 0) {
          barcodes = validBarcodes;
          console.log(
            `✅ Found ${validBarcodes.length} valid barcodes on attempt ${attempt}`
          );
          break;
        }
      }

      // If no results, wait a bit before retry
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Detection attempt ${attempt} failed:`, error);

      // Wait before retry
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  if (barcodes.length === 0 && lastError) {
    throw lastError;
  }

  return barcodes;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<BarcodeDetectionResponse>> {
  const startTime = Date.now();

  try {
    console.log("📥 Received barcode detection request");

    // Initialize detector
    const detector = await initializeBarcodeDetector();

    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "No image file provided",
        },
        { status: 400 }
      );
    }

    console.log(
      `📷 Processing image: ${imageFile.name} (${imageFile.size} bytes)`
    );

    // Convert file to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();

    // Create ImageBitmap for better performance
    const blob = new Blob([arrayBuffer], { type: imageFile.type });
    const imageBitmap = await createImageBitmap(blob);

    console.log(
      `🖼️ Image dimensions: ${imageBitmap.width}x${imageBitmap.height}`
    );

    // Try detection with multiple strategies
    let allBarcodes: any[] = [];
    let bestConfidence = 0;
    let detectionMethod = "direct";

    try {
      // Strategy 1: Direct detection on original image
      console.log("🔍 Strategy 1: Direct detection");
      const directResults = await detectBarcodesWithRetry(
        detector,
        imageBitmap,
        2
      );

      if (directResults.length > 0) {
        allBarcodes = directResults;
        bestConfidence = 0.9;
        detectionMethod = "direct";
        console.log("✅ Direct detection successful");
      }
    } catch (error) {
      console.warn("⚠️ Direct detection failed:", error);
    }

    // Strategy 2: Canvas preprocessing if direct failed or found weak results
    if (allBarcodes.length === 0 || bestConfidence < 0.7) {
      try {
        console.log("🔍 Strategy 2: Canvas preprocessing");

        // Create canvas and draw image
        const canvas = new OffscreenCanvas(
          imageBitmap.width,
          imageBitmap.height
        );
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(imageBitmap, 0, 0);

        // Try detection on canvas
        const canvasResults = await detectBarcodesWithRetry(
          detector,
          canvas as any,
          2
        );

        if (canvasResults.length > 0) {
          allBarcodes = canvasResults;
          bestConfidence = 0.8;
          detectionMethod = "canvas";
          console.log("✅ Canvas detection successful");
        }
      } catch (error) {
        console.warn("⚠️ Canvas preprocessing failed:", error);
      }
    }

    // Strategy 3: Enhanced preprocessing for difficult images
    if (allBarcodes.length === 0) {
      try {
        console.log("🔍 Strategy 3: Enhanced preprocessing");

        // Create canvas with enhanced preprocessing
        const canvas = new OffscreenCanvas(
          imageBitmap.width,
          imageBitmap.height
        );
        const ctx = canvas.getContext("2d")!;

        // Apply image filters for better barcode detection
        ctx.filter = "contrast(150%) brightness(110%)";
        ctx.drawImage(imageBitmap, 0, 0);

        const enhancedResults = await detectBarcodesWithRetry(
          detector,
          canvas as any,
          3
        );

        if (enhancedResults.length > 0) {
          allBarcodes = enhancedResults;
          bestConfidence = 0.7;
          detectionMethod = "enhanced";
          console.log("✅ Enhanced preprocessing successful");
        }
      } catch (error) {
        console.warn("⚠️ Enhanced preprocessing failed:", error);
      }
    }

    const processingTime = Date.now() - startTime;

    // Format results
    const formattedBarcodes = allBarcodes.map((barcode) => ({
      data: barcode.rawValue,
      format: barcode.format,
      quality: bestConfidence,
      boundingBox: barcode.boundingBox
        ? {
            x: barcode.boundingBox.x,
            y: barcode.boundingBox.y,
            width: barcode.boundingBox.width,
            height: barcode.boundingBox.height,
          }
        : undefined,
    }));

    // Create mock detections for visual feedback
    const detections = formattedBarcodes.map((barcode, index) => ({
      xmin: barcode.boundingBox?.x || 0.1,
      ymin: barcode.boundingBox?.y || 0.1,
      xmax:
        (barcode.boundingBox?.x || 0.1) + (barcode.boundingBox?.width || 0.8),
      ymax:
        (barcode.boundingBox?.y || 0.1) + (barcode.boundingBox?.height || 0.1),
      confidence: bestConfidence,
      class: `barcode_${barcode.format}`,
    }));

    if (formattedBarcodes.length > 0) {
      console.log(
        `✅ Detection successful: ${formattedBarcodes.length} barcodes found in ${processingTime}ms`
      );
      console.log(
        "📊 Detected barcodes:",
        formattedBarcodes.map((b) => `${b.data} (${b.format})`)
      );
    } else {
      console.log(`❌ No barcodes detected in ${processingTime}ms`);
    }

    // Clean up
    imageBitmap.close();

    return NextResponse.json({
      success: true,
      barcodes: formattedBarcodes,
      detections: detections,
      confidence: bestConfidence,
      rotation_angle: 0,
      decode_method: detectionMethod,
      processing_time: processingTime,
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("❌ Barcode detection error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to detect barcode",
        processing_time: processingTime,
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "Barcode Detection API",
    version: "2.0",
    status: "active",
    supported_formats: BARCODE_FORMATS,
    features: [
      "Multi-strategy detection",
      "Image preprocessing",
      "Barcode validation",
      "Enhanced error handling",
      "Performance optimization",
    ],
  });
}
