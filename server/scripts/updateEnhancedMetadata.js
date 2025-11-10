require("dotenv").config();
const mongoose = require("mongoose");
const Figure = require("../models/figure");
const fetch = require("node-fetch");

mongoose.connect(process.env.MONGODB_URI);

const API_BASE_URL = "https://en.wikipedia.org/w/api.php";

// Helper function to extract labels from Wikidata claims (for multiple values)
function extractWikidataLabels(claims, wikidataResponse) {
  if (!claims || !Array.isArray(claims)) return [];

  const labels = [];
  for (const claim of claims.slice(0, 10)) {
    const label = extractWikidataLabel(claim, wikidataResponse);
    if (label) labels.push(label);
  }
  return labels;
}

// Helper function to extract a single label from a Wikidata claim
function extractWikidataLabel(claim, wikidataResponse) {
  if (!claim || !claim.mainsnak || !claim.mainsnak.datavalue) return null;

  const value = claim.mainsnak.datavalue.value;

  // If it's an entity reference, try to get the label
  if (value.id && wikidataResponse.entities && wikidataResponse.entities[value.id]) {
    const entity = wikidataResponse.entities[value.id];
    return entity.labels?.en?.value || null;
  }

  // If it's a string value, return it directly
  if (typeof value === 'string') {
    return value;
  }

  return null;
}

// Fetch enhanced metadata from Wikidata for a single figure
async function fetchEnhancedMetadata(wikipediaId) {
  try {
    // First get the Wikidata ID from Wikipedia
    const pagePropsUrl = `${API_BASE_URL}?${new URLSearchParams({
      action: "query",
      format: "json",
      prop: "pageprops",
      pageids: wikipediaId,
      ppprop: "wikibase_item",
    })}`;

    const propsResponse = await fetch(pagePropsUrl, {
      headers: {
        'User-Agent': 'DiasporaEcho/1.0 (Migration Script)'
      }
    });
    if (!propsResponse.ok) {
      console.log(`   ⚠️  Wikipedia API returned status ${propsResponse.status}`);
      return null;
    }
    const propsData = await propsResponse.json();

    const wikidataId = propsData.query?.pages?.[wikipediaId]?.pageprops?.wikibase_item;

    if (!wikidataId) {
      console.log(`   ⚠️  No Wikidata ID found`);
      return null;
    }

    console.log(`   🔍 Wikidata ID: ${wikidataId}`);

    // Fetch enhanced metadata from Wikidata (no origin parameter needed for server-side)
    const wikidataUrl = `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: "wbgetentities",
      ids: wikidataId,
      props: "claims|labels",
      languages: "en",
      format: "json",
    })}`;

    const wikidataResponse = await fetch(wikidataUrl, {
      headers: {
        'User-Agent': 'DiasporaEcho/1.0 (Migration Script)'
      }
    });
    if (!wikidataResponse.ok) {
      console.log(`   ⚠️  Wikidata API returned status ${wikidataResponse.status}`);
      return null;
    }
    const wikidataData = await wikidataResponse.json();

    const entity = wikidataData.entities?.[wikidataId];

    if (!entity || !entity.claims) {
      return null;
    }

    // Extract enhanced metadata
    const occupation = extractWikidataLabels(entity.claims.P106, wikidataData); // P106 = occupation
    const birthPlace = extractWikidataLabel(entity.claims.P19?.[0], wikidataData); // P19 = place of birth
    const deathPlace = extractWikidataLabel(entity.claims.P20?.[0], wikidataData); // P20 = place of death
    const awards = extractWikidataLabels(entity.claims.P166, wikidataData).slice(0, 5); // P166 = awards (limit to 5)
    const education = extractWikidataLabels(entity.claims.P69, wikidataData).slice(0, 3); // P69 = educated at
    const notableWorks = extractWikidataLabels(entity.claims.P800, wikidataData).slice(0, 5); // P800 = notable works
    const movement = extractWikidataLabels(entity.claims.P135, wikidataData); // P135 = movement

    return {
      occupation,
      birthPlace,
      deathPlace,
      awards,
      education,
      notableWorks,
      movement
    };
  } catch (error) {
    console.error(`   ❌ Error fetching Wikidata:`, error.message);
    return null;
  }
}

async function updateEnhancedMetadata() {
  try {
    console.log("🔄 Updating Figures with Enhanced Wikidata Metadata\n");
    console.log("=".repeat(80));

    // Find all figures that don't have the new metadata fields populated
    const figuresToUpdate = await Figure.find({
      $or: [
        { occupation: { $exists: false } },
        { occupation: { $size: 0 } },
        { birthPlace: null },
        { awards: { $exists: false } },
        { awards: { $size: 0 } }
      ]
    });

    console.log(`\n📊 Found ${figuresToUpdate.length} figures to update\n`);

    if (figuresToUpdate.length === 0) {
      console.log("✅ All figures already have enhanced metadata!");
      return;
    }

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const figure of figuresToUpdate) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`\n📝 Processing: ${figure.name}`);
      console.log(`   Wikipedia ID: ${figure.wikipediaId}`);

      if (!figure.wikipediaId) {
        console.log(`   ⚠️  No Wikipedia ID - skipping`);
        skipped++;
        continue;
      }

      console.log(`   🌐 Fetching enhanced metadata from Wikidata...`);
      const metadata = await fetchEnhancedMetadata(figure.wikipediaId);

      if (metadata) {
        let hasUpdates = false;

        if (metadata.occupation && metadata.occupation.length > 0) {
          figure.occupation = metadata.occupation;
          console.log(`   ✅ Occupation: ${metadata.occupation.join(', ')}`);
          hasUpdates = true;
        }

        if (metadata.birthPlace) {
          figure.birthPlace = metadata.birthPlace;
          console.log(`   ✅ Birth place: ${metadata.birthPlace}`);
          hasUpdates = true;
        }

        if (metadata.deathPlace) {
          figure.deathPlace = metadata.deathPlace;
          console.log(`   ✅ Death place: ${metadata.deathPlace}`);
          hasUpdates = true;
        }

        if (metadata.awards && metadata.awards.length > 0) {
          figure.awards = metadata.awards;
          console.log(`   ✅ Awards: ${metadata.awards.length} found`);
          hasUpdates = true;
        }

        if (metadata.education && metadata.education.length > 0) {
          figure.education = metadata.education;
          console.log(`   ✅ Education: ${metadata.education.join(', ')}`);
          hasUpdates = true;
        }

        if (metadata.notableWorks && metadata.notableWorks.length > 0) {
          figure.notableWorks = metadata.notableWorks;
          console.log(`   ✅ Notable works: ${metadata.notableWorks.length} found`);
          hasUpdates = true;
        }

        if (metadata.movement && metadata.movement.length > 0) {
          figure.movement = metadata.movement;
          console.log(`   ✅ Movement: ${metadata.movement.join(', ')}`);
          hasUpdates = true;
        }

        if (hasUpdates) {
          await figure.save();
          updated++;
          console.log(`   💾 Updated in database`);
        } else {
          console.log(`   ℹ️  No new metadata available`);
          skipped++;
        }
      } else {
        failed++;
        console.log(`   ❌ Could not fetch metadata`);
      }

      // Rate limiting - wait 2 seconds between requests to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n✨ Update Complete!\n`);
    console.log(`   ✅ Successfully updated: ${updated} figures`);
    console.log(`   ⚠️  Skipped: ${skipped} figures`);
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
updateEnhancedMetadata();
