// src/services/csvUpdateService.ts
// Server-side CSV operations (Node.js environment only)
import * as fs from "fs/promises";
import * as path from "path";
import { CSVProductRow } from "../data/types/csvTypes";
import { ProductEntryFormData } from "../components/manual-product/ProductEntryForm";

// Note: This service can only be used in Node.js environment (API routes)
// For client-side operations, use csvClientService.ts

// ===== INTERFACES =====
interface CSVUpdateResult {
  success: boolean;
  rowsAdded: number;
  backupPath?: string;
  error?: string;
  warnings?: string[];
  fileSize?: {
    before: number;
    after: number;
  };
}

interface CSVBackupResult {
  success: boolean;
  backupPath?: string;
  timestamp: Date;
  error?: string;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  missingColumns?: string[];
}

interface CSVUpdateOptions {
  createBackup?: boolean;
  validateBeforeUpdate?: boolean;
  appendMode?: boolean;
  encoding?: "utf8" | "utf16le" | "latin1";
  backupDirectory?: string;
}

interface CSVLockManager {
  lockFile: string;
  maxWaitTime: number;
  checkInterval: number;
}

// ===== CONSTANTS =====
const CSV_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "product_list_csv.csv"
);
const BACKUP_DIRECTORY = path.join(process.cwd(), "backups", "csv");
const LOCK_FILE_PATH = path.join(process.cwd(), "tmp", "csv.lock");

const REQUIRED_CSV_COLUMNS = [
  "Material",
  "Description",
  "Thai Desc.",
  "Pack Size",
  "Product Group",
  "Shelflife (Months)",
  "Bar Code EA",
  "Bar Code DSP",
  "Bar Code CS",
];

const DEFAULT_UPDATE_OPTIONS: CSVUpdateOptions = {
  createBackup: true,
  validateBeforeUpdate: true,
  appendMode: true,
  encoding: "utf8",
  backupDirectory: BACKUP_DIRECTORY,
};

const LOCK_CONFIG: CSVLockManager = {
  lockFile: LOCK_FILE_PATH,
  maxWaitTime: 30000, // 30 seconds
  checkInterval: 100, // 100ms
};

// ===== UTILITY FUNCTIONS =====
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
};

const formatCSVField = (value: string): string => {
  if (!value) return "";

  // If the value contains comma, newline, or quote, wrap in quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    // Escape existing quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return value;
};

const formatCSVRow = (row: CSVProductRow): string => {
  const values = [
    formatCSVField(row.Material),
    formatCSVField(row.Description),
    formatCSVField(row["Thai Desc."]),
    formatCSVField(row["Pack Size"]),
    formatCSVField(row["Product Group"]),
    formatCSVField(row["Shelflife (Months)"]),
    formatCSVField(row["Bar Code EA"]),
    formatCSVField(row["Bar Code DSP"]),
    formatCSVField(row["Bar Code CS"]),
  ];

  return values.join(",");
};

// ===== LOCK MANAGEMENT =====
class CSVFileLock {
  private static instance: CSVFileLock;
  private isLocked = false;
  private lockTimestamp?: Date;

  static getInstance(): CSVFileLock {
    if (!CSVFileLock.instance) {
      CSVFileLock.instance = new CSVFileLock();
    }
    return CSVFileLock.instance;
  }

  async acquireLock(timeout = LOCK_CONFIG.maxWaitTime): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Check if lock file exists
        await fs.access(LOCK_CONFIG.lockFile);

        // Lock file exists, wait
        await new Promise((resolve) =>
          setTimeout(resolve, LOCK_CONFIG.checkInterval)
        );
      } catch {
        // Lock file doesn't exist, try to create it
        try {
          await ensureDirectoryExists(path.dirname(LOCK_CONFIG.lockFile));

          const lockData = {
            timestamp: new Date().toISOString(),
            pid: process.pid,
            user: process.env.USER || "unknown",
          };

          await fs.writeFile(LOCK_CONFIG.lockFile, JSON.stringify(lockData), {
            flag: "wx",
          });

          this.isLocked = true;
          this.lockTimestamp = new Date();
          return true;
        } catch {
          // Another process created the lock, continue waiting
          await new Promise((resolve) =>
            setTimeout(resolve, LOCK_CONFIG.checkInterval)
          );
        }
      }
    }

    throw new Error(`Unable to acquire CSV lock within ${timeout}ms`);
  }

  async releaseLock(): Promise<void> {
    if (this.isLocked) {
      try {
        await fs.unlink(LOCK_CONFIG.lockFile);
        this.isLocked = false;
        this.lockTimestamp = undefined;
      } catch (error) {
        console.error("Failed to release lock:", error);
        // Don't throw here as the operation might have succeeded
      }
    }
  }

  isCurrentlyLocked(): boolean {
    return this.isLocked;
  }

  getLockAge(): number | null {
    if (!this.lockTimestamp) return null;
    return Date.now() - this.lockTimestamp.getTime();
  }
}

// ===== MAIN SERVICE CLASS =====
export class CSVUpdateService {
  private lockManager: CSVFileLock;

  constructor() {
    this.lockManager = CSVFileLock.getInstance();
  }

  // ===== CSV VALIDATION =====
  async validateCSVFile(
    filePath: string = CSV_FILE_PATH
  ): Promise<CSVValidationResult> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        return {
          isValid: false,
          errors: ["CSV file is empty"],
          warnings: [],
          rowCount: 0,
          columnCount: 0,
        };
      }

      // Parse header
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required columns
      const missingColumns = REQUIRED_CSV_COLUMNS.filter(
        (col) => !headers.includes(col)
      );
      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
      }

      // Check for extra columns
      const extraColumns = headers.filter(
        (col) => !REQUIRED_CSV_COLUMNS.includes(col)
      );
      if (extraColumns.length > 0) {
        warnings.push(`Extra columns found: ${extraColumns.join(", ")}`);
      }

      // Validate data rows
      let validRowCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const fields = parseCSVLine(line);

        if (fields.length !== headers.length) {
          errors.push(
            `Row ${i + 1}: Field count mismatch (expected ${
              headers.length
            }, got ${fields.length})`
          );
          continue;
        }

        // Check required fields
        const materialCode = fields[headers.indexOf("Material")];
        if (!materialCode?.trim()) {
          errors.push(`Row ${i + 1}: Material code is required`);
          continue;
        }

        validRowCount++;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        rowCount: validRowCount,
        columnCount: headers.length,
        missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Failed to read CSV file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings: [],
        rowCount: 0,
        columnCount: 0,
      };
    }
  }

  // ===== BACKUP OPERATIONS =====
  async createBackup(
    sourcePath: string = CSV_FILE_PATH,
    backupDir: string = BACKUP_DIRECTORY
  ): Promise<CSVBackupResult> {
    try {
      await ensureDirectoryExists(backupDir);

      const timestamp = new Date();
      const timestampStr = timestamp
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .split(".")[0];

      const backupFileName = `product_list_backup_${timestampStr}.csv`;
      const backupPath = path.join(backupDir, backupFileName);

      // Copy the file
      await fs.copyFile(sourcePath, backupPath);

      // Verify backup
      const originalStats = await fs.stat(sourcePath);
      const backupStats = await fs.stat(backupPath);

      if (originalStats.size !== backupStats.size) {
        throw new Error("Backup file size mismatch");
      }

      return {
        success: true,
        backupPath,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown backup error",
      };
    }
  }

  async cleanupOldBackups(
    backupDir: string = BACKUP_DIRECTORY,
    maxAge: number = 30 * 24 * 60 * 60 * 1000, // 30 days
    maxCount: number = 50
  ): Promise<{ deleted: number; errors: string[] }> {
    try {
      await ensureDirectoryExists(backupDir);
      const files = await fs.readdir(backupDir);

      const backupFiles = files
        .filter(
          (file) =>
            file.startsWith("product_list_backup_") && file.endsWith(".csv")
        )
        .map(async (file) => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        });

      const backupFileStats = await Promise.all(backupFiles);
      const now = Date.now();
      const errors: string[] = [];
      let deleted = 0;

      // Sort by modification time (newest first)
      backupFileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      for (let i = 0; i < backupFileStats.length; i++) {
        const backup = backupFileStats[i];
        const age = now - backup.mtime.getTime();

        // Delete if too old or exceeds max count
        if (age > maxAge || i >= maxCount) {
          try {
            await fs.unlink(backup.path);
            deleted++;
          } catch (error) {
            errors.push(
              `Failed to delete ${backup.file}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
      }

      return { deleted, errors };
    } catch (error) {
      return {
        deleted: 0,
        errors: [
          `Failed to cleanup backups: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
      };
    }
  }

  // ===== CSV UPDATE OPERATIONS =====
  async addProductToCSV(
    formData: ProductEntryFormData,
    options: CSVUpdateOptions = {}
  ): Promise<CSVUpdateResult> {
    const config = { ...DEFAULT_UPDATE_OPTIONS, ...options };
    let backupPath: string | undefined;

    try {
      // Acquire lock
      await this.lockManager.acquireLock();

      // Get file size before update
      let beforeSize = 0;
      try {
        const stats = await fs.stat(CSV_FILE_PATH);
        beforeSize = stats.size;
      } catch {
        // File might not exist yet
      }

      // Create backup if requested
      if (config.createBackup) {
        const backupResult = await this.createBackup();
        if (!backupResult.success) {
          throw new Error(`Backup failed: ${backupResult.error}`);
        }
        backupPath = backupResult.backupPath;
      }

      // Validate CSV if requested
      if (config.validateBeforeUpdate) {
        const validation = await this.validateCSVFile();
        if (!validation.isValid) {
          throw new Error(
            `CSV validation failed: ${validation.errors.join(", ")}`
          );
        }
      }

      // Prepare new CSV row
      const newRow: CSVProductRow = {
        Material: formData.materialCode,
        Description: formData.description,
        "Thai Desc.": formData.thaiDescription,
        "Pack Size": formData.packSize,
        "Product Group": formData.productGroup,
        "Shelflife (Months)": formData.shelfLife || "",
        "Bar Code EA":
          formData.barcodeType === "ea" ? formData.scannedBarcode : "",
        "Bar Code DSP":
          formData.barcodeType === "dsp" ? formData.scannedBarcode : "",
        "Bar Code CS":
          formData.barcodeType === "cs" ? formData.scannedBarcode : "",
      };

      // Add to CSV
      const csvRow = formatCSVRow(newRow);

      if (config.appendMode) {
        // Append to existing file
        await fs.appendFile(CSV_FILE_PATH, `\n${csvRow}`, {
          encoding: config.encoding,
        });
      } else {
        // Read, modify, and write entire file
        let content = "";
        try {
          content = await fs.readFile(CSV_FILE_PATH, config.encoding);
        } catch {
          // File doesn't exist, create with header
          content = REQUIRED_CSV_COLUMNS.join(",");
        }

        if (!content.endsWith("\n") && content.length > 0) {
          content += "\n";
        }
        content += csvRow;

        await fs.writeFile(CSV_FILE_PATH, content, {
          encoding: config.encoding,
        });
      }

      // Get file size after update
      const stats = await fs.stat(CSV_FILE_PATH);
      const afterSize = stats.size;

      // Verify the update
      const verification = await this.verifyProductAdded(formData);
      if (!verification.found) {
        throw new Error("Product verification failed after adding to CSV");
      }

      return {
        success: true,
        rowsAdded: 1,
        backupPath,
        fileSize: {
          before: beforeSize,
          after: afterSize,
        },
      };
    } catch (error) {
      return {
        success: false,
        rowsAdded: 0,
        backupPath,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      // Always release lock
      await this.lockManager.releaseLock();
    }
  }

  // ===== VERIFICATION =====
  private async verifyProductAdded(formData: ProductEntryFormData): Promise<{
    found: boolean;
    rowNumber?: number;
  }> {
    try {
      const content = await fs.readFile(CSV_FILE_PATH, "utf8");
      const lines = content.split("\n");

      for (let i = 1; i < lines.length; i++) {
        // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const fields = parseCSVLine(line);

        // Check Material Code and Barcode
        if (fields[0] === formData.materialCode) {
          // Check if barcode matches in the correct column
          const barcodeIndex =
            formData.barcodeType === "ea"
              ? 6
              : formData.barcodeType === "dsp"
              ? 7
              : 8;

          if (fields[barcodeIndex] === formData.scannedBarcode) {
            return { found: true, rowNumber: i + 1 };
          }
        }
      }

      return { found: false };
    } catch {
      return { found: false };
    }
  }

  // ===== CSV STATISTICS =====
  async getCSVStatistics(filePath: string = CSV_FILE_PATH): Promise<{
    totalRows: number;
    totalProducts: number;
    barcodeStats: {
      withEA: number;
      withDSP: number;
      withCS: number;
      total: number;
    };
    productGroups: Record<string, number>;
    fileSize: number;
    lastModified: Date;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, "utf8");
      const lines = content.split("\n").filter((line) => line.trim());

      let totalProducts = 0;
      let withEA = 0;
      let withDSP = 0;
      let withCS = 0;
      const productGroups: Record<string, number> = {};

      // Parse header to get column indices
      const headers = parseCSVLine(lines[0]);
      const productGroupIndex = headers.indexOf("Product Group");
      const eaIndex = headers.indexOf("Bar Code EA");
      const dspIndex = headers.indexOf("Bar Code DSP");
      const csIndex = headers.indexOf("Bar Code CS");

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = parseCSVLine(line);
        totalProducts++;

        // Count barcode types
        if (fields[eaIndex]?.trim()) withEA++;
        if (fields[dspIndex]?.trim()) withDSP++;
        if (fields[csIndex]?.trim()) withCS++;

        // Count product groups
        const group = fields[productGroupIndex]?.trim();
        if (group) {
          productGroups[group] = (productGroups[group] || 0) + 1;
        }
      }

      return {
        totalRows: lines.length,
        totalProducts,
        barcodeStats: {
          withEA,
          withDSP,
          withCS,
          total: withEA + withDSP + withCS,
        },
        productGroups,
        fileSize: stats.size,
        lastModified: stats.mtime,
      };
    } catch (error) {
      throw new Error(
        `Failed to get CSV statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ===== HEALTH CHECK =====
  async healthCheck(): Promise<{
    csvExists: boolean;
    csvReadable: boolean;
    csvWritable: boolean;
    backupDirExists: boolean;
    lockStatus: {
      isLocked: boolean;
      lockAge?: number;
    };
    diskSpace?: number;
  }> {
    const result = {
      csvExists: false,
      csvReadable: false,
      csvWritable: false,
      backupDirExists: false,
      lockStatus: {
        isLocked: this.lockManager.isCurrentlyLocked(),
        lockAge: this.lockManager.getLockAge() || undefined,
      },
    };

    try {
      // Check CSV file
      await fs.access(CSV_FILE_PATH, fs.constants.F_OK);
      result.csvExists = true;

      await fs.access(CSV_FILE_PATH, fs.constants.R_OK);
      result.csvReadable = true;

      await fs.access(CSV_FILE_PATH, fs.constants.W_OK);
      result.csvWritable = true;
    } catch {
      // File access failed
    }

    try {
      // Check backup directory
      await fs.access(BACKUP_DIRECTORY, fs.constants.F_OK);
      result.backupDirExists = true;
    } catch {
      // Backup directory doesn't exist
    }

    return result;
  }
}

// ===== SINGLETON INSTANCE =====
export const csvUpdateService = new CSVUpdateService();

// ===== EXPORT TYPES =====
export type {
  CSVUpdateResult,
  CSVBackupResult,
  CSVValidationResult,
  CSVUpdateOptions,
};
