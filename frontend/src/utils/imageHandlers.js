import { getRootUrl } from "./utils";

/**
 * Gets the image URL for a bundle, checking both the bundleImages collection
 * and the legacy image_url property
 * 
 * @param {Object} bundle - The bundle object
 * @param {Object} bundleImages - Collection of images indexed by bundle ID
 * @returns {string} - URL to the bundle image
 */
export const getBundleImageUrl = (bundle, bundleImages = {}) => {
  // First check if we have images in the bundleImages collection
  if (bundleImages && bundleImages[bundle.id] && bundleImages[bundle.id].length > 0) {
    return getRootUrl() + `/uploads/${bundleImages[bundle.id][0].file_path}`;
  }
  
  // Fallback to direct image_url if it exists
  if (bundle.image_url) {
    return getRootUrl() + bundle.image_url;
  }
  
  // Return placeholder if no image found
  return 'https://via.placeholder.com/300x200?text=Pas+d%27image';
};

/**
 * Handle image upload for preview
 * 
 * @param {File} file - The uploaded file
 * @param {Function} callback - Callback function to receive the data URL
 */
export const handleImageUpload = (file, callback) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onloadend = () => {
    callback(reader.result);
  };
  reader.readAsDataURL(file);
};