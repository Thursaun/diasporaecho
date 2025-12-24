require('dotenv').config();
const mongoose = require('mongoose');
const Figure = require('../models/figure');
const FeaturedFiguresService = require('../services/FeaturedFiguresService');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        // 1. Pick 3 distinct figures to boost
        const figures = await Figure.find({}).limit(10);
        if (figures.length < 3) throw new Error("Not enough figures");

        const fig1 = figures[0]; // Will stay Most Liked (assume it has some likes or we give it some)
        const fig2 = figures[1]; // Will become Most Popular (Views)
        const fig3 = figures[2]; // Will become Featured (SearchHits)

        console.log(`🎯 Targeting:\n1. Likes: ${fig1.name}\n2. Views: ${fig2.name}\n3. Hits: ${fig3.name}`);

        // Boost Likes for Fig 1
        await Figure.findByIdAndUpdate(fig1._id, { $inc: { likes: 100 } });

        // Boost Views for Fig 2 (Needs to be higher than others to win Rank 2)
        await Figure.findByIdAndUpdate(fig2._id, { $set: { views: 500 } });

        // Boost SearchHits for Fig 3
        await Figure.findByIdAndUpdate(fig3._id, { $set: { searchHits: 200 } });

        console.log('🚀 Metrics boosted. Running update...');

        // Run update logic
        FeaturedFiguresService.clearCache();
        const results = await FeaturedFiguresService.updateDailyFeatured();

        console.log('\n🏆 Final Ranks:');
        results.forEach(r => {
            console.log(`${r.featuredRank}. ${r.name} (Likes: ${r.likes}, Views: ${r.views}, Hits: ${r.searchHits})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
