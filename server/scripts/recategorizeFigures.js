/**
 * Enhanced Migration Script: Recategorize Existing Figures
 * 
 * Fetches Wikidata occupation data for figures that don't have it,
 * then recategorizes using the new occupation-based logic.
 * 
 * Run: node scripts/recategorizeFigures.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Figure = require('../models/figure');

// Same category mapping used in WikiService.js
const CATEGORY_MAPPINGS = [
  { 
    keywords: ['athlete', 'basketball player', 'football player', 'baseball player', 'boxer', 'sprinter', 'track and field', 'olympian', 'tennis player', 'swimmer', 'golfer', 'wrestler', 'martial artist'],
    category: 'Athletic Icons' 
  },
  { 
    keywords: ['actor', 'actress', 'singer', 'musician', 'composer', 'dancer', 'choreographer', 'filmmaker', 'film director', 'director', 'artist', 'painter', 'sculptor', 'jazz musician', 'rapper', 'hip hop', 'comedian', 'entertainer', 'television presenter', 'record producer'],
    category: 'Arts, Culture & Entertainment' 
  },
  { 
    keywords: ['writer', 'author', 'novelist', 'poet', 'playwright', 'journalist', 'essayist', 'screenwriter', 'biographer', 'memoirist', 'lyricist'],
    category: 'Literary Icons' 
  },
  { 
    keywords: ['inventor', 'scientist', 'physicist', 'chemist', 'biologist', 'engineer', 'mathematician', 'astronaut', 'aerospace engineer', 'computer scientist', 'researcher', 'botanist', 'zoologist', 'surgeon', 'physician'],
    category: 'Inventors & Innovators' 
  },
  { 
    keywords: ['professor', 'teacher', 'academic', 'historian', 'scholar', 'philosopher', 'theologian', 'university president', 'educator', 'librarian', 'sociologist', 'psychologist', 'economist'],
    category: 'Educators & Scholars' 
  },
  { 
    keywords: ['politician', 'senator', 'congresswoman', 'congressman', 'representative', 'mayor', 'governor', 'president', 'diplomat', 'ambassador', 'judge', 'supreme court', 'attorney general', 'secretary', 'cabinet member', 'lawyer', 'attorney'],
    category: 'Political Leaders' 
  },
  { 
    keywords: ['pan-africanist', 'pan-african', 'liberator', 'independence leader', 'head of state', 'prime minister of'],
    category: 'Pan-African Leaders' 
  },
  { 
    keywords: ['abolitionist', 'underground railroad', 'slave revolt', 'maroon', 'freedom seeker', 'anti-slavery'],
    category: 'Freedom Fighters' 
  },
  // Civil Rights Activists - includes religious leaders who were often activists
  { 
    keywords: ['civil rights activist', 'civil rights leader', 'activist', 'organizer', 'social activist', 'human rights activist', 'minister', 'pastor', 'reverend', 'bishop', 'preacher'],
    category: 'Civil Rights Activists' 
  }
];

function determineCategoryFromOccupation(occupations) {
  if (!occupations || !Array.isArray(occupations) || occupations.length === 0) {
    return null;
  }
  
  const normalizedOccupations = occupations.map(o => o.toLowerCase());
  const occupationString = normalizedOccupations.join(' ');
  
  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalizedOccupations.some(occ => occ.includes(keyword)) ||
          occupationString.includes(keyword)) {
        return mapping.category;
      }
    }
  }
  
  return null;
}

// Fetch occupation data from Wikidata for a figure
async function fetchOccupationFromWikidata(figureName) {
  try {
    const headers = {
      'User-Agent': 'DiasporaEcho/1.0 (https://github.com/diasporaecho; contact@diasporaecho.com)',
      'Accept': 'application/json'
    };
    
    // Search for entity by name
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(figureName)}&language=en&limit=1&format=json`;
    const searchResponse = await fetch(searchUrl, { headers });
    
    if (!searchResponse.ok) {
      console.log(`   ⚠️ Wikidata search returned ${searchResponse.status}`);
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.search || searchData.search.length === 0) {
      return null;
    }
    
    const entityId = searchData.search[0].id;
    
    // Get entity details including occupation (P106)
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json`;
    const entityResponse = await fetch(entityUrl, { headers });
    if (!entityResponse.ok) return null;
    const entityData = await entityResponse.json();
    
    if (!entityData.entities || !entityData.entities[entityId]) {
      return null;
    }
    
    const entity = entityData.entities[entityId];
    const occupationClaims = entity.claims?.P106;
    
    if (!occupationClaims || occupationClaims.length === 0) {
      return null;
    }
    
    // Extract occupation entity IDs
    const occupationIds = occupationClaims
      .slice(0, 10)
      .map(claim => claim.mainsnak?.datavalue?.value?.id)
      .filter(id => id);
    
    if (occupationIds.length === 0) {
      return null;
    }
    
    // Get labels for occupation entities
    const labelsUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${occupationIds.join('|')}&props=labels&languages=en&format=json`;
    const labelsResponse = await fetch(labelsUrl, { headers });
    if (!labelsResponse.ok) return null;
    const labelsData = await labelsResponse.json();
    
    const occupations = [];
    for (const id of occupationIds) {
      const label = labelsData.entities?.[id]?.labels?.en?.value;
      if (label) {
        occupations.push(label);
      }
    }
    
    return occupations;
  } catch (error) {
    console.error(`Error fetching Wikidata for ${figureName}:`, error.message);
    return null;
  }
}

async function recategorizeFigures() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all figures
    const figures = await Figure.find({});
    console.log(`📊 Found ${figures.length} figures in database\n`);

    let updated = 0;
    let occupationsFetched = 0;
    let unchanged = 0;
    let errors = 0;
    const changes = [];

    for (let i = 0; i < figures.length; i++) {
      const figure = figures[i];
      console.log(`[${i + 1}/${figures.length}] Processing: ${figure.name}`);
      
      let occupations = figure.occupation;
      
      // Fetch occupation from Wikidata if not present
      if (!occupations || occupations.length === 0) {
        console.log(`   📡 Fetching occupation from Wikidata...`);
        occupations = await fetchOccupationFromWikidata(figure.name);
        
        if (occupations && occupations.length > 0) {
          figure.occupation = occupations;
          occupationsFetched++;
          console.log(`   ✅ Found: ${occupations.slice(0, 3).join(', ')}`);
        } else {
          console.log(`   ⚠️ No occupation data found`);
        }
        
        // Rate limit: wait 800ms between Wikidata requests to avoid blocking
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Determine new category
      const newCategory = determineCategoryFromOccupation(occupations);
      
      if (newCategory && newCategory !== figure.category) {
        changes.push({
          name: figure.name,
          oldCategory: figure.category,
          newCategory: newCategory,
          occupations: (occupations || []).slice(0, 3).join(', ')
        });
        
        figure.category = newCategory;
        console.log(`   🔄 Category: ${changes[changes.length - 1].oldCategory} → ${newCategory}`);
      }
      
      // Save if occupation was fetched or category changed
      if (figure.isModified()) {
        try {
          await figure.save();
          updated++;
        } catch (err) {
          console.log(`   ❌ Save error: ${err.message}`);
          errors++;
        }
      } else {
        unchanged++;
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('📋 CATEGORY CHANGES SUMMARY:');
    console.log('─'.repeat(80));
    
    if (changes.length === 0) {
      console.log('  No category changes were made.');
    } else {
      changes.forEach(change => {
        console.log(`  ${change.name}`);
        console.log(`    ${change.oldCategory} → ${change.newCategory}`);
        console.log(`    Occupations: ${change.occupations || 'N/A'}`);
      });
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`✅ COMPLETED:`);
    console.log(`   Total figures: ${figures.length}`);
    console.log(`   Occupations fetched from Wikidata: ${occupationsFetched}`);
    console.log(`   Categories updated: ${changes.length}`);
    console.log(`   Figures saved: ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the migration
recategorizeFigures();
