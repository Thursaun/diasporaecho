require("dotenv").config();
const fetch = require("node-fetch");
const Figure = require("../models/figure");
const checkDupes = require("../helper/checkDupes");

const API_BASE_URL = "https://en.wikipedia.org/w/api.php";

const searchController = async (req, res) => {
  try {
    const searchTerm = req.query.query || req.query.searchTerm || "";

    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }

    console.log("Searching for:", searchTerm);

    // Step 1: Search database first with enhanced name matching
    const dbResults = await Figure.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { name: { $regex: searchTerm.replace(/\s+/g, ".*"), $options: "i" } }, // Flexible name matching
        { description: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
    }).limit(10);

    console.log(`Found ${dbResults.length} results in database`);

    // Step 2: Only search Wikipedia if no database results found
    if (dbResults.length > 0) {
      // Sort database results to prioritize exact matches
      const sortedResults = dbResults.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return 0;
      });

      return res.json(sortedResults.slice(0, 15));
    }

    // No database results - search Wikipedia
    console.log("No database results, searching Wikipedia...");
    const wikiResults = await searchFigures({ searchTerm });
    console.log(`Found ${wikiResults.length} results from Wikipedia`);

    // Filter Wikipedia results
    const uniqueWikiResults = await Promise.all(
      wikiResults.map(async (figure) => {
        if (!figure.imageUrl || figure.imageUrl.includes("placeholder")) {
          return null;
        }

        const isDuplicate = await checkDupes(figure);
        if (isDuplicate) {
          return null;
        }

        return figure;
      })
    );

    const validWikiResults = uniqueWikiResults.filter(Boolean);

    // Sort Wikipedia results to prioritize exact matches
    const sortedResults = validWikiResults.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });

    res.json(sortedResults.slice(0, 15));
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error performing search" });
  }
};

function isSearchingByTopic(searchTerm) {
  if (!searchTerm) return false;
  
  const term = searchTerm.toLowerCase();
  const topicKeywords = [
    "movement", "revolution", "rights", "history", "culture", "music", "art",
    "education", "politics", "activism", "literature", "science", "invention"
  ];

  // If contains topic keywords, it's a topic search
  if (topicKeywords.some((keyword) => term.includes(keyword))) {
    return true;
  }

  // Check if it looks like a person's name (2+ capitalized words)
  const words = searchTerm.split(" ").filter((word) => word.length > 0);
  const looksLikeName = words.length >= 2 && 
    words.every((word) => word[0] === word[0].toUpperCase());

  return !looksLikeName; // If it looks like a name, it's NOT a topic search
}

const searchFigures = function (params = {}) {
  const searchTerm = params.searchTerm || "";
  const isTopicSearch = isSearchingByTopic(searchTerm);

  // IMPROVED: Better search strategies for famous figures
  let searchQueries = [];
  
  if (!isTopicSearch) {
    // For person searches, try multiple strategies
    searchQueries = [
      searchTerm, // Exact search first
      `"${searchTerm}"`, // Quoted search for exact phrase
      `${searchTerm} civil rights`, // Add context
      `${searchTerm} African American`, // Add racial context
      `${searchTerm} biography` // Biography search
    ];
  } else {
    searchQueries = [`African American ${searchTerm} notable figures`];
  }

  console.log("Search strategies:", searchQueries);

  // Try each search strategy until we get good results
  return trySearchStrategies(searchQueries, params.rows || 20, searchTerm);
};

async function trySearchStrategies(searchQueries, limit, originalTerm) {
  for (const query of searchQueries) {
    try {
      console.log("Trying search:", query);

      // IMPROVED: Use both search methods for better coverage
      // Method 1: Try opensearch first (better for names)
      const opensearchParams = new URLSearchParams({
        action: "opensearch",
        format: "json",
        search: query,
        limit: limit,
        namespace: "0", // Main namespace only
        origin: "*",
      });

      const opensearchUrl = `${API_BASE_URL}?${opensearchParams.toString()}`;
      const opensearchResponse = await fetch(opensearchUrl);

      let pageIds = [];

      if (opensearchResponse.ok) {
        const opensearchData = await opensearchResponse.json();
        // OpenSearch returns: [query, [titles...], [descriptions...], [urls...]]
        if (opensearchData && opensearchData[1] && opensearchData[1].length > 0) {
          console.log(`OpenSearch found ${opensearchData[1].length} results:`, opensearchData[1]);

          // Convert titles to page IDs
          const titlesParam = opensearchData[1].join("|");
          const titlesToIdsParams = new URLSearchParams({
            action: "query",
            format: "json",
            titles: titlesParam,
            origin: "*",
          });

          const titlesToIdsUrl = `${API_BASE_URL}?${titlesToIdsParams.toString()}`;
          const titlesToIdsResponse = await fetch(titlesToIdsUrl);

          if (titlesToIdsResponse.ok) {
            const titlesToIdsData = await titlesToIdsResponse.json();
            if (titlesToIdsData.query && titlesToIdsData.query.pages) {
              pageIds = Object.keys(titlesToIdsData.query.pages).filter(id => id !== "-1");
            }
          }
        }
      }

      // Method 2: Fallback to regular search if opensearch didn't work well
      if (pageIds.length === 0) {
        const searchQueryParams = new URLSearchParams({
          action: "query",
          format: "json",
          list: "search",
          srsearch: query,
          srlimit: limit,
          origin: "*",
        });

        const searchUrl = `${API_BASE_URL}?${searchQueryParams.toString()}`;
        const response = await fetch(searchUrl);

        if (!response.ok) continue;

        const data = await response.json();

        if (!data.query || !data.query.search || data.query.search.length === 0) {
          continue; // Try next strategy
        }

        console.log(`Regular search found ${data.query.search.length} results for "${query}"`);
        pageIds = data.query.search.map((item) => item.pageid);
      }

      if (pageIds.length > 0) {
        const pageIdsStr = pageIds.join("|");
        const detailedData = await getPageDetails(pageIdsStr, originalTerm, false);

        if (detailedData) {
          const figures = formatWikipediaData(detailedData, originalTerm, true);
          if (figures.length > 0) {
            console.log(`✅ Successfully found ${figures.length} figures`);
            return figures;
          }
        }
      }
    } catch (error) {
      console.error(`Error with search strategy "${query}":`, error);
      continue;
    }
  }

  return []; // No strategies worked
}

// Helper function to calculate name similarity
function calculateNameSimilarity(title, searchTerm) {
  const titleLower = title.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Exact match
  if (titleLower === searchLower) return 1.0;
  
  // Contains all words
  const searchWords = searchLower.split(' ');
  const matchedWords = searchWords.filter(word => titleLower.includes(word));
  
  return matchedWords.length / searchWords.length;
}

async function getPageDetails(pageIds, searchTerm, isTopicSearch) {
  try {
    // PERFORMANCE IMPROVEMENT: Fetch both extract AND wikibase data for better metadata
    const detailsQueryParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts|pageimages|info|categories|pageprops",
      pageids: pageIds,
      exintro: "true",
      explaintext: "true",
      piprop: "original",
      pithumbsize: 300, // Add thumbnail as fallback
      inprop: "url",
      cllimit: "50",
      ppprop: "wikibase_item", // Get Wikidata ID for precise dates
      origin: "*",
    });

    const detailsUrl = `${API_BASE_URL}?${detailsQueryParams.toString()}`;
    const response = await fetch(detailsUrl);

    if (!response.ok) {
      throw new Error(`Error fetching page details: ${response.statusText}`);
    }

    const data = await response.json();

    // OPTIMIZATION: Fetch Wikidata for pages that have wikibase items
    if (data && data.query && data.query.pages) {
      await enrichWithWikidata(data.query.pages);
    }

    return data;
  } catch (error) {
    console.error("Error fetching page details:", error);
    return null;
  }
}

// NEW: Enrich Wikipedia data with precise Wikidata birth/death dates
async function enrichWithWikidata(pages) {
  try {
    const wikidataIds = [];
    const pageIdToWikidataId = {};

    // Collect all Wikidata IDs
    for (const pageId in pages) {
      const wikidataId = pages[pageId].pageprops?.wikibase_item;
      if (wikidataId) {
        wikidataIds.push(wikidataId);
        pageIdToWikidataId[pageId] = wikidataId;
      }
    }

    if (wikidataIds.length === 0) return;

    console.log(`🔍 Fetching Wikidata for ${wikidataIds.length} entities...`);

    // Fetch Wikidata in batches of 50 (API limit)
    const batchSize = 50;
    for (let i = 0; i < wikidataIds.length; i += batchSize) {
      const batch = wikidataIds.slice(i, i + batchSize);
      await fetchWikidataBatch(batch, pageIdToWikidataId, pages);
    }
  } catch (error) {
    console.error("Error enriching with Wikidata:", error);
    // Don't throw - just log and continue with Wikipedia data
  }
}

// NEW: Fetch Wikidata batch for precise dates and enhanced metadata
async function fetchWikidataBatch(wikidataIds, pageIdToWikidataId, pages) {
  try {
    const wikidataUrl = `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: "wbgetentities",
      ids: wikidataIds.join("|"),
      props: "claims|labels",
      languages: "en",
      format: "json",
      origin: "*",
    })}`;

    const response = await fetch(wikidataUrl);
    if (!response.ok) return;

    const wikidataResponse = await response.json();

    if (!wikidataResponse.entities) return;

    // Process each entity
    for (const [wikidataId, entity] of Object.entries(wikidataResponse.entities)) {
      if (!entity.claims) continue;

      // P569 = date of birth, P570 = date of death
      const birthClaim = entity.claims.P569?.[0];
      const deathClaim = entity.claims.P570?.[0];

      const birthYear = extractYearFromWikidataClaim(birthClaim);
      const deathYear = extractYearFromWikidataClaim(deathClaim);

      // Enhanced metadata extraction
      const occupation = extractWikidataLabels(entity.claims.P106, wikidataResponse); // P106 = occupation
      const birthPlace = extractWikidataLabel(entity.claims.P19?.[0], wikidataResponse); // P19 = place of birth
      const deathPlace = extractWikidataLabel(entity.claims.P20?.[0], wikidataResponse); // P20 = place of death
      const awards = extractWikidataLabels(entity.claims.P166, wikidataResponse).slice(0, 5); // P166 = awards (limit to 5)
      const education = extractWikidataLabels(entity.claims.P69, wikidataResponse).slice(0, 3); // P69 = educated at
      const notableWorks = extractWikidataLabels(entity.claims.P800, wikidataResponse).slice(0, 5); // P800 = notable works
      const movement = extractWikidataLabels(entity.claims.P135, wikidataResponse); // P135 = movement

      // Find the corresponding Wikipedia page
      const pageId = Object.keys(pageIdToWikidataId).find(
        id => pageIdToWikidataId[id] === wikidataId
      );

      if (pageId && pages[pageId]) {
        // Store Wikidata dates for later use
        pages[pageId].wikidataBirth = birthYear;
        pages[pageId].wikidataDeath = deathYear;

        // Store enhanced metadata
        pages[pageId].wikidataOccupation = occupation;
        pages[pageId].wikidataBirthPlace = birthPlace;
        pages[pageId].wikidataDeathPlace = deathPlace;
        pages[pageId].wikidataAwards = awards;
        pages[pageId].wikidataEducation = education;
        pages[pageId].wikidataNotableWorks = notableWorks;
        pages[pageId].wikidataMovement = movement;

        if (birthYear || deathYear) {
          console.log(`✅ Wikidata: ${pages[pageId].title} - Birth: ${birthYear || 'unknown'}, Death: ${deathYear || 'unknown'}`);
        }
        if (occupation.length > 0) {
          console.log(`   Occupation: ${occupation.join(', ')}`);
        }
        if (birthPlace) {
          console.log(`   Birthplace: ${birthPlace}`);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching Wikidata batch:", error);
  }
}

// Helper function to extract labels from Wikidata claims (for multiple values)
function extractWikidataLabels(claims, wikidataResponse) {
  if (!claims || !Array.isArray(claims)) return [];

  const labels = [];
  for (const claim of claims.slice(0, 10)) { // Limit to first 10 to avoid too much data
    const label = extractWikidataLabel(claim, wikidataResponse);
    if (label) labels.push(label);
  }
  return labels;
}

// Helper function to extract a single label from a Wikidata claim
function extractWikidataLabel(claim, wikidataResponse) {
  if (!claim || !claim.mainsnak || !claim.mainsnak.datavalue) return null;

  const value = claim.mainsnak.datavalue.value;

  // If it's an entity reference, try to get the label
  if (value.id && wikidataResponse.entities && wikidataResponse.entities[value.id]) {
    const entity = wikidataResponse.entities[value.id];
    return entity.labels?.en?.value || null;
  }

  // If it's a string value, return it directly
  if (typeof value === 'string') {
    return value;
  }

  return null;
}

// NEW: Extract year from Wikidata claim
function extractYearFromWikidataClaim(claim) {
  if (!claim || !claim.mainsnak || !claim.mainsnak.datavalue) {
    return null;
  }

  const value = claim.mainsnak.datavalue.value;

  // Wikidata dates come in format: +1948-08-30T00:00:00Z
  if (value.time) {
    const match = value.time.match(/^[+-]?(\d{4})/);
    if (match) {
      const year = parseInt(match[1]);
      const currentYear = new Date().getFullYear();
      if (year >= 1700 && year <= currentYear) {
        return year;
      }
    }
  }

  return null;
}

function formatWikipediaData(data, searchTerm, peopleOnly = false) {
  if (!data || !data.query || !data.query.pages) {
    return [];
  }

  const pages = data.query.pages;
  const figures = [];

  for (const pageId in pages) {
    const page = pages[pageId];

    if (!page.extract) {
      continue;
    }

    if (peopleOnly && !looksLikePerson(page)) {
      continue;
    }

    // OPTIMIZATION: Use Wikidata first (most accurate), then extract from text
    let years = "Unknown";

    if (page.wikidataBirth || page.wikidataDeath) {
      // Wikidata provides the most accurate dates
      if (page.wikidataBirth && page.wikidataDeath) {
        years = `${page.wikidataBirth}-${page.wikidataDeath}`;
        console.log(`✅ Using Wikidata dates for ${page.title}: ${years}`);
      } else if (page.wikidataBirth) {
        // Check if person is likely still alive
        const currentYear = new Date().getFullYear();
        const age = currentYear - page.wikidataBirth;

        if (age < 120 && page.extract && /\bis\s+(?:a|an|the)/.test(page.extract)) {
          years = `${page.wikidataBirth}-Present`;
          console.log(`✅ Using Wikidata birth (living) for ${page.title}: ${years}`);
        } else {
          years = `${page.wikidataBirth}`;
          console.log(`✅ Using Wikidata birth only for ${page.title}: ${years}`);
        }
      } else if (page.wikidataDeath) {
        years = `Unknown-${page.wikidataDeath}`;
        console.log(`⚠️ Only death date from Wikidata for ${page.title}: ${years}`);
      }
    } else {
      // Fallback to text extraction
      const extractedYears = extractYearsFromText(page.extract);
      years = extractedYears || "Unknown";

      if (extractedYears) {
        console.log(`📝 Extracted from text for ${page.title}: ${years}`);
      } else {
        console.log(`❌ No dates found for ${page.title}`);
      }
    }

    const tags = extractTags(page);
    const contributions = extractContributions(page.extract);

    figures.push({
      _id: pageId,
      wikipediaId: pageId,
      name: page.title,
      imageUrl: page.original?.source || page.thumbnail?.source ||
        "https://via.placeholder.com/300x400?text=No+Image",
      description: page.extract || "No description available",
      years: years,
      tags: tags,
      contributions: contributions,
      source: "Wikipedia",
      sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${pageId}`,
      likes: 0,
      likedBy: [],
      // Enhanced metadata from Wikidata
      occupation: page.wikidataOccupation || [],
      birthPlace: page.wikidataBirthPlace || null,
      deathPlace: page.wikidataDeathPlace || null,
      awards: page.wikidataAwards || [],
      education: page.wikidataEducation || [],
      notableWorks: page.wikidataNotableWorks || [],
      movement: page.wikidataMovement || [],
    });
  }

  console.log(`Formatted ${figures.length} figures (${figures.filter(f => f.years !== 'Unknown').length} with dates)`);
  return figures;
}

function looksLikePerson(page) {
  if (!page.extract) return false;

  const personPatterns = [
    /\b(born|died)\b/i,
    /was an? (American|African[- ]American)/i,
    /is an? (American|African[- ]American)/i,
    /\(\d{4}.*\d{4}\)/,
    /(civil rights|activist|leader|politician|writer|artist)/i,
  ];

  return personPatterns.some((pattern) => pattern.test(page.extract));
}

function extractYearsFromText(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Extract only the first sentence/line - this is where Wikipedia typically puts birth/death info
  const firstSentence = text.split(/[.!?]/)[0].trim();
  
  // If first sentence is too short, try first two sentences
  const textToAnalyze = firstSentence.length < 50 ? 
    text.split(/[.!?]/).slice(0, 2).join('. ').trim() : 
    firstSentence;
  
  // Clean and normalize the text
  const cleanText = textToAnalyze.replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim();
  console.log(`🔍 Extracting years from first line: "${cleanText}"`);
  
  // OPTIMIZATION: Enhanced patterns for better year extraction
  const patterns = [
    // 1. Wikipedia's most common format: Name (born Other Name, c. March 1822 – March 10, 1913)
    {
      regex: /\((?:born[^,]*,?\s*)?(?:c\.\s*)?(?:january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{1,2},?\s*(\d{4})\s*[-–—]\s*(?:january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{1,2},?\s*(\d{4})\)/gi,
      type: 'birth-death',
      priority: 1
    },

    // 2. Simple parenthetical with years: Name (1929-1968), Name (c. 1822-1913)
    {
      regex: /\((?:c\.\s*)?(\d{4})\s*[-–—]\s*(\d{4})\)/g,
      type: 'birth-death',
      priority: 2
    },

    // NEW 3. Parenthetical with "born" and death year: (born 1929 – died 1968)
    {
      regex: /\(born[^0-9]*(\d{4})[^0-9]*(?:died|death|–|—|-)[^0-9]*(\d{4})\)/gi,
      type: 'birth-death',
      priority: 3
    },

    // 4. Born in parentheses only: Name (born 1961), (b. 1961)
    {
      regex: /\((?:born|b\.)[^0-9]*(\d{4})\)/gi,
      type: 'birth-only',
      priority: 4
    },

    // NEW 5. Parenthetical abbreviations: (b. 1822 – d. 1913)
    {
      regex: /\(b\.\s*(\d{4})\s*[-–—]\s*d\.\s*(\d{4})\)/gi,
      type: 'birth-death',
      priority: 5
    },

    // 6. Start of sentence with full dates: Born March 1822, died March 1913
    {
      regex: /^[^.]*born\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{1,2}?,?\s*(\d{4})[^0-9]*(?:died|death)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{1,2}?,?\s*(\d{4})/gi,
      type: 'birth-death',
      priority: 6
    },

    // 7. Simple born/died in first line: born 1948, died 1969
    {
      regex: /born[^0-9]*(\d{4})[^0-9]*(?:died|death)[^0-9]*(\d{4})/gi,
      type: 'birth-death',
      priority: 7
    },

    // NEW 8. Reverse order with died first: died 1968, born 1929 (less common but exists)
    {
      regex: /(?:died|death)[^0-9]*(\d{4})[^0-9]*born[^0-9]*(\d{4})/gi,
      type: 'death-birth-reverse',
      priority: 8
    },

    // NEW 9. Year range at start without "born": Name (1822–1913) was a...
    {
      regex: /^\s*[A-Z][^(]*\((\d{4})[-–—](\d{4})\)\s+(?:was|is)/,
      type: 'birth-death',
      priority: 9
    },

    // 10. Born with full date: born August 30, 1948
    {
      regex: /born\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+(\d{4})/gi,
      type: 'birth-only',
      priority: 10
    },

    // NEW 11. Born on specific date: born on August 30, 1948
    {
      regex: /born\s+on\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+(\d{4})/gi,
      type: 'birth-only',
      priority: 11
    },

    // 12. Simple born pattern: born 1948
    {
      regex: /born[^0-9]*(\d{4})/gi,
      type: 'birth-only',
      priority: 12
    },

    // NEW 13. Age in parentheses with current year calculation: (age 75) or (aged 75)
    {
      regex: /\((?:age|aged)\s+(\d{1,3})\)/gi,
      type: 'age-based',
      priority: 13
    }
  ];
  
  let birthYear = null;
  let deathYear = null;
  let bestMatch = null;
  let bestPriority = 999;
  
  // Try each pattern and find the best match
  for (const pattern of patterns) {
    const matches = [...cleanText.matchAll(pattern.regex)];

    if (matches.length > 0) {
      const match = matches[0];
      console.log(`📅 Pattern match (${pattern.type}, priority ${pattern.priority}):`, match[0]);

      if (pattern.type === 'birth-death' && match[1] && match[2]) {
        const year1 = parseInt(match[1]);
        const year2 = parseInt(match[2]);

        // Validate years are reasonable
        const currentYear = new Date().getFullYear();
        if (year1 >= 1700 && year1 <= currentYear &&
            year2 >= 1700 && year2 <= currentYear &&
            year2 > year1 && (year2 - year1) < 120) {

          if (pattern.priority < bestPriority) {
            birthYear = year1;
            deathYear = year2;
            bestMatch = pattern;
            bestPriority = pattern.priority;
            console.log(`✅ New best birth-death match: ${birthYear}-${deathYear} (priority ${bestPriority})`);

            // If we found a high-priority match, stop looking
            if (bestPriority <= 2) {
              break;
            }
          }
        }
      } else if (pattern.type === 'death-birth-reverse' && match[1] && match[2]) {
        // Handle reverse order (death year first, birth year second in regex)
        const deathYr = parseInt(match[1]);
        const birthYr = parseInt(match[2]);

        const currentYear = new Date().getFullYear();
        if (birthYr >= 1700 && birthYr <= currentYear &&
            deathYr >= 1700 && deathYr <= currentYear &&
            deathYr > birthYr && (deathYr - birthYr) < 120) {

          if (pattern.priority < bestPriority) {
            birthYear = birthYr;
            deathYear = deathYr;
            bestMatch = pattern;
            bestPriority = pattern.priority;
            console.log(`✅ Reverse order match: ${birthYear}-${deathYear} (priority ${bestPriority})`);
          }
        }
      } else if (pattern.type === 'birth-only' && match[1] && !birthYear && bestPriority > 9) {
        const year = parseInt(match[1]);
        const currentYear = new Date().getFullYear();

        if (year >= 1700 && year <= currentYear) {
          birthYear = year;
          bestPriority = pattern.priority;
          console.log(`📅 Found birth year: ${birthYear} (priority ${bestPriority})`);
        }
      } else if (pattern.type === 'age-based' && match[1] && !birthYear && bestPriority > 12) {
        // Calculate birth year from age
        const age = parseInt(match[1]);
        const currentYear = new Date().getFullYear();

        if (age >= 0 && age < 120) {
          birthYear = currentYear - age;
          bestPriority = pattern.priority;
          console.log(`📅 Calculated birth year from age ${age}: ${birthYear} (priority ${bestPriority})`);
        }
      }
    }
  }
  
  // If we have a complete birth-death pair, use it
  if (bestMatch && birthYear && deathYear) {
    console.log(`🎯 Final result (birth-death): ${birthYear}-${deathYear}`);
    return `${birthYear}-${deathYear}`;
  }
  
  // Handle birth-only cases
  if (birthYear && !deathYear) {
    const currentYear = new Date().getFullYear();
    
    // Enhanced living person detection
    const livingIndicators = [
      /\bis\s+(?:an?|the)\s+(?:american|african[- ]american)/i,
      /\bis\s+a\s+/i,
      /serves as/i,
      /currently/i,
      /continues/i,
      /works as/i,
      /active/i
    ];
    
    const deathIndicators = [
      /\b(?:died|death|deceased|late|passed away|assassinated|killed|murdered|executed)\b/i
    ];
    
    const hasLivingIndicators = livingIndicators.some(pattern => pattern.test(cleanText));
    const hasDeathIndicators = deathIndicators.some(pattern => pattern.test(cleanText));
    
    // If born within last 80 years and shows living indicators, likely alive
    if (birthYear > currentYear - 80 && hasLivingIndicators && !hasDeathIndicators) {
      console.log(`🎯 Final result (living): ${birthYear}-Present`);
      return `${birthYear}-Present`;
    } else {
      console.log(`🎯 Final result (birth only): ${birthYear}`);
      return `${birthYear}`;
    }
  }
  
  // Final fallback: look for any year range in first line
  const yearRangeMatch = cleanText.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
  if (yearRangeMatch) {
    const year1 = parseInt(yearRangeMatch[1]);
    const year2 = parseInt(yearRangeMatch[2]);
    const currentYear = new Date().getFullYear();
    
    if (year1 >= 1700 && year1 <= currentYear && 
        year2 >= 1700 && year2 <= currentYear && 
        year2 > year1 && (year2 - year1) < 120) {
      console.log(`🎯 Final result (fallback range): ${year1}-${year2}`);
      return `${year1}-${year2}`;
    }
  }
  
  console.log(`❌ No valid years found in first line, returning null`);
  return null;
}

function formatWikipediaData(data, searchTerm, peopleOnly = false) {
  if (!data || !data.query || !data.query.pages) {
    return [];
  }

  const pages = data.query.pages;
  const figures = [];

  for (const pageId in pages) {
    const page = pages[pageId];

    if (!page.extract) {
      continue;
    }

    if (peopleOnly && !looksLikePerson(page)) {
      continue;
    }

    // Use the improved year extraction
    const extractedYears = extractYearsFromText(page.extract);
    const years = extractedYears || "Unknown";
    
    const tags = extractTags(page);
    const contributions = extractContributions(page.extract);

    figures.push({
      _id: pageId,
      wikipediaId: pageId,
      name: page.title,
      imageUrl: page.original?.source || page.thumbnail?.source || 
        "https://via.placeholder.com/300x400?text=No+Image",
      description: page.extract || "No description available",
      years: years,
      tags: tags,
      contributions: contributions,
      source: "Wikipedia",
      sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${pageId}`,
      likes: 0,
      likedBy: [],
    });
  }

  console.log(`Formatted ${figures.length} figures with improved year extraction`);
  return figures;
}

function extractTags(page) {
  const tags = [];

  if (page.categories) {
    for (const category of page.categories.slice(0, 5)) {
      const categoryName = category.title.replace("Category:", "");
      
      if (!categoryName.match(/(Articles|Pages|Wikipedia|CS1|Stubs)/i)) {
        const tag = categoryName.split(" ")[0];
        if (tag.length > 2) {
          tags.push(tag);
        }
      }
    }
  }

  const commonTags = ["civil rights", "activist", "leader", "writer", "artist"];
  for (const tag of commonTags) {
    if (page.extract?.toLowerCase().includes(tag)) {
      tags.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    }
  }

  return [...new Set(tags)].slice(0, 3);
}

function extractContributions(text) {
  if (!text) return [];

  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length === 0) return [];

  const contributionKeywords = [
    "known for", "famous for", "best known", "led", "founded", 
    "established", "wrote", "created", "developed", "fought for"
  ];

  const contributionSentences = sentences.filter(sentence => {
    return contributionKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    );
  });

  if (contributionSentences.length > 0) {
    return contributionSentences.slice(0, 2)
      .map(s => s.length > 200 ? s.substring(0, 197) + "..." : s);
  }

  return sentences.slice(0, 1)
    .map(s => s.length > 200 ? s.substring(0, 197) + "..." : s);
}

const getFigureById = async (id) => {
  try {
    const figure = await Figure.findById(id);
    if (figure) return figure;

    if (id.match(/^\d+$/)) {
      const detailsQueryParams = new URLSearchParams({
        action: "query",
        format: "json",
        prop: "extracts|pageimages|info|categories",
        pageids: id,
        exintro: "true",
        explaintext: "true",
        piprop: "original",
        inprop: "url",
        origin: "*",
      });

      const detailsUrl = `${API_BASE_URL}?${detailsQueryParams.toString()}`;
      const response = await fetch(detailsUrl);

      if (response.ok) {
        const data = await response.json();
        const page = data.query?.pages?.[id];

        if (page && !page.missing) {
          const formattedData = formatWikipediaData(
            { query: { pages: { [id]: page } } }, "", true
          );
          return formattedData[0] || null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting figure by ID ${id}:`, error);
    return null;
  }
};

const getFeaturedFigures = async function (searchTerm = "", limit = 6) {
  try {
    let figuresPool = [];

    if (searchTerm) {
      figuresPool = await Figure.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { tags: { $in: [new RegExp(searchTerm, "i")] } },
          { category: { $regex: searchTerm, $options: "i" } }
        ],
        imageUrl: { $ne: null, $ne: "", $not: /placeholder/i },
        description: { $ne: null, $ne: "" }
      })
      .sort({ likes: -1, createdAt: -1 })
      .limit(limit * 2);
    } else {
      figuresPool = await Figure.find({
        imageUrl: { $ne: null, $ne: "", $not: /placeholder/i },
        description: { $ne: null, $ne: "", $regex: /.{100,}/ },
        name: { $ne: null, $ne: "" }
      })
      .sort({ likes: -1, createdAt: -1 })
      .limit(limit * 2);
    }

    if (figuresPool.length < limit) {
      const backfillCount = limit - figuresPool.length;
      const existingIds = figuresPool.map((fig) => fig._id);

      const randomFigures = await Figure.aggregate([
        { 
          $match: { 
            _id: { $nin: existingIds },
            imageUrl: { $ne: null, $ne: "", $not: /placeholder/i },
            name: { $ne: null, $ne: "" },
            description: { $ne: null, $ne: "", $regex: /.{50,}/ }
          } 
        },
        { $sample: { size: backfillCount } },
      ]);

      figuresPool.push(...randomFigures);
    }

    const validFigures = figuresPool
      .filter((figure) => {
        const hasValidImage = figure.imageUrl && 
          !figure.imageUrl.includes("placeholder") && 
          !figure.imageUrl.includes("No+Image");
        
        const hasName = figure.name && figure.name.trim().length > 0;
        const hasDescription = figure.description && 
          figure.description.trim().length >= 50;
        const hasSource = figure.source;

        return hasValidImage && hasName && hasDescription && hasSource;
      })
      .reduce((acc, current) => {
        const duplicate = acc.find(item => 
          item.name.toLowerCase() === current.name.toLowerCase()
        );
        if (!duplicate) {
          acc.push(current);
        } else if (current._id && !duplicate._id) {
          const index = acc.findIndex(item => 
            item.name.toLowerCase() === current.name.toLowerCase()
          );
          acc[index] = current;
        }
        return acc;
      }, [])
      .slice(0, limit);

    console.log(`Returning ${validFigures.length} featured figures`);
    return validFigures;

  } catch (error) {
    console.error("Error fetching featured figures:", error);
    return [];
  }
};

module.exports = {
  searchFigures,
  getFigureById,
  getFeaturedFigures,
  search: searchController,
};