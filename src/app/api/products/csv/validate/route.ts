// src/app/api/products/csv/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { csvUpdateService } from "../../../../../services/csvUpdateService";

// ===== MAIN HANDLER =====
export async function GET(): Promise<NextResponse> {
  try {
    const validation = await csvUpdateService.validateCSVFile();

    return NextResponse.json(
      {
        success: true,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        data: {
          rowCount: validation.rowCount,
          columnCount: validation.columnCount,
          missingColumns: validation.missingColumns,
        },
      },
      {
        status: validation.isValid ? 200 : 422,
      }
    );
  } catch (error) {
    console.error("CSV validation API error:", error);
    return NextResponse.json(
      {
        success: false,
        isValid: false,
        errors: ["Failed to validate CSV file"],
        warnings: [],
        data: {
          rowCount: 0,
          columnCount: 0,
        },
      },
      { status: 500 }
    );
  }
}

// ===== POST METHOD - Validate Specific CSV Content =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV content is required for validation",
        },
        { status: 400 }
      );
    }

    // Here you would implement CSV content validation
    // For now, just return a basic response
    return NextResponse.json({
      success: true,
      isValid: true,
      errors: [],
      warnings: [],
      message: "CSV content validation not fully implemented",
    });
  } catch (error) {
    console.error("CSV content validation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate CSV content",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
