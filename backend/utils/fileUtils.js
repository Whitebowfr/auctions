const fs = require('fs');
const path = require('path');

/**
 * Get uploads directory path
 */
const getUploadsDir = () => {
  return path.join(__dirname, '..', 'uploads');
};

/**
 * Ensure uploads directory exists
 */
const setupUploadDir = () => {
  const uploadsDir = getUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

/**
 * Delete a file from the uploads directory
 */
const deleteUploadedFile = (filename) => {
  const filePath = path.join(getUploadsDir(), filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

module.exports = {
  getUploadsDir,
  setupUploadDir,
  deleteUploadedFile
};