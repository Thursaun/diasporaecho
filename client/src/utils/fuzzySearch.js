// =============================================================================
// FUZZY SEARCH UTILITY
// Implements Wikipedia-style search with partial matching and typo tolerance
// =============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Used for typo tolerance and close spelling matches
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Edit distance
 */
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculate similarity score between query and text
 * Higher score = better match
 * @param {string} query - Search query
 * @param {string} text - Text to search in
 * @returns {number} - Similarity score (0-100)
 */
const calculateSimilarity = (query, text) => {
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();

  // Exact match = highest score
  if (textLower === queryLower) return 100;

  // Text contains exact query = very high score
  if (textLower.includes(queryLower)) return 90;

  // Split into words for partial matching
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);

  let matchScore = 0;

  // Check each query word against text words
  queryWords.forEach(queryWord => {
    if (queryWord.length < 2) return; // Skip single characters

    // Check for exact word match
    if (textWords.some(tw => tw === queryWord)) {
      matchScore += 20;
      return;
    }

    // Check for partial word match (word starts with query)
    if (textWords.some(tw => tw.startsWith(queryWord))) {
      matchScore += 15;
      return;
    }

    // Check for word contains query
    if (textWords.some(tw => tw.includes(queryWord))) {
      matchScore += 10;
      return;
    }

    // Check for typo tolerance using Levenshtein distance
    textWords.forEach(textWord => {
      if (textWord.length >= queryWord.length - 1) {
        const distance = levenshteinDistance(queryWord, textWord);
        const maxLength = Math.max(queryWord.length, textWord.length);
        const similarity = 1 - (distance / maxLength);

        // If similarity is high enough (allows 1-2 character differences)
        if (similarity >= 0.75) {
          matchScore += Math.floor(similarity * 8);
        }
      }
    });
  });

  return Math.min(matchScore, 85); // Cap at 85 for partial matches
};

/**
 * Common synonyms for historical figure attributes
 */
const SYNONYMS = {
  'leader': ['president', 'ruler', 'chief', 'head', 'commander', 'governor'],
  'activist': ['advocate', 'campaigner', 'reformer', 'fighter', 'champion'],
  'writer': ['author', 'novelist', 'poet', 'literary'],
  'scientist': ['researcher', 'inventor', 'scholar', 'innovator'],
  'artist': ['painter', 'sculptor', 'creator', 'performer'],
  'politician': ['statesman', 'senator', 'congressman', 'representative'],
  'teacher': ['educator', 'professor', 'instructor', 'scholar'],
  'athlete': ['player', 'sportsman', 'competitor', 'champion'],
  'musician': ['singer', 'composer', 'performer', 'artist'],
  'revolutionary': ['rebel', 'freedom fighter', 'insurgent', 'activist'],
};

/**
 * Expand query with synonyms
 * @param {string} query - Original search query
 * @returns {string[]} - Array of query variations including synonyms
 */
const expandQueryWithSynonyms = (query) => {
  const queryLower = query.toLowerCase().trim();
  const variations = [queryLower];

  // Check each synonym group
  Object.entries(SYNONYMS).forEach(([key, synonyms]) => {
    if (queryLower.includes(key)) {
      synonyms.forEach(synonym => {
        variations.push(queryLower.replace(key, synonym));
      });
    }

    synonyms.forEach(synonym => {
      if (queryLower.includes(synonym)) {
        variations.push(queryLower.replace(synonym, key));
      }
    });
  });

  return [...new Set(variations)]; // Remove duplicates
};

/**
 * Fuzzy search filter for figures
 * Matches partial words, typos, and synonyms
 * @param {Array} figures - Array of figure objects
 * @param {string} query - Search query
 * @returns {Array} - Filtered and sorted array of figures
 */
export const fuzzySearchFilter = (figures, query) => {
  if (!query || query.trim().length < 2) return figures;
  if (!Array.isArray(figures)) return [];

  const queryVariations = expandQueryWithSynonyms(query);

  // Score each figure based on relevance
  const scoredFigures = figures.map(figure => {
    let maxScore = 0;

    // Search across all text fields
    const searchableText = [
      figure.name || '',
      figure.description || '',
      ...(figure.tags || []),
      figure.category || '',
      figure.years || '',
    ].join(' ');

    // Calculate score for each query variation and keep the highest
    queryVariations.forEach(queryVar => {
      const score = calculateSimilarity(queryVar, searchableText);
      maxScore = Math.max(maxScore, score);
    });

    return {
      figure,
      score: maxScore,
    };
  });

  // Filter figures with score > 0 and sort by score
  return scoredFigures
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.figure);
};

/**
 * Check if query matches figure (for highlighting/indication)
 * @param {object} figure - Figure object
 * @param {string} query - Search query
 * @returns {boolean} - True if matches
 */
export const isMatch = (figure, query) => {
  if (!query || !figure) return false;

  const searchableText = [
    figure.name || '',
    figure.description || '',
    ...(figure.tags || []),
  ].join(' ').toLowerCase();

  return calculateSimilarity(query, searchableText) > 0;
};
