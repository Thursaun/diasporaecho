/**
 * Migration Script: Update Birth/Death Places with State/Region Info
 * 
 * This script fetches fuller location data from Wikidata to include
 * state/region (e.g., "Harlem, NY" instead of just "Harlem")
 * 
 * Run with: node scripts/migrate-location-details.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { MONGODB_URL } = require('../config/config');

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

const FETCH_OPTIONS = {
    headers: { 'User-Agent': 'DiasporaEcho/1.0 (Educational Project)' },
};

// US State abbreviations for common states
const US_STATES = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH',
    'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
    'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
    'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN',
    'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
    'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

// Get state abbreviation
function getStateAbbrev(stateName) {
    const lower = stateName.toLowerCase();
    return US_STATES[lower] || stateName;
}

// Get Wikidata ID from Wikipedia page ID
async function getWikidataId(wikipediaPageId) {
    const pageId = wikipediaPageId.replace('wiki_', '');
    const url = `${WIKIPEDIA_API}?${new URLSearchParams({
        action: 'query', pageids: pageId, prop: 'pageprops',
        ppprop: 'wikibase_item', format: 'json', origin: '*',
    })}`;

    try {
        const response = await fetch(url, FETCH_OPTIONS);
        const data = await response.json();
        return data?.query?.pages?.[pageId]?.pageprops?.wikibase_item || null;
    } catch (e) { return null; }
}

// Get full location with state/country from Wikidata
async function getFullLocation(wikidataId) {
    const url = `${WIKIDATA_API}?${new URLSearchParams({
        action: 'wbgetentities',
        ids: wikidataId,
        props: 'claims|labels',
        languages: 'en',
        format: 'json',
        origin: '*',
    })}`;

    try {
        const response = await fetch(url, FETCH_OPTIONS);
        const data = await response.json();

        const entity = data?.entities?.[wikidataId];
        if (!entity) return null;

        const claims = entity.claims;

        // Get birthPlace entity ID (P19)
        const birthPlaceId = claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id;
        const deathPlaceId = claims?.P20?.[0]?.mainsnak?.datavalue?.value?.id;

        const result = { birthPlace: null, deathPlace: null };

        if (birthPlaceId) {
            result.birthPlace = await getLocationWithRegion(birthPlaceId);
        }
        if (deathPlaceId) {
            result.deathPlace = await getLocationWithRegion(deathPlaceId);
        }

        return result;
    } catch (e) {
        console.error('Error:', e.message);
        return null;
    }
}

// Get location name with parent region (state/country)
async function getLocationWithRegion(locationId) {
    const url = `${WIKIDATA_API}?${new URLSearchParams({
        action: 'wbgetentities',
        ids: locationId,
        props: 'claims|labels',
        languages: 'en',
        format: 'json',
        origin: '*',
    })}`;

    try {
        const response = await fetch(url, FETCH_OPTIONS);
        const data = await response.json();

        const entity = data?.entities?.[locationId];
        if (!entity) return null;

        const cityName = entity.labels?.en?.value;
        if (!cityName) return null;

        // P131 = located in administrative territorial entity (state/county)
        const adminId = entity.claims?.P131?.[0]?.mainsnak?.datavalue?.value?.id;

        if (adminId) {
            // Fetch the admin region
            const adminUrl = `${WIKIDATA_API}?${new URLSearchParams({
                action: 'wbgetentities',
                ids: adminId,
                props: 'claims|labels',
                languages: 'en',
                format: 'json',
                origin: '*',
            })}`;

            const adminResponse = await fetch(adminUrl, FETCH_OPTIONS);
            const adminData = await adminResponse.json();

            const adminEntity = adminData?.entities?.[adminId];
            if (adminEntity?.labels?.en?.value) {
                let regionName = adminEntity.labels.en.value;

                // Check if it's a US state and abbreviate
                const abbrev = getStateAbbrev(regionName);
                if (abbrev !== regionName) {
                    return `${cityName}, ${abbrev}`;
                }

                // For non-US, check if parent is a US state
                const parentId = adminEntity.claims?.P131?.[0]?.mainsnak?.datavalue?.value?.id;
                if (parentId) {
                    const parentUrl = `${WIKIDATA_API}?${new URLSearchParams({
                        action: 'wbgetentities', ids: parentId,
                        props: 'labels', languages: 'en', format: 'json', origin: '*',
                    })}`;
                    const parentResponse = await fetch(parentUrl, FETCH_OPTIONS);
                    const parentData = await parentResponse.json();
                    const parentName = parentData?.entities?.[parentId]?.labels?.en?.value;

                    if (parentName) {
                        const parentAbbrev = getStateAbbrev(parentName);
                        if (parentAbbrev !== parentName) {
                            return `${cityName}, ${parentAbbrev}`;
                        }
                    }
                }

                // Return with full region name if not a US state
                return `${cityName}, ${regionName}`;
            }
        }

        return cityName;
    } catch (e) {
        return null;
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function migrateBirthPlaces() {
    console.log('🚀 Updating birth/death places with state/region info...\n');

    try {
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');

        const Figure = require('../models/figure');

        // Find all figures with birthPlace set
        const figures = await Figure.find({
            birthPlace: { $exists: true, $ne: null }
        }).select('_id name wikipediaId birthPlace deathPlace');

        console.log(`📋 Found ${figures.length} figures to process\n`);

        let updated = 0;
        let skipped = 0;

        for (let i = 0; i < figures.length; i++) {
            const figure = figures[i];

            // Skip if already has comma (already has region)
            if (figure.birthPlace?.includes(',')) {
                console.log(`[${i + 1}/${figures.length}] ${figure.name}: Already has region, skipping`);
                skipped++;
                continue;
            }

            console.log(`[${i + 1}/${figures.length}] Processing: ${figure.name}`);

            try {
                const wikidataId = await getWikidataId(figure.wikipediaId);
                if (!wikidataId) {
                    console.log(`   ⚠️ No Wikidata ID, skipping`);
                    skipped++;
                    continue;
                }

                const locations = await getFullLocation(wikidataId);
                if (!locations) {
                    skipped++;
                    continue;
                }

                const updateData = {};

                if (locations.birthPlace && locations.birthPlace !== figure.birthPlace) {
                    updateData.birthPlace = locations.birthPlace;
                }
                if (locations.deathPlace && locations.deathPlace !== figure.deathPlace) {
                    updateData.deathPlace = locations.deathPlace;
                }

                if (Object.keys(updateData).length > 0) {
                    await Figure.findByIdAndUpdate(figure._id, updateData);
                    console.log(`   ✅ Updated:`);
                    if (updateData.birthPlace) console.log(`      📍 Birth: ${figure.birthPlace} → ${updateData.birthPlace}`);
                    if (updateData.deathPlace) console.log(`      ⚰️ Death: ${figure.deathPlace} → ${updateData.deathPlace}`);
                    updated++;
                } else {
                    console.log(`   ℹ️ No changes needed`);
                    skipped++;
                }

                await sleep(400);

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                skipped++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 LOCATION UPDATE COMPLETE');
        console.log('='.repeat(50));
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️ Skipped: ${skipped}`);

    } catch (error) {
        console.error('❌ Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected');
    }
}

migrateBirthPlaces();
