// src/app/api/products/csv/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { csvUpdateService } from "../../../../../services/csvUpdateService";
import { ProductEntryFormData } from "../../../../../components/manual-product/ProductEntryForm";

// ===== INTERFACES =====
interface AddToCsvRequestBody {
  formData: ProductEntryFormData;
  options?: {
    createBackup?: boolean;
    validateBeforeUpdate?: boolean;
    appendMode?: boolean;
  };
}

// ===== MAIN HANDLER =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AddToCsvRequestBody = await request.json();

    if (!body.formData) {
      return NextResponse.json(
        { success: false, error: "Form data is required" },
        { status: 400 }
      );
    }

    const { formData, options = {} } = body;
    const {
      createBackup = true,
      validateBeforeUpdate = true,
      appendMode = true,
    } = options;

    // Add product to CSV using server-side service
    const result = await csvUpdateService.addProductToCSV(formData, {
      createBackup,
      validateBeforeUpdate,
      appendMode,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Product added to CSV successfully",
        data: {
          rowsAdded: result.rowsAdded,
          backupPath: result.backupPath,
          fileSize: result.fileSize,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to add product to CSV",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CSV add API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ===== OPTIONS METHOD - CORS =====
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
