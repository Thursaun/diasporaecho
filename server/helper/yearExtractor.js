/**
 * Shared Helper: Extract birth-death years range from a Wikipedia extract string.
 * Supports various parenthetical formats and falls back gracefully.
 * 
 * @param {string} extract - The Wikipedia page intro text
 * @returns {string} - Formatted year range (e.g. "1929 - 1968", "1954 - Present") or "Unknown"
 */
const extractYearsFromExtract = (extract) => {
  if (!extract || typeof extract !== "string") return "Unknown";
  
  // Normalize spacing and different dashes to standard hyphens
  const cleanText = extract.replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim();
  
  // 1. Try to extract from the first parenthetical section (which usually contains dates)
  const parenMatch = cleanText.substring(0, 200).match(/\(([^)]+)\)/);
  if (parenMatch) {
    const parenText = parenMatch[1];
    
    // Find all 4-digit numbers in the parenthetical
    const years = parenText.match(/\b\d{4}\b/g);
    if (years && years.length >= 2) {
      // Sort them to ensure birth year is before death year
      const sortedYears = [...years].map(Number).sort((a, b) => a - b);
      return `${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]}`;
    }
    
    if (years && years.length === 1) {
      const year = years[0];
      // Check if it's birth or death
      if (/born|b\./i.test(parenText)) {
        return `${year} - Present`;
      }
      if (/died|d\./i.test(parenText)) {
        return `Unknown - ${year}`;
      }
      // Fallback for single year in parentheses
      return `${year} - Present`;
    }
  }
  
  // 2. Fallback: Search the first 300 characters globally for two 4-digit numbers
  const globalYears = cleanText.substring(0, 300).match(/\b\d{4}\b/g);
  if (globalYears && globalYears.length >= 2) {
    const sortedYears = [...globalYears].map(Number).sort((a, b) => a - b);
    return `${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]}`;
  }
  
  if (globalYears && globalYears.length === 1) {
    const year = globalYears[0];
    if (/born|b\./i.test(cleanText)) {
      return `${year} - Present`;
    }
  }

  return "Unknown";
};

module.exports = {
  extractYearsFromExtract
};
