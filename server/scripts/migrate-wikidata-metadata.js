/**
 * Migration Script: Populate Existing Figures with Wikidata Metadata
 * 
 * This script fetches additional metadata (awards, education, notableWorks, 
 * movement, birthPlace, deathPlace) from Wikidata for existing figures
 * in the database that don't have this information populated.
 * 
 * Run with: node scripts/migrate-wikidata-metadata.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { MONGODB_URL } = require('../config/config');

// Wikidata API configuration
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

const FETCH_OPTIONS = {
    headers: {
        'User-Agent': 'DiasporaEcho/1.0 (Educational Project)',
    },
};

// Helper to extract year from Wikidata date claim
function extractYearFromClaim(claim) {
    if (!claim?.mainsnak?.datavalue?.value?.time) return null;
    const match = claim.mainsnak.datavalue.value.time.match(/^[+-]?(\d+)/);
    return match ? match[1] : null;
}

// Helper to extract labels from Wikidata claims
async function resolveWikidataLabels(claims, limit = 5) {
    if (!claims || !Array.isArray(claims)) return [];

    const entityIds = claims.slice(0, limit)
        .map(c => c?.mainsnak?.datavalue?.value?.id)
        .filter(Boolean);

    if (entityIds.length === 0) return [];

    const url = `${WIKIDATA_API}?${new URLSearchParams({
        action: 'wbgetentities',
        ids: entityIds.join('|'),
        props: 'labels',
        languages: 'en',
        format: 'json',
        origin: '*',
    })}`;

    try {
        const response = await fetch(url, FETCH_OPTIONS);
        const data = await response.json();

        if (!data.entities) return [];

        return Object.values(data.entities)
            .map(e => e?.labels?.en?.value)
            .filter(Boolean);
    } catch (error) {
        console.error('Error resolving labels:', error.message);
        return [];
    }
}

// Get Wikidata ID from Wikipedia page ID
async function getWikidataId(wikipediaPageId) {
    // Remove wiki_ prefix if present
    const pageId = wikipediaPageId.replace('wiki_', '');

    const url = `${WIKIPEDIA_API}?${new URLSearchParams({
        action: 'query',
        pageids: pageId,
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        format: 'json',
        origin: '*',
    })}`;

    try {
        const response = await fetch(url, FETCH_OPTIONS);
        const data = await response.json();

        const page = data?.query?.pages?.[pageId];
        return page?.pageprops?.wikibase_item || null;
    } catch (error) {
        console.error('Error getting Wikidata ID:', error.message);
        return null;
    }
}

// Fetch metadata from Wikidata
async function fetchWikidataMetadata(wikidataId) {
    const url = `${WIKIDATA_API}?${new URLSearchParams({
        action: 'wbgetentities',
        ids: wikidataId,
        props: 'claims',
        format: 'json',
        origin: '*',
    })}`;

    try {
        const response = await fetch(url, FETCH_OPTIONS);
        const data = await response.json();

        const entity = data?.entities?.[wikidataId];
        if (!entity?.claims) return null;

        const claims = entity.claims;

        // Extract metadata
        const metadata = {
            awards: await resolveWikidataLabels(claims.P166, 5), // P166 = awards
            education: await resolveWikidataLabels(claims.P69, 3), // P69 = educated at
            notableWorks: await resolveWikidataLabels(claims.P800, 5), // P800 = notable works
            movement: await resolveWikidataLabels(claims.P135, 3), // P135 = movement
            birthPlace: null,
            deathPlace: null,
        };

        // Get birth/death places
        if (claims.P19?.[0]) {
            const birthPlaces = await resolveWikidataLabels([claims.P19[0]], 1);
            metadata.birthPlace = birthPlaces[0] || null;
        }

        if (claims.P20?.[0]) {
            const deathPlaces = await resolveWikidataLabels([claims.P20[0]], 1);
            metadata.deathPlace = deathPlaces[0] || null;
        }

        return metadata;
    } catch (error) {
        console.error('Error fetching Wikidata metadata:', error.message);
        return null;
    }
}

// Sleep helper for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main migration function
async function migrateMetadata() {
    console.log('🚀 Starting Wikidata metadata migration...\n');

    try {
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');

        const Figure = require('../models/figure');

        // Find figures that might need metadata (empty arrays or no birthPlace)
        const figures = await Figure.find({
            $or: [
                { awards: { $size: 0 } },
                { awards: { $exists: false } },
                { birthPlace: null },
                { birthPlace: { $exists: false } },
            ]
        }).select('_id name wikipediaId awards education notableWorks movement birthPlace deathPlace');

        console.log(`📋 Found ${figures.length} figures to process\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < figures.length; i++) {
            const figure = figures[i];
            console.log(`[${i + 1}/${figures.length}] Processing: ${figure.name}`);

            try {
                // Get Wikidata ID from Wikipedia page ID
                const wikidataId = await getWikidataId(figure.wikipediaId);

                if (!wikidataId) {
                    console.log(`   ⚠️ No Wikidata ID found, skipping`);
                    skipped++;
                    continue;
                }

                console.log(`   📡 Found Wikidata ID: ${wikidataId}`);

                // Fetch metadata
                const metadata = await fetchWikidataMetadata(wikidataId);

                if (!metadata) {
                    console.log(`   ⚠️ No metadata found, skipping`);
                    skipped++;
                    continue;
                }

                // Check if there's anything new to update
                const hasNewData =
                    (metadata.awards.length > 0 && (!figure.awards || figure.awards.length === 0)) ||
                    (metadata.education.length > 0 && (!figure.education || figure.education.length === 0)) ||
                    (metadata.notableWorks.length > 0 && (!figure.notableWorks || figure.notableWorks.length === 0)) ||
                    (metadata.movement.length > 0 && (!figure.movement || figure.movement.length === 0)) ||
                    (metadata.birthPlace && !figure.birthPlace) ||
                    (metadata.deathPlace && !figure.deathPlace);

                if (!hasNewData) {
                    console.log(`   ℹ️ No new metadata, skipping`);
                    skipped++;
                    continue;
                }

                // Update figure with new metadata
                const updateData = {};
                if (metadata.awards.length > 0 && (!figure.awards || figure.awards.length === 0)) {
                    updateData.awards = metadata.awards;
                }
                if (metadata.education.length > 0 && (!figure.education || figure.education.length === 0)) {
                    updateData.education = metadata.education;
                }
                if (metadata.notableWorks.length > 0 && (!figure.notableWorks || figure.notableWorks.length === 0)) {
                    updateData.notableWorks = metadata.notableWorks;
                }
                if (metadata.movement.length > 0 && (!figure.movement || figure.movement.length === 0)) {
                    updateData.movement = metadata.movement;
                }
                if (metadata.birthPlace && !figure.birthPlace) {
                    updateData.birthPlace = metadata.birthPlace;
                }
                if (metadata.deathPlace && !figure.deathPlace) {
                    updateData.deathPlace = metadata.deathPlace;
                }

                await Figure.findByIdAndUpdate(figure._id, updateData);

                console.log(`   ✅ Updated with:`);
                if (updateData.awards) console.log(`      🏆 Awards: ${updateData.awards.length}`);
                if (updateData.education) console.log(`      🎓 Education: ${updateData.education.length}`);
                if (updateData.notableWorks) console.log(`      📚 Notable Works: ${updateData.notableWorks.length}`);
                if (updateData.movement) console.log(`      ✊ Movement: ${updateData.movement.length}`);
                if (updateData.birthPlace) console.log(`      📍 Birth Place: ${updateData.birthPlace}`);
                if (updateData.deathPlace) console.log(`      ⚰️ Death Place: ${updateData.deathPlace}`);

                updated++;

                // Rate limiting - 500ms between requests
                await sleep(500);

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                errors++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 MIGRATION COMPLETE');
        console.log('='.repeat(50));
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📋 Total: ${figures.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
migrateMetadata();
