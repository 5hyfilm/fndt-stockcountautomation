// src/data/readers/csvReader.ts

// Function to read CSV file with proper environment handling
export const readCSVFile = async (): Promise<string> => {
  // Check if we're in browser environment
  if (typeof window !== "undefined") {
    console.log("🌐 Loading CSV from browser environment...");

    const baseUrl = window.location.origin;
    const csvUrl = `${baseUrl}/product_list_csv.csv`;

    console.log("📡 Fetching from:", csvUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(csvUrl, {
        signal: controller.signal,
        cache: "no-cache",
        headers: {
          Accept: "text/csv, text/plain, */*",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch CSV: HTTP ${response.status} ${response.statusText}`
        );
      }

      const csvText = await response.text();
      console.log("✅ CSV loaded from browser, size:", csvText.length);
      return csvText;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        throw new Error("Failed to fetch CSV: Request timeout");
      }
      throw new Error(`Failed to fetch CSV: ${fetchError.message}`);
    }
  } else {
    console.log("🖥️ Loading CSV from server environment...");

    try {
      // Dynamic import for server-side modules
      const { promises: fs } = await import("fs");
      const path = await import("path");

      const csvPath = path.join(
        process.cwd(),
        "public",
        "product_list_csv.csv"
      );
      console.log("📂 Reading from path:", csvPath);

      const csvText = await fs.readFile(csvPath, "utf-8");
      console.log("✅ CSV loaded from server, size:", csvText.length);
      return csvText;
    } catch (fsError: any) {
      console.error("❌ Server file read error:", fsError);

      // Fallback to fetch in server environment
      console.log("🔄 Trying fetch fallback in server...");
      const csvUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/product_list_csv.csv`;

      try {
        const response = await fetch(csvUrl, {
          signal: AbortSignal.timeout(10000),
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (fetchFallbackError: any) {
        throw new Error(
          `Both fs and fetch failed: ${fsError.message} | ${fetchFallbackError.message}`
        );
      }
    }
  }
};
