require('dotenv').config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/diasporaecho';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';


module.exports = {
    NODE_ENV,
    PORT,
    MONGODB_URL,
    JWT_SECRET,
    JWT_EXPIRE,
};