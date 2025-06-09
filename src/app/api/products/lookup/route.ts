// src/app/api/products/lookup/route.ts - Updated with better error handling
import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode, loadCSVProducts } from "@/data/csvProducts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    console.log("🔍 Looking up product for barcode:", barcode);

    if (!barcode) {
      console.log("❌ No barcode provided");
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มี barcode ในคำขอ",
          debug: {
            providedBarcode: barcode,
            requestUrl: request.url,
          },
        },
        { status: 400 }
      );
    }

    // Clean barcode (remove spaces, special characters)
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, "");
    console.log("🧹 Clean barcode:", cleanBarcode);

    if (!cleanBarcode) {
      console.log("❌ Invalid barcode after cleaning");
      return NextResponse.json(
        {
          success: false,
          error: "Barcode ไม่ถูกต้อง",
          debug: {
            originalBarcode: barcode,
            cleanBarcode: cleanBarcode,
          },
        },
        { status: 400 }
      );
    }

    try {
      console.log("📂 Loading CSV products...");

      // Load CSV products with timeout
      const loadPromise = loadCSVProducts();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("CSV loading timeout")), 10000)
      );

      await Promise.race([loadPromise, timeoutPromise]);
      console.log("✅ CSV products loaded successfully");

      // Find product by barcode
      console.log("🔍 Searching for product...");
      const product = await findProductByBarcode(cleanBarcode);

      // If not found with clean barcode, try with original barcode
      let finalProduct = product;
      if (!finalProduct && cleanBarcode !== barcode.trim()) {
        console.log("🔄 Trying with original barcode:", barcode.trim());
        finalProduct = await findProductByBarcode(barcode.trim());
      }

      if (finalProduct) {
        console.log(
          "✅ Product found:",
          finalProduct.name,
          "Brand:",
          finalProduct.brand
        );

        return NextResponse.json({
          success: true,
          data: finalProduct,
          debug: {
            searchedBarcode: barcode,
            cleanBarcode: cleanBarcode,
            foundWith:
              cleanBarcode === finalProduct.barcode ? "clean" : "original",
          },
        });
      } else {
        console.log("❌ Product not found for barcode:", barcode);

        // Get sample available barcodes for debugging
        let sampleBarcodes: string[] = [];
        let totalProducts = 0;

        try {
          const allProducts = await loadCSVProducts();
          totalProducts = allProducts.length;
          sampleBarcodes = allProducts
            .slice(0, 10)
            .map((p) => p.barcode)
            .filter(Boolean);
        } catch (debugError) {
          console.warn("Could not load debug info:", debugError);
        }

        console.log("📋 Sample available barcodes:", sampleBarcodes);

        return NextResponse.json(
          {
            success: false,
            error: `ไม่พบสินค้าที่มี barcode: ${barcode}`,
            debug: {
              searchedBarcode: barcode,
              cleanBarcode: cleanBarcode,
              totalProducts,
              sampleBarcodes,
              barcodeLength: cleanBarcode.length,
            },
          },
          { status: 404 }
        );
      }
    } catch (csvError: any) {
      console.error("❌ Error with CSV operations:", csvError);

      let errorMessage = "เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า";
      let statusCode = 500;

      if (csvError.message?.includes("Failed to fetch CSV")) {
        errorMessage = "ไม่สามารถโหลดไฟล์ข้อมูลสินค้าได้";
        statusCode = 503;
      } else if (csvError.message?.includes("timeout")) {
        errorMessage = "การโหลดข้อมูลใช้เวลานานเกินไป";
        statusCode = 504;
      } else if (csvError.message?.includes("parse")) {
        errorMessage = "ข้อมูลสินค้าไม่ถูกต้อง";
        statusCode = 502;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          debug: {
            csvError: csvError.message,
            stack:
              process.env.NODE_ENV === "development"
                ? csvError.stack
                : undefined,
            searchedBarcode: barcode,
            cleanBarcode: cleanBarcode,
          },
        },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    console.error("💥 Unexpected error in product lookup:", error);

    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
        debug: {
          error: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use GET instead.",
    },
    { status: 405 }
  );
}
