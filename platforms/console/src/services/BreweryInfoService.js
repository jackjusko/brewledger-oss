import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AuthService } from './AuthService';

/**
 * Brewery Information Service
 * Handles fetching and updating TTB brewery information
 */
export const BreweryInfoService = {
  /**
   * Get brewery information for the current organization
   * @returns {Promise<Object>} Brewery info object
   */
  async getBreweryInfo() {
    try {
      const session = await AuthService.getSession();
      if (!session || !session.token || !session.orgId) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get(
        `${API_BASE_URL}/orgs/${session.orgId}/brewery-info`,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'Failed to fetch brewery information');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  },

  /**
   * Update brewery information for the current organization
   * @param {Object} breweryInfo - Brewery info object
   * @returns {Promise<Object>} Updated brewery info
   */
  async updateBreweryInfo(breweryInfo) {
    try {
      const session = await AuthService.getSession();
      if (!session || !session.token || !session.orgId) {
        throw new Error('Not authenticated');
      }

      const response = await axios.put(
        `${API_BASE_URL}/orgs/${session.orgId}/brewery-info`,
        breweryInfo,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'Failed to update brewery information');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  },
};
