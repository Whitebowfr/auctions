const { get_request, post_request, put_request, delete_request } = require('../db');
const { asyncHandler } = require('../middleware/asyncHandler');
const { upload } = require('../middleware/upload');
const { deleteUploadedFile } = require('../utils/fileUtils');

/**
 * Get all lots for an enchere
 */
const getLotsForEnchere = async (req, res) => {
  const { enchereId } = req.params;
  
  const lots = await get_request(
    "SELECT * FROM lots WHERE enchere_id = ? ORDER BY id",
    [enchereId]
  );
  
  res.json(lots);
};

/**
 * Get a single lot by ID
 */
const getLotById = async (req, res) => {
  const { id } = req.params;
  
  const lots = await get_request("SELECT * FROM lots WHERE id = ?", [id]);
  
  if (lots.length === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  // Get lot images
  const images = await get_request("SELECT * FROM images WHERE lot_id = ?", [id]);
  
  const lot = lots[0];
  lot.images = images;
  
  res.json(lot);
};

/**
 * Create a new lot
 */
const createLot = async (req, res) => {
  const { enchereId } = req.params;
  const { name, description, starting_price, category, notes } = req.body;
  
  if (!name || !starting_price) {
    return res.status(400).json({ message: 'Name and starting price are required' });
  }
  
  // Check if enchere exists
  const encheres = await get_request("SELECT id FROM encheres WHERE id = ?", [enchereId]);
  if (encheres.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  const result = await post_request(
    "INSERT INTO lots (enchere_id, name, description, starting_price, category, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [enchereId, name, description || '', starting_price, category || '', notes || '']
  );
  
  const newLot = await get_request("SELECT * FROM lots WHERE id = ?", [result.insertId]);
  res.status(201).json(newLot[0]);
};

/**
 * Update an existing lot
 */
const updateLot = async (req, res) => {
  const { id } = req.params;
  const { name, description, starting_price, category, notes } = req.body;
  
  if (!name || !starting_price) {
    return res.status(400).json({ message: 'Name and starting price are required' });
  }
  
  // Check if lot exists
  const lots = await get_request("SELECT id FROM lots WHERE id = ?", [id]);
  if (lots.length === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  await put_request(
    "UPDATE lots SET name = ?, description = ?, starting_price = ?, category = ?, notes = ? WHERE id = ?",
    [name, description || '', starting_price, category || '', notes || '', id]
  );
  
  const updatedLot = await get_request("SELECT * FROM lots WHERE id = ?", [id]);
  res.json(updatedLot[0]);
};

/**
 * Delete a lot
 */
const deleteLot = async (req, res) => {
  const { id } = req.params;
  
  // Get lot images to delete files
  const images = await get_request("SELECT file_path FROM images WHERE lot_id = ?", [id]);
  
  // Delete the lot from database
  const result = await delete_request("DELETE FROM lots WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  // Delete image files
  for (const image of images) {
    try {
      deleteUploadedFile(image.file_path);
    } catch (error) {
      console.error(`Failed to delete file ${image.file_path}:`, error);
    }
  }
  
  res.json({ message: 'Lot deleted successfully' });
};

/**
 * Mark a lot as sold
 */
const markLotAsSold = async (req, res) => {
  const { id } = req.params;
  const { participantId, soldPrice } = req.body;
  
  if (!participantId || !soldPrice) {
    return res.status(400).json({ message: 'Participant ID and sold price are required' });
  }
  
  // Check if lot exists
  const lots = await get_request("SELECT * FROM lots WHERE id = ?", [id]);
  if (lots.length === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  // Check if participant exists in this enchere
  const participants = await get_request(
    "SELECT * FROM participation WHERE enchere_id = ? AND client_id = ?",
    [lots[0].enchere_id, participantId]
  );
  
  if (participants.length === 0) {
    return res.status(400).json({ message: 'Participant is not registered for this enchere' });
  }
  
  await put_request(
    "UPDATE lots SET sold_to = ?, sold_price = ? WHERE id = ?",
    [participantId, soldPrice, id]
  );
  
  const updatedLot = await get_request("SELECT * FROM lots WHERE id = ?", [id]);
  
  // Get participant name
  const clients = await get_request("SELECT name FROM client WHERE id = ?", [participantId]);
  if (clients.length > 0) {
    updatedLot[0].sold_to_name = clients[0].name;
  }
  
  res.json(updatedLot[0]);
};

/**
 * Get all images for a lot
 */
const getLotImages = async (req, res) => {
  const { lotId } = req.params;
  
  const images = await get_request("SELECT * FROM images WHERE lot_id = ? ORDER BY id", [lotId]);
  res.json(images);
};

module.exports = {
  getLotsForEnchere,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  markLotAsSold,
  getLotImages
};