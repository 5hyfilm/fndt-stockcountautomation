// src/app/api/products/lookup/route.ts - Updated to use CSV
import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode, loadCSVProducts } from "@/data/csvProducts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    console.log("🔍 Looking up product for barcode:", barcode);

    if (!barcode) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มี barcode ในคำขอ",
        },
        { status: 400 }
      );
    }

    // Clean barcode (remove spaces, special characters)
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, "");
    console.log("🧹 Clean barcode:", cleanBarcode);

    try {
      // Load CSV products and find by barcode
      await loadCSVProducts(); // Ensure CSV is loaded
      const product = await findProductByBarcode(cleanBarcode);

      // If not found with clean barcode, try with original barcode
      let finalProduct = product;
      if (!finalProduct && cleanBarcode !== barcode.trim()) {
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
        });
      } else {
        console.log("❌ Product not found for barcode:", barcode);

        // Get all available barcodes for debugging (limited to first 10)
        const allProducts = await loadCSVProducts();
        const availableBarcodes = allProducts
          .slice(0, 10)
          .map((p) => p.barcode);

        console.log("📋 Sample available barcodes:", availableBarcodes);

        return NextResponse.json(
          {
            success: false,
            error: `ไม่พบสินค้าที่มี barcode: ${barcode}`,
            debug: {
              searchedBarcode: barcode,
              cleanBarcode: cleanBarcode,
              totalProducts: allProducts.length,
              sampleBarcodes: availableBarcodes,
            },
          },
          { status: 404 }
        );
      }
    } catch (csvError) {
      console.error("❌ Error loading CSV data:", csvError);
      return NextResponse.json(
        {
          success: false,
          error: "เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า",
          debug: {
            csvError:
              csvError instanceof Error ? csvError.message : String(csvError),
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error in product lookup:", error);
    return NextResponse.json(
      {
        success: false,
        error: `เกิดข้อผิดพลาดในการค้นหาสินค้า: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
