// Configuration for BrewLedger Console App
// Shared backend API with mobile web app

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
  },
  SYNC: {
    SYNC_DATA: '/sync',
    GET_UPDATES: '/sync/updates',
  },
  INVENTORY: {
    ITEMS: '/items',
    ITEM_BY_ID: (id) => `/items/${id}`,
    CATEGORIES: '/items/categories',
    LOCATIONS: '/locations',
  },
  BATCHES: {
    BATCHES: '/batches',
    BATCH_BY_ID: (id) => `/batches/${id}`,
    RECIPES: '/recipes',
  },
  REPORTS: {
    GENERATE: '/reports/generate',
    LIST: '/reports',
    DOWNLOAD: (id) => `/reports/${id}/download`,
  },
  SETTINGS: {
    ORGANIZATION: '/settings/organization',
    USERS: '/settings/users',
    PREFERENCES: '/settings/preferences',
  },
};

// SEO: Base URL for canonical tags (used when window is unavailable, e.g. prerender)
export const SITE_BASE_URL = import.meta.env.VITE_SITE_BASE_URL || 'http://localhost:5174';

// Contact email shown on landing page error fallback
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com';

// Mobile app store listings (optional — set via env for production deployments)
export const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || '';
export const GOOGLE_PLAY_URL = import.meta.env.VITE_GOOGLE_PLAY_URL || '';

// Application configuration
export const APP_CONFIG = {
  APP_NAME: 'BrewLedger Console',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: import.meta.env.MODE || 'development',

  // Sync configuration
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_SYNC_RETRIES: 3,

  // UI configuration
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,

  // Feature flags
  FEATURES: {
    REAL_TIME_SYNC: true,
    BULK_OPERATIONS: true,
    ADVANCED_REPORTING: true,
    MULTI_USER_SUPPORT: true,
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_ID: 'userId',
  ORG_ID: 'orgId',
  ORG_NAME: 'orgName',
  USER_NAME: 'userName',
  USER_ROLE: 'userRole',
  THEME: 'theme',
  LAST_SYNC_TIMESTAMP: 'lastSyncTimestamp',
  PREFERENCES: 'console_preferences',
};

// Default values
export const DEFAULTS = {
  THEME: 'light',
  CURRENCY: 'USD',
  MEASUREMENT_SYSTEM: 'imperial',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
};
