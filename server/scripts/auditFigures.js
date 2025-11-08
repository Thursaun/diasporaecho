require("dotenv").config();
const mongoose = require("mongoose");
const Figure = require("../models/figure");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function auditDatabase() {
  try {
    console.log("🔍 Database Audit Report\n");
    console.log("=".repeat(80));

    const allFigures = await Figure.find({});
    console.log(`\n📊 Total Figures: ${allFigures.length}\n`);

    // Categorize by years field completeness
    const withCompleteYears = []; // Has birth-death range
    const withPartialYears = []; // Has birth year only or "Present"
    const withUnknownYears = []; // "Unknown" or missing

    allFigures.forEach((figure) => {
      if (!figure.years || figure.years === "Unknown") {
        withUnknownYears.push(figure);
      } else if (figure.years.includes("-")) {
        const parts = figure.years.split("-");
        if (parts.length === 2 && parts[0] && parts[1] && parts[1] !== "Present") {
          withCompleteYears.push(figure);
        } else {
          withPartialYears.push(figure);
        }
      } else {
        withPartialYears.push(figure);
      }
    });

    console.log(`📈 Years Data Quality:\n`);
    console.log(`   ✅ Complete (Birth-Death): ${withCompleteYears.length} (${Math.round((withCompleteYears.length / allFigures.length) * 100)}%)`);
    console.log(`   ⚠️  Partial (Birth only/Present): ${withPartialYears.length} (${Math.round((withPartialYears.length / allFigures.length) * 100)}%)`);
    console.log(`   ❌ Unknown/Missing: ${withUnknownYears.length} (${Math.round((withUnknownYears.length / allFigures.length) * 100)}%)\n`);

    // Show figures with unknown years
    if (withUnknownYears.length > 0) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`\n❌ FIGURES WITH UNKNOWN YEARS (Need Improvement)\n`);
      withUnknownYears.forEach((figure, index) => {
        console.log(`${index + 1}. ${figure.name}`);
        console.log(`   ID: ${figure._id}`);
        console.log(`   Years: ${figure.years || "Missing"}`);
        console.log(`   Source: ${figure.source}`);
        console.log(`   Wikipedia ID: ${figure.wikipediaId || "N/A"}`);
        console.log(`   Likes: ${figure.likes}, Saved by: ${figure.owners?.length || 0}`);
        console.log(`   Description: ${figure.description?.substring(0, 80)}...`);
        console.log(`   🔗 Suggest re-fetching from Wikipedia to get accurate dates\n`);
      });
    }

    // Show figures with partial years
    if (withPartialYears.length > 0) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`\n⚠️  FIGURES WITH PARTIAL YEARS (Could Be Improved)\n`);
      withPartialYears.slice(0, 10).forEach((figure, index) => {
        console.log(`${index + 1}. ${figure.name}`);
        console.log(`   Years: ${figure.years}`);
        console.log(`   Source: ${figure.source}`);
        console.log(`   Likes: ${figure.likes}\n`);
      });
      if (withPartialYears.length > 10) {
        console.log(`   ... and ${withPartialYears.length - 10} more\n`);
      }
    }

    // Source breakdown
    const bySources = {};
    allFigures.forEach((fig) => {
      const source = fig.source || "Unknown";
      bySources[source] = (bySources[source] || 0) + 1;
    });

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n📚 By Source:\n`);
    Object.entries(bySources)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
      });

    // Category breakdown
    const byCategory = {};
    allFigures.forEach((fig) => {
      const cat = fig.category || "Uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n🏷️  By Category:\n`);
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });

    // Top figures by engagement
    const topByLikes = [...allFigures].sort((a, b) => b.likes - a.likes).slice(0, 5);
    const topBySaves = [...allFigures].sort((a, b) => (b.owners?.length || 0) - (a.owners?.length || 0)).slice(0, 5);

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n👑 Top 5 Most Liked:\n`);
    topByLikes.forEach((fig, index) => {
      console.log(`   ${index + 1}. ${fig.name} - ${fig.likes} likes`);
    });

    console.log(`\n💾 Top 5 Most Saved:\n`);
    topBySaves.forEach((fig, index) => {
      console.log(`   ${index + 1}. ${fig.name} - ${fig.owners?.length || 0} saves`);
    });

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n✨ Recommendations:\n`);

    if (withUnknownYears.length > 0) {
      console.log(`   1. Re-fetch ${withUnknownYears.length} figures with unknown years from Wikipedia`);
      console.log(`      using the enhanced Wikidata integration for accurate dates`);
    }

    if (withPartialYears.length > 0) {
      console.log(`   2. Consider updating ${withPartialYears.length} figures with partial years`);
      console.log(`      to include death dates for deceased individuals`);
    }

    console.log(`   3. Current data quality: ${Math.round((withCompleteYears.length / allFigures.length) * 100)}% complete`);
    console.log(`   4. Target: 95%+ complete (${Math.ceil(allFigures.length * 0.95)} figures)\n`);

  } catch (error) {
    console.error("❌ Error during audit:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run audit
auditDatabase();
