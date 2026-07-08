/**
 * Utility functions for formatting quantities with interval support
 * Interval allows tracking items in bulk quantities (e.g., bags of 50 lbs)
 */

/**
 * Format a base quantity with interval for display
 * @param {number} baseQuantity - Quantity in base units
 * @param {number|null} interval - Interval value (e.g., 50 for 50 lb bags)
 * @param {string|null} unit - Unit of measurement (e.g., "lb", "kg")
 * @returns {string} Formatted quantity string
 */
export function formatQuantityWithInterval(baseQuantity, interval, unit) {
  if (!interval || !unit) {
    return `${baseQuantity} ${unit || ''}`.trim()
  }

  const bags = Math.floor(baseQuantity / interval)
  const remainder = baseQuantity % interval

  if (remainder === 0) {
    return `${bags} bag${bags !== 1 ? 's' : ''} (${baseQuantity} ${unit})`
  }

  // Show fractional bags if remainder is significant
  const fractionalBags = (baseQuantity / interval).toFixed(1)
  if (remainder >= interval * 0.1) { // If remainder is >= 10% of interval, show fractional
    return `${fractionalBags} bag${fractionalBags !== '1.0' ? 's' : ''} (${baseQuantity} ${unit})`
  }

  return `${bags} bag${bags !== 1 ? 's' : ''} (${bags * interval} ${unit}) + ${remainder} ${unit}`
}

/**
 * Convert user input to base quantity
 * @param {number} inputValue - User input value
 * @param {string} inputMode - 'bags' or 'base'
 * @param {number|null} interval - Interval value
 * @returns {number} Base quantity
 */
export function convertInputToBase(inputValue, inputMode, interval) {
  if (inputMode === 'bags' && interval) {
    return inputValue * interval
  }
  return inputValue
}

/**
 * Get input mode suggestion based on item configuration
 * @param {Object} item - Item object
 * @returns {string} 'bags' or 'base'
 */
export function getSuggestedInputMode(item) {
  if (item.interval && item.interval > 0) {
    return 'bags'
  }
  return 'base'
}

/**
 * Format quantity for display in a compact way
 * @param {number} baseQuantity - Quantity in base units
 * @param {number|null} interval - Interval value
 * @param {string|null} unit - Unit of measurement
 * @returns {string} Compact formatted string
 */
export function formatQuantityCompact(baseQuantity, interval, unit) {
  if (!interval || !unit) {
    return `${baseQuantity} ${unit || ''}`.trim()
  }

  const bags = Math.floor(baseQuantity / interval)
  const remainder = baseQuantity % interval

  if (remainder === 0) {
    return `${bags} bag${bags !== 1 ? 's' : ''}`
  }

  const fractionalBags = (baseQuantity / interval).toFixed(1)
  return `${fractionalBags} bag${fractionalBags !== '1.0' ? 's' : ''}`
}
