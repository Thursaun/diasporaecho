require('dotenv').config();

const API_BASE_URL = 'https://api.si.edu/openaccess/api/v1.0/search';
const API_KEY = process.env.SMITHSONIAN_API_KEY;

const searchFigures = function(params = {}) {
    const defaultQuery = 'online_media_type:Images AND culture:African American';
    const query = params.q ? `${defaultQuery} AND ${params.q}` : defaultQuery;


}   