// bundleUtils.js

import { getRootUrl } from "./utils";

// Get the primary image URL for a bundle
export const getBundleImageUrl = (bundle, bundleImages) => {
  const images = bundleImages[bundle.id] || [];
  if (images.length > 0) {
    return getRootUrl() + `/uploads/${images[0].file_path}`;
  }
  return 'https://via.placeholder.com/300x200?text=Pas+d%27image';
};

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