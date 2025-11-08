/**
 * Initialize Featured Figures
 * Run this script to set up the initial featured figures
 * Usage: node scripts/initFeatured.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const FeaturedFiguresService = require('../services/featuredFiguresService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diasporaecho';

async function initFeatured() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Initializing featured figures...');
    const featured = await FeaturedFiguresService.updateDailyFeatured();

    console.log('\n✅ Featured figures initialized successfully!');
    console.log(`📊 Total featured: ${featured.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing featured figures:', error);
    process.exit(1);
  }
}

initFeatured();
