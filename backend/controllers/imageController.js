const { get_request, post_request, delete_request } = require('../db');
const { deleteUploadedFile } = require('../utils/fileUtils');

/**
 * Upload an image for a lot
 * Note: This function assumes the file has already been uploaded by multer
 */
const uploadLotImage = async (req, res) => {
  const { lotId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Check if lot exists
  const lots = await get_request("SELECT id FROM lots WHERE id = ?", [lotId]);
  if (lots.length === 0) {
    // Delete the uploaded file
    deleteUploadedFile(req.file.filename);
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  // Store image metadata in database
  const result = await post_request(
    "INSERT INTO images (lot_id, file_path, name, description) VALUES (?, ?, ?, ?)",
    [lotId, req.file.filename, req.body.name || 'Lot Image', req.body.description || '']
  );
  
  const image = {
    id: result.insertId,
    lot_id: lotId,
    file_path: req.file.filename,
    name: req.body.name || 'Lot Image',
    description: req.body.description || '',
    created_at: new Date()
  };
  
  res.status(201).json(image);
};

/**
 * Delete an image
 */
const deleteImage = async (req, res) => {
  const { id } = req.params;
  
  // Get image file path before deleting
  const images = await get_request("SELECT file_path FROM images WHERE id = ?", [id]);
  
  if (images.length === 0) {
    return res.status(404).json({ message: 'Image not found' });
  }
  
  const filePath = images[0].file_path;
  
  // Delete from database
  const result = await delete_request("DELETE FROM images WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Image not found' });
  }
  
  // Delete file from filesystem
  try {
    deleteUploadedFile(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    // Continue with response even if file deletion fails
  }
  
  res.json({ message: 'Image deleted successfully' });
};

module.exports = {
  uploadLotImage,
  deleteImage
};