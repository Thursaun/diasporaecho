

const SMITHSONIAN_API_BASE_URL = 'https://api.si.edu/openaccess/api/v1.0/';
const SMITHSONIAN_UNIT_CODE = 'NHAAHC';

const SUCCESS_CODES = {
  OK: 200,
  CREATED: 201,
};

const ERROR_MESSAGES = {
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access Denied',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  USER_NOT_FOUND: 'User not found',
  USER_CONFLICT: 'User already exists',
  INVALID_CREDENTIALS: 'Incorrect email or password',
};



module.exports = {
  SUCCESS_CODES,
  ERROR_MESSAGES,
  SMITHSONIAN_API_BASE_URL,
  SMITHSONIAN_UNIT_CODE,
};