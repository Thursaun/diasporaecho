require('dotenv').config();
const mongoose = require('mongoose');
const FeaturedFiguresService = require('../services/FeaturedFiguresService');
const Figure = require('../models/figure'); // Required for internal usage

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear cache
        FeaturedFiguresService.clearCache();

        // 2. Trigger new update (which runs logic based on new schema/indexes)
        console.log('🔄 Triggering force update of featured figures...');
        const figures = await FeaturedFiguresService.updateDailyFeatured();

        console.log('\n📊 Resulting Selection:');
        figures.forEach(fig => {
            console.log(`Rank ${fig.featuredRank} (${fig.featuredRank === 1 ? 'Likes' : fig.featuredRank === 2 ? 'Views' : 'SearchHits'}): ${fig.name}`);
            console.log(`   Stats - Likes: ${fig.likes}, Views: ${fig.views || 0}, Hits: ${fig.searchHits || 0}`);
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

run();
