const { get_request, post_request, put_request, delete_request } = require('../db');

/**
 * Get all clients
 */
const getAllClients = async (req, res) => {
  const clients = await get_request("SELECT * FROM client ORDER BY name");
  res.json(clients);
};

/**
 * Get a single client by ID
 */
const getClientById = async (req, res) => {
  const { id } = req.params;
  const clients = await get_request("SELECT * FROM client WHERE id = ?", [id]);
  
  if (clients.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  res.json(clients[0]);
};

/**
 * Create a new client
 */
const createClient = async (req, res) => {
  const { name, email, phone, address } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  // Check if email already exists
  const existing = await get_request("SELECT id FROM client WHERE email = ?", [email]);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Client with this email already exists' });
  }
  
  const result = await post_request(
    "INSERT INTO client (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)",
    [name, email, phone || '', address || '', req.body.notes || '']
  );
  
  const newClient = await get_request("SELECT * FROM client WHERE id = ?", [result.insertId]);
  res.status(201).json(newClient[0]);
};

/**
 * Update an existing client
 */
const updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, notes } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  // Check if client exists
  const existing = await get_request("SELECT id FROM client WHERE id = ?", [id]);
  if (existing.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Check if email is taken by another client
  const emailCheck = await get_request("SELECT id FROM client WHERE email = ? AND id != ?", [email, id]);
  if (emailCheck.length > 0) {
    return res.status(409).json({ message: 'Email is already taken by another client' });
  }
  
  await put_request(
    "UPDATE client SET name = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?",
    [name, email, phone || '', address || '', notes || '', id]
  );
  
  const updatedClient = await get_request("SELECT * FROM client WHERE id = ?", [id]);
  res.json(updatedClient[0]);
};

/**
 * Delete a client
 */
const deleteClient = async (req, res) => {
  const { id } = req.params;
  
  const result = await delete_request("DELETE FROM client WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  res.json({ message: 'Client deleted successfully' });
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};