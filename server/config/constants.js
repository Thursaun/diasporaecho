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
};