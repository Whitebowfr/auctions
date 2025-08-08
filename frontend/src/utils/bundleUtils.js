// bundleUtils.js

// Get the primary image URL for a bundle
export const getBundleImageUrl = (bundle, bundleImages) => {
  const images = bundleImages[bundle.id] || [];
  if (images.length > 0) {
    return `http://localhost:8080/uploads/${images[0].file_path}`;
  }
  return 'https://via.placeholder.com/300x200?text=No+Image';
};