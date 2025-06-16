// src/app/api/products/check-uniqueness/route.ts
import { NextRequest, NextResponse } from "next/server";
import { csvUpdateService } from "../../../../services/csvUpdateService";
import { loadCSVProducts } from "../../../../data/loaders/csvLoader";
import { findBarcodeMatch } from "../../../../data/matchers/barcodeMatcher";

// ===== INTERFACES =====
interface CheckUniquenessRequestBody {
  barcode: string;
  barcodeType: "ea" | "dsp" | "cs";
  options?: {
    includeDetails?: boolean;
    includeSimilar?: boolean;
    strictMatching?: boolean;
    excludeMaterialCode?: string; // For updating existing products
  };
}

interface CheckUniquenessResponse {
  success: boolean;
  isUnique: boolean;
  barcode: string;
  barcodeType: "ea" | "dsp" | "cs";
  conflictingProducts?: ConflictingProduct[];
  similarBarcodes?: SimilarBarcode[];
  metadata: {
    searchedProducts: number;
    processingTime: number;
    cacheHit: boolean;
    lastUpdated: string;
  };
  suggestions?: {
    availableAlternatives?: string[];
    nextAvailableSequence?: string;
  };
  error?: string;
}

interface ConflictingProduct {
  materialCode: string;
  description: string;
  thaiDescription: string;
  productGroup: string;
  barcodeType: "ea" | "dsp" | "cs";
  exactMatch: boolean;
  matchDetails: {
    matchType: "exact" | "partial" | "normalized";
    confidence: number;
  };
}

interface SimilarBarcode {
  barcode: string;
  materialCode: string;
  description: string;
  similarity: number;
  difference: string[];
}

interface SearchFilter {
  barcodeType?: "ea" | "dsp" | "cs";
  productGroup?: string;
  excludeMaterialCode?: string;
  strictMatching?: boolean;
}

// ===== CACHING =====
interface CacheEntry {
  result: CheckUniquenessResponse;
  timestamp: number;
  csvLastModified: number;
}

const uniquenessCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter than validation cache)
const MAX_CACHE_SIZE = 500;

// ===== BARCODE SIMILARITY =====
const calculateBarcodeDistance = (
  barcode1: string,
  barcode2: string
): {
  distance: number;
  similarity: number;
  differences: string[];
} => {
  const differences: string[] = [];
  let distance = 0;

  const maxLength = Math.max(barcode1.length, barcode2.length);

  for (let i = 0; i < maxLength; i++) {
    const char1 = barcode1[i] || "";
    const char2 = barcode2[i] || "";

    if (char1 !== char2) {
      distance++;
      differences.push(`Position ${i + 1}: '${char1}' vs '${char2}'`);
    }
  }

  const similarity = 1 - distance / maxLength;

  return { distance, similarity, differences };
};

const findSimilarBarcodes = (
  targetBarcode: string,
  products: any[],
  threshold: number = 0.8
): SimilarBarcode[] => {
  const similarBarcodes: SimilarBarcode[] = [];

  for (const product of products) {
    const barcodes = [
      { code: product.barcodes?.ea, type: "ea" },
      { code: product.barcodes?.dsp, type: "dsp" },
      { code: product.barcodes?.cs, type: "cs" },
    ].filter((b) => b.code);

    for (const { code } of barcodes) {
      if (code === targetBarcode) continue; // Skip exact matches

      const { similarity, differences } = calculateBarcodeDistance(
        targetBarcode,
        code
      );

      if (similarity >= threshold) {
        similarBarcodes.push({
          barcode: code,
          materialCode: product.sku || product.materialCode || "Unknown",
          description: product.name || product.description || "Unknown",
          similarity,
          difference: differences,
        });
      }
    }
  }

  // Sort by similarity (highest first)
  return similarBarcodes
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
};

// ===== BARCODE NORMALIZATION =====
const normalizeBarcodeForMatching = (barcode: string): string[] => {
  const normalized = barcode.replace(/[^0-9]/g, "");
  const variations: string[] = [normalized];

  // Add zero-padded variations
  if (normalized.length < 13) {
    variations.push(normalized.padStart(13, "0"));
  }
  if (normalized.length < 12) {
    variations.push(normalized.padStart(12, "0"));
  }

  // Add truncated variations
  if (normalized.length > 13) {
    variations.push(normalized.substring(0, 13));
    variations.push(normalized.substring(-13));
  }
  if (normalized.length > 12) {
    variations.push(normalized.substring(0, 12));
    variations.push(normalized.substring(-12));
  }

  // Remove leading zeros variation
  const withoutLeadingZeros = normalized.replace(/^0+/, "");
  if (withoutLeadingZeros && withoutLeadingZeros !== normalized) {
    variations.push(withoutLeadingZeros);
  }

  return [...new Set(variations)]; // Remove duplicates
};

// ===== CACHE MANAGEMENT =====
const getCacheKey = (
  barcode: string,
  barcodeType: string,
  options: any
): string => {
  return `${barcode}-${barcodeType}-${JSON.stringify(options)}`;
};

const getCachedResult = async (
  cacheKey: string
): Promise<CheckUniquenessResponse | null> => {
  const cached = uniquenessCache.get(cacheKey);
  if (!cached) return null;

  // Check if cache is still valid
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    uniquenessCache.delete(cacheKey);
    return null;
  }

  // Check if CSV file has been modified since cache
  try {
    const csvStats = await csvUpdateService.getCSVStatistics();
    const csvLastModified = new Date(csvStats.lastModified).getTime();

    if (csvLastModified > cached.csvLastModified) {
      uniquenessCache.delete(cacheKey);
      return null;
    }
  } catch (error) {
    // If we can't check CSV stats, invalidate cache to be safe
    uniquenessCache.delete(cacheKey);
    return null;
  }

  // Update cache hit metadata
  cached.result.metadata.cacheHit = true;
  return cached.result;
};

const setCachedResult = async (
  cacheKey: string,
  result: CheckUniquenessResponse
): Promise<void> => {
  try {
    const csvStats = await csvUpdateService.getCSVStatistics();
    const csvLastModified = new Date(csvStats.lastModified).getTime();

    uniquenessCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      csvLastModified,
    });

    // Clean up old cache entries
    if (uniquenessCache.size > MAX_CACHE_SIZE) {
      const now = Date.now();
      const entriesToDelete: string[] = [];

      for (const [key, entry] of uniquenessCache.entries()) {
        if (now - entry.timestamp > CACHE_DURATION) {
          entriesToDelete.push(key);
        }
      }

      entriesToDelete.forEach((key) => uniquenessCache.delete(key));
    }
  } catch (error) {
    console.error("Failed to cache uniqueness result:", error);
  }
};

// ===== VALIDATION HELPERS =====
const validateRequest = (
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

  const cleanBarcode = body.barcode.trim();
  if (!cleanBarcode) {
    return { isValid: false, error: "Barcode cannot be empty" };
  }

  return {
    isValid: true,
    barcode: cleanBarcode,
    barcodeType: body.barcodeType,
    options: body.options || {},
  };
};

// ===== SEARCH LOGIC =====
const searchForConflicts = async (
  barcode: string,
  barcodeType: "ea" | "dsp" | "cs",
  filter: SearchFilter
): Promise<{
  conflicts: ConflictingProduct[];
  searchedProducts: number;
}> => {
  try {
    const products = await loadCSVProducts();
    const conflicts: ConflictingProduct[] = [];

    // Normalize barcode for flexible matching
    const barcodeVariations = filter.strictMatching
      ? [barcode]
      : normalizeBarcodeForMatching(barcode);

    for (const product of products) {
      // Skip excluded products
      if (
        filter.excludeMaterialCode &&
        (product.sku === filter.excludeMaterialCode ||
          product.materialCode === filter.excludeMaterialCode)
      ) {
        continue;
      }

      // Filter by product group if specified
      if (filter.productGroup && product.productGroup !== filter.productGroup) {
        continue;
      }

      // Check for barcode matches
      for (const barcodeVariation of barcodeVariations) {
        const match = findBarcodeMatch(barcodeVariation, product);

        if (match.matched) {
          // Check if the match is for the same barcode type (or any type if not strict)
          if (!filter.barcodeType || match.type === filter.barcodeType) {
            const isExactMatch = match.barcode === barcode;
            const confidence = isExactMatch ? 1.0 : 0.8;

            conflicts.push({
              materialCode: product.sku || product.materialCode || "Unknown",
              description: product.name || product.description || "Unknown",
              thaiDescription:
                product.thaiDescription || product.description || "Unknown",
              productGroup: product.productGroup || "Unknown",
              barcodeType: match.type!,
              exactMatch: isExactMatch,
              matchDetails: {
                matchType: isExactMatch
                  ? "exact"
                  : barcodeVariation === barcode
                  ? "partial"
                  : "normalized",
                confidence,
              },
            });
          }
        }
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueConflicts = conflicts
      .filter(
        (conflict, index, self) =>
          index ===
          self.findIndex(
            (c) =>
              c.materialCode === conflict.materialCode &&
              c.barcodeType === conflict.barcodeType
          )
      )
      .sort((a, b) => b.matchDetails.confidence - a.matchDetails.confidence);

    return {
      conflicts: uniqueConflicts,
      searchedProducts: products.length,
    };
  } catch (error) {
    console.error("Error searching for conflicts:", error);
    throw new Error("Failed to search for barcode conflicts");
  }
};

// ===== SUGGESTION GENERATOR =====
const generateSuggestions = (
  originalBarcode: string,
  conflicts: ConflictingProduct[]
): {
  availableAlternatives: string[];
  nextAvailableSequence: string;
} => {
  const alternatives: string[] = [];

  // Generate variations by modifying last digits
  if (originalBarcode.length >= 8) {
    const base = originalBarcode.substring(0, originalBarcode.length - 3);

    for (let i = 0; i < 10; i++) {
      const variation = `${base}${i.toString().padStart(3, "0")}`;
      if (variation !== originalBarcode) {
        alternatives.push(variation);
      }
    }
  }

  // Generate next available sequence
  const lastDigits = originalBarcode.match(/\d+$/)?.[0] || "000";
  const nextNumber = (parseInt(lastDigits) + 1)
    .toString()
    .padStart(lastDigits.length, "0");
  const nextSequence = originalBarcode.replace(/\d+$/, nextNumber);

  return {
    availableAlternatives: alternatives.slice(0, 5),
    nextAvailableSequence: nextSequence,
  };
};

// ===== MAIN HANDLER =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = validateRequest(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          metadata: {
            processingTime: Date.now() - startTime,
          },
        },
        { status: 400 }
      );
    }

    const { barcode, barcodeType, options } = validation;
    const {
      includeDetails = false,
      includeSimilar = false,
      strictMatching = false,
      excludeMaterialCode,
    } = options;

    // Check cache
    const cacheKey = getCacheKey(barcode!, barcodeType!, options);
    const cachedResult = await getCachedResult(cacheKey);

    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Search for conflicts
    const searchFilter: SearchFilter = {
      barcodeType: barcodeType!,
      strictMatching,
      excludeMaterialCode,
    };

    const { conflicts, searchedProducts } = await searchForConflicts(
      barcode!,
      barcodeType!,
      searchFilter
    );

    const isUnique = conflicts.length === 0;

    // Find similar barcodes if requested
    let similarBarcodes: SimilarBarcode[] = [];
    if (includeSimilar) {
      try {
        const products = await loadCSVProducts();
        similarBarcodes = findSimilarBarcodes(barcode!, products);
      } catch (error) {
        console.error("Error finding similar barcodes:", error);
      }
    }

    // Generate suggestions if conflicts exist
    let suggestions: any = undefined;
    if (!isUnique && includeDetails) {
      suggestions = generateSuggestions(barcode!, conflicts);
    }

    // Get CSV stats for metadata
    const csvStats = await csvUpdateService.getCSVStatistics();

    const response: CheckUniquenessResponse = {
      success: true,
      isUnique,
      barcode: barcode!,
      barcodeType: barcodeType!,
      ...(conflicts.length > 0 && { conflictingProducts: conflicts }),
      ...(similarBarcodes.length > 0 && { similarBarcodes }),
      metadata: {
        searchedProducts,
        processingTime: Date.now() - startTime,
        cacheHit: false,
        lastUpdated: csvStats.lastModified.toISOString(),
      },
      ...(suggestions && { suggestions }),
    };

    // Cache the result
    await setCachedResult(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Uniqueness check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during uniqueness check",
        metadata: {
          processingTime: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

// ===== GET METHOD - Bulk Check =====
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const barcodes = searchParams.get("barcodes")?.split(",") || [];
    const barcodeType = searchParams.get("type") as
      | "ea"
      | "dsp"
      | "cs"
      | undefined;

    if (barcodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one barcode is required (use ?barcodes=123,456,789)",
        },
        { status: 400 }
      );
    }

    if (barcodes.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum 10 barcodes allowed per request",
        },
        { status: 400 }
      );
    }

    if (barcodeType && !["ea", "dsp", "cs"].includes(barcodeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid barcode type. Must be 'ea', 'dsp', or 'cs'",
        },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      barcodes.map(async (barcode) => {
        try {
          const { conflicts } = await searchForConflicts(
            barcode.trim(),
            barcodeType || "ea",
            { strictMatching: true }
          );

          return {
            barcode: barcode.trim(),
            isUnique: conflicts.length === 0,
            conflictCount: conflicts.length,
          };
        } catch (error) {
          return {
            barcode: barcode.trim(),
            isUnique: false,
            error: "Check failed",
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        unique: results.filter((r) => r.isUnique).length,
        conflicts: results.filter((r) => !r.isUnique && !r.error).length,
        errors: results.filter((r) => r.error).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform bulk uniqueness check",
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
