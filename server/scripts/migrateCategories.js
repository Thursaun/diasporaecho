/**
 * Migrate legacy categories to new schema-compliant categories
 * Usage: node scripts/migrateCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Figure = require('../models/figure');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diasporaecho';

const CATEGORY_MAP = {
  'Civil Rights Activists': 'Activists & Freedom Fighters',
  'Arts, Culture & Entertainment': 'Arts & Entertainment',
  'Educators & Scholars': 'Scholars & Educators',
  'Political Leaders': 'Political Leaders',
  'Inventors & Innovators': 'Inventors & Innovators',
  'Athletic Icons': 'Athletes',
  'Intellectuals Leaders': 'Scholars & Educators'
};

async function migrateCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const figures = await Figure.find({});
    console.log(`🔍 Found ${figures.length} figures to migrate.`);

    let updatedCount = 0;

    for (const figure of figures) {
      const rawCategory = figure.category;
      console.log(`Figure: "${figure.name}", Legacy Category: "${rawCategory}"`);

      let newCategories = [];
      if (rawCategory && CATEGORY_MAP[rawCategory]) {
        newCategories = [CATEGORY_MAP[rawCategory]];
      } else if (figure.categories && figure.categories.length > 0) {
        newCategories = figure.categories;
      } else {
        newCategories = ['Scholars & Educators'];
      }

      // Update both fields
      figure.categories = newCategories;
      if (rawCategory && CATEGORY_MAP[rawCategory]) {
        figure.category = CATEGORY_MAP[rawCategory];
      }

      await figure.save();
      updatedCount++;
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} figures.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

migrateCategories();
