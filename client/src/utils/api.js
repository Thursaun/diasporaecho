import { BASE_URL } from "./constants";

// =============================================================================
// PERFORMANCE IMPROVEMENTS: Caching & Request Optimization
// =============================================================================

// Simple in-memory cache for API responses
// Reduces redundant network requests and improves loading times
const cache = new Map();

// PERFORMANCE: Request deduplication - track in-flight requests to prevent duplicates
const pendingRequests = new Map();

// PERFORMANCE: Different cache durations for different data types
const CACHE_DURATIONS = {
  FEATURED: 24 * 60 * 60 * 1000, // 24 hours (featured figures rotate daily)
  REGULAR: 5 * 60 * 1000,         // 5 minutes (general data)
  USER_DATA: 60 * 1000,           // 1 minute (user-specific data)
  SEARCH: 10 * 60 * 1000          // 10 minutes (search results)
};

// PERFORMANCE: Track active timers to prevent race condition warnings
const activeTimers = new Set();

// Performance monitoring utilities with race condition fix
const performanceTracker = {
  start: (label) => {
    // Prevent duplicate timer warnings by checking if timer exists
    if (activeTimers.has(label)) {
      return; // Timer already running, skip
    }
    activeTimers.add(label);

    if (performance && performance.mark) {
      try {
        performance.mark(`${label}-start`);
      } catch {
        // Ignore if mark already exists
      }
    }
    try {
      console.time(`⏱️ ${label}`);
    } catch {
      // Ignore timer conflicts
    }
  },

  end: (label) => {
    // Only end timer if it was started
    if (!activeTimers.has(label)) {
      return; // Timer wasn't started, skip
    }
    activeTimers.delete(label);

    if (performance && performance.mark && performance.measure) {
      try {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);

        const measures = performance.getEntriesByName(label);
        const measure = measures[measures.length - 1];
        if (measure) {
          console.log(`⚡ ${label} completed in: ${measure.duration.toFixed(2)}ms`);
        }
        // Clean up performance entries
        performance.clearMarks(`${label}-start`);
        performance.clearMarks(`${label}-end`);
        performance.clearMeasures(label);
      } catch {
        // Ignore measurement errors
      }
    }
    try {
      console.timeEnd(`⏱️ ${label}`);
    } catch {
      // Ignore timer conflicts
    }
  }
};

// =============================================================================
// PERFORMANCE IMPROVEMENT: Cached Fetch Function with Request Deduplication
// =============================================================================

/**
 * Enhanced fetch function with caching, request deduplication and performance monitoring
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

  // PERFORMANCE: Request deduplication - if request is already in-flight, return existing promise
  if (pendingRequests.has(cacheKey)) {
    console.log('🔗 Joining existing request for:', url.split('/').pop());
    return pendingRequests.get(cacheKey);
  }

  // PERFORMANCE: Track network request timing
  const requestLabel = `API-${url.split('/').pop()}`;
  performanceTracker.start(requestLabel);

  // Create the request promise
  const requestPromise = (async () => {
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
    } finally {
      // PERFORMANCE: Clean up pending request when done
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the promise for deduplication
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
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
 * - localStorage persistence (survives page refresh)
 * - Stale-while-revalidate (show cached, refresh in background)
 * - Timeout handling to prevent hanging
 * - Performance monitoring
 */
const getFigures = async () => {
  const STORAGE_KEY = 'diaspora_figures';
  const STORAGE_TIMESTAMP_KEY = 'diaspora_figures_ts';
  const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  try {
    performanceTracker.start('getFigures');

    // PERFORMANCE: Check localStorage for instant load
    const cachedData = localStorage.getItem(STORAGE_KEY);
    const cachedTimestamp = parseInt(localStorage.getItem(STORAGE_TIMESTAMP_KEY) || '0');
    const isStale = Date.now() - cachedTimestamp > STALE_THRESHOLD;

    // If we have cached data, return it immediately
    if (cachedData) {
      const figures = JSON.parse(cachedData);
      console.log(`⚡ Loaded ${figures.length} figures from localStorage (${isStale ? 'stale' : 'fresh'})`);

      // If stale, refresh in background (don't await)
      if (isStale) {
        console.log('🔄 Refreshing figures in background...');
        fetchWithTimeout(`${BASE_URL}/figures`)
          .then(freshData => {
            if (Array.isArray(freshData) && freshData.length > 0) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
              localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
              console.log(`✅ Background refresh: ${freshData.length} figures cached`);
            }
          })
          .catch(err => console.warn('Background refresh failed:', err.message));
      }

      performanceTracker.end('getFigures');
      return figures;
    }

    // No cache - fetch from network
    console.log('🌐 No cached figures, fetching from network...');
    const data = await fetchWithTimeout(`${BASE_URL}/figures`);

    // Cache to localStorage
    if (Array.isArray(data) && data.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        console.log(`💾 Cached ${data.length} figures to localStorage`);
      } catch (e) {
        console.warn('localStorage full, skipping cache:', e.message);
      }
    }

    performanceTracker.end('getFigures');
    return Array.isArray(data) ? data : [];

  } catch (error) {
    performanceTracker.end('getFigures');
    console.error("❌ Error fetching figures:", error);

    // FALLBACK: Try localStorage even if network failed
    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (cachedData) {
      console.log('🔄 Network failed, using localStorage fallback');
      return JSON.parse(cachedData);
    }

    return [];
  }
};

/**
 * Get featured figures with optimization
 * PERFORMANCE IMPROVEMENTS:
 * - localStorage persistence (instant homepage load)
 * - Stale-while-revalidate (show cached, refresh in background)
 * - 1-hour cache for featured figures
 * - Graceful fallback to regular figures
 */
const getFeaturedFigures = async () => {
  const STORAGE_KEY = 'diaspora_featured';
  const STORAGE_TIMESTAMP_KEY = 'diaspora_featured_ts';
  const STALE_THRESHOLD = 60 * 60 * 1000; // 1 hour (featured rotate less often)

  try {
    performanceTracker.start('getFeaturedFigures');

    // PERFORMANCE: Check localStorage for instant homepage load
    const cachedData = localStorage.getItem(STORAGE_KEY);
    const cachedTimestamp = parseInt(localStorage.getItem(STORAGE_TIMESTAMP_KEY) || '0');
    const isStale = Date.now() - cachedTimestamp > STALE_THRESHOLD;

    if (cachedData) {
      const figures = JSON.parse(cachedData);
      console.log(`⚡ Loaded ${figures.length} featured figures from localStorage (${isStale ? 'stale' : 'fresh'})`);

      // If stale, refresh in background
      if (isStale) {
        console.log('🔄 Refreshing featured figures in background...');
        fetchWithTimeout(`${BASE_URL}/figures/featured`, {}, 30000, 2, 'FEATURED')
          .then(freshData => {
            if (Array.isArray(freshData) && freshData.length > 0) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
              localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
              console.log(`✅ Background refresh: ${freshData.length} featured figures cached`);
            }
          })
          .catch(err => console.warn('Featured background refresh failed:', err.message));
      }

      performanceTracker.end('getFeaturedFigures');
      return figures;
    }

    // No cache - fetch from network
    console.log('🌐 No cached featured figures, fetching...');
    const data = await fetchWithTimeout(
      `${BASE_URL}/figures/featured`,
      {},
      30000,
      2,
      'FEATURED'
    );

    // Cache to localStorage
    if (Array.isArray(data) && data.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        console.log(`💾 Cached ${data.length} featured figures to localStorage`);
      } catch (e) {
        console.warn('localStorage full, skipping featured cache:', e.message);
      }
    }

    performanceTracker.end('getFeaturedFigures');
    return Array.isArray(data) ? data : [];

  } catch (error) {
    performanceTracker.end('getFeaturedFigures');
    console.error("❌ Error fetching featured figures:", error);

    // FALLBACK: Try localStorage first
    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (cachedData) {
      console.log('🔄 Network failed, using localStorage fallback for featured');
      return JSON.parse(cachedData);
    }

    // Last resort: fallback to regular figures
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
 * - FIX: Falls back to Wikipedia API if not in database
 */
const getFigureByWikipediaId = async (wikipediaId) => {
  try {
    performanceTracker.start('getFigureByWikipediaId');

    // FIX: Strip wiki_ prefix if present since route already adds /wiki/
    const cleanId = wikipediaId.replace('wiki_', '');

    // First try to get from database
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/figures/wiki/${cleanId}`);
      performanceTracker.end('getFigureByWikipediaId');
      return data;
    } catch (dbError) {
      console.log("📥 Figure not in DB, fetching from Wikipedia...");
    }

    // Fallback: Fetch directly from Wikipedia API
    // cleanId is already extracted above (without wiki_ prefix)
    const wikiParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      pageids: cleanId,
      prop: 'pageimages|extracts|info',
      exintro: 'true',
      explaintext: 'true',
      piprop: 'thumbnail',
      pithumbsize: '600',
      inprop: 'url',
      origin: '*'
    });

    const wikiResponse = await fetch(`https://en.wikipedia.org/w/api.php?${wikiParams.toString()}`);

    if (!wikiResponse.ok) {
      throw new Error('Wikipedia API request failed');
    }

    const wikiData = await wikiResponse.json();
    const page = wikiData.query?.pages?.[cleanId];

    if (!page || page.missing) {
      throw new Error('Wikipedia page not found');
    }

    // Format as a figure object
    const figure = {
      wikipediaId: `wiki_${cleanId}`,
      name: page.title,
      description: page.extract || 'No description available.',
      imageUrl: page.thumbnail?.source || '',
      source: 'Wikipedia',
      sourceUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      likes: 0,
      tags: [],
      occupation: [],
      categories: [],
    };

    // AUTO-SAVE: Save to database on first view so it integrates into the system
    // This enables like/save and shows up in Echoes gallery
    console.log("💾 Auto-saving Wikipedia figure to database:", figure.name);
    try {
      const savedFigure = await fetch(`${BASE_URL}/figures/save`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(figure),
      }).then(res => res.ok ? res.json() : null);

      if (savedFigure) {
        console.log("✅ Figure saved to database:", savedFigure.name);
        performanceTracker.end('getFigureByWikipediaId');
        return savedFigure; // Return the saved version with _id
      }
    } catch (saveError) {
      console.warn("⚠️ Could not auto-save (user may not be logged in):", saveError.message);
    }

    performanceTracker.end('getFigureByWikipediaId');
    console.log("✅ Fetched figure from Wikipedia:", figure.name);
    return figure;

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

    // FIX: Clear localStorage cache so updated likes appear across pages
    localStorage.removeItem('diaspora_figures');
    localStorage.removeItem('diaspora_figures_ts');

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

    // FIX: Also clear localStorage cache so Echoes page shows new figures
    localStorage.removeItem('diaspora_figures');
    localStorage.removeItem('diaspora_figures_ts');
    console.log('🗑️ Cleared localStorage figures cache after save');

    return data;

  } catch (error) {
    performanceTracker.end('saveFigure');
    console.error("❌ Error saving figure:", error);
    throw error;
  }
};

/**
 * Ensure a figure exists in the database (for like/save to work)
 * Does NOT add to user's collection - just ensures DB record exists
 * @param {object} figure - Figure data to ensure exists
 * @returns {Promise} - The figure with valid MongoDB _id
 */
const ensureFigureInDB = async (figure) => {
  try {
    performanceTracker.start('ensureFigureInDB');

    // If already has valid MongoDB _id, return as-is
    if (figure._id && /^[0-9a-fA-F]{24}$/.test(figure._id)) {
      console.log('✅ Figure already has valid DB _id:', figure._id);
      performanceTracker.end('ensureFigureInDB');
      return figure;
    }

    console.log('📥 Ensuring figure exists in DB:', figure.name);

    const response = await fetch(`${BASE_URL}/figures/ensure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wikipediaId: figure.wikipediaId,
        name: figure.name,
        description: figure.description,
        imageUrl: figure.imageUrl || figure.image,
        years: figure.years,
        source: figure.source || 'Wikipedia',
        sourceUrl: figure.sourceUrl,
        tags: figure.tags || [],
        occupation: figure.occupation || [],
        categories: figure.categories || ['Scholars & Educators'],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const dbFigure = await response.json();
    console.log('✅ Figure ensured in DB with _id:', dbFigure._id);

    performanceTracker.end('ensureFigureInDB');
    return dbFigure;

  } catch (error) {
    performanceTracker.end('ensureFigureInDB');
    console.error('❌ Error ensuring figure in DB:', error);
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
    return "Scholars & Educators";
  }

  // PERFORMANCE: Cache toLowerCase operations
  const description = figure.description.toLowerCase();
  const tags = figure.tags ? figure.tags.map((tag) => tag.toLowerCase()) : [];
  const allText = `${description} ${tags.join(' ')}`;

  // PERFORMANCE: Use single text search instead of multiple includes()
  // Define optimized keyword patterns for faster matching
  const categoryPatterns = {
    "Athletes": /athlete|sports|olympic|baseball|basketball|football|boxing|tennis|track|swimmer|golfer/,
    "Musicians": /musician|singer|rapper|jazz|composer|songwriter|hip hop|gospel|soul|r&b|conductor|pianist/,
    "Arts & Entertainment": /actor|actress|dancer|entertainer|performer|film|television|artist|painter|comedian/,
    "Literary Icons": /author|writer|poet|novelist|literature|book|poetry|playwright|journalist/,
    "Inventors & Innovators": /inventor|invention|innovator|scientist|engineer|researcher|technology|astronaut|physicist|chemist/,
    "Scholars & Educators": /professor|teacher|educator|scholar|university|education|academic|historian|philosopher/,
    "Business & Entrepreneurs": /entrepreneur|business|executive|founder|ceo|investor|banker|industrialist/,
    "Political Leaders": /president|senator|congressman|politician|mayor|governor|political|diplomat|judge|lawyer/,
    "Pan-African Leaders": /pan-african|african unity|diaspora|african nationalism|independence leader/,
    "Activists & Freedom Fighters": /civil rights|rights movement|activist|protest|discrimination|freedom fighter|revolutionary|resistance|liberation|abolitionist/,
  };

  // PERFORMANCE: Test patterns in order of likelihood
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(allText)) {
      return category;
    }
  }

  // Default category
  return "Scholars & Educators";
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
      expired: (Date.now() - cache.get(key).timestamp) > CACHE_DURATIONS.REGULAR
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
  ensureFigureInDB,

  // Utility functions
  matchToCategory,

  // Performance monitoring functions
  clearAllCache,
  getCacheStats,
  checkApiHealth,
  clearCacheByPattern,
};