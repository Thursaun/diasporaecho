const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

// Configure dotenv with proper path resolution
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Wikipedia API endpoint
const API_BASE_URL = 'https://en.wikipedia.org/w/api.php';

async function exploreWikipediaAPI() {
    console.log('Testing Wikipedia API for figure data');
    
    // Test specific figure search
    const searchTerms = ['Martin Luther King', 'Harriet Tubman', 'Malcolm X', 'Frederick Douglass'];
    
    for (const term of searchTerms) {
        try {
            console.log(`\n=== Searching for: ${term} ===`);
            
            // Step 1: Search for the figure
            const searchQueryParams = new URLSearchParams({
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: `${term} African American historical figure`,
                srlimit: 3,
                origin: '*'
            });
            
            const searchUrl = `${API_BASE_URL}?${searchQueryParams.toString()}`;
            console.log('Search URL:', searchUrl);
            
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) {
                throw new Error(`HTTP error! status: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();
            const results = searchData.query?.search || [];
            console.log(`Found ${results.length} results`);
            
            if (results.length === 0) continue;
            
            // Get first result ID
            const pageId = results[0].pageid;
            console.log(`First result ID: ${pageId}`);
            
            // Step 2: Get detailed information for the figure
            const detailsQueryParams = new URLSearchParams({
                action: 'query',
                format: 'json',
                prop: 'extracts|pageimages|info|categories',
                pageids: pageId,
                exintro: 'true',
                explaintext: 'true',
                piprop: 'original',
                inprop: 'url',
                origin: '*'
            });
            
            const detailsUrl = `${API_BASE_URL}?${detailsQueryParams.toString()}`;
            const detailsResponse = await fetch(detailsUrl);
            
            if (!detailsResponse.ok) {
                throw new Error(`HTTP error! status: ${detailsResponse.status}`);
            }

            const detailsData = await detailsResponse.json();
            const page = detailsData.query?.pages?.[pageId];
            
            if (page) {
                // Extract year information using regex
                const yearsPattern = /\((\d{4}).*?(\d{4})\)/;
                let yearsMatch = page.extract?.match(yearsPattern) || page.title?.match(yearsPattern);
                
                const years = yearsMatch 
                    ? `${yearsMatch[1]}-${yearsMatch[2]}` 
                    : extractYearsFromText(page.extract);
                
                // Format the result like your FigureCard expects
                const figure = {
                    _id: page.pageid.toString(),
                    name: page.title || 'Unknown Figure',
                    imageUrl: page.original?.source || 'No image available',
                    description: page.extract?.substring(0, 200) + '...' || 'No description available',
                    years: years || 'Year information not found',
                    source: 'Wikipedia',
                    sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
                };
                
                console.log('\nFigure Data for FigureCard:');
                console.log(JSON.stringify(figure, null, 2));
                
                // Additional debugging for year extraction
                console.log('\nYear Extraction Debug:');
                console.log('Title:', page.title);
                console.log('Extract start:', page.extract?.substring(0, 100));
                console.log('Years match from regex:', yearsMatch ? `${yearsMatch[1]}-${yearsMatch[2]}` : 'No match');
            }
        } catch (error) {
            console.error(`Error searching for ${term}:`, error.message);
        }
    }
}

// Helper function to extract years from text when regex fails
function extractYearsFromText(text) {
    if (!text) return null;
    
    // Try different patterns for birth/death years
    const patterns = [
        /born\s+(\w+\s+\d{1,2},?\s+)?(\d{4})/i,
        /died\s+(\w+\s+\d{1,2},?\s+)?(\d{4})/i,
        /(\d{4})\s*[-–]\s*(\d{4})/,
        /born\s+.*?(\d{4}).*?died.*?(\d{4})/i,
    ];
    
    let birthYear = null;
    let deathYear = null;
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            if (pattern.toString().includes('born')) {
                birthYear = match[2] || match[1];
            } else if (pattern.toString().includes('died')) {
                deathYear = match[2] || match[1];
            } else if (match[1] && match[2]) {
                birthYear = match[1];
                deathYear = match[2];
                break;
            }
        }
    }
    
    return (birthYear && deathYear) ? `${birthYear}-${deathYear}` : null;
}


const fetchWikipediaData = async (name) => {
  const searchTerm = encodeURIComponent(name);
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|categories|pageimages&exintro=1&titles=${searchTerm}&pithumbsize=500&origin=*`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId];
  } catch (error) {
    console.error("Error fetching from Wikipedia:", error);
    return null;
  }
};

async function fetchWikipediaImage(name) {
  const searchTerm = encodeURIComponent(name);
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${searchTerm}&origin=*`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null;
  } catch (error) {
    console.error("Error fetching image from Wikipedia:", error);
    return null;
  }
}
// Call the function to explore the Wikipedia API   

fetchWikipediaData('Martin Luther King');
exploreWikipediaAPI();