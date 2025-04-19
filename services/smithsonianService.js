require('dotenv').config();

const API_BASE_URL = 'https://api.si.edu/openaccess/api/v1.0/search';
const API_KEY = process.env.SMITHSONIAN_API_KEY;

/**
 * Search for figures in the Smithsonian API
 * @param {Object} params - Search parameters
 * @param {string} params.q - Additional search query
 * @param {number} params.rows - Number of results to return (default: 10)
 * @param {number} params.start - Starting index for pagination
 * @returns {Promise<Array>} Array of formatted figure objects
 */
const searchFigures = function(params = {}) {
    const defaultQuery = 'online_media_type:Images AND culture:African American';
    const query = params.q ? `${defaultQuery} AND ${params.q}` : defaultQuery;
    const rows = params.rows || 10;
    const start = params.start || 0;
    
    const url = `${API_BASE_URL}?api_key=${API_KEY}&q=${encodeURIComponent(query)}&rows=${rows}&start=${start}`;
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.response && data.response.rows) {
                return formatFigures(data.response.rows);
            } else {
                throw new Error('No results found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            throw error;
        });
};

/**
 * Format Smithsonian API data into usable figure objects
 * @param {Array} rows - Raw data from Smithsonian API
 * @returns {Array} Formatted figure objects
 */
const formatFigures = function(rows) {
    return rows.map(row => {
        const content = row.content || {};
        
        // Extract images
        let imageUrl = '';
        if (content.descriptiveNonRepeating && content.descriptiveNonRepeating.online_media) {
            const media = content.descriptiveNonRepeating.online_media.media || [];
            if (media.length > 0 && media[0].content) {
                imageUrl = media[0].content;
            }
        }
        
        // Extract name/title
        const name = content.descriptiveNonRepeating?.title?.title || 'Unknown Figure';
        
        // Extract description
        let description = '';
        if (content.freetext && content.freetext.notes) {
            const notes = content.freetext.notes.find(note => note.label === 'Description');
            if (notes) {
                description = notes.content;
            }
        }
        
        // Extract dates
        let years = '';
        if (content.freetext && content.freetext.date) {
            const date = content.freetext.date.find(d => d.label === 'Date');
            if (date) {
                years = date.content;
            }
        }
        
        // Create unique ID
        const id = content.descriptiveNonRepeating?.record_ID || `figure-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        return {
            _id: id,
            name,
            imageUrl,
            description: description || 'No description available',
            years: years || 'Date unknown',
            likes: 0,
            source: 'Smithsonian',
            sourceUrl: content.descriptiveNonRepeating?.record_link || '',
            tags: extractTags(content)
        };
    }).filter(figure => figure.imageUrl); // Only return figures with images
};

/**
 * Extract tags from figure content
 * @param {Object} content - Figure content
 * @returns {Array} Array of tags
 */
const extractTags = function(content) {
    const tags = [];
    
    // Extract from topics
    if (content.indexedStructured && content.indexedStructured.topic) {
        content.indexedStructured.topic.forEach(topic => {
            tags.push(topic);
        });
    }
    
    // Extract from subjects
    if (content.indexedStructured && content.indexedStructured.subject_term) {
        content.indexedStructured.subject_term.forEach(subject => {
            tags.push(subject);
        });
    }
    
    return [...new Set(tags)]; // Remove duplicates
};

/**
 * Get a specific figure by ID from the Smithsonian API
 * @param {string} id - Figure ID
 * @returns {Promise<Object>} Formatted figure object
 */
const getFigureById = function(id) {
    const url = `${API_BASE_URL}?api_key=${API_KEY}&id=${id}`;
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching figure: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.response && data.response.rows && data.response.rows.length > 0) {
                const figures = formatFigures(data.response.rows);
                return figures[0];
            } else {
                throw new Error('Figure not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            throw error;
        });
};

/**
 * Search for featured figures
 * @param {number} limit - Number of featured figures to return
 * @returns {Promise<Array>} Array of formatted featured figure objects
 */
const getFeaturedFigures = function(limit = 3) {
    // You can customize this query to get featured figures
    return searchFigures({
        q: 'topic:\"Civil Rights\" OR topic:\"African American History\"',
        rows: limit
    });
};

module.exports = {
    searchFigures,
    getFigureById,
    getFeaturedFigures
};