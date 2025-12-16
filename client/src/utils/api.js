import { BASE_URL } from "./constants";

// =============================================================================
// PERFORMANCE IMPROVEMENTS: Caching & Request Optimization
// =============================================================================

// Simple in-memory cache for API responses
// Reduces redundant network requests and improves loading times
const cache = new Map();

// PERFORMANCE: Different cache durations for different data types
const CACHE_DURATIONS = {
  FEATURED: 24 * 60 * 60 * 1000, // 24 hours (featured figures rotate daily)
  REGULAR: 5 * 60 * 1000,         // 5 minutes (general data)
  USER_DATA: 60 * 1000,           // 1 minute (user-specific data)
  SEARCH: 10 * 60 * 1000          // 10 minutes (search results)
};

// Performance monitoring utilities
const performanceTracker = {
  start: (label) => {
    if (performance && performance.mark) {
      performance.mark(`${label}-start`);
    }
    console.time(`⏱️ ${label}`);
  },
  
  end: (label) => {
    if (performance && performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        console.log(`⚡ ${label} completed in: ${measure.duration.toFixed(2)}ms`);
      }
    }
    console.timeEnd(`⏱️ ${label}`);
  }
};

// =============================================================================
// PERFORMANCE IMPROVEMENT: Cached Fetch Function
// =============================================================================

/**
 * Enhanced fetch function with caching and performance monitoring
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {string} cacheType - Cache duration type: 'FEATURED', 'REGULAR', 'USER_DATA', 'SEARCH'
 * @returns {Promise} - Fetch promise with cached response
 */
const cachedFetch = async (url, options = {}, cacheType = 'REGULAR') => {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cacheDuration = CACHE_DURATIONS[cacheType] || CACHE_DURATIONS.REGULAR;

  // PERFORMANCE: Check cache first to avoid network requests
  if (cacheType !== 'NONE') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log('🔄 Cache hit for:', url.split('/').pop());
      return cached.data;
    }
  }

  // PERFORMANCE: Track network request timing
  const requestLabel = `API-${url.split('/').pop()}`;
  performanceTracker.start(requestLabel);

  try {
    console.log('🌐 Network request to:', url.split('/').pop());
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // PERFORMANCE: Cache successful responses (but not empty arrays for searches)
    if (cacheType !== 'NONE') {
      const shouldCache = !(cacheType === 'SEARCH' && Array.isArray(data) && data.length === 0);
      if (shouldCache) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
        console.log(`💾 Cached response for: ${url.split('/').pop()} (${cacheType})`);
      } else {
        console.log(`⏭️  Skipping cache for empty search result: ${url.split('/').pop()}`);
      }
    }

    performanceTracker.end(requestLabel);
    return data;

  } catch (error) {
    performanceTracker.end(requestLabel);
    throw error;
  }
};

// =============================================================================
// PERFORMANCE IMPROVEMENT: Request Timeout & Retry Logic
// =============================================================================

/**
 * Enhanced fetch with timeout and retry capabilities
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @param {number} retries - Number of retries (default: 2)
 * @param {string} cacheType - Cache duration type
 * @returns {Promise} - Fetch promise with timeout and retry
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000, retries = 2, cacheType = 'REGULAR') => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      // PERFORMANCE: Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await cachedFetch(url, {
        ...options,
        signal: controller.signal,
      }, cacheType);

      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      if (attempt <= retries) {
        console.warn(`⚠️ Attempt ${attempt} failed, retrying...`, error.message);
        // PERFORMANCE: Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      } else {
        throw error;
      }
    }
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get authentication headers with token
 * @returns {object} - Headers object with authorization if token exists
 */
const getHeaders = () => {
  const token = localStorage.getItem("token");
  console.log("Using token:", token ? "Present" : "Missing");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Legacy response checker for backward compatibility
 * @param {Response} res - Fetch response object
 * @returns {Promise} - JSON response or rejection
 */
const checkResponse = (res) => {
  if (res.ok) {
    return res.json();
  }
  return Promise.reject(`Error: ${res.status}`);
};

// =============================================================================
// PERFORMANCE IMPROVEMENT: Optimized Figure API Functions
// =============================================================================

/**
 * Get all figures with caching and performance optimization
 * PERFORMANCE IMPROVEMENTS:
 * - Caching to reduce API calls
 * - Timeout handling to prevent hanging
 * - Error handling with fallback
 * - Performance monitoring
 */
const getFigures = async () => {
  try {
    performanceTracker.start('getFigures');
    
    // PERFORMANCE: Use cached fetch with timeout
    const data = await fetchWithTimeout(`${BASE_URL}/figures`);
    
    performanceTracker.end('getFigures');
    
    // PERFORMANCE: Ensure array return type for consistent handling
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    performanceTracker.end('getFigures');
    console.error("❌ Error fetching figures:", error);
    
    // PERFORMANCE: Return empty array as fallback instead of throwing
    // This prevents the entire UI from breaking if API fails
    return [];
  }
};

/**
 * Get featured figures with optimization
 * PERFORMANCE IMPROVEMENTS:
 * - Separate cache key for featured content
 * - Faster loading for homepage content
 * - Graceful fallback handling
 */
const getFeaturedFigures = async () => {
  try {
    performanceTracker.start('getFeaturedFigures');

    // PERFORMANCE: Use 24-hour cache for featured figures (they rotate daily)
    const data = await fetchWithTimeout(
      `${BASE_URL}/figures/featured`,
      {},
      30000,
      2,
      'FEATURED'
    );

    performanceTracker.end('getFeaturedFigures');
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    performanceTracker.end('getFeaturedFigures');
    console.error("❌ Error fetching featured figures:", error);
    
    // PERFORMANCE: Fallback to regular figures if featured fails
    console.log("🔄 Falling back to regular figures...");
    return getFigures().then(figures => figures.slice(0, 6));
  }
};

/**
 * Search figures with debouncing and dual-source optimization
 * PERFORMANCE IMPROVEMENTS:
 * - Prioritizes local database for faster results
 * - Caches search results to avoid repeat queries
 * - Graceful fallback to Wikipedia search
 * - Input validation to prevent unnecessary requests
 */
const searchFigures = async (params = {}) => {
  const query = params.query || params.searchTerm;

  // PERFORMANCE: Early return for invalid queries
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    performanceTracker.start('searchFigures');

    const queryParams = new URLSearchParams();
    queryParams.append("query", query.trim());

    // SEARCH STRATEGY: Always search Wikipedia with exact match DB prioritization
    // This uses the /api/search endpoint which:
    // 1. Checks for exact match in database
    // 2. Searches Wikipedia for all results
    // 3. Filters out duplicates already in DB
    // 4. Returns exact match first, then Wikipedia results (without auto-saving)
    console.log("🔍 Searching Wikipedia with DB exact match check...");
    const results = await fetchWithTimeout(
      `${BASE_URL}/search?${queryParams.toString()}`,
      {},
      30000, // 30 second timeout for Wikipedia search
      2,
      'SEARCH'
    );

    if (!results || !Array.isArray(results)) {
      performanceTracker.end('searchFigures');
      return [];
    }

    // Process and normalize results
    const processedResults = results.map((result) => ({
      ...result,
      wikipediaId: result.wikipediaId || result._id,
      imageUrl: result.imageUrl || result.image,
      category: result.category || matchToCategory(result),
      source: result.source || 'Wikipedia',
      isFromDatabase: !!result._id // Flag to distinguish DB vs Wikipedia results
    }));

    performanceTracker.end('searchFigures');
    console.log(`✅ Found ${processedResults.length} results (mix of DB exact matches and Wikipedia)`);
    return processedResults;

  } catch (error) {
    console.error("❌ Search failed:", error);
    performanceTracker.end('searchFigures');
    return [];
  }
};

/**
 * Get figure by ID with caching
 * PERFORMANCE IMPROVEMENTS:
 * - Caches individual figure data
 * - Faster subsequent loads of same figure
 */
const getFigureById = async (id) => {
  try {
    performanceTracker.start('getFigureById');
    
    const data = await fetchWithTimeout(`${BASE_URL}/figures/${id}`);
    
    performanceTracker.end('getFigureById');
    return data;
    
  } catch (error) {
    performanceTracker.end('getFigureById');
    console.error("❌ Error fetching figure by ID:", error);
    throw error;
  }
};

/**
 * Get figure by Wikipedia ID with caching
 * PERFORMANCE IMPROVEMENTS:
 * - Separate cache for Wikipedia-sourced figures
 * - Optimized for external content loading
 */
const getFigureByWikipediaId = async (wikipediaId) => {
  try {
    performanceTracker.start('getFigureByWikipediaId');
    
    const data = await fetchWithTimeout(`${BASE_URL}/figures/wiki/${wikipediaId}`);
    
    performanceTracker.end('getFigureByWikipediaId');
    return data;
    
  } catch (error) {
    performanceTracker.end('getFigureByWikipediaId');
    console.error("❌ Error fetching figure by Wikipedia ID:", error);
    throw error;
  }
};

// =============================================================================
// USER INTERACTION API FUNCTIONS
// =============================================================================

/**
 * Like a figure (requires authentication)
 * PERFORMANCE IMPROVEMENTS:
 * - No caching for write operations
 * - Immediate feedback handling
 */
const likeFigure = async (id) => {
  try {
    performanceTracker.start('likeFigure');
    
    const response = await fetch(`${BASE_URL}/figures/${id}/like`, {
      method: "POST",
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    performanceTracker.end('likeFigure');
    
    // PERFORMANCE: Clear relevant cache entries after like action
    clearCacheByPattern('/figures');
    
    return data;
    
  } catch (error) {
    performanceTracker.end('likeFigure');
    console.error("❌ Error liking figure:", error);
    throw error;
  }
};

/**
 * Get saved figures for current user
 * PERFORMANCE IMPROVEMENTS:
 * - Caches user's saved figures
 * - Graceful fallback to empty array
 */
const getSavedFigures = async () => {
  try {
    performanceTracker.start('getSavedFigures');
    
    const data = await fetchWithTimeout(`${BASE_URL}/users/me/saved`, {
      headers: getHeaders(),
    });
    
    performanceTracker.end('getSavedFigures');
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    performanceTracker.end('getSavedFigures');
    console.error("❌ Error fetching saved figures:", error);
    
    // PERFORMANCE: Return empty array instead of throwing for better UX
    return [];
  }
};

/**
 * Save a figure (with data normalization)
 * PERFORMANCE IMPROVEMENTS:
 * - Normalizes data before sending to reduce server processing
 * - Clears cache after save to ensure fresh data
 */
const saveFigure = async (figure) => {
  try {
    performanceTracker.start('saveFigure');
    
    // PERFORMANCE: Normalize figure data to reduce server processing time
    const figureToSave = {
      ...figure,
      imageUrl: figure.imageUrl || figure.image,
      category: figure.category || matchToCategory(figure),
      ...(figure.wikipediaId && { wikipediaId: figure.wikipediaId }),
    };

    console.log("💾 Saving figure with data:", figureToSave);

    const response = await fetch(`${BASE_URL}/figures/save`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(figureToSave),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    performanceTracker.end('saveFigure');
    
    // PERFORMANCE: Clear cache after save operation
    clearCacheByPattern('/saved');
    
    return data;
    
  } catch (error) {
    performanceTracker.end('saveFigure');
    console.error("❌ Error saving figure:", error);
    throw error;
  }
};

/**
 * Unsave a figure
 * PERFORMANCE IMPROVEMENTS:
 * - Quick DELETE operation
 * - Cache invalidation for immediate UI update
 */
const unsaveFigure = async (figureId) => {
  try {
    performanceTracker.start('unsaveFigure');
    
    const response = await fetch(`${BASE_URL}/figures/unsave/${figureId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    performanceTracker.end('unsaveFigure');
    
    // PERFORMANCE: Clear cache after unsave operation
    clearCacheByPattern('/saved');
    
    return data;
    
  } catch (error) {
    performanceTracker.end('unsaveFigure');
    console.error("❌ Error unsaving figure:", error);
    throw error;
  }
};

// =============================================================================
// PERFORMANCE IMPROVEMENT: Category Matching Optimization
// =============================================================================

/**
 * Optimized category matching function
 * PERFORMANCE IMPROVEMENTS:
 * - Early returns to avoid unnecessary processing
 * - Cached toLowerCase() operations
 * - Optimized regex patterns for faster matching
 */
const matchToCategory = (figure) => {
  // PERFORMANCE: Early return for invalid input
  if (!figure || !figure.description) {
    return "Intellectuals Leaders";
  }

  // PERFORMANCE: Cache toLowerCase operations
  const description = figure.description.toLowerCase();
  const tags = figure.tags ? figure.tags.map((tag) => tag.toLowerCase()) : [];
  const allText = `${description} ${tags.join(' ')}`;

  // PERFORMANCE: Use single text search instead of multiple includes()
  // Define optimized keyword patterns for faster matching
  const categoryPatterns = {
    "Civil Rights Activists": /civil rights|rights movement|activist|protest|discrimination|segregation/,
    "Political Leaders": /president|senator|congressman|politician|mayor|governor|political/,
    "Arts, Culture & Entertainment": /actor|actress|singer|musician|artist|entertainer|performer|music|film|television/,
    "Literary Icons": /author|writer|poet|novelist|literature|book|poetry/,
    "Educators & Scholars": /professor|teacher|educator|scholar|university|education|academic/,
    "Inventors & Innovators": /inventor|invention|innovator|scientist|engineer|researcher|technology/,
    "Athletic Icons": /athlete|sports|olympic|baseball|basketball|football|boxing|tennis/,
    "Freedom Fighters": /freedom fighter|revolutionary|resistance|liberation|independence|rebellion/,
    "Pan-African Leaders": /pan-african|african unity|diaspora|african nationalism/,
  };

  // PERFORMANCE: Test patterns in order of likelihood
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(allText)) {
      return category;
    }
  }

  // Default category
  return "Intellectuals Leaders";
};

// =============================================================================
// PERFORMANCE IMPROVEMENT: Cache Management Functions
// =============================================================================

/**
 * Clear cache entries by URL pattern
 * @param {string} pattern - URL pattern to match for clearing
 */
const clearCacheByPattern = (pattern) => {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching: ${pattern}`);
};

/**
 * Clear all cache (useful for debugging or logout)
 */
const clearAllCache = () => {
  cache.clear();
  console.log('🗑️ All API cache cleared');
};

/**
 * Get cache statistics for debugging
 */
const getCacheStats = () => {
  const stats = {
    size: cache.size,
    entries: Array.from(cache.keys()).map(key => ({
      key,
      age: Date.now() - cache.get(key).timestamp,
      expired: (Date.now() - cache.get(key).timestamp) > CACHE_DURATION
    }))
  };
  console.log('📊 Cache Stats:', stats);
  return stats;
};

/**
 * Health check for API performance monitoring
 */
const checkApiHealth = async () => {
  try {
    performanceTracker.start('apiHealthCheck');
    
    const response = await fetch(`${BASE_URL.replace('/api', '/health')}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    performanceTracker.end('apiHealthCheck');
    
    console.log('✅ API Health Check:', data);
    return true;
    
  } catch (error) {
    performanceTracker.end('apiHealthCheck');
    console.error('❌ API Health Check Failed:', error);
    return false;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Core API functions
  getFigures,
  getFeaturedFigures,
  searchFigures,
  getFigureById,
  getFigureByWikipediaId,
  
  // User interaction functions
  likeFigure,
  getSavedFigures,
  saveFigure,
  unsaveFigure,
  
  // Utility functions
  matchToCategory,
  
  // Performance monitoring functions
  clearAllCache,
  getCacheStats,
  checkApiHealth,
  clearCacheByPattern,
};