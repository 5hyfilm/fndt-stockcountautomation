// src/app/api/products/lookup/route.ts - Fixed version with better error handling
import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode, loadCSVProducts } from "@/data/csvProducts";
import { findFallbackProductByBarcode } from "@/data/fallbackProducts";

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

    let product;
    let debug: any = {
      searchedBarcode: barcode,
      cleanBarcode: cleanBarcode,
    };

    try {
      console.log("📂 Loading CSV products...");

      // Try to find product using CSV data
      product = await findProductByBarcode(cleanBarcode);
      debug.source = "csv";
      debug.csvLoadSucceeded = true;

      if (product) {
        console.log(
          "✅ Product found in CSV:",
          product.name,
          "Brand:",
          product.brand
        );
      } else {
        console.log("❌ Product not found in CSV for barcode:", barcode);

        // Get sample available barcodes for debugging
        try {
          const allProducts = await loadCSVProducts();
          debug.totalProducts = allProducts.length;
          debug.sampleBarcodes = allProducts
            .slice(0, 10)
            .map((p) => p.barcode)
            .filter(Boolean);
        } catch (debugError) {
          console.warn("Could not load debug info:", debugError);
        }
      }
    } catch (csvError: any) {
      console.warn("⚠️ CSV loading failed, trying fallback:", csvError);

      debug.csvLoadSucceeded = false;
      debug.csvError = csvError.message;
      debug.source = "fallback";

      // Try fallback products when CSV fails
      product = findFallbackProductByBarcode(cleanBarcode);

      if (product) {
        console.log("✅ Product found in fallback:", product.name);
      } else {
        console.log("❌ Product not found in fallback either");
      }
    }

    if (product) {
      return NextResponse.json({
        success: true,
        data: product,
        debug,
      });
    } else {
      console.log("❌ Product not found in any source for barcode:", barcode);

      return NextResponse.json(
        {
          success: false,
          error: `ไม่พบสินค้าที่มี barcode: ${barcode}`,
          debug: {
            ...debug,
            barcodeLength: cleanBarcode.length,
            searchAttempts: [
              "exact_match",
              "last_12_digits",
              "first_12_digits",
              "without_leading_zeros",
              "padded_to_13_digits",
            ],
          },
        },
        { status: 404 }
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
