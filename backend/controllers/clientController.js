const db = require('../db');

/**
 * Get all clients
 */
const getAllClients = async (req, res) => {
  const clients = db.getAll('clients').sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  res.json(clients);
};

/**
 * Get a single client by ID
 */
const getClientById = async (req, res) => {
  const { id } = req.params;
  const client = db.getById('clients', id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
};

/**
 * Create a new client
 */
const createClient = async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  const existing = db.getAll('clients').find(c => (c.email || '').toLowerCase() === (email || '').toLowerCase());
  if (existing) return res.status(409).json({ message: 'Client with this email already exists' });

  const record = db.insert('clients', { name, email, phone: phone || '', address: address || '' });
  res.status(201).json(record);
};

/**
 * Update an existing client
 */
const updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  const existing = db.getById('clients', id);
  if (!existing) return res.status(404).json({ message: 'Client not found' });

  const emailTaken = db.getAll('clients').find(c => c.email === email && c.id !== Number(id));
  if (emailTaken) return res.status(409).json({ message: 'Email is already taken by another client' });

  const updated = db.update('clients', id, { name, email, phone: phone || '', address: address || '' });
  res.json(updated);
};

/**
 * Delete a client
 */
const deleteClient = async (req, res) => {
  const { id } = req.params;
  const ok = db.remove('clients', id);
  if (!ok) return res.status(404).json({ message: 'Client not found' });
  res.json({ message: 'Client deleted successfully' });
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};