/**
 * Authentication helper utilities
 */

/**
 * Get authentication headers for API requests.
 * Reads JWT token from localStorage and returns Authorization header if present.
 * 
 * @returns {Object} Headers object with Authorization if token exists, empty object otherwise
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return {
      Authorization: `Bearer ${token}`
    };
  }
  
  return {};
};

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} True if token exists in localStorage
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get the current JWT token
 * 
 * @returns {string|null} JWT token or null if not authenticated
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Clear authentication token (logout)
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
};
