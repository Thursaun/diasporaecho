require("dotenv").config();
const mongoose = require("mongoose");
const Figure = require("../models/figure");
const fetch = require("node-fetch");

mongoose.connect(process.env.MONGODB_URI);

const API_BASE_URL = "https://en.wikipedia.org/w/api.php";

// NEW: Extract year from Wikidata claim
function extractYearFromWikidataClaim(claim) {
  if (!claim || !claim.mainsnak || !claim.mainsnak.datavalue) {
    return null;
  }

  const value = claim.mainsnak.datavalue.value;

  // Wikidata dates come in format: +1948-08-30T00:00:00Z
  if (value.time) {
    const match = value.time.match(/^[+-]?(\d{4})/);
    if (match) {
      const year = parseInt(match[1]);
      const currentYear = new Date().getFullYear();
      if (year >= 1700 && year <= currentYear) {
        return year;
      }
    }
  }

  return null;
}

// Fetch Wikidata for a single figure
async function fetchWikidataForFigure(wikipediaId) {
  try {
    // First get the Wikidata ID from Wikipedia
    const pagePropsUrl = `${API_BASE_URL}?${new URLSearchParams({
      action: "query",
      format: "json",
      prop: "pageprops",
      pageids: wikipediaId,
      ppprop: "wikibase_item",
      origin: "*",
    })}`;

    const propsResponse = await fetch(pagePropsUrl);
    const propsData = await propsResponse.json();

    const wikidataId = propsData.query?.pages?.[wikipediaId]?.pageprops?.wikibase_item;

    if (!wikidataId) {
      console.log(`   ⚠️  No Wikidata ID found`);
      return null;
    }

    console.log(`   🔍 Wikidata ID: ${wikidataId}`);

    // Fetch birth/death from Wikidata
    const wikidataUrl = `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: "wbgetentities",
      ids: wikidataId,
      props: "claims",
      format: "json",
      origin: "*",
    })}`;

    const wikidataResponse = await fetch(wikidataUrl);
    const wikidataData = await wikidataResponse.json();

    const entity = wikidataData.entities?.[wikidataId];

    if (!entity || !entity.claims) {
      return null;
    }

    // P569 = date of birth, P570 = date of death
    const birthClaim = entity.claims.P569?.[0];
    const deathClaim = entity.claims.P570?.[0];

    const birthYear = extractYearFromWikidataClaim(birthClaim);
    const deathYear = extractYearFromWikidataClaim(deathClaim);

    return { birthYear, deathYear };
  } catch (error) {
    console.error(`   ❌ Error fetching Wikidata:`, error.message);
    return null;
  }
}

// Extract years from description text (fallback)
function extractYearsFromDescription(description) {
  if (!description) return null;

  // Pattern 1: (Month Day, Year – Month Day, Year)
  let match = description.match(/\((?:[^)]*?)?(\d{4})\s*[-–—]\s*(?:[^)]*?)?(\d{4})\)/);
  if (match) {
    return { birthYear: parseInt(match[1]), deathYear: parseInt(match[2]) };
  }

  // Pattern 2: born ... Year ... died ... Year
  match = description.match(/born[^0-9]*(\d{4})[^0-9]*(?:died|death)[^0-9]*(\d{4})/i);
  if (match) {
    return { birthYear: parseInt(match[1]), deathYear: parseInt(match[2]) };
  }

  // Pattern 3: (born ... Year)
  match = description.match(/\(born[^)]*?(\d{4})\)/i);
  if (match) {
    // Check if still alive
    const isAlive = /\bis\s+(?:a|an|the)/.test(description);
    return { birthYear: parseInt(match[1]), deathYear: isAlive ? "Present" : null };
  }

  // Pattern 4: c. Year – Year
  match = description.match(/c\.\s*(\d{4})\s*[-–—]\s*(\d{4})/);
  if (match) {
    return { birthYear: parseInt(match[1]), deathYear: parseInt(match[2]) };
  }

  return null;
}

async function updateMissingYears() {
  try {
    console.log("🔄 Updating Figures with Missing Years\n");
    console.log("=".repeat(80));

    // Find all figures with unknown or missing years
    const figuresToUpdate = await Figure.find({
      $or: [{ years: "Unknown" }, { years: null }, { years: "" }],
    });

    console.log(`\n📊 Found ${figuresToUpdate.length} figures to update\n`);

    if (figuresToUpdate.length === 0) {
      console.log("✅ All figures already have years data!");
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const figure of figuresToUpdate) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`\n📝 Processing: ${figure.name}`);
      console.log(`   Current years: ${figure.years || "Missing"}`);
      console.log(`   Wikipedia ID: ${figure.wikipediaId}`);

      let years = null;

      // Strategy 1: Try Wikidata first (most accurate)
      if (figure.wikipediaId) {
        console.log(`   🌐 Attempting Wikidata fetch...`);
        const wikidataResult = await fetchWikidataForFigure(figure.wikipediaId);

        if (wikidataResult && wikidataResult.birthYear) {
          if (wikidataResult.deathYear && wikidataResult.deathYear !== "Present") {
            years = `${wikidataResult.birthYear}-${wikidataResult.deathYear}`;
            console.log(`   ✅ Wikidata: ${years}`);
          } else if (wikidataResult.deathYear === "Present") {
            years = `${wikidataResult.birthYear}-Present`;
            console.log(`   ✅ Wikidata (living): ${years}`);
          } else {
            years = `${wikidataResult.birthYear}`;
            console.log(`   ✅ Wikidata (birth only): ${years}`);
          }
        }
      }

      // Strategy 2: Fall back to description parsing
      if (!years && figure.description) {
        console.log(`   📝 Attempting to extract from description...`);
        const extracted = extractYearsFromDescription(figure.description);

        if (extracted && extracted.birthYear) {
          if (extracted.deathYear && extracted.deathYear !== "Present") {
            years = `${extracted.birthYear}-${extracted.deathYear}`;
            console.log(`   ✅ Extracted from text: ${years}`);
          } else if (extracted.deathYear === "Present") {
            years = `${extracted.birthYear}-Present`;
            console.log(`   ✅ Extracted from text (living): ${years}`);
          } else {
            years = `${extracted.birthYear}`;
            console.log(`   ✅ Extracted from text (birth only): ${years}`);
          }
        }
      }

      // Update the figure
      if (years) {
        figure.years = years;
        await figure.save();
        updated++;
        console.log(`   💾 Updated in database: ${years}`);
      } else {
        failed++;
        console.log(`   ❌ Could not determine years`);
      }

      // Rate limiting - wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n✨ Update Complete!\n`);
    console.log(`   ✅ Successfully updated: ${updated} figures`);
    console.log(`   ❌ Failed to update: ${failed} figures`);
    console.log(`   📈 Success rate: ${Math.round((updated / figuresToUpdate.length) * 100)}%\n`);
  } catch (error) {
    console.error("❌ Error during update:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the update
updateMissingYears();
