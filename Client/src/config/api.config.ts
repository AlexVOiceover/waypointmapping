/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// API base URL from environment variables
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Validate that required environment variables are set
if (!apiBaseUrl) {
  throw new Error(
    'VITE_API_BASE_URL environment variable is required.\n' +
    'Please create a .env file with VITE_API_BASE_URL=http://localhost:5000 (or your API URL)'
  );
}

/**
 * API configuration object
 * Using as const for type safety
 */
export const API_CONFIG = {
  /** Base URL for API requests */
  baseURL: apiBaseUrl,

  /** Request timeout in milliseconds */
  timeout: 30000,

  /** Number of retries for failed requests */
  retries: 3,

  /** Retry delay in milliseconds */
  retryDelay: 1000,
} as const;

/**
 * API endpoints
 * Centralized endpoint paths
 */
export const API_ENDPOINTS = {
  waypoints: {
    generate: '/waypoints/generate',
    update: (id: number) => `/waypoints/${id}`,
    delete: (id: number) => `/waypoints/${id}`,
  },
  kmz: {
    generate: '/KMZ/generate',
  },
} as const;

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
  });
}
