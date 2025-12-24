require('dotenv').config();
const mongoose = require('mongoose');
const Figure = require('../models/figure');

// Fix years extraction function (same as controller logic)
function extractYears(extract) {
  if (!extract) return 'Unknown';
  
  // Pattern 1: Month Day, Year - Month Day, Year
  const fullMatch = extract.match(/([A-Z][a-z]+ \d{1,2}, \d{4})\s*[–—-]\s*([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if (fullMatch) {
    const birth = fullMatch[1].match(/\d{4}/)?.[0];
    const death = fullMatch[2].match(/\d{4}/)?.[0];
    if (birth && death) return `${birth} - ${death}`;
  }
  
  // Pattern 2: Year ranges "1933–2003"
  const rangeMatch = extract.match(/\b(\d{4})\s*[–—-]\s*(\d{4})\b/);
  if (rangeMatch) return `${rangeMatch[1]} - ${rangeMatch[2]}`;
  
  // Pattern 3: Born keyword with living/dead detection
  const bornMatch = extract.match(/born[^)]*(\d{4})/i);
  if (bornMatch) {
    const deathMatch = extract.match(/died[^)]*(\d{4})|(\d{4})\s*[–—-]\s*(\d{4})/i);
    if (deathMatch) {
        return deathMatch[3] ? `${deathMatch[2]} - ${deathMatch[3]}` : `${bornMatch[1]} - ${deathMatch[1]}`;
    } else {
        return `${bornMatch[1]} - Present`;
    }
  }
  
  return 'Unknown';
}

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find figures that strictly look like they have bad data (pronunciation guides usually contain semicolons or "born")
        // or just re-process "Unknown" ones or specific ones
        const figures = await Figure.find({});
        
        console.log(`Processing ${figures.length} figures...`);
        let updatedCount = 0;

        for (const fig of figures) {
            // Check if current years is "Unknown" or contains pronunciation/long text
            // Pronunciation often includes "born" inside the years field incorrectly from previous logic
            if (fig.years === 'Unknown' || fig.years.length > 20 || fig.years.includes('born') || fig.years.includes(';')) {
                const oldYears = fig.years;
                const newYears = extractYears(fig.description);
                
                if (newYears !== 'Unknown' && newYears !== oldYears) {
                    console.log(`\n🔹 Fixing ${fig.name}`);
                    console.log(`   Old: ${oldYears}`);
                    console.log(`   New: ${newYears}`);
                    
                    fig.years = newYears;
                    await fig.save();
                    updatedCount++;
                }
            }
        }

        console.log(`\n✨ Update complete! Fixed ${updatedCount} figures.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

run();
