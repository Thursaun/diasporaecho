const Figure = require('../models/figure');

/**
 * Daily Featured Figures Service
 * Selects top 3 approved figures based on engagement metrics.
 * Uses in-memory caching with robust fallbacks.
 *
 * Selection:
 *   Rank 1 (Most Liked)  — highest likes
 *   Rank 2 (Most Popular) — highest views
 *   Rank 3 (Featured)     — highest searchHits
 */

// In-memory cache
let cachedFeatured = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Only approved (or legacy unset-status) figures can be featured
const APPROVED_FILTER = { status: { $nin: ['pending', 'rejected'] } };

class FeaturedFiguresService {
  static clearCache() {
    cachedFeatured = null;
    cacheTimestamp = null;
  }

  /**
   * Quick fallback: return the top 3 approved figures by likes.
   * No isFeatured flags needed — just a simple sorted query.
   * Used when the flagging system has no results.
   */
  static async getTopApprovedFigures() {
    const figures = await Figure.find(APPROVED_FILTER)
      .sort({ likes: -1, views: -1, createdAt: -1 })
      .limit(3)
      .lean()
      .exec();

    console.log(`📋 Fallback: returning top ${figures.length} approved figures by likes`);
    return figures;
  }

  /**
   * Select and flag the daily featured figures.
   * Only considers approved figures.
   */
  static async updateDailyFeatured() {
    try {
      console.log('🔄 Updating daily featured figures...');

      // Clear previous flags
      await Figure.updateMany(
        { isFeatured: true },
        { $set: { isFeatured: false, featuredRank: null } }
      );

      const selectedIds = [];
      const picks = [];

      // Helper: find the top approved figure by a sort, excluding already-picked IDs
      const pickTop = async (sort, rank) => {
        const filter = {
          ...APPROVED_FILTER,
          ...(selectedIds.length > 0 && { _id: { $nin: selectedIds } }),
        };
        const fig = await Figure.findOne(filter).sort(sort).lean().exec();
        if (fig) {
          selectedIds.push(fig._id);
          picks.push({ id: fig._id, rank, name: fig.name });
        }
        return fig;
      };

      await pickTop({ likes: -1, createdAt: -1 }, 1);       // Most Liked
      await pickTop({ views: -1, likes: -1 }, 2);            // Most Popular
      await pickTop({ searchHits: -1, views: -1 }, 3);       // Featured

      if (picks.length === 0) {
        console.warn('⚠️ No approved figures to feature');
        this.clearCache();
        return [];
      }

      // Flag selected figures
      const now = new Date();
      const updated = await Promise.all(
        picks.map(({ id, rank }) =>
          Figure.findByIdAndUpdate(
            id,
            { $set: { isFeatured: true, featuredRank: rank, featuredSince: now } },
            { new: true, lean: true }
          )
        )
      );

      updated.sort((a, b) => a.featuredRank - b.featuredRank);

      console.log('✅ Featured figures updated:');
      updated.forEach((fig) => {
        const badge = fig.featuredRank === 1 ? '🥇 Most Liked'
          : fig.featuredRank === 2 ? '🥈 Most Popular' : '🥉 Featured';
        console.log(`  ${badge}: ${fig.name}`);
      });

      cachedFeatured = updated;
      cacheTimestamp = Date.now();
      return updated;
    } catch (error) {
      console.error('❌ Error updating featured figures:', error);
      // Non-fatal: return fallback instead of throwing
      return this.getTopApprovedFigures();
    }
  }

  /**
   * Get current featured figures from DB.
   * Falls back to top approved figures if none are flagged.
   */
  static async getFeatured() {
    try {
      const featured = await Figure.find({ isFeatured: true })
        .sort({ featuredRank: 1 })
        .limit(3)
        .lean()
        .exec();

      if (featured.length > 0) {
        cachedFeatured = featured;
        cacheTimestamp = Date.now();
        return featured;
      }

      // No flagged figures — try to flag some
      console.log('⚠️ No featured figures flagged, initializing...');
      const updated = await this.updateDailyFeatured();
      if (updated.length > 0) return updated;

      // updateDailyFeatured also returned empty — use direct fallback
      return this.getTopApprovedFigures();
    } catch (error) {
      console.error('❌ getFeatured error, using fallback:', error.message);
      return this.getTopApprovedFigures();
    }
  }

  /**
   * Check if featured data is stale (>24h).
   */
  static async needsRefresh() {
    if (cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      return false;
    }
    try {
      const featured = await Figure.findOne({ isFeatured: true })
        .sort({ featuredSince: -1 })
        .select('featuredSince')
        .lean();
      if (!featured || !featured.featuredSince) return true;
      return (Date.now() - featured.featuredSince.getTime()) >= 24 * 60 * 60 * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Main entry point: returns featured figures as fast as possible.
   * 1. In-memory cache (sub-ms)
   * 2. DB flagged figures (indexed query)
   * 3. Fallback to top approved figures
   * Background refresh if stale.
   */
  static async getOrRefreshFeatured() {
    // Fast path: in-memory cache
    if (cachedFeatured && cachedFeatured.length > 0 && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      return cachedFeatured;
    }

    const featured = await this.getFeatured();

    // Background staleness check (non-blocking)
    this.needsRefresh().then(stale => {
      if (stale) {
        console.log('🔄 Featured stale (>24h), refreshing in background...');
        this.updateDailyFeatured().catch(() => {});
      }
    }).catch(() => {});

    return featured;
  }
}

module.exports = FeaturedFiguresService;
