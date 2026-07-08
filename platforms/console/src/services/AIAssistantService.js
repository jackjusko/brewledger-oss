import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AuthService } from './AuthService';

/**
 * AI Assistant Service
 * Handles communication with the backend AI assistant API
 */
export const AIAssistantService = {
  /**
   * Send a message to the AI assistant
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<{response: string, model: string, preset?: string, action?: object | null, actionError?: string | null}>}
   */
  async sendMessage(message, conversationHistory = []) {
    try {
      const session = await AuthService.getSession();
      if (!session || !session.token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post(
        `${API_BASE_URL}/ai/chat`,
        {
          message,
          conversationHistory,
        },
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data?.error || 'Failed to get AI response');
      } else if (error.request) {
        // Request made but no response
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Error setting up request
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  },
};
