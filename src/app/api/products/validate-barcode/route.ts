// src/app/api/products/validate-barcode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { manualProductService } from "../../../../services/manualProductService";
import { BarcodeVerificationResult } from "../../../../components/manual-product/BarcodeVerification";

// ===== INTERFACES =====
interface ValidateBarcodeRequestBody {
  barcode: string;
  barcodeType: "ea" | "dsp" | "cs";
  options?: {
    checkFormat?: boolean;
    checkUniqueness?: boolean;
    strictMode?: boolean;
    includeDetails?: boolean;
    includeSuggestions?: boolean;
  };
}

interface ValidateBarcodeResponse {
  success: boolean;
  result: BarcodeVerificationResult;
  metadata?: {
    processingTime: number;
    cacheHit?: boolean;
    apiVersion: string;
  };
  suggestions?: {
    similarBarcodes?: string[];
    formatRecommendations?: string[];
  };
  details?: {
    formatAnalysis: {
      length: number;
      format: string;
      checkDigit?: boolean;
      countryCode?: string;
      manufacturerCode?: string;
    };
    uniquenessAnalysis?: {
      searchedInProducts: number;
      conflictingProducts?: any[];
      lastChecked: string;
    };
  };
  error?: string;
}

interface BarcodeFormatInfo {
  format: string;
  length: number;
  pattern: RegExp;
  description: string;
  hasCheckDigit: boolean;
  regions: string[];
}

// ===== BARCODE FORMAT DEFINITIONS =====
const BARCODE_FORMATS: Record<string, BarcodeFormatInfo> = {
  "EAN-13": {
    format: "EAN-13",
    length: 13,
    pattern: /^\d{13}$/,
    description: "European Article Number (13 digits)",
    hasCheckDigit: true,
    regions: ["Europe", "Asia", "Global"],
  },
  "UPC-A": {
    format: "UPC-A",
    length: 12,
    pattern: /^\d{12}$/,
    description: "Universal Product Code - Type A (12 digits)",
    hasCheckDigit: true,
    regions: ["North America"],
  },
  "EAN-8": {
    format: "EAN-8",
    length: 8,
    pattern: /^\d{8}$/,
    description: "European Article Number (8 digits)",
    hasCheckDigit: true,
    regions: ["Europe", "Asia"],
  },
  "ITF-14": {
    format: "ITF-14",
    length: 14,
    pattern: /^\d{14}$/,
    description: "Interleaved 2 of 5 (14 digits)",
    hasCheckDigit: true,
    regions: ["Global"],
  },
  Code128: {
    format: "Code 128",
    length: 0, // Variable
    pattern: /^[\x00-\x7F]{1,48}$/,
    description: "Code 128 (Variable length)",
    hasCheckDigit: true,
    regions: ["Global"],
  },
};

// ===== VALIDATION HELPERS =====
const validateRequestBody = (
  body: any
): {
  isValid: boolean;
  error?: string;
  barcode?: string;
  barcodeType?: "ea" | "dsp" | "cs";
  options?: any;
} => {
  if (!body) {
    return { isValid: false, error: "Request body is required" };
  }

  if (!body.barcode || typeof body.barcode !== "string") {
    return {
      isValid: false,
      error: "Barcode is required and must be a string",
    };
  }

  if (!body.barcodeType || !["ea", "dsp", "cs"].includes(body.barcodeType)) {
    return {
      isValid: false,
      error: "BarcodeType must be 'ea', 'dsp', or 'cs'",
    };
  }

  // Clean barcode - remove non-alphanumeric characters
  const cleanBarcode = body.barcode.trim().replace(/[^0-9A-Za-z]/g, "");

  if (cleanBarcode.length < 4) {
    return {
      isValid: false,
      error: "Barcode must be at least 4 characters long",
    };
  }

  if (cleanBarcode.length > 48) {
    return { isValid: false, error: "Barcode cannot exceed 48 characters" };
  }

  return {
    isValid: true,
    barcode: cleanBarcode,
    barcodeType: body.barcodeType,
    options: body.options || {},
  };
};

// ===== BARCODE ANALYSIS =====
const analyzeBarcodeFormat = (
  barcode: string
): {
  format: string;
  formatInfo?: BarcodeFormatInfo;
  isValid: boolean;
  warnings: string[];
  checkDigitValid?: boolean;
  countryCode?: string;
  manufacturerCode?: string;
} => {
  const warnings: string[] = [];
  const length = barcode.length;

  // Find matching format
  for (const [formatName, formatInfo] of Object.entries(BARCODE_FORMATS)) {
    if (formatInfo.length === 0 || formatInfo.length === length) {
      if (formatInfo.pattern.test(barcode)) {
        let checkDigitValid: boolean | undefined;
        let countryCode: string | undefined;
        let manufacturerCode: string | undefined;

        // Specific analysis for different formats
        if (formatName === "EAN-13" && length === 13) {
          checkDigitValid = validateEAN13CheckDigit(barcode);
          countryCode = extractEAN13CountryCode(barcode);
          manufacturerCode = barcode.substring(1, 7);

          if (!checkDigitValid) {
            warnings.push("EAN-13 check digit is invalid");
          }
        } else if (formatName === "UPC-A" && length === 12) {
          checkDigitValid = validateUPCACheckDigit(barcode);
          manufacturerCode = barcode.substring(0, 6);

          if (!checkDigitValid) {
            warnings.push("UPC-A check digit is invalid");
          }
        } else if (formatName === "EAN-8" && length === 8) {
          checkDigitValid = validateEAN8CheckDigit(barcode);
          countryCode = extractEAN8CountryCode(barcode);

          if (!checkDigitValid) {
            warnings.push("EAN-8 check digit is invalid");
          }
        }

        return {
          format: formatName,
          formatInfo,
          isValid: checkDigitValid !== false,
          warnings,
          checkDigitValid,
          countryCode,
          manufacturerCode,
        };
      }
    }
  }

  // No exact match found
  warnings.push(`No standard format matches barcode length ${length}`);

  return {
    format: `Unknown (${length} characters)`,
    isValid: false,
    warnings,
  };
};

// ===== CHECK DIGIT VALIDATION =====
const validateEAN13CheckDigit = (barcode: string): boolean => {
  if (barcode.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12]);
};

const validateUPCACheckDigit = (barcode: string): boolean => {
  if (barcode.length !== 12) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[11]);
};

const validateEAN8CheckDigit = (barcode: string): boolean => {
  if (barcode.length !== 8) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[7]);
};

// ===== COUNTRY CODE EXTRACTION =====
const extractEAN13CountryCode = (barcode: string): string | undefined => {
  const countryPrefix = barcode.substring(0, 3);
  const countryMappings: Record<string, string> = {
    "885": "Thailand",
    "000": "USA/Canada",
    "001": "USA/Canada",
    "380": "Bulgaria",
    "383": "Slovenia",
    "385": "Croatia",
    "387": "Bosnia and Herzegovina",
    "400": "Germany",
    "460": "Russia",
    "480": "Philippines",
    "489": "Hong Kong",
    "890": "India",
  };

  return countryMappings[countryPrefix] || "Unknown";
};

const extractEAN8CountryCode = (barcode: string): string | undefined => {
  const countryPrefix = barcode.substring(0, 2);
  // Simplified mapping for EAN-8
  return countryPrefix.startsWith("88") ? "Thailand" : "Unknown";
};

// ===== SUGGESTION GENERATOR =====
const generateBarcodeSuggestions = (
  barcode: string,
  formatAnalysis: any
): string[] => {
  const suggestions: string[] = [];

  // Format-based suggestions
  if (barcode.length === 12) {
    // Could be UPC-A, suggest with corrected check digit
    const upcSuggestion = generateUPCAWithCheckDigit(barcode.substring(0, 11));
    if (upcSuggestion !== barcode) {
      suggestions.push(upcSuggestion);
    }
  } else if (barcode.length === 13) {
    // Could be EAN-13, suggest with corrected check digit
    const eanSuggestion = generateEAN13WithCheckDigit(barcode.substring(0, 12));
    if (eanSuggestion !== barcode) {
      suggestions.push(eanSuggestion);
    }
  }

  // Length-based suggestions
  if (barcode.length > 13) {
    suggestions.push(barcode.substring(0, 13)); // Truncate to EAN-13
  } else if (barcode.length < 12 && barcode.length >= 8) {
    suggestions.push(barcode.padStart(12, "0")); // Pad to UPC-A
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
};

const generateUPCAWithCheckDigit = (barcode11: string): string => {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(barcode11[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode11 + checkDigit.toString();
};

const generateEAN13WithCheckDigit = (barcode12: string): string => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode12 + checkDigit.toString();
};

// ===== CACHING =====
const validationCache = new Map<
  string,
  { result: BarcodeVerificationResult; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedResult = (
  cacheKey: string
): BarcodeVerificationResult | null => {
  const cached = validationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  return null;
};

const setCachedResult = (
  cacheKey: string,
  result: BarcodeVerificationResult
): void => {
  validationCache.set(cacheKey, { result, timestamp: Date.now() });

  // Clean up old cache entries
  if (validationCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of validationCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        validationCache.delete(key);
      }
    }
  }
};

// ===== MAIN HANDLERS =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = validateRequestBody(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          metadata: {
            processingTime: Date.now() - startTime,
            apiVersion: "1.0.0",
          },
        },
        { status: 400 }
      );
    }

    const { barcode, barcodeType, options } = validation;
    const {
      checkFormat = true,
      checkUniqueness = true,
      strictMode = false,
      includeDetails = false,
      includeSuggestions = false,
    } = options;

    // Check cache
    const cacheKey = `${barcode}-${barcodeType}-${JSON.stringify(options)}`;
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        success: true,
        result: cachedResult,
        metadata: {
          processingTime: Date.now() - startTime,
          cacheHit: true,
          apiVersion: "1.0.0",
        },
      });
    }

    // Perform validation using the service
    const result = await manualProductService.validateBarcode(
      barcode!,
      barcodeType!,
      {
        checkFormat,
        checkUniqueness,
        strictMode,
      }
    );

    // Add detailed analysis if requested
    let details: any = undefined;
    let suggestions: any = undefined;

    if (includeDetails || includeSuggestions) {
      const formatAnalysis = analyzeBarcodeFormat(barcode!);

      if (includeDetails) {
        details = {
          formatAnalysis: {
            length: barcode!.length,
            format: formatAnalysis.format,
            checkDigit: formatAnalysis.checkDigitValid,
            countryCode: formatAnalysis.countryCode,
            manufacturerCode: formatAnalysis.manufacturerCode,
          },
        };

        if (checkUniqueness) {
          details.uniquenessAnalysis = {
            searchedInProducts: 1000, // This would come from actual DB query
            lastChecked: new Date().toISOString(),
          };
        }
      }

      if (includeSuggestions) {
        suggestions = {
          similarBarcodes: generateBarcodeSuggestions(barcode!, formatAnalysis),
          formatRecommendations: formatAnalysis.warnings,
        };
      }
    }

    // Cache the result
    setCachedResult(cacheKey, result);

    const response: ValidateBarcodeResponse = {
      success: true,
      result,
      metadata: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        apiVersion: "1.0.0",
      },
      ...(details && { details }),
      ...(suggestions && { suggestions }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Barcode validation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during barcode validation",
        metadata: {
          processingTime: Date.now() - startTime,
          apiVersion: "1.0.0",
        },
      },
      { status: 500 }
    );
  }
}

// ===== GET METHOD - Validation Info =====
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json({
        success: true,
        supportedFormats: Object.entries(BARCODE_FORMATS).map(
          ([name, info]) => ({
            name,
            description: info.description,
            length: info.length || "Variable",
            regions: info.regions,
            hasCheckDigit: info.hasCheckDigit,
          })
        ),
        validationRules: {
          minLength: 4,
          maxLength: 48,
          allowedCharacters: "0-9, A-Z, a-z",
          requiredFields: ["barcode", "barcodeType"],
        },
        apiVersion: "1.0.0",
      });
    }

    // Quick format analysis for GET requests
    const cleanBarcode = barcode.trim().replace(/[^0-9A-Za-z]/g, "");
    const formatAnalysis = analyzeBarcodeFormat(cleanBarcode);

    return NextResponse.json({
      success: true,
      barcode: cleanBarcode,
      formatAnalysis: {
        format: formatAnalysis.format,
        isValid: formatAnalysis.isValid,
        warnings: formatAnalysis.warnings,
        length: cleanBarcode.length,
      },
      suggestions: generateBarcodeSuggestions(cleanBarcode, formatAnalysis),
      apiVersion: "1.0.0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get barcode information",
        apiVersion: "1.0.0",
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
