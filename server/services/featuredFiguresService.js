const Figure = require('../models/figure');

/**
 * Daily Featured Figures Service
 * Automatically selects and updates the top 3 figures based on likes
 * Runs daily to keep featured content fresh
 * 
 * PERFORMANCE: Uses in-memory caching to minimize DB queries
 */

// In-memory cache for server-side optimization
let cachedFeatured = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in-memory cache

class FeaturedFiguresService {
  /**
   * Clear the in-memory cache (call after updates)
   */
  static clearCache() {
    cachedFeatured = null;
    cacheTimestamp = null;
    console.log('🗑️ Featured figures cache cleared');
  }

  /**
   * Update featured figures based on distinct metrics:
   * Rank 1 (🥇 Most Liked): Highest likes
   * Rank 2 (🥈 Most Popular): Highest views
   * Rank 3 (🥉 Featured): Highest searchHits
   */
  static async updateDailyFeatured() {
    try {
      console.log('🔄 Starting daily featured figures update...');

      // STEP 1: Clear all current featured status
      await Figure.updateMany(
        { isFeatured: true },
        {
          $set: {
            isFeatured: false,
            featuredRank: null
          }
        }
      );
      console.log('✅ Cleared previous featured figures');

      const selectedIds = new Set();
      const featuredFigures = [];

      // --- SELECTION 1: MOST LIKED (🥇) ---
      const mostLiked = await Figure.findOne({ _id: { $nin: Array.from(selectedIds) } })
        .sort({ likes: -1, createdAt: -1 })
        .exec();

      if (mostLiked) {
        selectedIds.add(mostLiked._id.toString());
        featuredFigures.push({ figure: mostLiked, rank: 1 });
      }

      // --- SELECTION 2: MOST POPULAR / VIEWS (🥈) ---
      const mostPopular = await Figure.findOne({ _id: { $nin: Array.from(selectedIds) } })
        .sort({ views: -1, likes: -1 }) // Fallback to likes if views are tied
        .exec();

      if (mostPopular) {
        selectedIds.add(mostPopular._id.toString());
        featuredFigures.push({ figure: mostPopular, rank: 2 });
      }

      // --- SELECTION 3: FEATURED / SEARCH HITS (🥉) ---
      const topSearched = await Figure.findOne({ _id: { $nin: Array.from(selectedIds) } })
        .sort({ searchHits: -1, views: -1 }) // Fallback to views
        .exec();

      if (topSearched) {
        selectedIds.add(topSearched._id.toString());
        featuredFigures.push({ figure: topSearched, rank: 3 });
      }

      if (featuredFigures.length === 0) {
        console.warn('⚠️ No figures found to feature');
        this.clearCache();
        return [];
      }

      // STEP 3: Update selected figures with featured status
      const now = new Date();
      const updatePromises = featuredFigures.map(({ figure, rank }) => {
        return Figure.findByIdAndUpdate(
          figure._id,
          {
            $set: {
              isFeatured: true,
              featuredRank: rank,
              featuredSince: now,
            }
          },
          { new: true }
        );
      });

      const updatedFigures = await Promise.all(updatePromises);

      // Sort back by rank for consistent return
      updatedFigures.sort((a, b) => a.featuredRank - b.featuredRank);

      console.log('✅ Featured figures updated:');
      updatedFigures.forEach((fig) => {
        const badge = fig.featuredRank === 1 ? '🥇 Most Liked' : fig.featuredRank === 2 ? '🥈 Most Popular' : '🥉 Featured';
        const metric = fig.featuredRank === 1 ? `${fig.likes} likes` : fig.featuredRank === 2 ? `${fig.views} views` : `${fig.searchHits} searches`;
        console.log(`  ${badge}: ${fig.name} (${metric})`);
      });

      // PERFORMANCE: Update in-memory cache after DB update
      cachedFeatured = updatedFigures.map(fig => fig.toObject ? fig.toObject() : fig);
      cacheTimestamp = Date.now();
      console.log('💾 Featured figures cached in memory');

      return updatedFigures;

    } catch (error) {
      console.error('❌ Error updating featured figures:', error);
      throw error;
    }
  }

  /**
   * Get current featured figures (fast query using index)
   */
  static async getFeatured() {
    try {
      const featured = await Figure.find({ isFeatured: true })
        .sort({ featuredRank: 1 }) // Sort by rank: 1, 2, 3
        .limit(3)
        .select('+likedBy') // IMPORTANT: Include likedBy field for client-side like status check
        .lean() // PERFORMANCE: Return plain JS objects instead of Mongoose documents
        .exec();

      // If no featured figures exist, run initial update
      if (featured.length === 0) {
        console.log('⚠️ No featured figures found, initializing...');
        return await this.updateDailyFeatured();
      }

      // PERFORMANCE: Update cache with fresh data
      cachedFeatured = featured;
      cacheTimestamp = Date.now();

      return featured;
    } catch (error) {
      console.error('❌ Error getting featured figures:', error);
      throw error;
    }
  }

  /**
   * Check if featured figures need refresh (older than 24 hours)
   * Uses in-memory cache timestamp first for speed
   * @returns {boolean}
   */
  static async needsRefresh() {
    try {
      // PERFORMANCE: Check in-memory cache timestamp first (fastest path)
      if (cacheTimestamp) {
        const hoursSinceCache = (Date.now() - cacheTimestamp) / (1000 * 60 * 60);
        if (hoursSinceCache < 1) {
          // Cache is fresh, check if DB data needs refresh
          // But only query DB if cache is > 1 hour old
          return false;
        }
      }

      const featured = await Figure.findOne({ isFeatured: true })
        .sort({ featuredSince: -1 })
        .select('featuredSince')
        .lean();

      if (!featured || !featured.featuredSince) {
        return true; // No featured figures or no timestamp
      }

      const hoursSinceUpdate = (Date.now() - featured.featuredSince.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate >= 24;

    } catch (error) {
      console.error('❌ Error checking refresh status:', error);
      return true; // Refresh on error to be safe
    }
  }

  /**
   * Smart get: Returns in-memory cached featured figures, refreshes if needed
   * PERFORMANCE: Checks in-memory cache first (sub-millisecond), then DB cache
   */
  static async getOrRefreshFeatured() {
    try {
      // PERFORMANCE: Check in-memory cache first (fastest path - sub-millisecond)
      if (cachedFeatured && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
        console.log('⚡ Returning in-memory cached featured figures');
        return cachedFeatured;
      }

      // Check if DB data needs refresh (>24h old)
      const needsUpdate = await this.needsRefresh();

      if (needsUpdate) {
        console.log('🔄 Featured figures are stale (>24h), refreshing...');
        return await this.updateDailyFeatured();
      }

      return await this.getFeatured();
    } catch (error) {
      console.error('❌ Error in getOrRefreshFeatured:', error);
      // Fallback: just get current featured figures
      return await this.getFeatured();
    }
  }
}

module.exports = FeaturedFiguresService;

