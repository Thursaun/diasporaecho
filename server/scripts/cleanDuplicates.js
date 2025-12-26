require("dotenv").config();
const mongoose = require("mongoose");
const Figure = require("../models/figure");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/**
 * Calculate completeness score for a figure
 * Higher score = more complete data
 */
function calculateCompletenessScore(figure) {
  let score = 0;

  // Years field scoring (most important for this cleanup)
  if (figure.years && figure.years !== "Unknown") {
    // Check if it has both birth and death years
    if (figure.years.includes("-")) {
      const parts = figure.years.split("-");
      if (parts.length === 2 && parts[0] && parts[1]) {
        score += 100; // Complete birth-death range
      } else {
        score += 50; // Partial range
      }
    } else if (figure.years.match(/^\d{4}$/)) {
      score += 70; // At least has birth year
    }
  }

  // Other data completeness
  if (figure.description && figure.description.length > 100) score += 20;
  if (figure.imageUrl && !figure.imageUrl.includes("placeholder")) score += 15;
  if (figure.tags && figure.tags.length > 0) score += 10;
  if (figure.contributions && figure.contributions.length > 0) score += 10;
  if (figure.sourceUrl && figure.sourceUrl.includes("wikipedia")) score += 5;

  // Engagement metrics
  score += (figure.likes || 0) * 2;
  score += (figure.owners?.length || 0) * 3;

  return score;
}

/**
 * Normalize name for comparison (handle different capitalizations, spacing, etc.)
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "");
}

/**
 * Main cleanup function
 */
async function cleanupDuplicates() {
  try {
    console.log("🔍 Starting duplicate cleanup...\n");

    // Get all figures
    const allFigures = await Figure.find({});
    console.log(`📊 Total figures in database: ${allFigures.length}\n`);

    // Group figures by normalized name
    const figuresByName = new Map();

    allFigures.forEach((figure) => {
      const normalizedName = normalizeName(figure.name);
      if (!figuresByName.has(normalizedName)) {
        figuresByName.set(normalizedName, []);
      }
      figuresByName.get(normalizedName).push(figure);
    });

    // Find duplicates
    const duplicateGroups = [];
    for (const [name, figures] of figuresByName.entries()) {
      if (figures.length > 1) {
        duplicateGroups.push({ name, figures });
      }
    }

    console.log(`🔎 Found ${duplicateGroups.length} names with duplicates\n`);

    if (duplicateGroups.length === 0) {
      console.log("✅ No duplicates found! Database is clean.");
      return;
    }

    // Process each duplicate group
    let totalRemoved = 0;
    let totalKept = 0;

    for (const group of duplicateGroups) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📝 Processing: ${group.figures[0].name}`);
      console.log(`   Found ${group.figures.length} duplicates\n`);

      // Score each figure
      const scoredFigures = group.figures.map((figure) => ({
        figure,
        score: calculateCompletenessScore(figure),
      }));

      // Sort by score (highest first)
      scoredFigures.sort((a, b) => b.score - a.score);

      // Display comparison
      scoredFigures.forEach((item, index) => {
        const fig = item.figure;
        console.log(`   ${index === 0 ? "👑 KEEP" : "❌ REMOVE"} [Score: ${item.score}]`);
        console.log(`      ID: ${fig._id}`);
        console.log(`      Years: ${fig.years || "Unknown"}`);
        console.log(`      Description: ${fig.description?.substring(0, 60)}...`);
        console.log(`      Likes: ${fig.likes}, Saved by: ${fig.owners?.length || 0}`);
        console.log(`      Tags: ${fig.tags?.length || 0}, Contributions: ${fig.contributions?.length || 0}`);
        console.log(`      Source: ${fig.source}`);
      });

      // Keep the best one, remove others
      const toKeep = scoredFigures[0].figure;
      const toRemove = scoredFigures.slice(1).map((s) => s.figure);

      // Before removing, merge important data
      for (const duplicate of toRemove) {
        // Merge owners (people who saved this figure)
        if (duplicate.owners && duplicate.owners.length > 0) {
          const existingOwners = toKeep.owners || [];
          const mergedOwners = [
            ...new Set([...existingOwners, ...duplicate.owners].map((id) => id.toString())),
          ];
          toKeep.owners = mergedOwners.map((id) => mongoose.Types.ObjectId(id));
        }

        // Merge likedBy
        if (duplicate.likedBy && duplicate.likedBy.length > 0) {
          const existingLikes = toKeep.likedBy || [];
          const mergedLikes = [
            ...new Set([...existingLikes, ...duplicate.likedBy].map((id) => id.toString())),
          ];
          toKeep.likedBy = mergedLikes.map((id) => mongoose.Types.ObjectId(id));
          toKeep.likes = mergedLikes.length;
        }
      }

      // Save the merged data
      await toKeep.save();
      console.log(`\n   ✅ Saved merged data to: ${toKeep._id}`);

      // Remove duplicates
      for (const duplicate of toRemove) {
        await Figure.findByIdAndDelete(duplicate._id);
        totalRemoved++;
        console.log(`   🗑️  Removed: ${duplicate._id}`);
      }

      totalKept++;
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n✨ Cleanup Complete!`);
    console.log(`   📊 Processed ${duplicateGroups.length} duplicate groups`);
    console.log(`   ✅ Kept ${totalKept} best records`);
    console.log(`   🗑️  Removed ${totalRemoved} duplicates`);
    console.log(`   📈 Final count: ${allFigures.length - totalRemoved} figures\n`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Dry run function to preview changes without making them
async function dryRun() {
  try {
    console.log("🔍 DRY RUN - No changes will be made\n");

    const allFigures = await Figure.find({});
    console.log(`📊 Total figures in database: ${allFigures.length}\n`);

    const figuresByName = new Map();

    allFigures.forEach((figure) => {
      const normalizedName = normalizeName(figure.name);
      if (!figuresByName.has(normalizedName)) {
        figuresByName.set(normalizedName, []);
      }
      figuresByName.get(normalizedName).push(figure);
    });

    const duplicateGroups = [];
    for (const [name, figures] of figuresByName.entries()) {
      if (figures.length > 1) {
        duplicateGroups.push({ name, figures });
      }
    }

    console.log(`🔎 Found ${duplicateGroups.length} names with duplicates\n`);

    if (duplicateGroups.length === 0) {
      console.log("✅ No duplicates found!");
      return;
    }

    for (const group of duplicateGroups) {
      console.log(`\n📝 ${group.figures[0].name} (${group.figures.length} duplicates)`);

      const scoredFigures = group.figures.map((figure) => ({
        figure,
        score: calculateCompletenessScore(figure),
      }));

      scoredFigures.sort((a, b) => b.score - a.score);

      scoredFigures.forEach((item, index) => {
        const fig = item.figure;
        console.log(
          `   ${index === 0 ? "✅ KEEP" : "❌ REMOVE"} [Score: ${item.score}] Years: ${
            fig.years || "Unknown"
          } Likes: ${fig.likes}`
        );
      });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Would keep: ${duplicateGroups.length} figures`);
    console.log(
      `   Would remove: ${duplicateGroups.reduce((sum, g) => sum + g.figures.length - 1, 0)} duplicates`
    );
  } catch (error) {
    console.error("❌ Error during dry run:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the script
const args = process.argv.slice(2);
if (args.includes("--dry-run")) {
  dryRun();
} else if (args.includes("--run")) {
  cleanupDuplicates();
} else {
  console.log(`
📚 Database Duplicate Cleanup Script

Usage:
  node scripts/cleanDuplicates.js --dry-run    Preview changes without modifying database
  node scripts/cleanDuplicates.js --run        Execute cleanup and remove duplicates

The script will:
  • Find all figures with duplicate names
  • Score each duplicate based on data completeness
  • Keep the most complete version (prioritizing birth/death years)
  • Merge likes and saves into the kept record
  • Remove less complete duplicates
  `);
  process.exit(0);
}
