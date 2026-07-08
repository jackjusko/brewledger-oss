import axios from 'axios';
import { API_BASE_URL } from '../config';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
}

export const QBOService = {
  async getStatus() {
    const { data } = await axios.get(`${API_BASE_URL}/integrations/qbo/status`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getAuthorizeUrl() {
    const { data } = await axios.post(`${API_BASE_URL}/integrations/qbo/authorize-url`, {}, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async exchangeCode({ code, realmId }) {
    const { data } = await axios.post(`${API_BASE_URL}/integrations/qbo/exchange`, { code, realmId }, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async disconnect() {
    const { data } = await axios.post(`${API_BASE_URL}/integrations/qbo/disconnect`, {}, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getCustomers() {
    const { data } = await axios.get(`${API_BASE_URL}/integrations/qbo/customers`, {
      headers: getAuthHeaders()
    });
    return data.customers || [];
  },

  async getMappings() {
    const { data } = await axios.get(`${API_BASE_URL}/integrations/qbo/mappings`, {
      headers: getAuthHeaders()
    });
    return data.mappings || [];
  },

  async getItems() {
    const { data } = await axios.get(`${API_BASE_URL}/integrations/qbo/items`, {
      headers: getAuthHeaders()
    });
    return data.items || [];
  },

  async saveMapping({ brew_item_id, qbo_item_id }) {
    const { data } = await axios.post(`${API_BASE_URL}/integrations/qbo/mappings`, {
      brew_item_id,
      qbo_item_id: qbo_item_id || null
    }, {
      headers: getAuthHeaders()
    });
    return data.mapping;
  },

  async pushItem(itemId) {
    const { data } = await axios.post(`${API_BASE_URL}/integrations/qbo/items/${itemId}/push`, {}, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async pushInvoice(ledgerEntryId) {
    const { data } = await axios.post(`${API_BASE_URL}/integrations/qbo/push/invoice`, { ledger_entry_id: ledgerEntryId }, {
      headers: getAuthHeaders()
    });
    return data;
  }
};
