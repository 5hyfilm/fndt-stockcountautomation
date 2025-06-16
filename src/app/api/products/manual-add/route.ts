// src/app/api/products/manual-add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { manualProductService } from "../../../../services/manualProductService";
import { csvUpdateService } from "../../../../services/csvUpdateService";
import { ProductEntryFormData } from "../../../../components/manual-product/ProductEntryForm";

// ===== INTERFACES =====
interface ManualAddRequestBody {
  formData: ProductEntryFormData;
  employeeContext: {
    employeeName: string;
    branchCode: string;
    branchName: string;
  };
  options?: {
    skipValidation?: boolean;
    skipBackup?: boolean;
    dryRun?: boolean;
  };
}

interface ManualAddResponse {
  success: boolean;
  product?: any;
  message: string;
  metadata?: {
    processingTime: number;
    backupCreated: boolean;
    csvRowAdded: boolean;
    validationResults?: any;
  };
  error?: string;
  warnings?: string[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ===== VALIDATION HELPERS =====
const validateRequestBody = (
  body: any
): {
  isValid: boolean;
  errors: ValidationError[];
  formData?: ProductEntryFormData;
  employeeContext?: any;
} => {
  const errors: ValidationError[] = [];

  // Check if body exists
  if (!body) {
    errors.push({
      field: "body",
      message: "Request body is required",
      code: "MISSING_BODY",
    });
    return { isValid: false, errors };
  }

  // Validate formData
  if (!body.formData) {
    errors.push({
      field: "formData",
      message: "Form data is required",
      code: "MISSING_FORM_DATA",
    });
  } else {
    const formData = body.formData;

    // Required fields validation
    const requiredFields: (keyof ProductEntryFormData)[] = [
      "scannedBarcode",
      "barcodeType",
      "materialCode",
      "description",
      "thaiDescription",
      "packSize",
      "productGroup",
    ];

    for (const field of requiredFields) {
      if (
        !formData[field] ||
        (typeof formData[field] === "string" && !formData[field].trim())
      ) {
        errors.push({
          field: `formData.${field}`,
          message: `${field} is required`,
          code: "REQUIRED_FIELD_MISSING",
        });
      }
    }

    // Barcode type validation
    if (
      formData.barcodeType &&
      !["ea", "dsp", "cs"].includes(formData.barcodeType)
    ) {
      errors.push({
        field: "formData.barcodeType",
        message: "Invalid barcode type. Must be 'ea', 'dsp', or 'cs'",
        code: "INVALID_BARCODE_TYPE",
      });
    }

    // Material code format
    if (
      formData.materialCode &&
      !/^[A-Z0-9]{3,10}$/.test(formData.materialCode)
    ) {
      errors.push({
        field: "formData.materialCode",
        message: "Material code must be 3-10 alphanumeric characters",
        code: "INVALID_MATERIAL_CODE_FORMAT",
      });
    }

    // Barcode format
    if (
      formData.scannedBarcode &&
      !/^\d{8,14}$/.test(formData.scannedBarcode)
    ) {
      errors.push({
        field: "formData.scannedBarcode",
        message: "Barcode must be 8-14 digits",
        code: "INVALID_BARCODE_FORMAT",
      });
    }
  }

  // Validate employeeContext
  if (!body.employeeContext) {
    errors.push({
      field: "employeeContext",
      message: "Employee context is required",
      code: "MISSING_EMPLOYEE_CONTEXT",
    });
  } else {
    const requiredEmployeeFields = ["employeeName", "branchCode", "branchName"];

    for (const field of requiredEmployeeFields) {
      if (!body.employeeContext[field]?.trim()) {
        errors.push({
          field: `employeeContext.${field}`,
          message: `${field} is required`,
          code: "REQUIRED_FIELD_MISSING",
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    formData: body.formData,
    employeeContext: body.employeeContext,
  };
};

const logAPIRequest = (
  method: string,
  body: any,
  ip: string,
  userAgent: string
): void => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method,
    endpoint: "/api/products/manual-add",
    ip,
    userAgent,
    employeeName: body?.employeeContext?.employeeName,
    branchCode: body?.employeeContext?.branchCode,
    materialCode: body?.formData?.materialCode,
    barcode: body?.formData?.scannedBarcode
      ? `${body.formData.scannedBarcode.substring(
          0,
          4
        )}...${body.formData.scannedBarcode.substring(-4)}`
      : null,
  };

  console.log(
    "📊 Manual Product API Request:",
    JSON.stringify(logData, null, 2)
  );
};

// ===== RATE LIMITING =====
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per 5 minutes per IP

const checkRateLimit = (
  ip: string
): { allowed: boolean; resetTime?: number } => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitMap.delete(key);
    }
  }

  const current = rateLimitMap.get(ip);

  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: current.resetTime };
  }

  current.count++;
  return { allowed: true };
};

// ===== MAIN HANDLER =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Get client info
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimit.resetTime! - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Parse request body
    let body: ManualAddRequestBody;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    // Log request
    logAPIRequest("POST", body, ip, userAgent);

    // Validate request
    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          message: "Request validation failed",
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { formData, employeeContext } = validation;
    const options = body.options || {};

    // ===== DRY RUN MODE =====
    if (options.dryRun) {
      const dryRunValidation = manualProductService.validateFormData(formData!);

      return NextResponse.json({
        success: true,
        message: "Dry run completed successfully",
        metadata: {
          processingTime: Date.now() - startTime,
          backupCreated: false,
          csvRowAdded: false,
          validationResults: dryRunValidation,
        },
        warnings: dryRunValidation.warnings,
      });
    }

    // ===== BARCODE UNIQUENESS CHECK =====
    if (!options.skipValidation) {
      console.log("🔍 Checking barcode uniqueness...");

      const barcodeValidation = await manualProductService.validateBarcode(
        formData!.scannedBarcode,
        formData!.barcodeType,
        {
          checkFormat: true,
          checkUniqueness: true,
          strictMode: true,
        }
      );

      if (!barcodeValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Barcode validation failed",
            message: "The barcode format is invalid",
            metadata: {
              processingTime: Date.now() - startTime,
              validationResults: barcodeValidation,
            },
          },
          { status: 422 }
        );
      }

      if (!barcodeValidation.isUnique) {
        return NextResponse.json(
          {
            success: false,
            error: "Barcode already exists",
            message: "This barcode is already registered in the system",
            existingProduct: barcodeValidation.existingProduct,
            metadata: {
              processingTime: Date.now() - startTime,
              validationResults: barcodeValidation,
            },
          },
          { status: 409 }
        );
      }
    }

    // ===== FORM VALIDATION =====
    console.log("📝 Validating form data...");
    const formValidation = manualProductService.validateFormData(formData!);

    if (!formValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Form validation failed",
          message: "The form data contains errors",
          validationErrors: Object.entries(formValidation.errors).map(
            ([field, message]) => ({
              field,
              message,
              code: "VALIDATION_ERROR",
            })
          ),
          metadata: {
            processingTime: Date.now() - startTime,
            validationResults: formValidation,
          },
        },
        { status: 422 }
      );
    }

    // ===== CSV HEALTH CHECK =====
    console.log("🏥 Checking CSV health...");
    const csvHealth = await csvUpdateService.healthCheck();

    if (!csvHealth.csvExists || !csvHealth.csvWritable) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is not accessible",
          message: "Unable to access or write to the product CSV file",
          metadata: {
            processingTime: Date.now() - startTime,
            csvHealth,
          },
        },
        { status: 503 }
      );
    }

    // ===== CREATE PRODUCT =====
    console.log("🏭 Creating manual product...");
    const creationResult = await manualProductService.createManualProduct(
      formData!,
      employeeContext!
    );

    if (!creationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: creationResult.error || "Failed to create product",
          message: "Product creation failed",
          metadata: {
            processingTime: Date.now() - startTime,
            backupCreated: creationResult.backupCreated || false,
            csvRowAdded: false,
          },
          warnings: creationResult.warnings,
        },
        { status: 500 }
      );
    }

    // ===== UPDATE CSV =====
    console.log("📄 Updating CSV file...");
    const csvUpdateResult = await csvUpdateService.addProductToCSV(formData!, {
      createBackup: !options.skipBackup,
      validateBeforeUpdate: true,
      appendMode: true,
    });

    if (!csvUpdateResult.success) {
      // Log the error but don't fail the entire operation
      console.error("❌ CSV update failed:", csvUpdateResult.error);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update CSV file",
          message: "Product was created but CSV update failed",
          product: creationResult.product,
          metadata: {
            processingTime: Date.now() - startTime,
            backupCreated: csvUpdateResult.backupPath ? true : false,
            csvRowAdded: false,
          },
          warnings: [
            ...(creationResult.warnings || []),
            "CSV file could not be updated",
          ],
        },
        { status: 207 } // Multi-status: partial success
      );
    }

    // ===== SUCCESS RESPONSE =====
    const processingTime = Date.now() - startTime;

    console.log("✅ Manual product creation successful:", {
      materialCode: formData!.materialCode,
      barcode: formData!.scannedBarcode,
      employee: employeeContext!.employeeName,
      processingTime: `${processingTime}ms`,
    });

    const response: ManualAddResponse = {
      success: true,
      product: creationResult.product,
      message: "Product added successfully",
      metadata: {
        processingTime,
        backupCreated: csvUpdateResult.backupPath ? true : false,
        csvRowAdded: csvUpdateResult.rowsAdded > 0,
        validationResults: formValidation,
      },
      warnings: [
        ...(creationResult.warnings || []),
        ...(formValidation.warnings || []),
      ],
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Processing-Time": processingTime.toString(),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ Manual product creation error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while creating the product",
        metadata: {
          processingTime,
          backupCreated: false,
          csvRowAdded: false,
        },
      },
      { status: 500 }
    );
  }
}

// ===== GET METHOD - Health Check =====
export async function GET(): Promise<NextResponse> {
  try {
    // Get CSV statistics
    const csvStats = await csvUpdateService.getCSVStatistics();
    const csvHealth = await csvUpdateService.healthCheck();

    // Get service status
    const serviceStatus = {
      manualProductService: "healthy",
      csvUpdateService: csvHealth.csvWritable ? "healthy" : "degraded",
    };

    return NextResponse.json({
      success: true,
      status: "operational",
      services: serviceStatus,
      csvInfo: {
        totalProducts: csvStats.totalProducts,
        fileSize: csvStats.fileSize,
        lastModified: csvStats.lastModified,
        barcodeStats: csvStats.barcodeStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
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
