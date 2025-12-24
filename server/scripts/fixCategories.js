/**
 * Fix Categories Migration Script
 * Fixes specific figures and ensures all figures have categories array
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Figure = require('../models/figure');

const fixes = [
  { name: /Langston Hughes/i, occupation: ['poet', 'novelist', 'playwright'], categories: ['Literary Icons'] },
  { name: /Harriet Tubman/i, occupation: ['abolitionist', 'activist', 'nurse'], categories: ['Activists & Freedom Fighters'] },
  { name: /Marcus Garvey/i, occupation: ['publisher', 'Pan-Africanist'], categories: ['Pan-African Leaders'] },
  { name: /Frederick Douglass/i, occupation: ['writer', 'orator', 'statesman'], categories: ['Literary Icons', 'Activists & Freedom Fighters', 'Political Leaders'] },
  { name: /W\. E\. B\. Du Bois/i, occupation: ['historian', 'sociologist', 'activist'], categories: ['Literary Icons', 'Activists & Freedom Fighters', 'Scholars & Educators'] },
  { name: /Maya Angelou/i, occupation: ['poet', 'memoirist', 'civil rights activist'], categories: ['Literary Icons', 'Activists & Freedom Fighters'] },
  { name: /Martin Luther King/i, occupation: ['minister', 'civil rights activist'], categories: ['Activists & Freedom Fighters'] },
  { name: /Malcolm X/i, occupation: ['minister', 'human rights activist'], categories: ['Activists & Freedom Fighters'] },
];

const categoryMap = {
  'Arts, Culture & Entertainment': 'Arts & Entertainment',
  'Educators & Scholars': 'Scholars & Educators',
  'Athletic Icons': 'Athletes',
  'Civil Rights Activists': 'Activists & Freedom Fighters',
  'Freedom Fighters': 'Activists & Freedom Fighters',
  'Intellectuals Leaders': 'Scholars & Educators',
};

async function run() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Fix specific figures
    console.log('📝 Fixing specific figures...');
    for (const fix of fixes) {
      const fig = await Figure.findOne({ name: fix.name });
      if (fig) {
        fig.occupation = fix.occupation;
        fig.categories = fix.categories;
        await fig.save();
        console.log(`  ✅ ${fig.name}: ${fix.categories.join(', ')}`);
      }
    }

    // Ensure ALL figures have categories
    console.log('\n📊 Ensuring all figures have categories...');
    const allFigs = await Figure.find({});
    let fixed = 0;
    
    for (const fig of allFigs) {
      if (!fig.categories || fig.categories.length === 0) {
        const oldCat = fig.category;
        fig.categories = [categoryMap[oldCat] || oldCat || 'Scholars & Educators'];
        await fig.save();
        console.log(`  Set ${fig.name}: ${fig.categories[0]}`);
        fixed++;
      }
    }

    console.log(`\n✅ Complete! Fixed ${fixed} figures without categories.`);
    console.log(`📊 Total figures: ${allFigs.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected');
  }
}

run();
