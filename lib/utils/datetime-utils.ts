/**
 * DateTime Utility Functions
 * Helper functions for handling datetime conversions between different formats
 */

/**
 * Convert datetime-local input value to ISO 8601 datetime string
 * Input: "2025-11-23T19:04" (datetime-local format)
 * Output: "2025-11-23T19:04:00.000Z" (ISO 8601 format)
 */
export function datetimeLocalToISO(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  
  // If already in ISO format, return as is
  if (datetimeLocal.includes("T") && datetimeLocal.includes("Z")) {
    return datetimeLocal;
  }
  
  // Convert datetime-local format to ISO
  // datetime-local: "2025-11-23T19:04"
  // ISO: "2025-11-23T19:04:00.000Z"
  const date = new Date(datetimeLocal);
  
  if (isNaN(date.getTime())) {
    throw new Error("Invalid datetime format");
  }
  
  return date.toISOString();
}

/**
 * Convert ISO 8601 datetime string to datetime-local input value
 * Input: "2025-11-23T19:04:00.000Z" (ISO 8601 format)
 * Output: "2025-11-23T19:04" (datetime-local format)
 */
export function isoToDatetimeLocal(isoString: string): string {
  if (!isoString) return "";
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "";
    }
    
    // Get local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Error converting ISO to datetime-local:", error);
    return "";
  }
}

/**
 * Validate that end date is after start date
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }
    
    return end > start;
  } catch {
    return false;
  }
}

