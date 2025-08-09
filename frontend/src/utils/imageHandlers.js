import { getRootUrl } from "./utils";

export const getBundleImageUrl = (bundle) => {
  if (bundle.image_url) {
    return getRootUrl() +bundle.image_url;
  }
  return 'https://via.placeholder.com/300x200?text=No+Image';
};

export const handleImageUpload = (file, callback) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onloadend = () => {
    callback(reader.result);
  };
  reader.readAsDataURL(file);
};