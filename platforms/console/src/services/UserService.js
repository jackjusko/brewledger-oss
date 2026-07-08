import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AuthService } from './AuthService';

/**
 * User management service for console (admin-only).
 * List org users and invite new users via backend API.
 */
export const UserService = {
  /**
   * List users for the current organization (admin only).
   * @returns {Promise<{ users: Array<{ id, name, email, role, created_at }> }>}
   */
  async getUsers() {
    const session = await AuthService.getSession();
    if (!session?.token) {
      throw new Error('Not authenticated');
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.error || 'Failed to load users';
        throw new Error(msg);
      }
      if (error.request) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'An unexpected error occurred');
    }
  },

  /**
   * Invite a new user to the organization (admin only).
   * @param {Object} payload - { name, email, password }
   * @returns {Promise<{ userId, message }>}
   */
  async inviteUser(payload) {
    const { name, email, password } = payload || {};
    if (!name?.trim() || !email?.trim() || !password) {
      throw new Error('Name, email, and password are required');
    }
    const session = await AuthService.getSession();
    if (!session?.token) {
      throw new Error('Not authenticated');
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/invite`,
        { name: name.trim(), email: email.trim(), password },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.error || 'Failed to create user';
        throw new Error(msg);
      }
      if (error.request) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'An unexpected error occurred');
    }
  },
};
