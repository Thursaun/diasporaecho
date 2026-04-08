/**
 * Centralized Cache Service
 * In-memory caching with TTL support for all server endpoints
 * 
 * PERFORMANCE: Reduces database queries and external API calls
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Get a cached value
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    console.log(`⚡ Cache HIT: ${key}`);
    return entry.value;
  }

  /**
   * Set a cached value with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set(key, value, ttlMs = 300000) { // Default 5 minutes
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    });

    // Auto-cleanup after TTL
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);
    
    this.timers.set(key, timer);
    console.log(`💾 Cache SET: ${key} (TTL: ${ttlMs / 1000}s)`);
  }

  /**
   * Delete a cached entry
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Delete entries matching a pattern
   * @param {string} pattern - Pattern to match
   */
  deletePattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`🗑️ Cleared ${count} cache entries matching: ${pattern}`);
    }
  }

  /**
   * Clear all cached entries
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

// Cache TTL constants (milliseconds)
const CACHE_TTL = {
  FIGURES_ALL: 5 * 60 * 1000,      // 5 minutes - all figures list
  FIGURES_FEATURED: 60 * 60 * 1000, // 1 hour - featured figures
  SEARCH_WIKI: 30 * 60 * 1000,      // 30 minutes - Wikipedia search
  SEARCH_LOCAL: 10 * 60 * 1000,     // 10 minutes - local DB search
  FIGURE_DETAIL: 15 * 60 * 1000,    // 15 minutes - individual figure
};

module.exports = { cacheService, CACHE_TTL };
