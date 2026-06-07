/**
 * Migration Script: Update all local database figures with correct years and eras.
 * Run with: node server/scripts/updateAllYears.js
 */

const mongoose = require("mongoose");
require("dotenv").config();
const { MONGODB_URL } = require("../config/config");
const Figure = require("../models/figure");

const yearsMap = {
  "Harriet Tubman": "1822 - 1913",
  "Sojourner Truth": "1797 - 1883",
  "Malcolm X": "1925 - 1965",
  "James Baldwin": "1924 - 1987",
  "Huey P. Newton": "1942 - 1989",
  "Booker T. Washington": "1856 - 1915",
  "Claudette Colvin": "1939 - Present",
  "Frederick Douglass": "1818 - 1895",
  "Coretta Scott King": "1927 - 2006",
  "Martin Luther King III": "1957 - Present",
  "Muhammad Ali": "1942 - 2016",
  "Jackie Robinson": "1919 - 1972",
  "Katherine Johnson": "1918 - 2020",
  "Al Sharpton": "1954 - Present",
  "Jesse Jackson": "1941 - Present",
  "Sam Cooke": "1931 - 1964",
  "Fred Hampton": "1948 - 1969",
  "Mary McLeod Bethune": "1875 - 1955",
  "Fanny Jackson Coppin": "1837 - 1913",
  "W. E. B. Du Bois": "1868 - 1963",
  "Nelson Mandela": "1918 - 2013",
  "George Washington Carver": "1864 - 1943",
  "Garrett Morgan": "1877 - 1963",
  "Lewis Howard Latimer": "1848 - 1928",
  "Jesse Owens": "1913 - 1980",
  "Bill Russell": "1934 - 2022",
  "Haile Selassie": "1892 - 1975",
  "Amha Selassie": "1916 - 1997",
  "Louis Farrakhan": "1933 - Present",
  "Langston Hughes": "1902 - 1967",
  "Martin Luther King Jr.": "1929 - 1968"
};

const getFirstSentence = (text) => {
  if (!text || typeof text !== 'string') return "";
  
  let pLevel = 0; // parentheses level ()
  let bLevel = 0; // brackets level []
  let sentenceEnd = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(') pLevel++;
    else if (char === ')') pLevel--;
    else if (char === '[') bLevel++;
    else if (char === ']') bLevel--;
    else if (pLevel === 0 && bLevel === 0 && (char === '.' || char === '!' || char === '?')) {
      const nextText = text.substring(i + 1);
      const hasSpaceAndCapital = /^\s+([A-Z\d]|$)/.test(nextText) || nextText.trim() === "";
      
      const backwardText = text.substring(0, i);
      const isAbbreviation = /\b(c|ca|dr|mr|mrs|ms|jr|sr|st|vs|al|gen|col|maj|capt|lieut|rev|prof|univ|est|dept)\s*$/i.test(backwardText) ||
                             /\b[A-Z]\s*$/i.test(backwardText);
      
      if (hasSpaceAndCapital && !isAbbreviation) {
        sentenceEnd = i;
        break;
      }
    }
  }
  
  let firstSentence = "";
  if (sentenceEnd !== -1) {
    firstSentence = text.substring(0, sentenceEnd + 1).trim();
  } else {
    firstSentence = text.trim();
  }
  
  return firstSentence;
};

const determineEra = (years) => {
  if (!years || typeof years !== "string") return "Unknown Era";
  const match = years.match(/\b\d{4}\b/);
  if (!match) return "Unknown Era";
  
  const birthYear = parseInt(match[0], 10);
  const year = birthYear + 25; // Estimate era based on age of impact (approx. 25 years after birth)
  
  if (year < 1865) return "Slavery & Abolition Era";
  if (year >= 1865 && year <= 1877) return "Reconstruction Era";
  if (year > 1877 && year <= 1915) return "Jim Crow & Early Activism";
  if (year > 1915 && year <= 1940) return "Harlem Renaissance & New Negro";
  if (year > 1940 && year <= 1968) return "Civil Rights Movement";
  return "Post-Civil Rights & Modern Era";
};

async function run() {
  const uri = process.env.MONGODB_URI || MONGODB_URL || "mongodb://localhost:27017/diasporaecho";
  console.log(`📡 Connecting to MongoDB at ${uri}...`);
  
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected!");

    const figures = await Figure.find({});
    console.log(`📋 Found ${figures.length} figures in the database.`);

    let updatedCount = 0;
    for (const fig of figures) {
      const years = yearsMap[fig.name] || fig.years;
      const correctEra = determineEra(years);
      
      const update = {};
      let needsUpdate = false;

      if (years && fig.years !== years) {
        update.years = years;
        needsUpdate = true;
      }

      if (correctEra !== "Unknown Era" && fig.era !== correctEra) {
        update.era = correctEra;
        needsUpdate = true;
      }

      if (!fig.legacy) {
        const cleanLegacy = getFirstSentence(fig.description);
        if (cleanLegacy) {
          update.legacy = cleanLegacy;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Figure.updateOne({ _id: fig._id }, { $set: update });
        console.log(`✏️ Updated "${fig.name}": Years = "${years || fig.years}", Era = "${correctEra}", Legacy = "${update.legacy || fig.legacy || 'No Change'}"`);
        updatedCount++;
      } else {
        console.log(`ℹ️ "${fig.name}" already has correct years, era, and legacy.`);
      }
    }

    console.log(`\n🎉 Migration finished. Updated ${updatedCount} figures.`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

run();
