// bundleUtils.js

// Image support removed — bundles no longer include images in lightweight backend

/**
 * Process bulk import text for bundles and convert to bundle objects
 * @param {string} bulkText - CSV-style text input with bundle data
 * @returns {Array} - Array of bundle objects
 */
export const processBulkBundleImport = (bulkText) => {
  const lines = bulkText.split('\n').filter(line => line.trim());
  
  return lines.map((line) => {
    const [name, description, startingPrice, category, notes] = line.split(';').map(item => item?.trim() || '');
    
    return {
      name: name || `Lot sans nom`,
      description: description || '',
      startingPrice: parseFloat(startingPrice) || 0,
      category: category || '',
      notes: notes || ''
    };
  });
};