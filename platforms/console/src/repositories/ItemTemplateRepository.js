import { API_BASE_URL } from '../config'
import { AuthService } from '../services/AuthService'

const getAuthHeaders = async () => {
  const session = await AuthService.getSession()
  if (!session || !session.token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.token}`,
    'Content-Type': 'application/json'
  }
}

export const ItemTemplateRepository = {
  /**
   * Search item templates with optional filters
   * @param {Object} filters - Search filters
   * @param {string} filters.q - Search query
   * @param {string} filters.type_class - Filter by type class
   * @param {string} filters.category - Filter by category
   * @param {string} filters.vendor - Filter by vendor
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.limit - Items per page (default: 50)
   */
  async search(filters = {}) {
    const params = new URLSearchParams()
    if (filters.q) params.append('q', filters.q)
    if (filters.type_class) params.append('type_class', filters.type_class)
    if (filters.category) params.append('category', filters.category)
    if (filters.vendor) params.append('vendor', filters.vendor)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const url = `${API_BASE_URL}/item-templates?${params.toString()}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to search templates: ${response.statusText}`)
    }
    
    return await response.json()
  },

  /**
   * Get all templates (with pagination)
   * @param {Object} options - Pagination and filter options
   */
  async getAll(options = {}) {
    return await this.search(options)
  },

  /**
   * Get a single template by ID
   * @param {string} id - Template ID
   */
  async getById(id) {
    const url = `${API_BASE_URL}/item-templates/${id}`
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to get template: ${response.statusText}`)
    }
    
    return await response.json()
  },

  /**
   * Import a template into organization items
   * @param {string} templateId - Template ID to import
   * @param {Object} overrides - Override values for the imported item
   * @param {string} overrides.unit - Override unit
   * @param {number} overrides.interval - Override interval
   * @param {number} overrides.price - Override price
   * @param {string} overrides.vendor - Override vendor
   * @param {string} overrides.type_class - Override type class
   * @param {string} overrides.category - Override category
   */
  async importToOrg(templateId, overrides = {}) {
    const headers = await getAuthHeaders()
    const url = `${API_BASE_URL}/item-templates/import`
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        template_id: templateId,
        overrides
      })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Failed to import template: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.item
  }
}
