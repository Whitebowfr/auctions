const { get_request, post_request, put_request, delete_request } = require('../db');

/**
 * Get all encheres (auctions)
 */
const getAllEncheres = async (req, res) => {
  const encheres = await get_request("SELECT * FROM encheres ORDER BY date DESC");
  res.json(encheres);
};

/**
 * Get a single enchere by ID with all related data
 */
const getEnchereById = async (req, res) => {
  const { id } = req.params;
  
  // Get basic enchere data
  const encheres = await get_request("SELECT * FROM encheres WHERE id = ?", [id]);
  
  if (encheres.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  const enchere = encheres[0];
  
  // Get bundles (lots)
  enchere.bundles = await get_request("SELECT * FROM lots WHERE enchere_id = ? ORDER BY id", [id]);
  
  // Get participants
  const participations = await get_request(`
    SELECT p.*, c.name, c.email, c.phone, c.address
    FROM participation p
    JOIN client c ON p.client_id = c.id
    WHERE p.enchere_id = ?
    ORDER BY p.registered_at DESC
  `, [id]);
  
  enchere.participants = participations.map(p => ({
    id: p.client_id,
    participation_id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    local_number: p.local_number,
    registered_at: p.registered_at
  }));
  
  // Get sales
  const sales = await get_request(`
    SELECT l.id as bundleId, l.name as bundleName, l.starting_price, l.sold_price as finalPrice,
           p.client_id as participantId, c.name as participantName, p.local_number as bidderNumber
    FROM lots l
    JOIN participation p ON l.sold_to = p.client_id AND l.enchere_id = p.enchere_id
    JOIN client c ON p.client_id = c.id
    WHERE l.enchere_id = ? AND l.sold_to IS NOT NULL
    ORDER BY l.id
  `, [id]);
  
  enchere.sales = sales;
  
  res.json(enchere);
};

/**
 * Create a new enchere
 */
const createEnchere = async (req, res) => {
  const { name, date, address, notes } = req.body;
  
  if (!name || !date) {
    return res.status(400).json({ message: 'Name and date are required' });
  }
  
  const result = await post_request(
    "INSERT INTO encheres (name, date, address, notes) VALUES (?, ?, ?, ?)",
    [name, date, address || '', notes || '']
  );
  
  const newEnchere = await get_request("SELECT * FROM encheres WHERE id = ?", [result.insertId]);
  res.status(201).json(newEnchere[0]);
};

/**
 * Update an existing enchere
 */
const updateEnchere = async (req, res) => {
  const { id } = req.params;
  const { name, date, address, metadata } = req.body;
  
  if (!name || !date) {
    return res.status(400).json({ message: 'Name and date are required' });
  }
  
  // Check if enchere exists
  const existing = await get_request("SELECT id FROM encheres WHERE id = ?", [id]);
  if (existing.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  // Update the enchere with optional metadata
  const updateFields = [name, date.split("T")[0], address || ''];
  let query = "UPDATE encheres SET name = ?, date = ?, address = ?";
  
  // If metadata is provided, add it to the query
  if (metadata) {
    query += ", metadata = ?";
    updateFields.push(metadata);
  }
  
  query += " WHERE id = ?";
  updateFields.push(id);
  
  await put_request(query, updateFields);
  
  const updatedEnchere = await get_request("SELECT * FROM encheres WHERE id = ?", [id]);
  res.json(updatedEnchere[0]);
};

/**
 * Delete an enchere
 */
const deleteEnchere = async (req, res) => {
  const { id } = req.params;
  
  const result = await delete_request("DELETE FROM encheres WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  res.json({ message: 'Enchere deleted successfully' });
};

module.exports = {
  getAllEncheres,
  getEnchereById,
  createEnchere,
  updateEnchere,
  deleteEnchere
};