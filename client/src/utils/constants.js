export const BASE_URL = import.meta.env.PROD 
  ? 'https://diasporaecho.onrender.com/api'
  : 'http://localhost:3001/api';

export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please try again later.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'Unauthorized. Please log in.',
    FORBIDDEN: 'Forbidden. You do not have permission to access this resource.',
    NOT_FOUND: 'Not found. The requested resource could not be found.',
    VALIDATION_ERROR: 'Validation error. Please check your input.',
}

export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful. Welcome back!',
    SIGNUP_SUCCESS: 'Signup successful. Welcome aboard!',
    LOGOUT_SUCCESS: 'Logout successful. See you next time!',
    PROFILE_UPDATE_SUCCESS: 'Profile updated successfully.',
    PASSWORD_UPDATE_SUCCESS: 'Password updated successfully.',
}