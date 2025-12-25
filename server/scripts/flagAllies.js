/**
 * Flag Allies Script
 * 
 * This script helps identify and flag figures who are allies (not people of color)
 * so they rank lower in search results while still being included in the collection.
 * 
 * Usage: 
 *   node scripts/flagAllies.js --list              # List all figures
 *   node scripts/flagAllies.js --flag "Name Here"  # Flag a specific figure as ally
 *   node scripts/flagAllies.js --unflag "Name"     # Unflag a figure (make primary again)
 *   node scripts/flagAllies.js --show-allies       # Show all current allies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Figure = require('../models/figure');

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function listFigures() {
    const figures = await Figure.find({})
        .select('name isPrimaryFigure ethnicGroup categories')
        .sort({ name: 1 })
        .lean();

    console.log('\n📋 All Figures:\n');
    figures.forEach((fig, i) => {
        const status = fig.isPrimaryFigure === false ? '👤 ALLY' : '⭐ PRIMARY';
        const ethnic = fig.ethnicGroup?.length > 0 ? ` [${fig.ethnicGroup.join(', ')}]` : '';
        console.log(`${i + 1}. ${status} ${fig.name}${ethnic}`);
    });

    console.log(`\n📊 Total: ${figures.length} figures`);
    console.log(`   - Primary: ${figures.filter(f => f.isPrimaryFigure !== false).length}`);
    console.log(`   - Allies:  ${figures.filter(f => f.isPrimaryFigure === false).length}`);
}

async function showAllies() {
    const allies = await Figure.find({ isPrimaryFigure: false })
        .select('name categories')
        .sort({ name: 1 })
        .lean();

    if (allies.length === 0) {
        console.log('\n✅ No allies have been flagged yet.');
        return;
    }

    console.log('\n👤 Current Allies (non-primary figures):\n');
    allies.forEach((fig, i) => {
        console.log(`${i + 1}. ${fig.name}`);
    });
    console.log(`\n📊 Total Allies: ${allies.length}`);
}

async function flagAsAlly(name) {
    const figure = await Figure.findOne({
        name: { $regex: new RegExp(name, 'i') }
    });

    if (!figure) {
        console.error(`❌ Figure not found: "${name}"`);
        console.log('   Try using --list to see all figure names.');
        return;
    }

    if (figure.isPrimaryFigure === false) {
        console.log(`ℹ️  "${figure.name}" is already flagged as an ally.`);
        return;
    }

    figure.isPrimaryFigure = false;
    await figure.save();
    console.log(`✅ Flagged "${figure.name}" as an ally (will rank lower in search).`);
}

async function unflagAsAlly(name) {
    const figure = await Figure.findOne({
        name: { $regex: new RegExp(name, 'i') }
    });

    if (!figure) {
        console.error(`❌ Figure not found: "${name}"`);
        return;
    }

    if (figure.isPrimaryFigure !== false) {
        console.log(`ℹ️  "${figure.name}" is already a primary figure.`);
        return;
    }

    figure.isPrimaryFigure = true;
    await figure.save();
    console.log(`✅ Unflagged "${figure.name}" - now a primary figure again.`);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Flag Allies Script - Mark figures as allies for search ranking

Usage:
  node scripts/flagAllies.js --list              List all figures with their status
  node scripts/flagAllies.js --show-allies       Show only figures marked as allies
  node scripts/flagAllies.js --flag "Name"       Flag a figure as ally (lower ranking)
  node scripts/flagAllies.js --unflag "Name"     Restore a figure to primary status
`);
        process.exit(0);
    }

    await connectDB();

    try {
        if (args[0] === '--list') {
            await listFigures();
        } else if (args[0] === '--show-allies') {
            await showAllies();
        } else if (args[0] === '--flag' && args[1]) {
            await flagAsAlly(args[1]);
        } else if (args[0] === '--unflag' && args[1]) {
            await unflagAsAlly(args[1]);
        } else {
            console.error('❌ Unknown command. Run without arguments for help.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
}

main();
